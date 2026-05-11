---
plan: 04-01
phase: 04-polish-brand
status: complete
completed: 2026-05-11
key-files:
  created: []
  modified:
    - app/globals.css
    - components/dashboard/CategoriesClient.tsx
    - components/dashboard/DishesClient.tsx
    - components/dashboard/CategoryModal.tsx
    - components/dashboard/DishModal.tsx
    - components/dashboard/RestaurantProfileForm.tsx
    - components/dashboard/OnboardingSlug.tsx
---

## What Was Built

Added `--color-brand-danger: #DC2626` to the `@theme` block in `globals.css`, formalising the danger colour into the brand design system. Replaced every `red-*` Tailwind class across six dashboard components with the new `brand-danger` token — zero off-palette colour references remain in those files.

## Tasks Completed

1. **Add danger token** — `--color-brand-danger: #DC2626` inserted after `--color-brand-texto` in the `@theme` block of `app/globals.css`. Token generates Tailwind utilities `bg-brand-danger`, `text-brand-danger`, `border-brand-danger`, and opacity variants.
2. **Replace red-* classes** — Applied substitution table from 04-UI-SPEC.md §3 across all six files. Substitutions include delete buttons, confirm-delete buttons, error toasts, required-field asterisks, upload error text, and error banner backgrounds. `hover:bg-[#C2410C]` (brand-principal hover) and `text-gray-300` (neutral placeholder) were left untouched.

## Self-Check

- [x] `--color-brand-danger: #DC2626` in `globals.css` @theme block
- [x] Zero `red-*` classes in all 6 migrated files
- [x] `hover:bg-[#C2410C]` untouched (brand-principal hover)
- [x] `text-gray-300` untouched in DishesClient (neutral ImageOff placeholder)
- [x] Task 1 committed: `feat(04-01): add --color-brand-danger token to globals.css @theme`
- [x] Task 2 committed: `feat(04-01): replace red-* classes with brand-danger across 6 components`
