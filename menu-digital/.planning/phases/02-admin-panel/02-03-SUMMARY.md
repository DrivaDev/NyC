---
phase: 02-admin-panel
plan: 03
subsystem: dishes-crud
tags: [dishes, server-actions, cloudinary, allergens, availability-toggle, optimistic-ui, useActionState]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [03-01]
  affects:
    - actions/dishes.ts
    - app/(admin)/dashboard/dishes/page.tsx
    - components/dashboard/DishesClient.tsx
    - components/dashboard/DishModal.tsx
    - components/dashboard/AvailabilityToggle.tsx
tech_stack:
  added: []
  patterns:
    - signed-cloudinary-upload
    - cloudinary-destroy-before-db-delete
    - optimistic-ui-useTransition
    - useActionState-react19
    - native-dialog-showModal
    - inline-delete-confirm
    - ownership-guard
    - price-centavos-conversion
key_files:
  created:
    - actions/dishes.ts
    - app/(admin)/dashboard/dishes/page.tsx
    - components/dashboard/DishesClient.tsx
    - components/dashboard/DishModal.tsx
    - components/dashboard/AvailabilityToggle.tsx
  modified: []
decisions:
  - "deleteDish calls cloudinary.uploader.destroy(imagePublicId) in try/catch before Dish.deleteOne — log error and always delete DB doc"
  - "Price stored as centavos integer: Math.round(parseFloat(priceStr) * 100); displayed as pesos: (price / 100).toFixed(2)"
  - "Image upload fires on file onChange (sign + upload immediately), not at form submit; hidden fields carry imageUrl/imagePublicId to Server Action"
  - "AvailabilityToggle uses useState + useTransition for optimistic update; reverts on Server Action error"
  - "available checkbox: value='true' when checked; null when unchecked — formData.get('available') === 'true' correctly resolves both states"
  - "Cloudinary configured at module scope in actions/dishes.ts — CLOUDINARY_API_SECRET never in client bundle or NEXT_PUBLIC_ vars"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 2 Plan 3: Dishes CRUD Summary

**One-liner:** Four Server Actions (createDish/updateDish/deleteDish/toggleAvailability) with signed Cloudinary deletion, auth+ownership guards, and price centavos conversion, plus /dashboard/dishes Server Component page, DishesClient table, DishModal with allergen grid and client-side signed Cloudinary upload, and AvailabilityToggle with optimistic UI.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create actions/dishes.ts with all four Server Actions | ee7f3f0 | actions/dishes.ts |
| 2 | Create dishes page, DishesClient, DishModal, and AvailabilityToggle components | bc202c9 | app/(admin)/dashboard/dishes/page.tsx, components/dashboard/DishesClient.tsx, components/dashboard/DishModal.tsx, components/dashboard/AvailabilityToggle.tsx |

## What Was Built

### Task 1 — Server Actions (`actions/dishes.ts`)

Four exported Server Actions, all accepting `(prevState: any, formData: FormData)` for `useActionState` compatibility:

- **`createDish`** — validates name, categoryId, price (isFinite + >= 0); collects allergens via `formData.getAll('allergens')`; converts price from pesos string to centavos integer; stores imageUrl/imagePublicId from hidden fields set by client-side upload; calls `revalidatePath('/menu/' + restaurant.slug)`
- **`updateDish`** — same validation + ownership check (`Dish.findOne({ _id: dishId, restaurantId: restaurant._id })`), then `updateOne $set` on all fields including imageUrl/imagePublicId
- **`deleteDish`** — ownership check, then `cloudinary.uploader.destroy(dish.imagePublicId)` in try/catch (logs error, never throws), then `Dish.deleteOne`; revalidates
- **`toggleAvailability`** — reads current `dish.available`, flips via `$set: { available: !dish.available }`; returns `{ success: true, available: <new value> }` for optimistic revert if needed

Cloudinary configured at module scope with `CLOUDINARY_API_SECRET` (server-only, non-NEXT_PUBLIC_).

Every action: `await auth()` first → `await dbConnect()` → `Restaurant.findOne({ clerkId: userId })` for server-scoped ownership.

### Task 2 — UI Components

