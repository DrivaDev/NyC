# Project State — Menú Digital

**Current phase:** 1
**Status:** Not started
**Last updated:** 2026-05-04

---

## Phase Status

| Phase | Name | Status | Started | Completed |
|-------|------|--------|---------|-----------|
| 1 | Foundation | Not started | — | — |
| 2 | Admin Panel | Not started | — | — |
| 3 | Public Menu & QR | Not started | — | — |
| 4 | Polish & Brand | Not started | — | — |

---

## Active Work

(empty)

---

## Completed Phases

(none)

---

## Accumulated Context

### Key Decisions
- Clerk v6 — all routes public by default; only `/dashboard(.*)` is protected explicitly via `clerkMiddleware`. Do NOT use removed `authMiddleware`.
- `auth()` is async in Clerk v6 — always `await auth()` server-side; missing await returns a silent Promise.
- MongoDB connection must use the global singleton pattern (`lib/dbConnect.ts`) from day one — serverless functions do not persist connections.
- Slug is generated at registration from restaurant name (slugify + nanoid suffix) and is immutable forever — QR codes in the wild depend on it.
- Price stored as cents integer — never float.
- Cloudinary uploads are signed server-side (`/api/sign-cloudinary-params`); `CLOUDINARY_API_SECRET` must never appear in any `NEXT_PUBLIC_` variable.
- QR URL always sourced from `NEXT_PUBLIC_APP_URL` — set to `https://menudig.com.ar` in production Vercel env.
- Public menu `/menu/[slug]` uses ISR (`revalidate: 60`) + `revalidatePath` on save — never SSR per scan.
- Allergens are the fixed 14 EU allergens (Reglamento 1169/2011) stored as `[String]` enum on Dish — no custom text allergens.

### Open Questions
- Slug onboarding: auto-generated with editable preview before submit, or silent auto-generation?
- ISR strategy: `revalidatePath` on-demand only, or also `revalidate: 60` as fallback?
- Cloudinary asset deletion: synchronous in Server Action, or deferred?
- Allergen display format: icon + tooltip, badge with abbreviation, or expanded label?
- Category ordering UX: up/down buttons (v1 spec), numeric field, or deferred drag-and-drop?
- `autoIndex` in production: disable and manage via Atlas UI or migration script?

### Blockers
(none)

### Todos
(none)

---

## Session Continuity

Next action: Run `/gsd-plan-phase 1` to plan Phase 1 (Foundation).

Phase 1 scope: AUTH-01, AUTH-02, AUTH-03, REST-01, REST-02
Core deliverable: Clerk auth live + Restaurant document with immutable slug + MongoDB singleton + Clerk webhook handler.
