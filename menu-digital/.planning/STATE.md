# Project State — Menú Digital

**Current phase:** 4
**Status:** Complete
**Last updated:** 2026-05-11

---

## Phase Status

| Phase | Name | Status | Started | Completed |
|-------|------|--------|---------|-----------|
| 1 | Foundation | Complete | 2026-05-04 | 2026-05-04 |
| 2 | Admin Panel | Complete | 2026-05-05 | 2026-05-05 |
| 3 | Public Menu & QR | Complete | 2026-05-06 | 2026-05-06 |
| 4 | Polish & Brand | Complete | 2026-05-11 | 2026-05-11 |

---

## Active Work

All 4 phases complete. Product is fully built and verified.

---

## Completed Phases

- **Phase 1: Foundation** — completed 2026-05-04. Auth, Restaurant model, slug utilities, webhook handler, dashboard shell with 3-state onboarding flow.
- **Phase 2: Admin Panel** — completed 2026-05-05. Categories + Dishes CRUD, Cloudinary signed upload, 14 EU allergen grid, availability toggle with optimistic UI. All 5 UAT tests passed on production (menudig.com.ar).
- **Phase 3: Public Menu & QR** — completed 2026-05-06. ISR public menu page `/menu/[slug]` with sticky IntersectionObserver tabs, AllergenBadge with CSS tooltips, DishRow with ARS prices, custom 404, Cloudinary remotePatterns, Restaurant.description field, and QR card with "Ver mi menú" link. All 10 UAT truths verified on production.
- **Phase 4: Polish & Brand** — completed 2026-05-11. Danger token (`--color-brand-danger`), full red-* → brand-danger migration across 6 components, green-* success banner fixed, branded landing page, mobile hamburger drawer (DashboardShell + DashboardHeader + Sidebar), dedicated `/dashboard/qr` page with QRCard server component.

---

## Accumulated Context

### Key Decisions
- Clerk v7 — all routes public by default; only `/dashboard(.*)` is protected explicitly via `clerkMiddleware`. Do NOT use removed `authMiddleware`.
- `auth()` is async in Clerk v7 — always `await auth()` server-side; missing await returns a silent Promise.
- MongoDB connection must use the global singleton pattern (`lib/dbConnect.ts`) from day one — serverless functions do not persist connections.
- Slug is generated at registration from restaurant name (slugify + nanoid suffix) and is immutable forever — QR codes in the wild depend on it.
- Price stored as centavos integer — never float. UI shows pesos (price / 100), stores Math.round(pesos * 100).
- Cloudinary uploads are signed server-side (`/api/sign-cloudinary-params`); `CLOUDINARY_API_SECRET` must never appear in any `NEXT_PUBLIC_` variable. Auth guard added (401 if unauthenticated).
- QR URL always sourced from `NEXT_PUBLIC_APP_URL` — set to `https://menudig.com.ar` in production Vercel env.
- Public menu `/menu/[slug]` uses ISR + `revalidatePath('/menu/' + restaurant.slug)` on every mutation — on-demand only, no static revalidate interval.
- Allergens are the fixed 14 EU allergens (Reglamento 1169/2011) stored as `[String]` on Dish — constants in `lib/allergens.ts`.
- `useActionState` from `'react'` (React 19) — NOT `useFormState` from `'react-dom'`. All Server Actions accept `(prevState: any, formData: FormData)`.
- Pages at `app/(admin)/dashboard/categories/` and `app/(admin)/dashboard/dishes/` — not at `app/(admin)/categories/`.
- Cloudinary deletion on dish delete: synchronous try/catch before DB delete; log error but always delete DB doc.
- Category reorder: sentinel swap (3 updateOne calls with SENTINEL=-9999) to avoid duplicate-order corruption window.
- `categoryId` ownership always verified via `Category.findOne({ _id: categoryId, restaurantId: restaurant._id })` before createDish/updateDish.
- `router.refresh()` called after every successful mutation in CategoriesClient and DishesClient to re-fetch RSC data.

### Open Questions
- `autoIndex` in production: disable and manage via Atlas UI or migration script?

### Blockers
(none)

### Todos
(none)

---

## Session Continuity

All 4 phases complete. No outstanding work. Project is production-ready.
