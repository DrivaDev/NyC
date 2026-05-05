# Phase 2: Admin Panel - Research

**Researched:** 2026-05-04
**Domain:** Next.js 16 App Router · Cloudinary signed uploads · Mongoose 9 CRUD · Server Actions · Native dialog
**Confidence:** HIGH (all core findings verified against official Next.js docs, Cloudinary docs, and live codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Forms open in a modal/dialog — no route change. One modal serves both create (empty) and edit (pre-filled) modes.
- **D-02:** Category form: name field only (order managed by ↑↓ buttons, not the form).
- **D-03:** Dish form: name, description, price (displayed as pesos, stored as centavos), category selector, image upload, allergen grid, availability toggle.
- **D-04:** Simple file input — user picks a file, a Server Action calls `/api/sign-cloudinary-params` to get a signed URL, then the client POSTs directly to Cloudinary. No Cloudinary Upload Widget.
- **D-05:** `CLOUDINARY_API_SECRET` lives only on the server — signing happens in the API route, never in client code.
- **D-06:** On dish delete: delete Cloudinary asset synchronously inside the Server Action before removing the DB document. If Cloudinary deletion fails, log the error but still delete the DB document (orphaned assets acceptable; broken DB references are not).
- **D-07:** Store both `imageUrl` and `imagePublicId` on Dish — `imagePublicId` is needed for Cloudinary deletion.
- **D-08:** Checkbox grid — all 14 EU allergens visible at once. No custom allergens. Stored as `[String]` enum on Dish.
- **D-09:** 14 EU allergens (Reglamento 1169/2011): gluten, crustáceos, huevos, pescado, cacahuetes, soja, lácteos, frutos_de_cáscara, apio, mostaza, sésamo, dióxido_de_azufre, altramuces, moluscos.
- **D-10:** ↑↓ arrow buttons per category row — no drag-and-drop, no dnd-kit.
- **D-11:** Order stored as `order: Number` on Category. Reorder = swap `order` values of two adjacent categories in a single Server Action.
- **D-12:** Price stored as centavos (integer) in DB. UI shows and accepts pesos with 2 decimal places. Conversion: `display = price / 100`, `store = Math.round(inputPesos * 100)`.
- **D-13:** Every DB query filters by `restaurantId` derived from `Restaurant.findOne({ clerkId: userId })` — never trust a client-supplied restaurantId.
- **D-14:** Ownership check before any update/delete: verify the target Category/Dish belongs to the authenticated user's Restaurant.
- **D-15:** `revalidatePath('/menu/[slug]')` called on every category and dish mutation. No static `revalidate` interval — on-demand only.

### Claude's Discretion

None declared — all implementation decisions were locked in the discussion.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAT-01 | Restaurant can create a category with a name | Server Action pattern (`actions/categories.ts`) + modal form |
| CAT-02 | Restaurant can edit an existing category name | Same modal in edit mode (pre-filled) + updateOne with ownership guard |
| CAT-03 | Restaurant can delete a category (blocked if dishes exist) | deleteOne + Dish.countDocuments check before delete |
| CAT-04 | Restaurant can reorder categories with ↑↓ buttons | bulkWrite swap of `order` fields between two adjacent docs |
| CAT-05 | Categories shown in configured order on public menu | `sort({ order: 1 })` query; `revalidatePath` on every mutation |
| DISH-01 | Restaurant can create a dish with name, description, price, category | Server Action with Zod validation |
| DISH-02 | Restaurant can edit any field of an existing dish | Same Server Action with dishId ownership guard |
| DISH-03 | Restaurant can delete a dish | deleteOne + Cloudinary asset deletion before DB deletion |
| DISH-04 | Restaurant can upload one image per dish via signed Cloudinary | `/api/sign-cloudinary-params` route + client FormData POST |
| DISH-05 | Restaurant can mark a dish as unavailable | `toggleAvailability` Server Action — optimistic UI on toggle button |
| DISH-06 | Restaurant can assign allergens from 14 EU allergens | Checkbox grid → `allergens: [String]` stored on Dish |
| DISH-07 | Only available dishes appear on public menu | Filtered at query time in Phase 3; `available: true` field on Dish |
</phase_requirements>

---

## Summary

Phase 2 delivers the full CRUD surface for categories and dishes. The codebase already has both Mongoose models fully scaffolded (`models/Category.ts`, `models/Dish.ts`) and the Server Action pattern is established in `actions/restaurant.ts`. The main engineering challenges are: (1) the Cloudinary signed upload flow — where the server generates a signature and the browser POSTs the file directly to Cloudinary's API; (2) the revalidation strategy — `revalidatePath` with the correct call signature for dynamic routes; and (3) the category reorder swap — which needs two atomic `updateOne` calls (bulkWrite is available but overkill for a 2-document swap).

All UI is built with Tailwind CSS v4 primitives, Lucide React, and native `<dialog>` elements — no new dependencies are introduced. The `cloudinary` npm package (v2 API) must be added as it is not yet installed. The `zod` package is also not yet installed and should be added for server-side form validation.

**Primary recommendation:** Wire Server Actions directly to `<form action={...}>` with `useActionState` for error display. Use `revalidatePath('/menu/' + slug, 'page')` (literal path) inside every mutating action — this is the correct call for a specific known slug.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Category CRUD | API / Backend (Server Actions) | Browser (modal form state) | Writes must go through Server Actions with auth guard |
| Dish CRUD | API / Backend (Server Actions) | Browser (modal form + upload progress) | Same — all DB writes server-gated |
| Image upload signing | API / Backend (Route Handler) | — | API secret must never reach browser |
| Image file upload | Browser | CDN (Cloudinary) | Client POSTs file directly to Cloudinary after getting server signature |
| Image deletion | API / Backend (Server Action) | — | Requires API secret; runs before DB delete |
| Availability toggle | Browser (optimistic) | API / Backend (Server Action) | UI updates optimistically; action confirms server state |
| Category ordering (↑↓ swap) | API / Backend (Server Action) | Browser (disabled button state) | Order is DB state; button triggers action |
| ISR cache invalidation | API / Backend (Server Action) | — | `revalidatePath` is server-only |
| Admin page data reads | Frontend Server (Server Components) | — | Pages fetch via Server Components, pass props to client |

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.4 | App Router framework | Project foundation |
| mongoose | 9.6.1 | MongoDB ODM | Project foundation |
| @clerk/nextjs | 7.3.0 | Auth — `await auth()` pattern | Project foundation |
| lucide-react | 1.14.0 | Icons (Pencil, Trash2, ChevronUp/Down, X, etc.) | Project foundation |
| tailwindcss | v4 | Styling via `@theme` tokens | Project foundation |

[VERIFIED: npm registry — versions confirmed via `npm view` during research]

### New dependencies to install
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cloudinary | 2.10.0 (latest) | Server-side: signature generation + asset deletion | Official Cloudinary Node.js SDK; `v2 as cloudinary` API |
| zod | latest | Server-side form validation in Server Actions | Next.js official docs recommend zod for Server Action validation |

[VERIFIED: npm registry — `npm view cloudinary version` returned 2.10.0]

**Note:** `cloudinary` is NOT yet installed in the project (`npm ls cloudinary` returns empty). It must be added in Wave 1.

**Installation:**
```bash
npm install cloudinary zod
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<dialog>` | Radix UI Dialog / Headless UI | Radix is more accessible out of box but adds a dependency; native dialog is sufficient given UI spec confirms it |
| zod | Manual validation | Zod gives typed errors + field-level messages; manual is error-prone |
| bulkWrite (2-doc swap) | Two sequential updateOne calls | BulkWrite is one round-trip; two updateOne calls are simpler and equally safe for this use case |

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Client Component)
  │
  ├─── <form action={serverAction}> ──────────────────────► Server Action ('use server')
  │         useActionState(action, init)                         ├── await auth() → userId
  │         pending / error / success state                      ├── dbConnect()
  │                                                              ├── Restaurant.findOne({ clerkId: userId })
  │                                                              ├── Category/Dish CRUD (filtered by restaurantId)
  │                                                              ├── revalidatePath('/menu/' + slug)
  │                                                              └── return { success, error }
  │
  ├─── Image upload flow:
  │     1. user selects file (onChange)
  │     2. fetch('/api/sign-cloudinary-params', { method: 'POST', body: { paramsToSign } })
  │              │
  │              ▼
  │         Route Handler (app/api/sign-cloudinary-params/route.ts)
  │              ├── cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET)
  │              └── return { signature, timestamp, api_key, cloud_name }
  │              │
  │     3. POST FormData to https://api.cloudinary.com/v1_1/{cloud}/image/upload
  │              └── response: { public_id, secure_url, ... }
  │     4. store { imageUrl: secure_url, imagePublicId: public_id } in dish form state
  │
  ├─── Availability toggle:
  │     1. onClick → setOptimisticAvailable(!current)
  │     2. startTransition(() => toggleAvailabilityAction(dishId))
  │     3. on error: revert + toast
  │
  └─── Server Component (page.tsx)
        ├── await auth() → userId
        ├── dbConnect()
        ├── Restaurant.findOne + Category.find + Dish.find
        └── pass data as props to Client Components
