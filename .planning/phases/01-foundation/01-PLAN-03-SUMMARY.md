---
plan: "01-03"
phase: 1
status: complete
completed: 2026-05-04
---

# Summary — Plan 03: Dashboard Shell + Onboarding UX

## What Was Built

- `app/(admin)/layout.tsx` — Server Component admin layout: `await auth()`, redirect to `/sign-in` when unauthenticated, `Restaurant.findOne({ clerkId: userId }).lean()`, sidebar + header + scrollable main + Driva Dev footer
- `components/dashboard/Sidebar.tsx` — Client Component sidebar: `LayoutDashboard`, `Tag`, `UtensilsCrossed`, `QrCode` from lucide-react; Dashboard nav item enabled, the other three rendered as `<span>` (not `<Link>`) with "Pronto" badge + `cursor-not-allowed`; active state uses `bg-brand-acento text-brand-titulares`; `UserButton` in footer
- `components/dashboard/OnboardingSlug.tsx` — Client Component: `useTransition`, calls `confirmSlug` Server Action, URL preview, slug input with live sanitisation (`[^a-z0-9-]` stripped), `AlertTriangle` warning banner, `Loader2` spinner on pending, toast (`CheckCircle2` / `XCircle`) at `fixed bottom-6 right-6 z-50`, reloads on success
- `app/(admin)/dashboard/page.tsx` — Server Component: 3-state logic (A: `!restaurant` → Loader2 spinner + "Configurando tu cuenta..."; B: `!slugConfirmed` → `<OnboardingSlug>`; C: confirmed → welcome + URL card with `Clock` icon)
- `npx tsc --noEmit` passes 0 errors

## Key Files Created

- `app/(admin)/layout.tsx`
- `components/dashboard/Sidebar.tsx`
- `components/dashboard/OnboardingSlug.tsx`
- `app/(admin)/dashboard/page.tsx`

## Deviations

- **Clerk v7 `UserButton`**: `afterSignOutUrl` prop removed in v7 — moved to `ClerkProvider afterSignOutUrl="/sign-in"` in root layout. `UserButton` in Sidebar rendered without the prop. Sign-out still redirects to `/sign-in` via the provider-level config.

## Self-Check: PASSED
