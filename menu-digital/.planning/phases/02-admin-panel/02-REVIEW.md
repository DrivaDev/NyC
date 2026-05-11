---
phase: 02-admin-panel
reviewed: 2026-05-05T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - menu-digital/actions/categories.ts
  - menu-digital/actions/dishes.ts
  - menu-digital/app/(admin)/dashboard/categories/page.tsx
  - menu-digital/app/(admin)/dashboard/dishes/page.tsx
  - menu-digital/app/(admin)/layout.tsx
  - menu-digital/app/api/sign-cloudinary-params/route.ts
  - menu-digital/components/dashboard/AvailabilityToggle.tsx
  - menu-digital/components/dashboard/CategoriesClient.tsx
  - menu-digital/components/dashboard/CategoryModal.tsx
  - menu-digital/components/dashboard/DashboardHeader.tsx
  - menu-digital/components/dashboard/DishModal.tsx
  - menu-digital/components/dashboard/DishesClient.tsx
  - menu-digital/components/dashboard/Sidebar.tsx
  - menu-digital/lib/allergens.ts
  - menu-digital/package.json
findings:
  critical: 3
  warning: 6
  info: 3
  total: 12
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-05-05
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 2 implements the admin panel: category and dish CRUD, Cloudinary signed uploads, availability toggling, and reorder controls. The auth ownership-check pattern used in Server Actions is sound — every mutation re-derives `userId` from `await auth()` server-side and verifies the resource belongs to that user's restaurant. However, three blockers exist: the Cloudinary signature endpoint has no authentication gate (any internet user can obtain a valid upload credential), the `categoryId` supplied by the client is never verified to belong to the authenticated restaurant (cross-tenant contamination), and the reorder swap is non-atomic (partial failure leaves corrupted ordering). Additionally, all client components hold stale prop data after mutations, silently showing outdated state until a hard reload.

---

## Critical Issues

### CR-01: Cloudinary signature endpoint has no authentication check

**File:** `menu-digital/app/api/sign-cloudinary-params/route.ts:10-25`

**Issue:** `POST /api/sign-cloudinary-params` issues a time-valid Cloudinary upload signature to any caller — authenticated or not. The middleware matcher on line 20-23 of `middleware.ts` excludes routes matching `api(?!/webhooks)`, which means the `/api/sign-cloudinary-params` route IS covered by the matcher, but no auth guard is applied inside the handler itself. More critically, the middleware only calls `auth.protect()` for routes matching `/dashboard(.*)`. API routes that fall outside that pattern proceed without protection. Any unauthenticated (or foreign-account) HTTP client can POST to this endpoint and receive a signed credential that allows uploading arbitrary files into the `menu-digital` Cloudinary folder, consuming storage quota and potentially hosting malicious content.

**Fix:**
```typescript
import { auth } from '@clerk/nextjs/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST() {
  // Guard: only authenticated users may obtain upload credentials
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = { timestamp, folder: 'menu-digital' }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  )

  return Response.json({
    signature,
    timestamp,
    api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  })
}
```

---

### CR-02: `categoryId` ownership not verified in `createDish` and `updateDish`

**File:** `menu-digital/actions/dishes.ts:25-26`, `menu-digital/actions/dishes.ts:68-69`

**Issue:** Both `createDish` and `updateDish` accept a `categoryId` from `FormData` and store it directly in the database without confirming the category belongs to the authenticated user's restaurant. Architecture Rule 1 states "Every DB query must filter by `userId` from `await auth()`". A user who knows (or can guess) a MongoDB ObjectId for another restaurant's category can associate their dishes with that foreign category, polluting the other restaurant's data and breaking the public menu rendering for the victim restaurant.

**Fix:** After resolving `restaurant._id`, add an ownership check before creating or updating:

```typescript
// In createDish and updateDish, after restaurant is resolved:
const Category = (await import('@/models/Category')).Category
const category = await Category.findOne({
  _id: categoryId,
  restaurantId: restaurant._id,
}).lean()
if (!category) return { success: false, error: 'Categoría no válida.' }
```

Add the `Category` model import to `dishes.ts` (it is already imported in `categories.ts` and the pattern is established).

---

### CR-03: Non-atomic order swap in `reorderCategory` can corrupt ordering

**File:** `menu-digital/actions/categories.ts:122-123`

**Issue:** The order swap between `target` and `neighbor` is performed with two sequential `updateOne` calls. If the process is interrupted (serverless timeout, network error, transient MongoDB write failure) between the two writes, the two categories will share the same `order` value, producing non-deterministic sort results that persist silently. The comment acknowledges this but incorrectly equates "two updateOne calls" with "equivalent atomicity to bulkWrite" — bulkWrite is also not atomic across documents unless used inside a transaction.

