---
phase: 3
plan: "03-PLAN-02"
subsystem: public-menu
tags: [public-menu, isr, allergens, sticky-nav, intersection-observer, next-image, server-component]
dependency_graph:
  requires: [03-PLAN-01]
  provides: [public-menu-page, allergen-badges, dish-rows, sticky-category-nav]
  affects: [/menu/[slug]]
tech_stack:
  added: []
  patterns: [isr-on-demand, async-params, json-parse-serialize, intersection-observer, css-group-tooltip]
key_files:
  created:
    - lib/allergenEmoji.ts
    - components/menu/AllergenBadge.tsx
    - components/menu/ImagePlaceholder.tsx
    - components/menu/MenuCategoryNav.tsx
    - components/menu/DishRow.tsx
  modified:
    - app/(public)/menu/[slug]/page.tsx
decisions:
  - "Model imports aliased (Restaurant as RestaurantModel, etc.) to avoid naming collision with local type interfaces in page.tsx"
  - "generateStaticParams returns [] — all slugs generated on-demand (D-14: no export const revalidate)"
  - "populatedCategories filters out categories with zero available dishes before rendering — empty categories never appear in tab bar or sections"
  - "MenuCategoryNav receives only { _id, name } shape — no ObjectId leakage to client"
  - "tabIndex={0} on AllergenBadge outer span enables focus-within CSS tooltip on mobile tap"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-06"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 6
---

# Phase 3 Plan 02: Public Menu Page Summary

**One-liner:** Full ISR public menu page at /menu/[slug] with sticky IntersectionObserver tab bar, allergen emoji badges with CSS tooltips, and DishRow server components showing ARS-formatted prices.

## What Was Built

### Task 1 — Allergen emoji map and leaf components

**lib/allergenEmoji.ts** — New file exporting `ALLERGEN_EMOJI` as `Record<AllergenKey, string>` with all 14 EU allergen emoji. Imports `AllergenKey` from `./allergens` (not duplicated). `lib/allergens.ts` is unmodified.

**components/menu/AllergenBadge.tsx** — Server component (no `'use client'`). Renders a 24px `bg-brand-acento` circle with the allergen emoji, plus a CSS-only tooltip above it showing the Spanish allergen name. Tooltip uses both `group-hover/badge:opacity-100` (desktop hover) and `group-focus-within/badge:opacity-100` (mobile tap via `tabIndex={0}`). Accessible via `role="img"` + `aria-label={label}`.

**components/menu/ImagePlaceholder.tsx** — Server component. Fills the 80px image slot with a `bg-gray-100` div containing a centered SVG fork icon (stroke `#9CA3AF`, `aria-hidden`). Inherits rounded corners from parent container.

### Task 2 — MenuCategoryNav client island

**components/menu/MenuCategoryNav.tsx** — The sole `'use client'` island on the public menu page. Receives serialized `{ _id, name }[]` categories prop. Renders a `sticky top-0 z-10 bg-white border-b border-gray-100 overflow-x-auto` nav with one button per category. IntersectionObserver (rootMargin `-20% 0px -70% 0px`, threshold 0) updates activeId when a section enters the upper 30% of the viewport. Tab click optimistically sets activeId then calls `scrollIntoView({ behavior: 'smooth', block: 'start' })`. All observers disconnected on unmount.

### Task 3 — DishRow and full public menu page

**components/menu/DishRow.tsx** — Server component. Horizontal article layout with 80px (96px on md) image slot (next/image `fill` + `sizes`, or ImagePlaceholder), dish name, optional `line-clamp-2` description, ARS price via `toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })`, and allergen badges row (only when `dish.allergens.length > 0`). `last:border-b-0` prevents double border at section bottom.

