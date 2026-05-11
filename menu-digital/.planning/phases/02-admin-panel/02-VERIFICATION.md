---
phase: 02-admin-panel
verified: 2026-05-05T00:00:00Z
status: human_needed
score: 17/18 must-haves verified
overrides_applied: 0
deferred:
  - truth: "Only available dishes (available: true) will be returned when Phase 3 queries the DB"
    addressed_in: "Phase 3"
    evidence: "Phase 3 Success Criteria 1: 'A diner can navigate to /menu/[slug] without logging in and see all available dishes grouped by category in the restaurant's configured order.'"
human_verification:
  - test: "Navigate to /dashboard/categories, click 'Nueva categoría', submit the modal — verify category appears in list with a success toast."
    expected: "Category is created, list updates, toast shows 'Categoría creada correctamente.'"
    why_human: "Server Action requires live MongoDB + Clerk auth. Cannot verify round-trip mutation from static analysis."
  - test: "With a category that has dishes, click its delete button and confirm. Verify the blocked error toast appears."
    expected: "Error toast: 'No podés eliminar esta categoría porque tiene platos asociados. Eliminá o reasigná los platos primero.'"
    why_human: "Referential integrity guard requires live DB with actual dish documents linked to the category."
  - test: "On /dashboard/dishes, create a dish with name, price, category, select a file image, and check allergens. Submit."
    expected: "Dish appears in table. Image thumbnail visible. Price displayed as pesos (e.g., $1500.00). Allergens stored."
    why_human: "Cloudinary upload requires live Cloudinary credentials + network. Cannot mock from static analysis."
  - test: "Click the availability toggle on a dish — it should flip immediately (optimistic), then persist on page reload."
    expected: "Toggle flips color from orange to gray or vice versa instantly. DB reflects the change after reload."
    why_human: "Optimistic UI + Server Action requires live execution to verify revert-on-error and DB persistence."
  - test: "Navigate to /dashboard/categories and then /dashboard/dishes — verify the header shows 'Categorías' and 'Platos' respectively."
    expected: "DashboardHeader renders the correct route-aware title per page."
    why_human: "usePathname() client hook requires a running browser to verify."
---

# Phase 2: Admin Panel Verification Report

**Phase Goal:** A logged-in restaurant owner can build and maintain their full menu — creating categories and dishes, uploading images, assigning allergens, and toggling availability — all from the dashboard.
**Verified:** 2026-05-05T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | cloudinary and zod packages are importable in the project | VERIFIED | `package.json` has `"cloudinary": "^2.10.0"` and `"zod": "^4.4.3"` in dependencies |
| 2 | POST /api/sign-cloudinary-params returns a JSON object with signature, timestamp, api_key, and cloud_name | VERIFIED | `app/api/sign-cloudinary-params/route.ts` — full implementation present; uses `cloudinary.utils.api_sign_request`; returns all 4 fields |
| 3 | lib/allergens.ts exports the 14 EU allergens as a typed constant array | VERIFIED | `lib/allergens.ts` exports `ALLERGENS` (14 entries confirmed by `grep -c "key:"`) and `AllergenKey` type with `as const` |
| 4 | The dashboard header title changes to 'Categorías' on /dashboard/categories and 'Platos' on /dashboard/dishes | VERIFIED (human confirm) | `DashboardHeader.tsx` has correct titles map; wired in `layout.tsx` replacing static header. Runtime behavior needs human confirmation. |
| 5 | Categorías and Platos sidebar nav items are enabled (clickable Links, not disabled spans) | VERIFIED | `Sidebar.tsx` has `enabled: true` for both Categorías and Platos; Mi QR remains `enabled: false` |
| 6 | A restaurant owner can create a new category by clicking 'Nueva categoría' and submitting the modal form | VERIFIED (human confirm) | `createCategory` action, `CategoryModal`, `CategoriesClient` all exist and are wired. Live execution needed. |
| 7 | A restaurant owner can edit an existing category name by clicking the pencil icon | VERIFIED | `updateCategory` action with ownership check; `CategoryModal` in edit mode pre-fills `defaultValue={category?.name}` |
| 8 | A restaurant owner can delete a category; if it has dishes the delete is blocked with an error message | VERIFIED | `deleteCategory` calls `Dish.countDocuments({ categoryId })` — blocks with Spanish error message when dishCount > 0 |
| 9 | A restaurant owner can reorder categories using ↑ and ↓ buttons; order persists in the database | VERIFIED | `reorderCategory` swaps `order` values of adjacent categories; `CategoriesClient` renders forms with `reorderAction` |
| 10 | Categories are sorted by their order field ascending on page load | VERIFIED | `categories/page.tsx` uses `.sort({ order: 1 })` |
| 11 | Every mutation calls revalidatePath with the literal restaurant slug | VERIFIED | `categories.ts` has 4 calls; `dishes.ts` has 5 calls (4 mutations + 1 in toggleAvailability). All use `revalidatePath('/menu/' + restaurant.slug)` |
| 12 | The categories page is accessible at /dashboard/categories | VERIFIED | `app/(admin)/dashboard/categories/page.tsx` exists and exports `CategoriesPage` async Server Component |
| 13 | A restaurant owner can create a dish with name, description, price, category, allergens, and availability | VERIFIED (human confirm) | `createDish` handles all fields; `DishModal` renders all inputs including allergen grid and availability checkbox |
| 14 | A restaurant owner can upload an image for a dish; upload happens client-side directly to Cloudinary after getting a server signature | VERIFIED | `DishModal.handleFileChange` fetches `/api/sign-cloudinary-params`, then POSTs to Cloudinary directly. Hidden fields carry `imageUrl`/`imagePublicId` to Server Action |
| 15 | CLOUDINARY_API_SECRET never appears in browser network requests or client bundle | VERIFIED | `grep -r "CLOUDINARY_API_SECRET" components/` — only a comment in `DishModal.tsx`. Secret is only read server-side in `route.ts` and `actions/dishes.ts` |
| 16 | A restaurant owner can delete a dish; the Cloudinary asset is deleted synchronously before the DB document | VERIFIED | `deleteDish` calls `cloudinary.uploader.destroy(dish.imagePublicId)` in try/catch before `Dish.deleteOne` |
| 17 | A restaurant owner can toggle a dish's availability; the toggle updates optimistically in the UI | VERIFIED | `AvailabilityToggle.tsx` uses `useState(dish.available)` + `startTransition` — sets optimistic state immediately, reverts on error |
| 18 | Only available dishes (available: true) will be returned when Phase 3 queries the DB | DEFERRED | `available` field exists on Dish model (default: true), stored correctly by Phase 2 actions. Phase 3 is responsible for filtering. See Deferred Items. |

