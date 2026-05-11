# Roadmap — Menú Digital

**4 phases** | **34 requirements** | Granularity: coarse

---

## Phases

- [x] **Phase 1: Foundation** - Clerk auth is live, restaurant accounts are created with a permanent slug, and the MongoDB connection is stable. *(completed 2026-05-04)*
- [x] **Phase 2: Admin Panel** - A logged-in restaurant owner can fully manage their menu — categories, dishes, images, allergens, and availability — from the dashboard. *(completed 2026-05-05)*
- [x] **Phase 3: Public Menu & QR** - A diner can scan the QR, open the public menu, and a restaurant owner can preview and download their QR code. *(completed 2026-05-06)*
- [x] **Phase 4: Polish & Brand** - The entire product consistently applies Driva Dev's visual identity, handles empty and error states gracefully, and passes a mobile audit. *(completed 2026-05-11)*

---

## Phase Details

### Phase 1: Foundation
**Goal**: A restaurant owner can create an account, log in, and have a permanent unique slug assigned automatically — the backbone every other feature depends on.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, REST-01, REST-02
**Success Criteria** (what must be TRUE):
  1. A restaurant owner can register with email and password via Clerk and immediately access the dashboard.
  2. A restaurant owner can close and reopen the browser and remain logged in without re-authenticating.
  3. A restaurant owner can click "Sign out" from any dashboard page and be logged out completely.
  4. Upon registration, a `Restaurant` document exists in MongoDB with a unique, URL-safe slug derived from the restaurant name — and that slug cannot be changed.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Admin Panel
**Goal**: A logged-in restaurant owner can build and maintain their full menu — creating categories and dishes, uploading images, assigning allergens, and toggling availability — all from the dashboard.
**Depends on**: Phase 1
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, DISH-01, DISH-02, DISH-03, DISH-04, DISH-05, DISH-06, DISH-07
**Success Criteria** (what must be TRUE):
  1. A restaurant owner can create, rename, delete, and reorder categories using up/down controls, and the saved order is reflected everywhere.
  2. A restaurant owner can create a dish with name, description, price, and category — and later edit or delete it.
  3. A restaurant owner can upload an image for a dish and see it stored via Cloudinary without any API secret appearing in the browser.
  4. A restaurant owner can assign any combination of the 14 EU allergens to a dish from a fixed list.
  5. A restaurant owner can toggle a dish as "unavailable" and it immediately disappears from the public menu without being deleted.
**Plans**: 3 plans (02-PLAN-01, 02-PLAN-02, 02-PLAN-03)
**UI hint**: yes

**Wave 1** — Foundation (02-PLAN-01)
- Install `cloudinary` + `zod`; create `app/api/sign-cloudinary-params/route.ts`; create `lib/allergens.ts`; enable sidebar nav items; dynamic `DashboardHeader`

**Wave 2** *(blocked on Wave 1 completion)* — Categories (02-PLAN-02)
- `actions/categories.ts` (create/update/delete/reorder); `/dashboard/categories` page; `CategoriesClient` + `CategoryModal`

**Wave 3** *(blocked on Wave 1 + Wave 2 completion)* — Dishes (02-PLAN-03)
- `actions/dishes.ts` (create/update/delete/toggle); `/dashboard/dishes` page; `DishesClient` + `DishModal` (Cloudinary upload + allergen grid) + `AvailabilityToggle`

**Cross-cutting constraints:**
- Every Server Action calls `await auth()` → `Restaurant.findOne({ clerkId: userId })` → ownership-scoped query
- `revalidatePath('/menu/' + restaurant.slug)` on every mutation (all 8 mutating actions)
- `useActionState` from `'react'` (React 19) in all client form components

### Phase 3: Public Menu & QR
**Goal**: A diner can open the restaurant's public menu by scanning a QR code and browse dishes by category and allergen — and the restaurant owner can preview and download that QR from the dashboard.
**Depends on**: Phase 2
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04, PUB-05, PUB-06, PUB-07, QR-01, QR-02, QR-03, QR-04
**Success Criteria** (what must be TRUE):
  1. A diner can navigate to `/menu/[slug]` without logging in and see all available dishes grouped by category in the restaurant's configured order.
  2. A diner can see each dish's photo, name, description, price, and allergen icons — with tooltip labels visible on hover or tap.
  3. A diner can tap a category tab to filter the visible dishes client-side with no page reload.
  4. A diner who scans a QR for a non-existent slug sees a clear 404 page rather than an error or blank screen.
  5. A restaurant owner can see their QR code in the dashboard, open their public menu in a new tab, and download the QR as a PNG — all pointing to `https://menudig.com.ar/menu/[slug]`.