**`app/(admin)/dashboard/dishes/page.tsx`** (Server Component):
- Auth guard → `redirect('/sign-in')`; restaurant guard → `redirect('/dashboard')`
- Fetches categories and dishes in parallel via `Promise.all`
- Serializes via `JSON.parse(JSON.stringify(...))` to avoid Mongoose document serialization issues

**`components/dashboard/DishesClient.tsx`** (Client Component):
- Table with columns: image thumbnail (40x40 rounded, fallback `ImageOff` icon), name, category (resolved via categoryMap), price in pesos with `font-mono`, availability toggle, edit/delete actions
- Prerequisite warning (`AlertTriangle` + "Primero necesitás crear al menos una categoría...") with link to `/dashboard/categories` when `categories.length === 0`
- Empty state with `UtensilsCrossed` icon, heading "Sin platos todavía", body, CTA button
- "Nuevo plato" button disabled when no categories exist
- Inline delete confirmation replaces row action buttons when `confirmDeleteId === dish._id`
- Toast notifications (4 second auto-dismiss) for success/error feedback

**`components/dashboard/DishModal.tsx`** (Client Component):
- Native `<dialog>` opened via `dialogRef.current?.showModal()` on mount
- `useActionState` from `'react'` switches between `createDish` and `updateDish` based on `mode` prop
- Image upload on file `onChange`: GET signature from `/api/sign-cloudinary-params`, POST directly to Cloudinary; `isUploading` spinner shown, submit disabled during upload; `imageUrl`/`imagePublicId` stored in state and passed as hidden form fields
- Client-side file validation: 5 MB size limit, JPG/PNG/WebP type check — errors shown inline
- Allergen grid: 14 EU allergen checkboxes in 2-column grid; `ALLERGENS` array from `lib/allergens.ts`; `defaultChecked` set from `dish?.allergens?.includes(allergen.key)`
- Availability: checkbox with `value="true"`, `defaultChecked={dish?.available ?? true}`
- Price field: `$` prefix span + number input, `defaultValue={dish ? (dish.price / 100).toFixed(2) : ''}`

**`components/dashboard/AvailabilityToggle.tsx`** (Client Component):
- `role="switch"` ARIA toggle button with `aria-checked={optimisticAvailable}`
- `useState` for optimistic local state; `useTransition` to fire Server Action without blocking UI
- Immediate optimistic flip on click; reverts if `toggleAvailability` returns `{ success: false }`; calls `onToggleError` prop with error message for parent toast

## Verification Results

- `npx tsc --noEmit` — no output (clean; 0 errors)
- `npm run build` — exits 0; `/dashboard/dishes` registered as dynamic route
- `grep -r "process.env.CLOUDINARY_API_SECRET" menu-digital/components` — no results (secret only in actions/dishes.ts)
- All four Server Actions present with correct `(prevState: any, formData: FormData)` signatures
- `await auth()` called 4 times (once per action)
- `revalidatePath('/menu/' + restaurant.slug)` called 4 times (once per mutation)
- `cloudinary.uploader.destroy(dish.imagePublicId)` present in deleteDish before Dish.deleteOne
- `console.error('[Cloudinary delete failed]'` present (log-and-continue pattern)
- `formData.getAll('allergens')` present (multi-checkbox collection)
- `Math.round(parseFloat(` present (price centavos conversion)
- `ALLERGENS.map` present in DishModal (allergen grid rendered)
- "14 alérgenos EU" hint text present in DishModal
- `type="hidden" name="imageUrl"` and `type="hidden" name="imagePublicId"` present in DishModal
- `role="switch"` and `useTransition` present in AvailabilityToggle
- `setOptimisticAvailable` optimistic update pattern present

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows from MongoDB via Server Components. No hardcoded dishes or placeholder data.

## Threat Flags

None — all security surface is covered by the plan's threat model (T-02-03-01 through T-02-03-07). No new network endpoints introduced beyond what was planned.

## Self-Check: PASSED

- `actions/dishes.ts` — FOUND
- `app/(admin)/dashboard/dishes/page.tsx` — FOUND
- `components/dashboard/DishesClient.tsx` — FOUND
- `components/dashboard/DishModal.tsx` — FOUND
- `components/dashboard/AvailabilityToggle.tsx` — FOUND
- Commit ee7f3f0 — FOUND
- Commit bc202c9 — FOUND
