---
phase: 03-public-menu-qr
reviewed: 2026-05-06T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - menu-digital/next.config.ts
  - menu-digital/models/Restaurant.ts
  - menu-digital/actions/restaurant.ts
  - menu-digital/components/dashboard/RestaurantProfileForm.tsx
  - menu-digital/app/(admin)/dashboard/settings/page.tsx
  - menu-digital/lib/allergenEmoji.ts
  - menu-digital/components/menu/AllergenBadge.tsx
  - menu-digital/components/menu/ImagePlaceholder.tsx
  - menu-digital/components/menu/MenuCategoryNav.tsx
  - menu-digital/components/menu/DishRow.tsx
  - menu-digital/app/(public)/menu/[slug]/page.tsx
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-06T00:00:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

This review covers the Phase 3 public menu implementation: the ISR page at `/menu/[slug]`, its supporting components (`DishRow`, `AllergenBadge`, `MenuCategoryNav`, `ImagePlaceholder`), the settings form/action that feeds it, and the shared model/config files. The public page architecture is sound — server-side grouping, ISR via `generateStaticParams`, no auth leak on public routes. However, three critical defects were found that can produce incorrect behavior or expose a security gap: the server action does not validate the `description` length server-side (HTML `maxLength` is bypassable), the `clearLogo` flag can silently bypass Cloudinary cleanup when set together with a new upload, and the `DishRow` price formatter will display `NaN` or `$0,00` for dishes where `price` is `null`/`undefined` (the schema allows this via `required: false`). Five additional warnings cover missing error handling, a race condition in the IntersectionObserver nav, and a type-safety cast that hides invalid allergen keys at runtime.

---

## Critical Issues

### CR-01: No server-side length validation on `description` — `maxLength={200}` is client-only

**File:** `menu-digital/actions/restaurant.ts:70`

**Issue:** The `description` field is accepted without any server-side length check. The `<textarea maxLength={200}>` in the form (line 163 of `RestaurantProfileForm.tsx`) is a DOM hint only — it can be bypassed with any HTTP client (curl, Postman, direct `fetch`). An authenticated user can persist an arbitrarily long description, which is then rendered verbatim in the public menu header (`app/(public)/menu/[slug]/page.tsx:99-103`). A 10 MB description would be stored in MongoDB and served to every visitor of the public menu page on every ISR hit.

**Fix:**
```typescript
// actions/restaurant.ts — after line 70
const description = formData.get('description')?.toString().trim() ?? ''
if (description.length > 200) {
  return { success: false, error: 'La descripción no puede superar los 200 caracteres.' }
}
```

---

### CR-02: `clearLogo` flag can silently delete the wrong Cloudinary asset — race condition between upload and clear

**File:** `menu-digital/actions/restaurant.ts:77-93` / `menu-digital/components/dashboard/RestaurantProfileForm.tsx:81-86`

**Issue:** The `handleRemoveLogo` client function sets `clearLogo = true` and also clears `logoUrl`/`logoPublicId` to empty strings (lines 82-85). However, the submit button is **not** disabled while `clearLogo` is true — only while `isUploading` or `uploadError !== null`. A user can: (1) upload a new image (sets `logoUrl` + `logoPublicId` to the new asset, `clearLogo=false`), (2) click "Remove logo" immediately after upload completes (sets `clearLogo=true`, clears `logoUrl`/`logoPublicId` to `''`), then (3) submit. The server action receives `newLogoPublicId = ''` and `clearLogo = 'true'`. The action sets `logoUrl = ''` and `logoPublicId = ''` correctly — but the **just-uploaded** Cloudinary asset (the one the user selected) is now orphaned because the cleanup guard on line 77 requires `newLogoPublicId` to be non-empty. The newly uploaded image is leaked in Cloudinary and never deleted.

Separately: because `clearLogo` is a plain hidden `<input type="hidden" value="false">`, it is always submitted as the string `"false"` unless the state is `true`. This means every form submission carries `clearLogo` and the server action on line 90 checks `formData.get('clearLogo') === 'true'` — which is correct when true, but the hidden field still exists even during normal saves. This is not a bug in isolation, but combined with the upload+clear sequence above, it can produce the orphaned-asset situation.

**Fix:** When the user clicks "Remove logo" after a successful upload (i.e., `logoPublicId` was just set by an upload), pass the to-be-deleted public ID explicitly to the server action so it can be destroyed regardless of what `newLogoPublicId` contains:

```typescript
// Option: Add a hidden field for the public ID to delete
<input type="hidden" name="deleteLogoPublicId" value={clearLogo ? previousLogoPublicId : ''} />
```

And in the server action, always destroy `deleteLogoPublicId` if provided and non-empty.

---

### CR-03: `DishRow` price will render `NaN` / garbage for dishes where `price` is missing or zero

**File:** `menu-digital/components/menu/DishRow.tsx:20-23` / `menu-digital/models/Dish.ts:9`

