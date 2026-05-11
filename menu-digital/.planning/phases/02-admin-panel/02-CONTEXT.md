# Phase 2: Admin Panel - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the full menu management experience for a logged-in restaurant owner: CRUD for categories (with ordering), CRUD for dishes (with images via Cloudinary and allergen assignment), and availability toggling.

**When Phase 2 is done:**
- A restaurant owner can create, rename, reorder (↑↓), and delete categories
- A restaurant owner can create, edit, and delete dishes with name, description, price, category, image, allergens, and availability toggle
- Images upload securely via signed Cloudinary request — API secret never touches the browser
- Every mutation calls `revalidatePath` so Phase 3's public menu stays fresh

**Requirements in scope:** CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, DISH-01, DISH-02, DISH-03, DISH-04, DISH-05, DISH-06, DISH-07
**Out of scope:** Public menu display, QR generation, any public-facing UI

</domain>

<decisions>
## Implementation Decisions

### Form UX (Categories & Dishes)
- **D-01:** Forms open in a **modal/dialog** — no route change. One modal serves both create (empty) and edit (pre-filled) modes.
- **D-02:** Category form: name field only (order is managed by ↑↓ buttons, not the form).
- **D-03:** Dish form: name, description, price (displayed as pesos, stored as centavos), category selector, image upload, allergen grid, availability toggle.

### Image Upload
- **D-04:** **Simple file input** — user picks a file, a Server Action calls `/api/sign-cloudinary-params` to get a signed URL, then the client POSTs directly to Cloudinary. No Cloudinary Upload Widget.
- **D-05:** `CLOUDINARY_API_SECRET` lives only in the server — signing happens in the API route, never in client code.
- **D-06:** On dish delete: delete Cloudinary asset synchronously inside the Server Action before removing the DB document. If Cloudinary deletion fails, log the error but still delete the DB document (orphaned assets are acceptable; broken DB references are not).
- **D-07:** Store both `imageUrl` and `imagePublicId` on Dish — `imagePublicId` is needed for Cloudinary deletion.

### Allergen Selection
- **D-08:** **Checkbox grid** — all 14 EU allergens visible at once. No custom allergens. Stored as `[String]` enum on Dish (already scaffolded in `models/Dish.ts`).
- **D-09:** The 14 EU allergens (Reglamento 1169/2011): gluten, crustáceos, huevos, pescado, cacahuetes, soja, lácteos, frutos_de_cáscara, apio, mostaza, sésamo, dióxido_de_azufre, altramuces, moluscos.

### Category Ordering
- **D-10:** **↑↓ arrow buttons** per category row — no drag-and-drop, no dnd-kit dependency.
- **D-11:** Order stored as `order: Number` on Category (already in schema). Reorder = swap `order` values of two adjacent categories in a single Server Action.

### Pricing
- **D-12:** Price stored as **centavos (integer)** in DB. UI shows and accepts pesos with 2 decimal places. Conversion: `display = price / 100`, `store = Math.round(inputPesos * 100)`.

### Data Security
- **D-13:** Every DB query filters by `restaurantId` derived from `Restaurant.findOne({ clerkId: userId })` — never trust a client-supplied restaurantId.
- **D-14:** Ownership check before any update/delete: verify the target Category/Dish belongs to the authenticated user's Restaurant.

### ISR Strategy
- **D-15:** `revalidatePath('/menu/[slug]')` called on every category and dish mutation. No static `revalidate` interval — on-demand only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/REQUIREMENTS.md` — CAT-01..05, DISH-01..07 are in scope for this phase
- `.planning/phases/01-foundation/01-CONTEXT.md` — Architecture rules, auth patterns, Clerk v7 specifics, dbConnect pattern

### Existing Models (already scaffolded — use as-is)
- `models/Category.ts` — `restaurantId`, `name`, `order`; registration guard in place
- `models/Dish.ts` — `restaurantId`, `categoryId`, `name`, `description`, `price` (cents), `available`, `imageUrl`, `imagePublicId`, `allergens: [String]`; registration guard in place
- `models/Restaurant.ts` — `clerkId`, `name`, `slug`, `slugConfirmed`

### Existing Patterns to Follow
- `actions/restaurant.ts` — Server Action pattern with `await auth()`, ownership guard, dbConnect call
- `app/(admin)/layout.tsx` — Admin shell; new pages go inside `app/(admin)/`
- `components/dashboard/Sidebar.tsx` — Nav items for Categorías and Platos are already declared (disabled); enable them by setting `enabled: true`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/dbConnect.ts` — mandatory call at top of every Server Action and Server Component that touches MongoDB
- `components/dashboard/Sidebar.tsx` — `navItems` array; flip `enabled: true` for Categorías and Platos when pages exist
- `app/(admin)/layout.tsx` — `<main>` + `<footer>` shell already rendered; new pages only need their content

### Established Patterns
- **Server Actions for writes:** `'use server'`, `await auth()`, `redirect()` or return `{ error }` object — mirror `actions/restaurant.ts`
- **Server Components for reads:** fetch inside the page component directly, pass data as props to client components
- **Model guard:** `models.X || model('X', XSchema)` — already applied to all 3 models
- **Brand tokens:** `text-brand-titulares`, `bg-brand-acento`, `text-brand-principal` etc. — Tailwind v4 `@theme` vars in `globals.css`

### Integration Points
- New pages: `app/(admin)/categories/page.tsx`, `app/(admin)/dishes/page.tsx`
- New Server Actions: `actions/categories.ts`, `actions/dishes.ts`
- New API route: `app/api/sign-cloudinary-params/route.ts` (Cloudinary signing — already planned in Phase 1 context)
- Sidebar: enable `Categorías` and `Platos` nav items

</code_context>

<specifics>
## Specific Ideas

No specific UI references provided — standard admin table/list layout with modal forms is the target.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Admin Panel*
*Context gathered: 2026-05-04*