**Fix:** Use a MongoDB session transaction, or apply a temporary sentinel value to avoid the collision window:

```typescript
// Option A: session transaction (requires MongoDB replica set — Atlas supports this)
import mongoose from 'mongoose'

const session = await mongoose.startSession()
try {
  await session.withTransaction(async () => {
    await Category.updateOne({ _id: target._id },   { $set: { order: neighbor.order } }, { session })
    await Category.updateOne({ _id: neighbor._id }, { $set: { order: target.order } },   { session })
  })
} finally {
  await session.endSession()
}

// Option B (no transaction): use a sentinel to avoid duplicate order values mid-swap
const SENTINEL = -9999
await Category.updateOne({ _id: target._id },   { $set: { order: SENTINEL } })
await Category.updateOne({ _id: neighbor._id }, { $set: { order: target.order } })
await Category.updateOne({ _id: target._id },   { $set: { order: neighbor.order } })
```

---

## Warnings

### WR-01: All client components display stale data after mutations — no UI refresh

**File:** `menu-digital/components/dashboard/CategoriesClient.tsx:21`, `menu-digital/components/dashboard/DishesClient.tsx:33`

**Issue:** Both `CategoriesClient` and `DishesClient` receive data as props (`initialCategories`, `initialDishes`) and never update local state after Server Actions succeed. `revalidatePath` invalidates the Next.js cache on the server, but the client component continues to render the original snapshot. After creating, editing, deleting, or reordering a category or dish, the user sees the old list until they manually reload the page. This is a UX correctness defect — the feedback toast says "success" but the table still shows the removed or renamed item.

**Fix:** Use `router.refresh()` from `next/navigation` after a successful action to re-fetch the Server Component data without a full navigation:

```typescript
import { useRouter } from 'next/navigation'

// inside the component:
const router = useRouter()

function handleModalSuccess(message: string) {
  setModalOpen(false)
  setEditTarget(null)
  showToast('success', message)
  router.refresh()   // triggers RSC re-render with fresh DB data
}
```

Apply the same pattern in the delete handlers and after reorder actions.

---

### WR-02: Reorder errors silently discarded in `CategoriesClient`

**File:** `menu-digital/components/dashboard/CategoriesClient.tsx:28`

**Issue:** `useActionState` is called with `reorderCategory`, but the returned state is discarded (`[, reorderAction, reorderPending]`). If `reorderCategory` returns `{ success: false, error: '...' }`, no toast or visual feedback is shown to the user. The category silently fails to move.

**Fix:**
```typescript
const [reorderState, reorderAction, reorderPending] = useActionState(reorderCategory, reorderInitialState)

// Add an effect to surface errors:
useEffect(() => {
  if (reorderState.error) {
    showToast('error', reorderState.error)
  }
}, [reorderState])
```

---

### WR-03: `dishId` / `categoryId` missing undefined guard before Mongoose query

**File:** `menu-digital/actions/dishes.ts:104`, `menu-digital/actions/dishes.ts:135`

**Issue:** In `deleteDish` (line 104) and `toggleAvailability` (line 135), `dishId` is read from FormData but never validated before being passed to `Dish.findOne({ _id: dishId, ... })`. If `dishId` is `undefined`, Mongoose will attempt to cast `undefined` to an ObjectId and throw a `CastError`, which propagates as an unhandled server error (500) rather than a clean `{ success: false, error: '...' }` response. The same applies to `categoryId` in `deleteCategory` (line 69) and `reorderCategory` (line 98 — partially guarded).

**Fix:** Add an explicit guard immediately after reading from FormData:

```typescript
// deleteDish, toggleAvailability — add after reading dishId:
if (!dishId) return { success: false, error: 'Datos inválidos.' }

// deleteCategory — add after reading categoryId:
if (!categoryId) return { success: false, error: 'Datos inválidos.' }
```

---

### WR-04: Uploading a new image in edit mode clears the existing image on submission error

**File:** `menu-digital/components/dashboard/DishModal.tsx:33-34`, `menu-digital/components/dashboard/DishModal.tsx:125-126`