```

### Recommended Project Structure
```
app/
  (admin)/
    categories/
      page.tsx             # Server Component — fetches categories, renders CategoriesClient
    dishes/
      page.tsx             # Server Component — fetches dishes + categories, renders DishesClient
  api/
    sign-cloudinary-params/
      route.ts             # POST — signs upload params, returns { signature, timestamp, api_key, cloud_name }

actions/
  categories.ts            # createCategory, updateCategory, deleteCategory, reorderCategory
  dishes.ts                # createDish, updateDish, deleteDish, toggleAvailability

components/
  dashboard/
    Sidebar.tsx            # existing — set enabled: true for Categorías + Platos
    DashboardHeader.tsx    # NEW — client component reading usePathname() for dynamic title
    categories/
      CategoriesClient.tsx # 'use client' — list + modal state
      CategoryModal.tsx    # 'use client' — create/edit modal (native <dialog>)
      CategoryRow.tsx      # 'use client' — row with ↑↓ + inline delete confirmation
    dishes/
      DishesClient.tsx     # 'use client' — table + modal state
      DishModal.tsx        # 'use client' — create/edit modal with image upload
      DishRow.tsx          # 'use client' — table row with availability toggle
      AvailabilityToggle.tsx # 'use client' — optimistic toggle button
  ui/
    Toast.tsx              # 'use client' — success/error toast (if not already built)