**Score:** 17/18 truths verified (1 deferred to Phase 3)

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Only available dishes (available: true) will be returned when Phase 3 queries the DB | Phase 3 | Phase 3 SC1: "A diner can navigate to `/menu/[slug]` without logging in and see all **available** dishes grouped by category in the restaurant's configured order." The public menu page at `app/(public)/menu/[slug]/page.tsx` is a Phase 3 placeholder stub. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/api/sign-cloudinary-params/route.ts` | Cloudinary signing route — POST endpoint returning signature | VERIFIED | Full implementation; `cloudinary.config()` at module scope; returns `{ signature, timestamp, api_key, cloud_name }` |
| `lib/allergens.ts` | 14 EU allergen constants shared across form and display | VERIFIED | 14 entries, `as const`, exports `ALLERGENS` and `AllergenKey` type |
| `components/dashboard/DashboardHeader.tsx` | Dynamic header title client component reading usePathname() | VERIFIED | `'use client'`, `usePathname()`, titles map with all 4 routes |
| `actions/categories.ts` | Server Actions for category CRUD and reorder | VERIFIED | Exports `createCategory`, `updateCategory`, `deleteCategory`, `reorderCategory` — all with `(prevState, formData)` signature |
| `app/(admin)/dashboard/categories/page.tsx` | Server Component that fetches and renders categories list | VERIFIED | Fetches with `.sort({ order: 1 })`, passes `JSON.parse(JSON.stringify(categories))` to `CategoriesClient` |
| `components/dashboard/CategoriesClient.tsx` | Client Component managing modal open/close state and category list display | VERIFIED | `'use client'`, `useActionState`, empty state, inline delete confirmation |
| `components/dashboard/CategoryModal.tsx` | Native dialog modal for create/edit category with useActionState | VERIFIED | `<dialog ref={dialogRef}>`, `showModal()` on mount, `useActionState` from `'react'` |
| `actions/dishes.ts` | Server Actions for dish CRUD, availability toggle | VERIFIED | Exports `createDish`, `updateDish`, `deleteDish`, `toggleAvailability`; price centavos conversion; Cloudinary deletion |
| `app/(admin)/dashboard/dishes/page.tsx` | Server Component fetching dishes + categories in parallel | VERIFIED | `Promise.all([...])` for parallel fetch; both passed as serialized JSON |
| `components/dashboard/DishesClient.tsx` | Client Component managing dish table, modal, delete confirmation | VERIFIED | Table, empty state, prerequisite warning, inline delete, `AvailabilityToggle` wired |
| `components/dashboard/DishModal.tsx` | Native dialog modal with image upload, allergen grid, price conversion | VERIFIED | Signed Cloudinary upload, ALLERGENS grid, price conversion `(dish.price / 100).toFixed(2)`, hidden image fields |
| `components/dashboard/AvailabilityToggle.tsx` | Optimistic toggle button that calls toggleAvailability Server Action | VERIFIED | `role="switch"`, `useTransition`, optimistic state with revert on error |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(admin)/layout.tsx` | `components/dashboard/DashboardHeader.tsx` | `import DashboardHeader` + render | WIRED | Layout imports and renders `<DashboardHeader />` — static header removed |
| `app/api/sign-cloudinary-params/route.ts` | `CLOUDINARY_API_SECRET` | `process.env.CLOUDINARY_API_SECRET` (never NEXT_PUBLIC_) | WIRED | Only appears as `process.env.CLOUDINARY_API_SECRET` — not prefixed with NEXT_PUBLIC_ |
| `components/dashboard/CategoriesClient.tsx` | `actions/categories.ts` | `useActionState(reorderCategory, ...)` + direct `deleteCategory(...)` call | WIRED | `reorderAction` from `useActionState`; delete called as async function inline |
| `app/(admin)/dashboard/categories/page.tsx` | `components/dashboard/CategoriesClient.tsx` | props: `categories` (serialized plain objects) | WIRED | `JSON.parse(JSON.stringify(categories))` passed as prop |
| `actions/categories.ts` | `revalidatePath` | `revalidatePath('/menu/' + restaurant.slug)` | WIRED | Called in `createCategory`, `updateCategory`, `deleteCategory`, `reorderCategory` |
| `components/dashboard/DishModal.tsx` | `/api/sign-cloudinary-params` | `fetch('/api/sign-cloudinary-params', { method: 'POST' })` | WIRED | In `handleFileChange`; signature used for direct Cloudinary upload |
| `components/dashboard/DishesClient.tsx` | `actions/dishes.ts` | `deleteDish(...)` direct async call | WIRED | `handleDelete` calls `deleteDish({ success: false }, fd)` directly |
| `components/dashboard/AvailabilityToggle.tsx` | `actions/dishes.ts` | `startTransition(() => toggleAvailability({ success: false }, fd))` | WIRED | `toggleAvailability` called inside `startTransition` |
| `actions/dishes.ts` | `cloudinary.uploader.destroy` | `v2 as cloudinary` — import from `'cloudinary'` | WIRED | `deleteDish` calls `cloudinary.uploader.destroy(dish.imagePublicId)` before DB delete |
| `actions/dishes.ts` | `revalidatePath` | `revalidatePath('/menu/' + restaurant.slug)` | WIRED | Called in all 4 mutations including `toggleAvailability` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/(admin)/dashboard/categories/page.tsx` | `categories` | `Category.find({ restaurantId: restaurant._id }).sort({ order: 1 }).lean()` | Yes — DB query scoped to authenticated user's restaurant | FLOWING |
| `app/(admin)/dashboard/dishes/page.tsx` | `dishes`, `categories` | `Promise.all([Category.find(...), Dish.find(...)])` — both scoped to authenticated `restaurant._id` | Yes — parallel DB queries | FLOWING |
| `components/dashboard/CategoriesClient.tsx` | `initialCategories` prop | Passed from Server Component (see above) | Yes — serialized from real DB data | FLOWING |
| `components/dashboard/DishesClient.tsx` | `initialDishes`, `categories` props | Passed from Server Component (see above) | Yes — serialized from real DB data | FLOWING |
| `components/dashboard/DishModal.tsx` | `imageUrl`, `imagePublicId` | Client-side upload via `handleFileChange` → Cloudinary response | Yes — `data.secure_url`, `data.public_id` from Cloudinary API | FLOWING (requires live Cloudinary env vars) |

### Behavioral Spot-Checks

Step 7b: SKIPPED — Server Actions require live MongoDB + Clerk auth. API routes require live Cloudinary credentials. No runnable checks possible without starting the server.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CAT-01 | 02-PLAN-02 | El restaurante puede crear una categoría con nombre | SATISFIED | `createCategory` action + `CategoryModal` in create mode |
| CAT-02 | 02-PLAN-02 | El restaurante puede editar el nombre de una categoría existente | SATISFIED | `updateCategory` action + `CategoryModal` in edit mode with `defaultValue={category?.name}` |
| CAT-03 | 02-PLAN-02 | El restaurante puede eliminar una categoría (los platos asociados bloquean la eliminación) | SATISFIED | `deleteCategory` with `Dish.countDocuments` referential integrity guard returning Spanish error message |
| CAT-04 | 02-PLAN-02 | El restaurante puede reordenar categorías usando botones de subir/bajar posición | SATISFIED | `reorderCategory` swaps order values; `CategoriesClient` renders ↑↓ forms |
| CAT-05 | 02-PLAN-02 | Las categorías se muestran en el menú público en el orden configurado por el restaurante | SATISFIED (infrastructure) | `categories/page.tsx` fetches with `.sort({ order: 1 })`; ISR revalidation on every mutation. Public display is Phase 3. |
| DISH-01 | 02-PLAN-03 | El restaurante puede crear un plato con nombre, descripción, precio y categoría | SATISFIED | `createDish` validates and stores all 4 fields; `DishModal` renders all inputs |
| DISH-02 | 02-PLAN-03 | El restaurante puede editar cualquier campo de un plato existente | SATISFIED | `updateDish` with ownership check; `DishModal` in edit mode with `defaultValue` for all fields |
| DISH-03 | 02-PLAN-03 | El restaurante puede eliminar un plato | SATISFIED | `deleteDish` with ownership check; `DishesClient` inline delete confirmation |
| DISH-04 | 02-PLAN-01, 02-PLAN-03 | El restaurante puede subir una imagen por plato via Cloudinary (upload firmado, sin exponer API secret) | SATISFIED | Signing route + client-side upload in `DishModal`; `CLOUDINARY_API_SECRET` never in client code |
| DISH-05 | 02-PLAN-03 | El restaurante puede marcar un plato como no disponible | SATISFIED | `toggleAvailability` action + `AvailabilityToggle` component with optimistic UI |
| DISH-06 | 02-PLAN-03 | El restaurante puede asignar alérgenos de los 14 alérgenos EU obligatorios | SATISFIED | `ALLERGENS` constant (14 entries) → `DishModal` allergen grid → `formData.getAll('allergens')` in `createDish`/`updateDish` |
| DISH-07 | 02-PLAN-03 | Solo los platos marcados como disponibles aparecen en el menú público | PARTIAL — DEFERRED | `available` field stored correctly by Phase 2. Public query filtering is Phase 3 responsibility (SC1). |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/(public)/menu/[slug]/page.tsx` | 1-6 | Placeholder stub: `return <div>Menú público — disponible en la Fase 3</div>` | Info | Phase 3 placeholder — intentional. Not a Phase 2 blocker. |
| `components/dashboard/DishModal.tsx` | 47 | `// Step 1: get signature from our server (CLOUDINARY_API_SECRET stays server-side)` — comment contains "CLOUDINARY_API_SECRET" | Info | Comment only — `grep` picks it up but the string never reaches the client bundle. Confirmed by absence of actual env var reference. |

