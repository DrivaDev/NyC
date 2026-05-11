---
phase: 3
plan: "03-PLAN-01"
subsystem: infrastructure
tags: [next-config, mongoose, server-action, settings-form, cloudinary, description]
dependency_graph:
  requires: []
  provides: [cloudinary-image-loading, restaurant-description-field]
  affects: [public-menu-page, settings-form]
tech_stack:
  added: []
  patterns: [remotePatterns, uncontrolled-textarea, unconditional-field-update]
key_files:
  created: []
  modified:
    - next.config.ts
    - models/Restaurant.ts
    - actions/restaurant.ts
    - components/dashboard/RestaurantProfileForm.tsx
    - app/(admin)/dashboard/settings/page.tsx
decisions:
  - "description field added unconditionally to updateRestaurantProfile update object — clearing to empty string is a valid user action (per D-03)"
  - "textarea uses defaultValue (uncontrolled) to match existing name input pattern"
  - "hostname scoped to res.cloudinary.com only — no wildcard (T-03-02)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-06"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
---

# Phase 3 Plan 01: Infrastructure & Settings Groundwork Summary

**One-liner:** Added Cloudinary remotePatterns to next.config.ts and wired the description field through Restaurant model, updateRestaurantProfile action, and settings form textarea.

## What Was Built

### Task 1 — Cloudinary remotePatterns (next.config.ts)
Replaced the empty `nextConfig` object with one containing `images.remotePatterns` scoped to `hostname: 'res.cloudinary.com'` and `pathname: '/**'`. This allows `next/image` to load Cloudinary-hosted images without triggering 400 errors — previously any `<Image src={cloudinaryUrl}>` would fail at build time or runtime.

### Task 2 — description field end-to-end
Four files modified in concert:

1. **models/Restaurant.ts** — added `description: { type: String, default: '' }` after `logoPublicId`. No migration needed; MongoDB returns the Mongoose default `''` for existing documents.

2. **actions/restaurant.ts** — extracted `description` from `formData` with `.trim() ?? ''` and added it to the base `update` object unconditionally (`{ name, description }`). It is NOT inside any conditional block — clearing the description to an empty string is a valid user action.

3. **components/dashboard/RestaurantProfileForm.tsx** — added `initialDescription: string` to the Props interface, destructured it, and inserted a `<textarea>` field (id `restaurant-description`, name `description`, `maxLength={200}`, `rows={3}`, `disabled={pending}`, `defaultValue={initialDescription}`) between the logo upload section and the feedback banners. Uses uncontrolled pattern (defaultValue) consistent with the existing name input.

4. **app/(admin)/dashboard/settings/page.tsx** — added `description: string` to the `.lean<{...}>()` generic type, passed `initialDescription={restaurant.description ?? ''}` to `<RestaurantProfileForm>`, and updated the page subtitle from "nombre y logo" to "nombre, logo y descripción".

## Verification

- TypeScript (`npx tsc --noEmit`) — zero errors.
- All grep checks passed:
  - `grep -c "res.cloudinary.com" next.config.ts` → 1
  - `grep -c "description:" models/Restaurant.ts` → 1
  - `grep -c "description" actions/restaurant.ts` → 2
  - `grep -c "restaurant-description" components/dashboard/RestaurantProfileForm.tsx` → 2 (id + name)
  - `description: string` in lean type and `initialDescription` prop both present in settings page

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 98587d6 | feat(03-03-PLAN-01): add Cloudinary remotePatterns to next.config.ts |
| 2    | 55d914a | feat(03-03-PLAN-01): add description field to model, action, and settings form |

## Known Stubs

None — all fields are fully wired. The `description` field will be empty string for existing restaurants until they save it; this is expected behavior, not a stub.

## Threat Flags

No new security-relevant surface beyond what the plan's threat model covers (T-03-01, T-03-02, T-03-03 all addressed).

## Self-Check: PASSED

- [x] next.config.ts exists and contains `res.cloudinary.com`
- [x] models/Restaurant.ts contains `description:` field
- [x] actions/restaurant.ts contains `description` extraction and inclusion in update object
- [x] RestaurantProfileForm.tsx contains `restaurant-description` textarea
- [x] settings/page.tsx passes `initialDescription` prop
- [x] Commits 98587d6 and 55d914a exist on master branch
- [x] TypeScript compilation passes with zero errors