```

**Key note on sidebar nav paths:** The Sidebar currently declares `href: '/dashboard/categories'` and `href: '/dashboard/dishes'` but the route group `(admin)` creates pages at `app/(admin)/categories/page.tsx`. Next.js App Router strips route group names from URLs so `/dashboard/categories` is incorrect — the correct URL is `/categories`. Check the existing nav item hrefs against the actual routes.

[VERIFIED: read `components/dashboard/Sidebar.tsx` — hrefs are `/dashboard/categories` and `/dashboard/dishes`]

**IMPORTANT:** The admin layout route group is `(admin)` which means pages live at `app/(admin)/categories/page.tsx` → URL `/categories`, NOT `/dashboard/categories`. The sidebar hrefs must be corrected OR the pages must be created at `app/(admin)/dashboard/categories/page.tsx` → URL `/dashboard/categories`. The latter (nested under `dashboard/`) is more consistent with the existing `app/(admin)/dashboard/page.tsx` → `/dashboard` pattern.

**Recommendation:** Create pages at `app/(admin)/dashboard/categories/page.tsx` and `app/(admin)/dashboard/dishes/page.tsx` to match the existing sidebar hrefs `/dashboard/categories` and `/dashboard/dishes`.

---

### Pattern 1: Server Action with Auth Guard (established in codebase)

**What:** Every Server Action in `actions/` follows this exact pattern from `actions/restaurant.ts`.
**When to use:** All category and dish mutations.

```typescript
// Source: actions/restaurant.ts (existing codebase)
'use server'

import { auth } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'

export async function createCategory(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const name = formData.get('name')?.toString().trim()
  if (!name) return { success: false, error: 'El nombre de la categoría es obligatorio.' }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  // All queries scoped to restaurant._id — never trust client-supplied restaurantId
  const maxOrder = await Category.findOne({ restaurantId: restaurant._id })
    .sort({ order: -1 }).lean<{ order: number }>()
  
  await Category.create({
    restaurantId: restaurant._id,
    name,
    order: (maxOrder?.order ?? -1) + 1,
  })

  revalidatePath('/menu/' + restaurant.slug)
  return { success: true }
}
```

[VERIFIED: cross-referenced with Next.js official forms guide — `nextjs.org/docs/app/guides/forms`]

---

### Pattern 2: useActionState for Form Error Display

**What:** Client component wraps form, uses `useActionState` to display server-returned errors.
**When to use:** All modal forms (category + dish).

```typescript
// Source: Next.js official docs — nextjs.org/docs/app/guides/forms
'use client'
import { useActionState } from 'react'
import { createCategory } from '@/actions/categories'

const initialState = { success: false, error: undefined }

export function CategoryModal() {
  const [state, formAction, pending] = useActionState(createCategory, initialState)

  return (
    <form id="modal-form" action={formAction}>
      <input type="text" name="name" />
      {state.error && <p role="alert" className="text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Guardando...' : 'Crear categoría'}
      </button>
    </form>
  )
}
```

**Important:** When using `useActionState`, the Server Action signature must add `prevState` as first parameter:
```typescript
export async function createCategory(prevState: any, formData: FormData) { ... }
```

[VERIFIED: Next.js official docs — nextjs.org/docs/app/guides/forms]

---

### Pattern 3: Cloudinary Signed Upload Flow

**What:** Three-step flow — server signs params, client uploads directly to Cloudinary, client stores the returned URLs.
**When to use:** Image upload in dish modal.

**Step 1 — Server signing route:**
```typescript
// Source: cloudinary.com/blog/next-js-cloudinary-upload-transform-moderate-images
// app/api/sign-cloudinary-params/route.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,       // NEVER in NEXT_PUBLIC_
})