**Issue:** The `Dish` schema defines `price: { type: Number, required: true }` (line 9 of `Dish.ts`), but Mongoose `required` is only enforced on `.save()`/`.create()` — not on `.lean()` reads of documents that were inserted before the constraint was added, or documents inserted bypassing validation. Additionally, the `DishData` interface in `page.tsx` types `price` as `number`, but `lean()` returns what is actually stored. If `price` is `null`, `undefined`, or `0`, the expression `dish.price / 100` evaluates to `NaN` or `0`. `toLocaleString` on `NaN` produces `"NaN"` in Node.js (not a currency string). This would render `"NaN"` visibly on the public menu page.

More critically: the `Dish` model schema sets `required: true` but does **not** set a `min` validator. A price of `-500` (−5.00 ARS) would pass validation and render as a negative price in the public menu.

**Fix:**
```typescript
// DishRow.tsx — defensive guard
const rawPrice = typeof dish.price === 'number' && isFinite(dish.price) ? dish.price : 0
const priceFormatted = (rawPrice / 100).toLocaleString('es-AR', {
  style: 'currency',
  currency: 'ARS',
})
```

Also add a `min: 0` validator to the Dish schema:
```typescript
price: { type: Number, required: true, min: 0 },
```

---

## Warnings

### WR-01: IntersectionObserver nav does not handle rapid scrolling — multiple sections simultaneously visible

**File:** `menu-digital/components/menu/MenuCategoryNav.tsx:26-36`

**Issue:** Each `IntersectionObserver` independently fires `setActiveId(cat._id)` when its section enters the viewport. With `rootMargin: '-20% 0px -70% 0px'` there is only a 10% window where a section is considered "active". On fast scroll or on short sections (a category with one dish), two sections can be simultaneously inside the intersection zone, causing the active tab to flicker between two categories. Additionally, when the user clicks a tab (`handleTabClick`), the active state is set optimistically to the clicked category, but if the smooth scroll is still in progress, an IntersectionObserver from a section that crosses the viewport mid-scroll will overwrite the optimistic state immediately (lines 42-46 vs lines 27-29).

**Fix:** In the IntersectionObserver callback, only update `activeId` if the new candidate is not already the active one, or track intersecting entries in a `Set` and pick the topmost:
```typescript
const intersecting = useRef<Set<string>>(new Set())
// In observer callback:
if (entry.isIntersecting) {
  intersecting.current.add(cat._id)
} else {
  intersecting.current.delete(cat._id)
}
// Pick the first category (by order) that is currently intersecting
const firstIntersecting = categories.find(c => intersecting.current.has(c._id))
if (firstIntersecting) setActiveId(firstIntersecting._id)
```

---

### WR-02: `updateRestaurantProfile` calls `revalidatePath('/menu/' + restaurant.slug)` using the **old** slug — irrelevant but misleading

**File:** `menu-digital/actions/restaurant.ts:98`

**Issue:** At line 73, `restaurant` is fetched before any update is applied. `restaurant.slug` at this point is the pre-existing slug. Since slug is immutable (Architecture Rule 8), the slug used in `revalidatePath` will always be the correct current slug — this is not a correctness bug. However, it creates a latent risk: if the slug immutability invariant were ever relaxed, this revalidation would silently point at the wrong path. More concretely, the code on line 96-98 revalidates `/dashboard`, `/dashboard/settings`, and the menu — but does **not** revalidate the root `/` path, which may render a restaurant listing page if one is added in a future phase.

Additionally, `revalidatePath` at line 96 calls `revalidatePath('/dashboard')` but the page that actually shows after a profile update is `/dashboard/settings`. Without revalidating the exact segment, the dashboard page server component will not reflect the new restaurant name until its own cache expires.

**Fix:** This is already correct for the current slug-immutable architecture. Add a comment making the dependency explicit:
```typescript
// slug is immutable (Architecture Rule 8) — restaurant.slug is always the canonical value
revalidatePath('/menu/' + restaurant.slug)
```

---

### WR-03: `allergens` cast `key as AllergenKey` in `DishRow` silently passes invalid strings

**File:** `menu-digital/components/menu/DishRow.tsx:54`

**Issue:** `dish.allergens` is typed as `string[]` in the `Dish` interface. The cast `key as AllergenKey` on line 54 is a compile-time assertion with no runtime check. If a dish document in MongoDB contains an allergen string that is not a valid `AllergenKey` (e.g., a typo `"gluten2"` or a legacy value), `AllergenBadge` will call `ALLERGENS.find(a => a.key === allergenKey)` (line 10 of `AllergenBadge.tsx`) and get `undefined`, falling back to `label = allergenKey` (the raw invalid string), and `ALLERGEN_EMOJI[allergenKey]` will return `undefined`, falling back to `'?'`. The badge renders but shows the raw DB key string as its tooltip — an information leak of internal data.