**Plans**: 2 plans (03-01-PLAN, 03-02-PLAN)
**UI hint**: yes

Plans:
- [ ] 03-01-PLAN.md — Infrastructure: Cloudinary remotePatterns + Restaurant.description field + updateRestaurantProfile + settings textarea
- [ ] 03-02-PLAN.md — Public menu page: allergenEmoji.ts, AllergenBadge, MenuCategoryNav, DishRow, /menu/[slug]/page.tsx, not-found.tsx

**Wave 1** — Infrastructure (03-01-PLAN)
- `next.config.ts` remotePatterns; `models/Restaurant.ts` description field; `actions/restaurant.ts` description persistence; `RestaurantProfileForm.tsx` textarea; `settings/page.tsx` prop wiring

**Wave 2** *(blocked on Wave 1 completion)* — Public Menu Page (03-02-PLAN)
- `lib/allergenEmoji.ts`; `components/menu/AllergenBadge.tsx`; `components/menu/MenuCategoryNav.tsx`; `components/menu/DishRow.tsx`; `app/(public)/menu/[slug]/page.tsx`; `app/not-found.tsx`

**Cross-cutting constraints:**
- Public page uses slug → restaurant._id join — no auth() call
- ISR on-demand only — no `export const revalidate`; `generateStaticParams` returns `[]`
- Only `MenuCategoryNav` has 'use client' — everything else is server-rendered
- `JSON.parse(JSON.stringify(...))` on all Mongoose lean() results before passing to JSX

### Phase 4: Polish & Brand
**Goal**: Every screen in the product — admin and public — consistently applies Driva Dev's visual identity, handles empty and error states cleanly, and is fully usable on mobile.
**Depends on**: Phase 3
**Requirements**: BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06
**Success Criteria** (what must be TRUE):
  1. Every page uses only the defined Driva Dev color palette (`#EA580C`, `#9A3412`, `#FED7AA`, `#FFF7ED`, `#1C1917`) — no off-palette colors anywhere.
  2. All text renders in Fira Sans with the correct weight hierarchy (Bold H1/H2, Medium H3, Regular body, Light caption) and minimum 12px size.
  3. Primary buttons show `#EA580C` background with white text; secondary buttons show `#EA580C` border with transparent background; input focus shows `#EA580C` border; badges show `#FED7AA` background with `#9A3412` text.
  4. The footer on every page reads "Desarrollado por Driva Dev" and no gradients, excessive shadows, or off-palette decorations appear anywhere.
**Plans**: 4 plans (04-01-PLAN, 04-02-PLAN, 04-03-PLAN, 04-04-PLAN)
**UI hint**: yes

Plans:
- [ ] 04-01-PLAN.md — Danger Token Migration: add --color-brand-danger to globals.css; replace all red-* classes in CategoriesClient, DishesClient, CategoryModal, DishModal, RestaurantProfileForm, OnboardingSlug
- [ ] 04-02-PLAN.md — Landing Page: rewrite app/(marketing)/page.tsx with branded card (wordmark + tagline + CTAs + footer)
- [ ] 04-03-PLAN.md — Mobile Drawer: create DashboardShell.tsx; update DashboardHeader, Sidebar, layout.tsx
- [ ] 04-04-PLAN.md — QR Dedicated Page: create QRCard.tsx; create /dashboard/qr page; update dashboard/page.tsx; enable Mi QR nav item

**Wave 1** *(parallel)* — Danger token + Landing page
- 04-01-PLAN: globals.css + 6 component files (red-* migration)
- 04-02-PLAN: app/(marketing)/page.tsx rewrite

**Wave 2** *(blocked on Wave 1)* — Mobile drawer
- 04-03-PLAN: DashboardShell.tsx (new) + DashboardHeader.tsx + Sidebar.tsx + layout.tsx

**Wave 3** *(blocked on Wave 2)* — QR dedicated page
- 04-04-PLAN: QRCard.tsx (new) + /dashboard/qr/page.tsx (new) + dashboard/page.tsx + Sidebar.tsx Mi QR enable

---

## Progress Table

| Phase | Name | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 | Foundation | 3/3 | Complete | 2026-05-04 |
| 2 | Admin Panel | 3/3 | Complete | 2026-05-05 |
| 3 | Public Menu & QR | 3/3 | Complete | 2026-05-06 |
| 4 | Polish & Brand | 4/4 | Complete | 2026-05-11 |