**app/(public)/menu/[slug]/page.tsx** — Full replacement of the stub. Key characteristics:
- `params: Promise<{ slug: string }>` with `const { slug } = await params` (Next.js 15+ pattern)
- No `await auth()` — public route, join via `slug → restaurant._id`
- No `export const revalidate` — on-demand ISR only (revalidatePath called by all mutations)
- `generateStaticParams` returns `[]` — all slugs generated on-demand
- `Promise.all([Category.find(...), Dish.find(...)])` parallel queries
- Dishes grouped server-side into `dishesByCategory` Record before serialization
- `JSON.parse(JSON.stringify(...))` on all data before passing to client components
- `populatedCategories` filters out categories with zero available dishes
- Restaurant header: logo (if set, `next/image` 80×80 rounded-full border-brand-acento), H1 name, optional description
- `notFound()` when `Restaurant.findOne({ slug })` returns null
- Section elements: `id="category-{cat._id}"` and `className="scroll-mt-12"` for smooth scroll anchor
- Footer: exact string "Desarrollado por Driva Dev"

## Verification

TypeScript compilation (`npx tsc --noEmit`) — zero errors.

Grep checks:
- `grep -c "params: Promise" page.tsx` → 1
- `grep -c "notFound()" page.tsx` → 1
- `grep -c "available: true" page.tsx` → 1
- `grep -c "export const revalidate" page.tsx` → 0 (correct)
- `grep -c "await auth()" page.tsx` → 0 (correct)
- `grep -c "Desarrollado por Driva Dev" page.tsx` → 1
- `grep -c "scroll-mt-12" page.tsx` → 1
- `grep -c "toLocaleString" DishRow.tsx` → 1
- `grep -c "group-focus-within/badge:opacity-100" AllergenBadge.tsx` → 1
- `grep -c "bg-gray-100" ImagePlaceholder.tsx` → 1
- `grep -c "'use client'" MenuCategoryNav.tsx` → 1
- `grep -c "rootMargin" MenuCategoryNav.tsx` → 1
- `grep -c "border-gray-100" MenuCategoryNav.tsx` → 1

## Deviations from Plan

**1. [Rule 1 - Bug] Aliased Mongoose model imports in page.tsx**
- **Found during:** Task 3 implementation
- **Issue:** The plan's code sample defined local TypeScript interfaces named `Restaurant`, `Category`, and `Dish` in the same file that imports the Mongoose models `Restaurant`, `Category`, `Dish`. This would cause a TS2300 "duplicate identifier" error.
- **Fix:** Renamed the Mongoose model imports to `RestaurantModel`, `CategoryModel`, `DishModel` using `import { Restaurant as RestaurantModel } from '@/models/Restaurant'` etc. Local interface types kept their original names.
- **Files modified:** `app/(public)/menu/[slug]/page.tsx`
- **Commit:** d5f9964

No other deviations — plan executed exactly as specified.

## Known Stubs

None. All data flows from MongoDB through server actions. The public menu page reads live restaurant/category/dish data from the database on every ISR-uncached request.

## Threat Flags

No new security-relevant surface beyond what the plan's threat model covers (T-03-04 through T-03-08 all addressed). Verified:
- No `await auth()` in the public page (T-03-05)
- All client-bound data serialized with JSON.parse(JSON.stringify()) (T-03-07)
- Dish query filtered by `available: true` and scoped to `restaurant._id` from slug lookup (T-03-04)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 117af20 | feat(03-PLAN-02): add allergen emoji map and leaf components (AllergenBadge, ImagePlaceholder) |
| 2    | 6c37eab | feat(03-PLAN-02): add MenuCategoryNav sticky tab bar client island |
| 3    | d5f9964 | feat(03-PLAN-02): implement full public menu page with DishRow component |

## Self-Check: PASSED

- [x] lib/allergenEmoji.ts exists with all 14 emoji
- [x] components/menu/AllergenBadge.tsx exists, no 'use client', has group/badge and focus-within tooltip
- [x] components/menu/ImagePlaceholder.tsx exists, no 'use client', has bg-gray-100
- [x] components/menu/MenuCategoryNav.tsx exists, has 'use client', IntersectionObserver, rootMargin
- [x] components/menu/DishRow.tsx exists, no 'use client', has toLocaleString ARS price
- [x] app/(public)/menu/[slug]/page.tsx has async params, notFound(), available:true filter, no revalidate export, no auth(), footer copy, scroll-mt-12
- [x] TypeScript compilation passes with zero errors
- [x] Commits 117af20, 6c37eab, d5f9964 exist on master branch