**Fix:** Add a runtime filter before rendering allergen badges:
```typescript
import { ALLERGENS } from '@/lib/allergens'
import type { AllergenKey } from '@/lib/allergens'

const validAllergenKeys = new Set(ALLERGENS.map(a => a.key))
// In DishRow:
const validAllergens = dish.allergens.filter(
  (key): key is AllergenKey => validAllergenKeys.has(key as AllergenKey)
)
```

---

### WR-04: `RestaurantProfileForm` success banner can appear stale after a second failed submission

**File:** `menu-digital/components/dashboard/RestaurantProfileForm.tsx:29-35`

**Issue:** `setSuccessMsg` is triggered inside a `useEffect` that depends on `[state]`. After a successful save, `successMsg` is set and auto-clears after 4 seconds. If the user then immediately makes a second submission that **fails**, `state.success` becomes `false` and `state.error` is set — but `successMsg` may still be visible (within its 4-second window). The UI would simultaneously show the green success banner and the red error banner, which is contradictory and confusing.

**Fix:** Clear `successMsg` whenever a new submission with `state.error` arrives:
```typescript
useEffect(() => {
  if (state.success) {
    setSuccessMsg('Perfil actualizado correctamente.')
    const t = setTimeout(() => setSuccessMsg(null), 4000)
    return () => clearTimeout(t)
  }
  if (state.error) {
    setSuccessMsg(null)  // Clear any lingering success message
  }
}, [state])
```

---

### WR-05: Public menu page does not set `revalidate` export or `dynamicParams` explicitly — ISR behavior depends on implicit Next.js defaults

**File:** `menu-digital/app/(public)/menu/[slug]/page.tsx:11-16`

**Issue:** The file comment says "On-demand ISR — no revalidate interval" and relies on `revalidatePath` calls from server actions. `generateStaticParams` returns `[]`, meaning no pages are pre-built. The default for `dynamicParams` in Next.js 15 is `true` (allows runtime generation), which is correct. However, without an explicit `export const dynamicParams = true` or `export const revalidate = false`, the ISR behavior relies on undocumented defaults. If the framework default changes in a Next.js minor update, pages could accidentally become fully dynamic (SSR) or fully static (no revalidation). Architecture Rule 6 mandates ISR explicitly.

**Fix:** Add explicit exports to document and lock the intended behavior:
```typescript
export const dynamicParams = true   // allow on-demand generation for any slug
export const revalidate = false     // no time-based revalidation; rely on revalidatePath only
```

---

## Info

### IN-01: `ImagePlaceholder` SVG icon does not match the semantic context (food/dish icon expected)

**File:** `menu-digital/components/menu/ImagePlaceholder.tsx:4-18`

**Issue:** The SVG path data renders a **fork-and-knife / restaurant cutlery** icon (paths that draw a fork handle and a knife), which is semantically appropriate for a dish image placeholder. However, the SVG has no `role` or `title` element — it relies on `aria-hidden="true"` (line 11) which is correct since it is decorative. The concern is that the icon SVG paths are copied from a specific Lucide icon set and there is no import — if the design system changes, this inline SVG will drift silently. Consider importing the `UtensilsCrossed` icon from `lucide-react` instead for consistency with the rest of the codebase.

**Fix:**
```tsx
import { UtensilsCrossed } from 'lucide-react'

export function ImagePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <UtensilsCrossed size={32} color="#9CA3AF" aria-hidden="true" />
    </div>
  )
}
```

---

### IN-02: `AllergenBadge` tooltip is not visible on touch-only devices

**File:** `menu-digital/components/menu/AllergenBadge.tsx:25`

**Issue:** The tooltip uses `group-hover/badge:opacity-100` and `group-focus-within/badge:opacity-100` for visibility. On mobile/tablet touch devices (primary use case for a QR menu), there is no hover state. `tabIndex={0}` allows keyboard focus but does not help touch users. The allergen information — a food safety detail — is hidden behind an interaction that is inaccessible on the primary consumption device.

**Fix:** Add `group-active/badge:opacity-100` as a fallback, or render allergen labels visibly below the emoji row on mobile, or use a tap-to-toggle pattern:
```tsx
className="... group-hover/badge:opacity-100 group-focus-within/badge:opacity-100 group-active/badge:opacity-100 ..."
```

---

### IN-03: `next.config.ts` `remotePatterns` pathname is overly permissive

**File:** `menu-digital/next.config.ts:9`

**Issue:** `pathname: '/**'` allows Next.js Image to proxy any path under `res.cloudinary.com`, including paths belonging to other Cloudinary accounts and cloud names. While `Next/Image` does not act as an open proxy (only the configured hostname is allowed), the pathname wildcard means any valid Cloudinary URL — from any account — would be accepted and optimized. For defense in depth, restrict to the project's own cloud:

**Fix:**
```typescript
{
  protocol: 'https',
  hostname: 'res.cloudinary.com',
  pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**`,
}
```

---

_Reviewed: 2026-05-06T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
