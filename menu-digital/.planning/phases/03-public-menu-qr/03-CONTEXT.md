# Phase 3: Public Menu & QR - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the public-facing menu page at `/menu/[slug]` — the screen a diner sees when they scan a QR code. No login required. Served with ISR (on-demand revalidation via `revalidatePath`).

**When Phase 3 is done:**
- A diner can open `/menu/[slug]` and see all available dishes grouped by category in the restaurant's configured order
- A diner can tap a category tab to scroll to that section (sticky tab bar + smooth scroll)
- Each dish shows: image (thumbnail left), name, description, price in pesos, allergen emoji-icons with tooltip
- A non-existent slug returns a clear Next.js 404 page
- The public menu header shows: restaurant logo (if set), restaurant name, and a short description
- The restaurant owner can edit name, logo, and description from `/dashboard/settings`

**QR requirements already delivered (Phase 2):**
- QR-01: QR preview visible in dashboard ✓
- QR-02: Download QR as PNG ✓
- QR-03: Direct link to `/menu/[slug]` in a new tab ✓
- QR-04: QR points to `https://menudig.com.ar/menu/[slug]` via `NEXT_PUBLIC_APP_URL` ✓

**Requirements in scope:** PUB-01, PUB-02, PUB-03, PUB-04, PUB-05, PUB-06, PUB-07
**Out of scope:** QR generation (done), admin panel changes beyond settings description field, payment flows, reservations, custom brand colors per restaurant

</domain>

<decisions>
## Implementation Decisions

### Restaurant Header (public menu top)
- **D-01:** Full header with **logo + name + description**. Logo displayed if `restaurant.logoUrl` is set (skip gracefully if empty). Name as H1. Description as a short paragraph below.
- **D-02:** The restaurant `description` field must be added to `models/Restaurant.ts` (String, default `''`). It is editable from `/dashboard/settings` — add a textarea to the existing `RestaurantProfileForm` alongside name and logo. No new page needed.
- **D-03:** `updateRestaurantProfile` server action must be updated to accept and persist the `description` field.