**Issue:** When editing a dish, `imageUrl` and `imagePublicId` state are initialised from `dish.imageUrl` and `dish.imagePublicId`. If the user starts a new upload that fails (upload error), `imageUrl` state is not reverted — it retains the previous value, which is correct. However, if the user's upload succeeds but the Server Action subsequently returns an error (e.g., price validation), the hidden fields will carry the new `imagePublicId` on re-submit. The old Cloudinary asset is never deleted, and on the next successful submit the DB is updated with the new public ID while the old asset becomes an orphan. More critically: if `uploadError` is set and the user ignores it and submits the form (submit button is only disabled while `isUploading`, not when `uploadError` is non-null), the old `imageUrl` is cleared from the hidden field and replaced with whatever partial state exists.

**Fix:** Disable the submit button when `uploadError` is non-null, and on Server Action error in edit mode do not replace the stored `imagePublicId` unless the upload was intentional:

```typescript
// Disable submit when there is an unresolved upload error
<button
  type="submit"
  form="dish-modal-form"
  disabled={pending || isUploading || uploadError !== null}
  ...
>
```

---

### WR-05: `available` checkbox state lost when DishModal re-renders during pending

**File:** `menu-digital/components/dashboard/DishModal.tsx:253-261`

**Issue:** The availability checkbox uses `defaultChecked` (uncontrolled). When `pending` changes (form submits), React does not reset uncontrolled inputs. This is fine for the happy path, but if a Server Action returns an error and `state.error` is set, the `onError` callback fires and the modal stays open. The checkbox retains whatever the user last set, which is correct. However, there is no `key` prop on the form — if `useActionState` resets the form, the uncontrolled inputs may not reflect the `dish` prop values correctly across repeated submissions. This is a subtle correctness risk under concurrent submissions.

**Fix:** Add `key={dish?._id ?? 'create'}` to the `<form>` element to force remount when switching between dishes in edit mode:

```tsx
<form id="dish-modal-form" action={formAction} key={dish?._id ?? 'create'} className="space-y-4">
```

---

### WR-06: `@clerk/nextjs ^7.3.0` installed but root `CLAUDE.md` references Clerk v6 patterns

**File:** `menu-digital/package.json:12`

**Issue:** The project-local `menu-digital/CLAUDE.md` correctly documents Clerk v7 patterns (`afterSignOutUrl` on `ClerkProvider`, async `auth()`). However, the root `CLAUDE.md` still references "Clerk v6 patterns only — `clerkMiddleware` (not `authMiddleware`)", which is stale. The installed package is `^7.3.0`. This creates a risk that future agents working from the root guide will apply outdated patterns (e.g., omitting `afterSignOutUrl`). The current code uses v7 patterns correctly, but the inconsistent documentation will cause confusion.

**Fix:** Update root `CLAUDE.md` to reference Clerk v7, or remove the duplicate project guide from the root and point to `menu-digital/CLAUDE.md` as the canonical source.

---

## Info

### IN-01: Raw `<img>` used instead of Next.js `<Image>` component

**File:** `menu-digital/components/dashboard/DishModal.tsx:205`, `menu-digital/components/dashboard/DishesClient.tsx:145`

**Issue:** Both files use bare `<img>` elements to display dish photos. Next.js `<Image>` provides automatic format optimisation, lazy loading, and prevents layout shift. Using raw `<img>` also triggers an ESLint warning with `eslint-config-next`.

**Fix:**
```tsx
import Image from 'next/image'

// DishesClient table row:
<Image src={dish.imageUrl} alt={dish.name} width={40} height={40} className="w-full h-full object-cover" />

// DishModal preview:
<Image src={imageUrl} alt="Imagen actual" width={80} height={80} className="w-full h-full object-cover" />
```

---

### IN-02: `console.error` left in production Server Action

**File:** `menu-digital/actions/dishes.ts:121`

**Issue:** `console.error('[Cloudinary delete failed]', err)` is the only observability mechanism for Cloudinary deletion failures. On Vercel, function logs are ephemeral and not searchable. If orphaned Cloudinary assets accumulate, there is no alerting path.

**Fix:** The log line is intentional and acceptable for a v1. Consider replacing with a structured logger (e.g., `pino`) or integrating with Vercel Log Drains before production launch.

---

### IN-03: Magic number `5 * 1024 * 1024` for file size limit

**File:** `menu-digital/components/dashboard/DishModal.tsx:54`

**Issue:** The 5 MB file size limit is expressed as an inline arithmetic expression without a named constant. The same limit is also mentioned in the UI copy on line 215 (`Máximo 5 MB`). If the limit changes, two locations must be updated in sync.

**Fix:**
```typescript
// In lib/constants.ts or top of DishModal.tsx:
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

// Usage:
if (file.size > MAX_IMAGE_BYTES) { ... }
```

---

_Reviewed: 2026-05-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