export async function POST(request: Request) {
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

**Step 2 — Client uploads directly to Cloudinary:**
```typescript
// Source: cloudinary.com/documentation/client_side_uploading + authentication_signatures
async function uploadToCloudinary(file: File): Promise<{ secure_url: string; public_id: string }> {
  // 1. Get signature from our server
  const signRes = await fetch('/api/sign-cloudinary-params', { method: 'POST' })
  const { signature, timestamp, api_key, cloud_name } = await signRes.json()

  // 2. Build FormData for direct upload
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', api_key)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', 'menu-digital')

  // 3. POST directly to Cloudinary
  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await uploadRes.json()

  // 4. Response contains public_id and secure_url
  return { secure_url: data.secure_url, public_id: data.public_id }
}
```

[VERIFIED: cloudinary.com/documentation/client_side_uploading + authentication_signatures]

**Required environment variables (new for Phase 2):**
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...   # safe — needed by client for upload URL
NEXT_PUBLIC_CLOUDINARY_API_KEY=...      # safe — public key, not secret
CLOUDINARY_API_SECRET=...               # NEVER NEXT_PUBLIC_ — server only
```

---

### Pattern 4: Cloudinary Asset Deletion in Server Action

**What:** Delete asset by `public_id` before removing the DB document.
**When to use:** `deleteDish` Server Action.

```typescript
// Source: cloudinary.com/documentation/delete_assets
import { v2 as cloudinary } from 'cloudinary'

// Inside deleteDish Server Action, after auth guard:
if (dish.imagePublicId) {
  try {
    await cloudinary.uploader.destroy(dish.imagePublicId)
  } catch (err) {
    // D-06: log but continue — broken DB references are worse than orphaned assets
    console.error('[Cloudinary delete failed]', err)
  }
}
await Dish.deleteOne({ _id: dishId, restaurantId: restaurant._id })
```

[VERIFIED: cloudinary.com/documentation/delete_assets]

---

### Pattern 5: revalidatePath for Public Menu

**What:** Invalidate the public menu page cache on every category/dish mutation.
**When to use:** End of every Server Action that mutates categories or dishes.

```typescript
// Source: nextjs.org/docs/app/api-reference/functions/revalidatePath (verified — version 16.2.4 docs)
import { revalidatePath } from 'next/cache'

// Option A — Revalidate ONE specific slug (use this when you have the slug):
revalidatePath('/menu/' + restaurant.slug)
// No 'type' param needed — literal path omits the type

// Option B — Revalidate ALL /menu/[slug] pages (use if slug lookup is expensive):
revalidatePath('/menu/[slug]', 'page')
```

**Verdict for this project:** Use Option A (literal slug). The Server Action already looks up `restaurant` to get `restaurantId`, so `restaurant.slug` is available at zero extra cost. This is more precise — only the current user's menu is invalidated.

[VERIFIED: nextjs.org/docs/app/api-reference/functions/revalidatePath — confirmed literal path omits type parameter]

---

### Pattern 6: Category Reorder (Swap Two Documents)

**What:** Swap `order` values of two adjacent categories when user clicks ↑ or ↓.
**When to use:** `reorderCategory` Server Action.

```typescript
// Source: [ASSUMED] — standard Mongoose pattern; verified bulkWrite exists in Mongoose 9
export async function reorderCategory(
  prevState: any,
  formData: FormData
) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const categoryId = formData.get('categoryId')?.toString()
  const direction   = formData.get('direction')?.toString() // 'up' | 'down'

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  const target = await Category.findOne({ _id: categoryId, restaurantId: restaurant._id }).lean()
  if (!target) return { success: false, error: 'Categoría no encontrada.' }

  const neighbor = await Category.findOne({
    restaurantId: restaurant._id,
    order: direction === 'up' ? target.order - 1 : target.order + 1,
  }).lean()
  if (!neighbor) return { success: true } // already at boundary — no-op

  // Swap order values — two updateOne calls (no transactions needed for this UX)
  await Category.updateOne({ _id: target._id },   { $set: { order: neighbor.order } })
  await Category.updateOne({ _id: neighbor._id }, { $set: { order: target.order } })

  revalidatePath('/menu/' + restaurant.slug)
  return { success: true }
}
```

**Why two updateOne calls instead of bulkWrite:** BulkWrite would work identically but adds syntactic overhead for a 2-document swap. MongoDB does not execute multi-document writes atomically without transactions; both approaches have the same atomicity characteristics for this use case. Two updateOne calls are simpler and clearer. [ASSUMED — see assumptions log]

---

### Pattern 7: Native `<dialog>` Modal (no library)

**What:** Native HTML dialog element controlled via `useRef`.
**When to use:** Category modal + Dish modal (per UI spec decision).

```typescript
// Source: spacejelly.dev/posts/how-to-create-a-modal-in-react-with-html-dialog
// Source: 02-UI-SPEC.md (design contract)
'use client'
import { useRef } from 'react'