No blockers found. All Phase 2 files are substantive implementations with no empty returns, no hardcoded stubs, and no disabled handlers.

### Human Verification Required

#### 1. Category Create Flow

**Test:** Log in, navigate to `/dashboard/categories`, click "Nueva categoría", type a name, click "Crear categoría".
**Expected:** Category appears in list; success toast "Categoría creada correctamente." is shown; revalidatePath triggers ISR for the restaurant's slug.
**Why human:** Server Action requires live MongoDB Atlas + Clerk auth session.

#### 2. Category Delete Blocked by Dishes

**Test:** Create a category, add a dish to it, then attempt to delete the category.
**Expected:** Error toast: "No podés eliminar esta categoría porque tiene platos asociados. Eliminá o reasigná los platos primero."
**Why human:** Requires live DB with actual dish documents linked by `categoryId`.

#### 3. Dish Create with Image Upload

**Test:** Navigate to `/dashboard/dishes`, click "Nuevo plato", fill all fields, select a ≤5 MB JPG/PNG/WebP image, check 2–3 allergens, click "Crear plato".
**Expected:** "Subiendo imagen..." spinner appears; on success dish appears in table with thumbnail, pesos price (e.g., $1500.00), and correct category.
**Why human:** Cloudinary requires live credentials (`CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`) configured in `.env.local`.

#### 4. Availability Toggle (Optimistic + Persistent)

**Test:** Click the toggle switch on any dish. Then reload the page.
**Expected:** Toggle flips color immediately (orange ↔ gray). After reload, the toggle reflects the new state (persisted in DB).
**Why human:** Optimistic UI + `useTransition` + `toggleAvailability` Server Action + `revalidatePath` all require live execution.

#### 5. Dynamic Dashboard Header

**Test:** Navigate between `/dashboard`, `/dashboard/categories`, and `/dashboard/dishes`.
**Expected:** The header reads "Dashboard", "Categorías", and "Platos" respectively.
**Why human:** `usePathname()` is a client-side hook that reads the router state at runtime.

### Gaps Summary

No blocking gaps. All 12 required artifacts exist, are substantive (full implementations), and are wired to their dependencies. All key links are present and connected. The phase goal is structurally achieved.

The single deferred truth (DISH-07 / public menu availability filter) is correctly assigned to Phase 3, which has explicit success criteria covering it.

Five human verification items are required to confirm runtime behavior (modal round-trips, Cloudinary upload, optimistic toggle, route-aware header) — none of which can be verified through static analysis.

---

_Verified: 2026-05-05T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