### Dish Layout
- **D-04:** **Horizontal list rows** — image thumbnail (80–96px square, `object-cover`) on the left, name + description + price stacked on the right. Full-width row with a subtle divider between dishes.
- **D-05:** If a dish has no image (`imageUrl` is empty), the left slot shows a neutral placeholder (e.g., gray square with a fork icon or simply no image area — researcher's call). Do NOT break the layout.

### Category Navigation
- **D-06:** **Sticky tab bar + scroll-to-section**. Tab bar sticks to the top of the viewport after the restaurant header scrolls away. Tapping a tab triggers smooth scroll (`scroll-behavior: smooth`) to the corresponding category section anchor.
- **D-07:** Category names also appear as visible section headers/separators within the dish list, so the diner always knows which section they're in.
- **D-08:** Active tab highlights the category currently in the viewport (IntersectionObserver or manual scroll tracking — researcher/planner decides implementation).

### Allergen Display
- **D-09:** **Emoji icons in circles** — each allergen is represented by an emoji in a small circle (24px) with `bg-brand-acento` (`#FED7AA`) background. The tooltip shows the full allergen name on hover (desktop) or tap (mobile).
- **D-10:** Allergen icons are shown only if the dish has at least one allergen. If none, the allergen row is omitted entirely.
- **D-11:** Emoji mapping (one per allergen — planner assigns these, reference: `lib/allergens.ts` for the 14 keys):
  - gluten → 🌾, crustaceos → 🦐, huevos → 🥚, pescado → 🐟, cacahuetes → 🥜
  - soja → 🫘, lacteos → 🥛, frutos_de_cascara → 🌰, apio → 🥬, mostaza → 🌻
  - sesamo → 🫙, dioxido_de_azufre → 🍷, altramuces → 🌼, moluscos → 🦪

### ISR & Data Fetching
- **D-12:** `/menu/[slug]` is a **Server Component** (no `'use client'`). Data fetched at build/revalidation time. All category and dish queries use the restaurant's `_id` (not slug) as the join key.
- **D-13:** `notFound()` from `next/navigation` when slug doesn't match any Restaurant document — triggers Next.js 404 page.
- **D-14:** ISR is on-demand only — no `export const revalidate = N`. The existing `revalidatePath('/menu/' + restaurant.slug)` calls in all mutating server actions are sufficient.

### Client Interactivity
- **D-15:** The sticky tab bar and scroll behavior are the only client-side interactions. Extract them into a single `'use client'` component (e.g., `MenuCategoryNav`) that wraps the tab bar only — the rest of the page stays server-rendered.
- **D-16:** No full page reload when switching categories — all dishes are already in the HTML; the client just scrolls.

### Settings page update
- **D-17:** `/dashboard/settings` gets a new **"Descripción"** textarea field (optional, max ~200 chars suggested). Same card as name + logo. Saves via the existing `updateRestaurantProfile` action.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/REQUIREMENTS.md` — PUB-01..07 are in scope for this phase; QR-01..04 are already complete
- `.planning/PROJECT.md` — product vision, tech stack, deploy target
- `.planning/phases/01-foundation/01-CONTEXT.md` — auth patterns, Clerk v7, dbConnect singleton
- `.planning/phases/02-admin-panel/02-CONTEXT.md` — ISR strategy (D-15), pricing (D-12), allergen list (D-09), Cloudinary patterns

### Existing Models (read before touching)
- `models/Restaurant.ts` — add `description: { type: String, default: '' }` field
- `models/Category.ts` — `restaurantId`, `name`, `order`
- `models/Dish.ts` — `restaurantId`, `categoryId`, `name`, `description`, `price`, `available`, `imageUrl`, `imagePublicId`, `allergens: [String]`

### Existing Actions & Routes
- `actions/restaurant.ts` → `updateRestaurantProfile` — extend to accept `description` field
- `app/(admin)/dashboard/settings/page.tsx` — add description textarea here
- `components/dashboard/RestaurantProfileForm.tsx` — add description textarea to this form

### Existing UI Patterns
- `components/dashboard/CategoriesClient.tsx` — `useTransition` + optimistic UI pattern
- `lib/allergens.ts` — the 14 EU allergen keys and labels (SINGLE SOURCE OF TRUTH — do not duplicate)
- `app/(admin)/layout.tsx` — admin shell pattern (public menu does NOT use this layout)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/allergens.ts` — allergen keys + labels array, already typed. The emoji mapping in D-11 extends this for public display (do not modify the file — add a separate mapping in the public menu component or a new `lib/allergenEmoji.ts`).
- `lib/dbConnect.ts` — mandatory for any DB query in the public route (serverless connection pool).
- `lib/utils.ts` — `validateSlug` utility; may have other helpers.

### Established Patterns
- **Server Component → Client island**: admin panel uses this (`DishesClient`, `CategoriesClient` are `'use client'`, page components are server). Public menu should mirror this: page = server, `MenuCategoryNav` = client island.
- **ISR with on-demand revalidation**: `revalidatePath` is already called by all 8 mutating server actions. Public menu page must NOT set `export const revalidate` — rely on those calls.
- **`notFound()`**: standard Next.js pattern, returns 404. Use it when `Restaurant.findOne({ slug })` returns null.

### Integration Points
- `/menu/[slug]` is a **new route group** outside `(admin)` — it uses its own layout (or no layout), not the dashboard shell.
- Public menu reads `restaurant.logoUrl` (already in model) and `restaurant.description` (to be added).
- Dishes must be filtered `{ restaurantId: restaurant._id, available: true }` — only show available dishes.
- Categories must be sorted by `order` ascending.

</code_context>

<specifics>
## Specific Ideas

- The user chose the most information-rich header option (logo + name + description) — invest in making this look polished even when the logo is missing.
- Horizontal list layout was preferred over cards — keep image thumbnails square and consistent (use `aspect-square object-cover`).
- Tabs should be sticky — this is a key UX requirement, not optional.
- Allergen emoji in circles with tooltip — the emoji list in D-11 is defined; planner should wire them up.

</specifics>

<deferred>
## Deferred Ideas

- **Colores personalizables por restaurante**: El dueño del restaurante podría elegir los colores del menú público (primario, acento, fondo). Implica campos en el modelo Restaurant, un color picker en settings, y que el menú público lea esos valores dinámicamente. Candidato a Fase 5 o post-launch.

</deferred>

---

*Phase: 3-Public Menu & QR*
*Context gathered: 2026-05-05*