export function CategoryModal({ mode, category, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  function open()  { dialogRef.current?.showModal() }
  function close() { dialogRef.current?.close(); onClose?.() }

  return (
    <>
      {/* Overlay — click-outside closes modal */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={close} />

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   z-50 m-0 p-0 bg-white rounded-lg shadow-sm
                   w-full max-w-sm border border-brand-acento outline-none"
      >
        {/* header / body / footer — per UI spec */}
      </dialog>
    </>
  )
}
```

**Key facts about native `<dialog>` in React:**
- Must be a Client Component (`'use client'`) to use `useRef`
- `showModal()` enables the native backdrop and traps focus
- The UI spec overrides the native `::backdrop` with a manual overlay div — this is intentional for full style control
- `close()` method dismisses the dialog; `Escape` key also works natively
- No accessibility library needed — native dialog has built-in `role="dialog"` and focus trap

[VERIFIED: MDN + spacejelly.dev tutorial cross-referenced with 02-UI-SPEC.md]

---

### Pattern 8: Dynamic Header Title (usePathname)

**What:** Extract header title into a client component that reads `usePathname()`.
**When to use:** Phase 2 adds `/dashboard/categories` and `/dashboard/dishes` pages; the header currently hardcodes "Dashboard".

```typescript
// components/dashboard/DashboardHeader.tsx
'use client'
import { usePathname } from 'next/navigation'

const titles: Record<string, string> = {
  '/dashboard':            'Dashboard',
  '/dashboard/categories': 'Categorías',
  '/dashboard/dishes':     'Platos',
}

export function DashboardHeader() {
  const pathname = usePathname()
  const title = titles[pathname] ?? 'Dashboard'
  return (
    <header className="h-14 bg-white border-b border-brand-acento flex items-center px-6 justify-between shrink-0">
      <h1 className="text-base font-bold text-brand-titulares">{title}</h1>
    </header>
  )
}
```

Then replace the static `<header>` in `app/(admin)/layout.tsx` with `<DashboardHeader />`.

[VERIFIED: read `app/(admin)/layout.tsx` — header title is hardcoded as "Dashboard"]

---

### Anti-Patterns to Avoid

- **Trusting client-supplied restaurantId:** Always derive `restaurantId` from `Restaurant.findOne({ clerkId: userId })`. Never accept it from `formData.get('restaurantId')`.
- **Calling `revalidatePath('/menu/[slug]', 'page')` with the template:** This invalidates ALL restaurant menus. Use the literal slug `/menu/${restaurant.slug}` instead — it only costs one DB lookup that's already done in the action.
- **Putting `CLOUDINARY_API_SECRET` in a `NEXT_PUBLIC_` var:** Exposes the secret in the browser bundle. The signing route is the only code that reads it.
- **Calling `cloudinary.config()` inside every request:** Call it once at module scope in the route handler file; it's idempotent but repeated calls are unnecessary overhead.
- **Skipping the Mongoose registration guard:** Both models already use `models.X || model('X', XSchema)`. New models must follow the same pattern.
- **Using `useFormState` from `react-dom`:** That was React 18. In React 19 (this project uses 19.2.4) use `useActionState` from `'react'`.
- **Hardcoding dashboard/categories paths without verifying the route group structure:** Pages under `app/(admin)/dashboard/categories/` resolve to `/dashboard/categories`. Pages under `app/(admin)/categories/` resolve to `/categories`. The sidebar hrefs point to `/dashboard/categories` — match that.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upload signature | Custom HMAC implementation | `cloudinary.utils.api_sign_request()` | Handles SHA-1/SHA-256, correct param ordering, encoding |
| Asset deletion | Manual fetch to Cloudinary API | `cloudinary.uploader.destroy(public_id)` | Handles auth, retries, result parsing |
| Form pending state | `useState(isPending)` + manual tracking | `useActionState` third return value `pending` | Built into React 19, no extra state |
| Price formatting | Custom number-to-pesos function | `(price / 100).toFixed(2)` inline | No library needed for this simple conversion |
| Focus trap in modal | Custom focus trap logic | Native `<dialog>` + `showModal()` | Browser handles focus trap, Escape key, ARIA role automatically |
| Allergen list | Define inline in component | `const ALLERGENS = [...]` constant in `lib/allergens.ts` | Shared between form + display; single source of truth |

**Key insight:** Cloudinary's Node.js SDK handles all the cryptographic complexity of signed uploads. Using raw fetch calls to the Cloudinary REST API bypasses signature validation, error handling, and future API version compatibility.

---

## Common Pitfalls

### Pitfall 1: revalidatePath Template vs Literal
**What goes wrong:** Calling `revalidatePath('/menu/[slug]', 'page')` invalidates every restaurant's cached menu simultaneously — massive unnecessary revalidation.
**Why it happens:** Developer reads the Next.js docs example showing the template form and uses it everywhere.
**How to avoid:** Use the literal path `revalidatePath('/menu/' + restaurant.slug)` inside Server Actions where `restaurant` is already in scope.
**Warning signs:** All restaurant menus showing fresh content after one restaurant's edit.

[VERIFIED: nextjs.org/docs/app/api-reference/functions/revalidatePath — confirmed literal path is correct for single-page invalidation]

---

### Pitfall 2: Cloudinary Signature Expiry
**What goes wrong:** Upload fails with "signature expired" if the user delays between selecting the file and submitting.
**Why it happens:** Signatures are valid for exactly 1 hour from the timestamp. If the signing route is called at page load (pre-fetching), the signature may be stale by upload time.
**How to avoid:** Per D-04 pattern — sign immediately when the user selects a file (`onChange` on the file input), not at modal open time. The 1-hour window is more than enough for the actual upload.
**Warning signs:** Upload succeeds in dev but fails after idle time in production.

[CITED: cloudinary.com/documentation/authentication_signatures — "Signatures are valid for one hour from the timestamp value"]

---

### Pitfall 3: `useActionState` First-Argument Signature Change
**What goes wrong:** Server Action works in isolation but throws "too many arguments" or returns stale state when used with `useActionState`.
**Why it happens:** `useActionState` injects `prevState` as the first argument. A Server Action defined as `async function createCategory(formData: FormData)` receives the prevState object as `formData`, breaking `formData.get(...)`.
**How to avoid:** Always define actions used with `useActionState` as `async function createCategory(prevState: any, formData: FormData)`.
**Warning signs:** `formData.get('name')` returns `null` even when the field is filled.

[VERIFIED: nextjs.org/docs/app/guides/forms — confirmed prevState is injected as first arg]

---

### Pitfall 4: Mongoose `OverwriteModelError` on Hot Reload
**What goes wrong:** Dev server crashes with "Cannot overwrite Category model once compiled" after saving a model file.
**Why it happens:** Next.js hot reload re-executes module files; `mongoose.model()` is called again on an already-registered model name.
**How to avoid:** Both `models/Category.ts` and `models/Dish.ts` already use the registration guard `models.Category || model('Category', ...)`. Do not break this pattern.
**Warning signs:** Error only in dev (`next dev`), not in production.

[VERIFIED: read `models/Category.ts` and `models/Dish.ts` — guard already in place]

---

### Pitfall 5: `cloudinary` Module Not Installed
**What goes wrong:** Build fails with "Module not found: cloudinary".
**Why it happens:** The `cloudinary` npm package is not in `package.json` — it's a new dependency for Phase 2.
**How to avoid:** Wave 1 must run `npm install cloudinary zod` before any code that imports from cloudinary is written.
**Warning signs:** `npm ls cloudinary` returns empty (confirmed during research).

[VERIFIED: `npm ls cloudinary` in the project returned empty during research]

---

### Pitfall 6: Category Delete Without Dish Check
**What goes wrong:** Deleting a category orphans all its dishes (categoryId becomes a dangling reference).
**Why it happens:** Missing the prerequisite check before delete.
**How to avoid:** Before `Category.deleteOne(...)`, run `Dish.countDocuments({ categoryId: category._id })`. If count > 0, return `{ success: false, error: 'No podés eliminar esta categoría porque tiene platos asociados...' }`. (Per UI spec copywriting contract.)
**Warning signs:** Dishes page shows dishes with no category name — the `categoryId` points to a deleted doc.

[ASSUMED — standard referential integrity pattern; no official source needed]

---

### Pitfall 7: Price Stored as Float Instead of Integer
**What goes wrong:** `price: 1500.1` stored in DB due to float precision; displays as `1500.10` but may round inconsistently.
**Why it happens:** Developer reads `price / 100` and stores the result instead of using `Math.round(inputPesos * 100)`.
**How to avoid:** Always `Math.round(parseFloat(formData.get('price')) * 100)` on write. Validate that the result is a finite integer before saving.
**Warning signs:** Prices like `$14.999999999999998` in the public menu.

[CITED: 02-CONTEXT.md D-12 — price stored as centavos (integer)]

---

## Code Examples

### Categories Server Action (full create)
```typescript
// actions/categories.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { Category } from '@/models/Category'
import { Dish } from '@/models/Dish'

export async function createCategory(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const name = formData.get('name')?.toString().trim()
  if (!name) return { success: false, error: 'El nombre de la categoría es obligatorio.' }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  const maxOrderDoc = await Category
    .findOne({ restaurantId: restaurant._id })
    .sort({ order: -1 })
    .lean<{ order: number }>()

  await Category.create({
    restaurantId: restaurant._id,
    name,
    order: (maxOrderDoc?.order ?? -1) + 1,
  })

  revalidatePath('/menu/' + restaurant.slug)
  return { success: true }
}
```

### Cloudinary Signing Route
```typescript
// app/api/sign-cloudinary-params/route.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST() {
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

### Client-Side Upload Helper
```typescript
// lib/cloudinaryUpload.ts
export async function uploadDishImage(file: File): Promise<{ secure_url: string; public_id: string }> {
  const signRes = await fetch('/api/sign-cloudinary-params', { method: 'POST' })
  if (!signRes.ok) throw new Error('No se pudo firmar la carga.')
  const { signature, timestamp, api_key, cloud_name } = await signRes.json()

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', api_key)
  body.append('timestamp', String(timestamp))
  body.append('signature', signature)
  body.append('folder', 'menu-digital')

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: 'POST', body }
  )
  if (!uploadRes.ok) throw new Error('Error al subir la imagen a Cloudinary.')
  const data = await uploadRes.json()
  return { secure_url: data.secure_url, public_id: data.public_id }
}
```

### Delete Dish with Cloudinary Cleanup
```typescript
// Inside actions/dishes.ts — deleteDish Server Action
import { v2 as cloudinary } from 'cloudinary'

export async function deleteDish(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const dishId = formData.get('dishId')?.toString()

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  // Ownership check
  const dish = await Dish.findOne({ _id: dishId, restaurantId: restaurant._id }).lean<{ imagePublicId: string }>()
  if (!dish) return { success: false, error: 'Plato no encontrado.' }

  // D-06: attempt Cloudinary deletion first; continue even on failure
  if (dish.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(dish.imagePublicId)
    } catch (err) {
      console.error('[Cloudinary delete failed]', err)
    }
  }

  await Dish.deleteOne({ _id: dishId, restaurantId: restaurant._id })
  revalidatePath('/menu/' + restaurant.slug)
  return { success: true }
}
```

### Allergens Constant (shared across form + display)
```typescript
// lib/allergens.ts
export const ALLERGENS = [
  { key: 'gluten',            label: 'Gluten' },
  { key: 'crustaceos',        label: 'Crustáceos' },
  { key: 'huevos',            label: 'Huevos' },
  { key: 'pescado',           label: 'Pescado' },
  { key: 'cacahuetes',        label: 'Cacahuetes' },
  { key: 'soja',              label: 'Soja' },
  { key: 'lacteos',           label: 'Lácteos' },
  { key: 'frutos_de_cascara', label: 'Frutos de cáscara' },
  { key: 'apio',              label: 'Apio' },
  { key: 'mostaza',           label: 'Mostaza' },
  { key: 'sesamo',            label: 'Sésamo' },
  { key: 'dioxido_de_azufre', label: 'Dióxido de azufre' },
  { key: 'altramuces',        label: 'Altramuces' },
  { key: 'moluscos',          label: 'Moluscos' },
] as const

export type AllergenKey = typeof ALLERGENS[number]['key']
```

[CITED: 02-CONTEXT.md D-09 — authoritative allergen list]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` from `react-dom` | `useActionState` from `react` | React 19 | Import source changed; API identical |
| `authMiddleware` from Clerk | `clerkMiddleware` | Clerk v6 | `authMiddleware` removed in Core 2 |
| Tailwind config in `tailwind.config.ts` | `@theme` in `globals.css` | Tailwind v4 | Brand tokens in CSS, not JS config |
| Mongoose `autoIndex: true` (default) | `autoIndex: false` in production | Ongoing best practice | Prevents index rebuilds on cold start |

**Deprecated/outdated:**
- `useFormState` (react-dom): replaced by `useActionState` (react) in React 19 — this project uses React 19.2.4
- `authMiddleware` (Clerk): removed — already using `clerkMiddleware` correctly
- `tailwind.config.ts` brand tokens: already using `@theme` in `globals.css` correctly

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Two sequential `updateOne` calls for category swap have equivalent atomicity to `bulkWrite` for this 2-document use case | Pattern 6 (reorder) | If simultaneous requests corrupt order values — mitigation: UI disables ↑↓ buttons during pending action, making concurrent swaps effectively impossible |
| A2 | Category delete guard (check dish count before delete) is the correct behavior for CAT-03 | Pitfall 6 | If requirement is "cascade delete all dishes" instead of "block delete" — but D-13/UI spec copywriting confirms the block behavior |
| A3 | `app/(admin)/dashboard/categories/page.tsx` resolves to `/dashboard/categories` matching sidebar hrefs | File Structure pattern | If Next.js route group behavior differs — easily verified by checking existing `app/(admin)/dashboard/page.tsx` → `/dashboard` |

---

## Open Questions

1. **Cloudinary cloudname/api-key env vars**
   - What we know: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_API_KEY` are needed; `CLOUDINARY_API_SECRET` must be server-only.
   - What's unclear: Whether these env vars are already set in `.env.local` and Vercel. They were not created in Phase 1.
   - Recommendation: Wave 1 must include a step to add all three Cloudinary env vars.

2. **Toast component existence**
   - What we know: The UI spec specifies a toast notification system (success + error toasts, bottom-right, 4s auto-dismiss). The dashboard shell has a `components/ui/` directory but no toast was built in Phase 1.
   - What's unclear: Whether a `Toast.tsx` component was created in Phase 1.
   - Recommendation: Wave 1 should check for `components/ui/Toast.tsx` and create it if missing.

3. **Cloudinary upload folder and transformation settings**
   - What we know: D-04 specifies direct upload; the signing route should scope uploads to a folder.
   - What's unclear: Whether a specific Cloudinary upload preset or transformation (resize, format conversion) should be applied.
   - Recommendation: Use folder `menu-digital` with no transformations at upload time — Phase 4 can add image optimization if needed. [ASSUMED]

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next.js dev server | ✓ | (project runs) | — |
| MongoDB Atlas | All DB operations | ✓ | (Phase 1 confirmed working) | — |
| Cloudinary npm pkg | Image upload/delete | ✗ | not installed | Must install: `npm install cloudinary` |
| zod npm pkg | Server Action validation | ✗ | not installed | Must install: `npm install zod` |
| Cloudinary account env vars | Signing route | Unknown | — | Must add to .env.local and Vercel |

**Missing dependencies with no fallback:**
- `cloudinary` npm package — blocks `app/api/sign-cloudinary-params/route.ts` and dish delete
- `zod` npm package — blocks server-side form validation (can hand-roll if needed but not recommended)
- Cloudinary env vars (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) — blocks the entire image upload feature

---

## Project Constraints (from CLAUDE.md)

| Directive | Enforcement |
|-----------|-------------|
| Every DB query filters by `userId` from `await auth()` | Every Server Action must call `await auth()` first; derive `restaurantId` from `Restaurant.findOne({ clerkId: userId })` |
| Global Mongoose connection cache in `lib/dbConnect.ts` | Call `await dbConnect()` at the top of every Server Action and Server Component touching MongoDB |
| Clerk v7 patterns only — `clerkMiddleware`, async `auth()`, `ClerkProvider` inside `<body>` | No `authMiddleware`; always `await auth()` (missing await returns silent Promise) |
| Server Actions for writes, Server Components for reads | Modal form submissions → Server Actions; page data fetching → Server Component `page.tsx` |
| Signed Cloudinary uploads — `CLOUDINARY_API_SECRET` never in client code or `NEXT_PUBLIC_` vars | API secret only in Route Handler; cloud name and api_key may use `NEXT_PUBLIC_` |
| ISR for `/menu/[slug]` — call `revalidatePath` on every dish/category mutation | Every Server Action that mutates categories or dishes must call `revalidatePath('/menu/' + restaurant.slug)` |
| Tailwind v4 — brand tokens via `@theme` in `globals.css`, not in `tailwind.config.ts` | Use `bg-brand-principal`, `text-brand-titulares` etc. — already defined in `globals.css` |
| No gradients, no off-palette colors, no excessive shadows | `shadow-sm` max; destructive actions use `red-600` only (single allowed deviation) |
| Footer "Desarrollado por Driva Dev" on every page | Inherited from `app/(admin)/layout.tsx` — no action needed in Phase 2 |
| Slug is immutable after creation | No Phase 2 code should touch the `slug` field |

---

## Sources

### Primary (HIGH confidence)
- [Next.js Forms Guide — nextjs.org/docs/app/guides/forms](https://nextjs.org/docs/app/guides/forms) — `useActionState`, Server Action signature, validation pattern, pending state (version 16.2.4, updated 2026-04-10)
- [Next.js revalidatePath Docs — nextjs.org/docs/app/api-reference/functions/revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) — literal vs template path, `type` parameter behavior (version 16.2.4, updated 2026-04-10)
- [Cloudinary Delete Assets — cloudinary.com/documentation/delete_assets](https://cloudinary.com/documentation/delete_assets) — `cloudinary.uploader.destroy(public_id)` pattern
- [Cloudinary Authentication Signatures — cloudinary.com/documentation/authentication_signatures](https://cloudinary.com/documentation/authentication_signatures) — `api_sign_request`, timestamp, 1-hour validity
- [Cloudinary Client-Side Uploading — cloudinary.com/documentation/client_side_uploading](https://cloudinary.com/documentation/client_side_uploading) — direct FormData upload to Cloudinary URL

### Secondary (MEDIUM confidence)
- [Cloudinary Next.js Blog Post — cloudinary.com/blog/next-js-cloudinary-upload-transform-moderate-images](https://cloudinary.com/blog/next-js-cloudinary-upload-transform-moderate-images) — App Router signing route pattern (verified against official docs)
- [Space Jelly — Native Dialog in React](https://spacejelly.dev/posts/how-to-create-a-modal-in-react-with-html-dialog) — `useRef` + `showModal()` pattern (cross-referenced with MDN)
- [MDN HTMLDialogElement](https://developer.mozilla.org/docs/Web/HTML/Element/dialog) — native dialog API

### Tertiary (LOW confidence — validated against codebase)
- Existing codebase (`actions/restaurant.ts`, `models/Category.ts`, `models/Dish.ts`, `app/(admin)/layout.tsx`, `components/dashboard/Sidebar.tsx`) — verified by direct file reads during research

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages verified via `npm view`; codebase read directly
- Architecture: HIGH — patterns verified against Next.js 16.2.4 official docs
- Cloudinary flow: HIGH — official Cloudinary docs + verified working pattern
- Pitfalls: HIGH (most) / MEDIUM (price/allergen pitfalls — based on requirement reading)

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (stable libraries — Next.js, Cloudinary Node SDK, Mongoose are not fast-moving at patch level)
