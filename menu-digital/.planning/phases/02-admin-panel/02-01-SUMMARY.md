---
phase: 02-admin-panel
plan: 01
subsystem: admin-panel-foundation
tags: [cloudinary, allergens, dashboard-header, sidebar, infrastructure]
dependency_graph:
  requires: [01-03]
  provides: [02-02, 02-03]
  affects: [app/(admin)/layout.tsx, components/dashboard/Sidebar.tsx]
tech_stack:
  added: [cloudinary@^2.10.0, zod@^4.4.3]
  patterns: [signed-cloudinary-upload, usePathname-dynamic-header, enabled-nav-items]
key_files:
  created:
    - app/api/sign-cloudinary-params/route.ts
    - lib/allergens.ts
    - components/dashboard/DashboardHeader.tsx
  modified:
    - package.json
    - package-lock.json
    - components/dashboard/Sidebar.tsx
    - app/(admin)/layout.tsx
decisions:
  - "CLOUDINARY_API_SECRET configured at module scope in route handler; never returned in response body"
  - "Allergen keys use underscores (frutos_de_cascara) matching D-09 spec for MongoDB string storage"
  - "DashboardHeader uses usePathname() fallback to Dashboard for unknown routes"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-05"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 2 Plan 1: Admin Panel Foundation Summary

**One-liner:** Installed cloudinary+zod, wired signed-upload API route, exported 14 EU allergen constants, and replaced static dashboard header with a route-aware DashboardHeader client component while enabling Categorías and Platos sidebar navigation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install cloudinary+zod, signing route, allergen constants | ec9c89c | package.json, app/api/sign-cloudinary-params/route.ts, lib/allergens.ts |
| 2 | DashboardHeader, enable sidebar nav items, update layout | 428acf1 | components/dashboard/DashboardHeader.tsx, components/dashboard/Sidebar.tsx, app/(admin)/layout.tsx |

## What Was Built

### Task 1 — Cloudinary + Allergens
- `cloudinary@^2.10.0` and `zod@^4.4.3` added to project dependencies
- `POST /api/sign-cloudinary-params` — signs Cloudinary upload parameters server-side; `CLOUDINARY_API_SECRET` never leaves the server, never returned in the response; signature is time-limited (1 hour) and folder-scoped to `menu-digital`
- `lib/allergens.ts` — exports `ALLERGENS` (14 EU allergens per Reglamento 1169/2011) as a readonly `as const` array, plus `AllergenKey` union type derived from it

### Task 2 — Dashboard Shell
- `components/dashboard/DashboardHeader.tsx` — client component using `usePathname()` to render the correct title for `/dashboard`, `/dashboard/categories`, `/dashboard/dishes`, and `/dashboard/qr`; falls back to "Dashboard" for unknown routes
- `components/dashboard/Sidebar.tsx` — Categorías and Platos entries changed from `enabled: false` to `enabled: true`; they now render as `<Link>` elements instead of disabled `<span>` elements; Mi QR remains disabled
- `app/(admin)/layout.tsx` — static `<header>` replaced with `<DashboardHeader />`; all other layout code (auth guard, dbConnect, Restaurant.findOne, Sidebar, main, footer) unchanged

## Verification Results

- `npm run build` — exits 0; 7 routes generated, no type errors
- `npx tsc --noEmit` — no output (clean)
- `grep -c "key:" lib/allergens.ts` — returns 14
- `grep -c "enabled: false" components/dashboard/Sidebar.tsx` — returns 1 (only Mi QR)
- `CLOUDINARY_API_SECRET` present in route handler, no `NEXT_PUBLIC_` prefix on it

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan is infrastructure-only. The signing route requires `CLOUDINARY_API_SECRET` in `.env.local` to return a valid signature; without it the route returns an object with an undefined `api_key` and empty `cloud_name`. This is expected — env vars are user-configured per `user_setup` in the plan frontmatter.

## Threat Flags

None — no new threat surface beyond what was modeled in the plan's `<threat_model>`.

## Self-Check: PASSED

- `app/api/sign-cloudinary-params/route.ts` — FOUND
- `lib/allergens.ts` — FOUND
- `components/dashboard/DashboardHeader.tsx` — FOUND
- Commit ec9c89c — FOUND
- Commit 428acf1 — FOUND
