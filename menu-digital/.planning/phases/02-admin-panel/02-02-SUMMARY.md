---
phase: 02-admin-panel
plan: 02
subsystem: categories-crud
tags: [categories, server-actions, crud, reorder, modal, useActionState]
dependency_graph:
  requires: [02-01]
  provides: [02-03]
  affects: [app/(admin)/dashboard/categories/page.tsx, components/dashboard/CategoriesClient.tsx, components/dashboard/CategoryModal.tsx, actions/categories.ts]
tech_stack:
  added: []
  patterns: [useActionState-react19, native-dialog-showModal, inline-delete-confirm, ownership-guard, referential-integrity-guard]
key_files:
  created:
    - actions/categories.ts
    - app/(admin)/dashboard/categories/page.tsx
    - components/dashboard/CategoriesClient.tsx
    - components/dashboard/CategoryModal.tsx
  modified: []
decisions:
  - "deleteCategory calls Dish.countDocuments before deletion — referential integrity guard blocks delete when dishes exist"
  - "reorderCategory uses two sequential updateOne calls to swap order values; UI disables ↑↓ during pending to prevent concurrent writes"
  - "Delete confirmation is inline (replaces row controls) — not a separate modal"
  - "useActionState imported from 'react' (React 19) in both CategoriesClient and CategoryModal"
  - "deletePending is local useState (not from useActionState) because deleteCategory is called as a direct async call to read result immediately and drive toast/confirmDeleteId state"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 2 Plan 2: Categories CRUD Summary

**One-liner:** Four Server Actions (create/update/delete/reorder) with auth+ownership guards and ISR revalidation, plus /dashboard/categories Server Component page, CategoriesClient list with inline delete confirmation, and CategoryModal native dialog using useActionState.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create actions/categories.ts with all four Server Actions | d2e8c13 | actions/categories.ts |
| 2 | Create categories page (Server Component) and CategoriesClient + CategoryModal (Client Components) | fa27423 | app/(admin)/dashboard/categories/page.tsx, components/dashboard/CategoriesClient.tsx, components/dashboard/CategoryModal.tsx |

## What Was Built

### Task 1 — Server Actions (`actions/categories.ts`)

Four exported Server Actions, all accepting `(prevState: any, formData: FormData)` for `useActionState` compatibility:

- **`createCategory`** — validates name, finds restaurant by `clerkId`, assigns `order = maxOrder + 1`, creates category, calls `revalidatePath('/menu/' + restaurant.slug)`
- **`updateCategory`** — ownership check (`Category.findOne({ _id, restaurantId })`), patches name only, revalidates
- **`deleteCategory`** — ownership check, then `Dish.countDocuments({ categoryId })` blocks deletion if dishes exist with a Spanish error message matching the UI-SPEC copywriting contract
- **`reorderCategory`** — finds target + neighbor by adjacent order value, swaps the two `order` fields via two `updateOne` calls; no-op at boundaries returns `{ success: true }`

Every action: `await auth()` first, `await dbConnect()`, `Restaurant.findOne({ clerkId: userId })` for server-scoped ownership — no client-supplied restaurantId is trusted.

### Task 2 — UI Components

**`app/(admin)/dashboard/categories/page.tsx`** (Server Component):
- Auth guard → `redirect('/sign-in')`
- Restaurant guard → `redirect('/dashboard')`
- Fetches categories sorted by `{ order: 1 }`, passes via `JSON.parse(JSON.stringify(...))` to avoid Mongoose object serialization issues

**`components/dashboard/CategoriesClient.tsx`** (Client Component):
- Manages modal open/close state, edit target, inline delete confirmation, toast
- `useActionState(reorderCategory, ...)` for ↑↓ forms (native form action pattern)
- Delete action called as direct async invocation to read result immediately and drive `setConfirmDeleteId`/`showToast` 
- Empty state with `Tag` icon, heading, body, and CTA matching UI-SPEC exactly
- Inline delete confirmation replaces row controls when `confirmDeleteId === cat._id`

**`components/dashboard/CategoryModal.tsx`** (Client Component):
- Native `<dialog>` opened via `dialogRef.current?.showModal()` on mount
- `useActionState` switches between `createCategory` and `updateCategory` based on `mode` prop
- `useEffect` on `state` drives `onSuccess`/`onError` callbacks to parent
- All copywriting matches UI-SPEC: `Nueva categoría` / `Editar categoría`, `Crear categoría` / `Guardar cambios`, `Guardando...`

## Verification Results

- `npx tsc --noEmit` — no output (clean; 0 errors)
- All four Server Actions present with correct signatures in `actions/categories.ts`
- `await auth()` called 4 times (once per action)
- `await dbConnect()` called 4 times
- `Restaurant.findOne({ clerkId: userId })` called 4 times
- `Dish.countDocuments({ categoryId:` present (referential integrity guard)
- `revalidatePath('/menu/' + restaurant.slug)` called 4 times (once per mutation)
- `useActionState` imported from `'react'` in both client components
- `<dialog ref={dialogRef}` and `dialogRef.current?.showModal()` present in CategoryModal
- Empty state text `Sin categorías todavía` present in CategoriesClient
- Inline confirmation text `¿Eliminar?` and `Sí, eliminar` present in CategoriesClient

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing state] Local `deletePending` useState instead of useActionState for delete**

- **Found during:** Task 2 implementation
- **Issue:** The plan called for passing `deleteCategory` directly as an async call inside a form action (not via `useActionState`), to read the result immediately and drive `confirmDeleteId` and toast state. However, the plan's `CategoriesClient` snippet still included `deletePending` from a `useActionState` call that would not be needed. Using `useActionState` for delete would require additional coordination to read the result and clear the confirmation state.
- **Fix:** Used local `useState(false)` for `deletePending` and called `deleteCategory` directly inside the form's async action handler — consistent with the plan's stated intent ("Delete action in CategoriesClient is called as a direct async call so it can read the result immediately").
- **Files modified:** components/dashboard/CategoriesClient.tsx
- **Commit:** fa27423

## Known Stubs

None — all data flows from MongoDB via Server Components. No hardcoded categories or placeholder data.

## Threat Flags

None — all security surface is covered by the plan's threat model (T-02-02-01 through T-02-02-05). No new network endpoints introduced.

## Self-Check: PASSED

- `actions/categories.ts` — FOUND
- `app/(admin)/dashboard/categories/page.tsx` — FOUND
- `components/dashboard/CategoriesClient.tsx` — FOUND
- `components/dashboard/CategoryModal.tsx` — FOUND
- Commit d2e8c13 — FOUND
- Commit fa27423 — FOUND
