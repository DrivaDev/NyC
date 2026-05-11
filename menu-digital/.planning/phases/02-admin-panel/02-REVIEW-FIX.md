---
phase: 02-admin-panel
fixed_at: 2026-05-05T00:00:00Z
review_path: menu-digital/.planning/phases/02-admin-panel/02-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 2: Code Review Fix Report

**Fixed at:** 2026-05-05
**Source review:** menu-digital/.planning/phases/02-admin-panel/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (CR-01, CR-02, CR-03, WR-01, WR-02, WR-03, WR-04, WR-05, WR-06)
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: Cloudinary signature endpoint has no authentication check

**Files modified:** `menu-digital/app/api/sign-cloudinary-params/route.ts`
**Commit:** `0479963`
**Applied fix:** Added `import { auth } from '@clerk/nextjs/server'` and a `const { userId } = await auth()` guard at the top of the `POST` handler. Returns `Response.json({ error: 'No autorizado.' }, { status: 401 })` if no userId is present.

---

### CR-02: `categoryId` ownership not verified in `createDish` and `updateDish`

**Files modified:** `menu-digital/actions/dishes.ts`
**Commit:** `4f392a6`
**Applied fix:** Added `import { Category } from '@/models/Category'` and inserted `Category.findOne({ _id: categoryId, restaurantId: restaurant._id })` ownership check in both `createDish` and `updateDish` — immediately after the restaurant is resolved. Returns `{ success: false, error: 'Categoría no válida.' }` if the category does not belong to this restaurant.

---

### CR-03: Non-atomic order swap in `reorderCategory` can corrupt ordering

**Files modified:** `menu-digital/actions/categories.ts`
**Commit:** `cefed42`
**Applied fix:** Replaced the 2-step order swap with a 3-step sentinel swap. Step 1 parks the target at `SENTINEL = -9999`, step 2 sets the neighbor to `target.order`, step 3 sets the target to `neighbor.order`. This eliminates the window where both documents share the same order value.

---

### WR-01: All client components display stale data after mutations — no UI refresh

**Files modified:** `menu-digital/components/dashboard/CategoriesClient.tsx`, `menu-digital/components/dashboard/DishesClient.tsx`
**Commit:** `694fa44`
**Applied fix:** Added `import { useRouter } from 'next/navigation'` and `const router = useRouter()` to both components. Called `router.refresh()` in `handleModalSuccess` (after create/edit modal closes successfully) and in the delete success branch in both components. Also added `router.refresh()` after successful reorder via a `useEffect` on `reorderState` in `CategoriesClient`.

---

### WR-02: Reorder errors silently discarded in `CategoriesClient`

**Files modified:** `menu-digital/components/dashboard/CategoriesClient.tsx`
**Commit:** `694fa44` (committed together with WR-01)
**Applied fix:** Changed `const [, reorderAction, reorderPending]` to `const [reorderState, reorderAction, reorderPending]` to capture the action state. Added a `useEffect` that calls `showToast('error', reorderState.error)` whenever `reorderState.error` is set.

---

### WR-03: `dishId` / `categoryId` missing undefined guard before Mongoose query

**Files modified:** `menu-digital/actions/dishes.ts`, `menu-digital/actions/categories.ts`
**Commit:** `ceee444`
**Applied fix:** Added `if (!dishId) return { success: false, error: 'Datos inválidos.' }` immediately after reading `dishId` in both `deleteDish` and `toggleAvailability`. Added the equivalent `if (!categoryId) return ...` guard in `deleteCategory` after reading `categoryId`.

---

### WR-04: Uploading a new image in edit mode clears the existing image on submission error

**Files modified:** `menu-digital/components/dashboard/DishModal.tsx`
**Commit:** `a997611`
**Applied fix:** Changed the submit button `disabled` condition from `pending || isUploading` to `pending || isUploading || uploadError !== null` so the user cannot submit the form when there is an unresolved upload error.

---

### WR-05: `available` checkbox state lost when DishModal re-renders during pending

**Files modified:** `menu-digital/components/dashboard/DishModal.tsx`
**Commit:** `a997611` (committed together with WR-04)
**Applied fix:** Added `key={dish?._id ?? 'create'}` to the `<form id="dish-modal-form">` element to force a remount when switching between dishes in edit mode, ensuring uncontrolled inputs are reset to the correct `dish` prop values.

---

### WR-06: `@clerk/nextjs ^7.3.0` installed but root `CLAUDE.md` references Clerk v6 patterns

**Files modified:** `CLAUDE.md` (root)
**Commit:** `1518cec`
**Applied fix:** Updated stack line from "Clerk v6" to "Clerk v7". Updated Architecture Rule 3 from "Clerk v6 patterns only" to "Clerk v7 patterns only" and appended the `afterSignOutUrl on ClerkProvider (not on UserButton)` note to align with the installed package and the project-local `menu-digital/CLAUDE.md`.

---

_Fixed: 2026-05-05_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
