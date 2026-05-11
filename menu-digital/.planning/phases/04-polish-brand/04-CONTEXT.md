# Phase 4: Polish & Brand - Context

**Gathered:** 2026-05-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 applies Driva Dev's visual identity consistently across every screen, handles empty/error states cleanly, and makes the admin panel fully usable on mobile.

**When Phase 4 is done:**
- The `/` (homepage) shows a minimal branded card: product wordmark, tagline, and two CTA buttons linking to `/sign-in` and `/sign-up`
- The admin panel works on mobile via a hamburger → slide-out drawer pattern
- A `--color-danger` token (`#DC2626`) is defined in `@theme`, and all `red-*` Tailwind classes are replaced with `brand-danger` equivalents
- A dedicated `/dashboard/qr` page exists with the QR card (preview + download + "Ver mi menú"), and the "Mi QR" sidebar nav item is enabled
- Dashboard home is unchanged — it keeps the QR card + quick actions as-is

**Requirements in scope:** BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06
**Out of scope:** New menu features, QR customization options (future phase), multi-restaurant support, analytics

</domain>

<decisions>
## Implementation Decisions

### Landing Page (/)
- **D-LP-01:** The `/` route renders a **minimal centered card** — centered on `bg-brand-fondo`. Layout: product wordmark/name as H1 (`text-brand-titulares`), one short tagline below, then two CTA buttons.
- **D-LP-02:** Card content = **logo + tagline only**. No feature bullet list. Tagline: use metadata description ("El menú digital de tu restaurante") or similar concise line.
- **D-LP-03:** **Footer included** — "Desarrollado por Driva Dev" at the bottom, matching every other page.
- **D-LP-04:** CTA buttons **link to `/sign-in` and `/sign-up`** — no inline Clerk component. "Iniciar sesión" = primary button (`bg-brand-principal`, white text, `min-h-[44px]`). "Registrate" = secondary button (`border-brand-principal`, `text-brand-principal`, transparent background). No Clerk embedding on the landing page.

### Mobile Admin Panel
- **D-MOB-01:** On mobile, the sidebar is **hidden by default** and opened via a hamburger → **slide-out drawer**. The drawer overlays the content area (does not push it). Reuses the existing `Sidebar` component inside a mobile drawer wrapper.
- **D-MOB-02:** Hamburger button lives **inside `DashboardHeader`**, top-left, visible only on mobile (`md:hidden`). On desktop (`md:flex`), the sidebar shows normally as before.
- **D-MOB-03:** When the drawer opens, a **semi-transparent dark overlay** covers the main content area. Tapping the overlay closes the drawer.
- **D-MOB-04:** The drawer **closes automatically** when any nav link is tapped (link `onClick` → `setOpen(false)`). The `Sidebar` component needs an `onNavigate` callback prop to support this.

### Destructive Action Colors
- **D-DNG-01:** Add **`--color-danger: #DC2626`** to `@theme` in `app/globals.css`. This token covers: danger background (`bg-brand-danger`), danger text (`text-brand-danger`), danger border (`border-brand-danger`).
- **D-DNG-02:** Replace all Tailwind `red-*` classes throughout the codebase with `brand-danger` equivalents. Files affected: `components/dashboard/CategoriesClient.tsx`, `components/dashboard/DishesClient.tsx`, `components/dashboard/CategoryModal.tsx`, `components/dashboard/DishModal.tsx`, and any toast/notification components using red. Do NOT change `hover:bg-[#C2410C]` — that is a brand-principal hover, not red.

### Mi QR Nav Item
- **D-QR-01:** Create a new **`/dashboard/qr` page** (`app/(admin)/dashboard/qr/page.tsx`) containing the same QR card component currently on the dashboard home. QR card = QR preview image, download PNG button, "Ver mi menú" link, and menu URL display.
- **D-QR-02:** **Enable the "Mi QR" nav item** in `Sidebar.tsx` — set `enabled: true`, remove the "Pronto" badge. Nav item already points to `/dashboard/qr`.
- **D-QR-03:** **Dashboard home is unchanged** — it keeps both the QR card and the quick actions card exactly as-is. The `/dashboard/qr` page is an additional entry point, not a replacement.
- **D-QR-04:** The QR card on both pages must use `NEXT_PUBLIC_APP_URL` for the QR URL — same generation logic as today.
- **D-QR-05:** Add `"/dashboard/qr": "Mi QR"` is already present in `DashboardHeader` titles map — no change needed there.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/REQUIREMENTS.md` — BRAND-01..06 are in scope for this phase
- `.planning/PROJECT.md` — brand palette, typography weights, button rules, footer rule
- `CLAUDE.md` — architecture rules (especially Rule 9: Tailwind v4 with `@theme` in `globals.css`)

### Brand Tokens (SINGLE SOURCE OF TRUTH)
- `app/globals.css` — `@theme` block defines all `--color-brand-*` tokens; Phase 4 adds `--color-brand-danger: #DC2626` here

### Existing Components to Modify
- `components/dashboard/Sidebar.tsx` — add `onNavigate?: () => void` callback; mobile breakpoints
- `components/dashboard/DashboardHeader.tsx` — add hamburger button (mobile only); needs open/close state
- `app/(admin)/layout.tsx` — wraps Sidebar + DashboardHeader; must manage `sidebarOpen` state and pass it down
- `app/(marketing)/page.tsx` — replace placeholder with branded landing card

### Files with red-* classes to migrate to brand-danger
- `components/dashboard/CategoriesClient.tsx` — delete confirmation, toast
- `components/dashboard/DishesClient.tsx` — delete confirmation, toast
- `components/dashboard/CategoryModal.tsx` — error states if any
- `components/dashboard/DishModal.tsx` — error states if any

### Prior Phase Context
- `.planning/phases/03-public-menu-qr/03-CONTEXT.md` — D-09 allergen badge pattern, D-04 dish layout
- `.planning/phases/02-admin-panel/02-CONTEXT.md` — button patterns, modal patterns, toast pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/globals.css` `@theme` — already has 5 brand tokens; add `--color-brand-danger` here
- `components/dashboard/Sidebar.tsx` — full nav component; needs `onNavigate` prop added and mobile breakpoint classes
- `components/dashboard/DashboardHeader.tsx` — `'use client'` already; add hamburger toggle here
- `app/(admin)/layout.tsx` — server component today; must become client component (`'use client'`) to manage `sidebarOpen` state, OR pass state down via a client wrapper
- Dashboard QR card in `app/(admin)/dashboard/page.tsx` — extract into a `QRCard` server component to share between `/dashboard` and `/dashboard/qr`

### Established Patterns
- **`min-h-[44px]` touch targets** — all interactive elements already use this; keep on landing CTA buttons
- **Primary button:** `bg-brand-principal text-white rounded-lg hover:bg-[#C2410C]` — use on "Iniciar sesión"
- **Secondary button:** `border border-brand-principal text-brand-principal rounded-lg hover:bg-brand-fondo` — use on "Registrate"
- **Toast pattern:** already in `CategoriesClient`/`DishesClient` — update `border-red-200` and `text-red-500` to `border-brand-danger` / `text-brand-danger`
- **`'use client'` island in server layout** — precedent set by `DashboardHeader` and `Sidebar` inside `app/(admin)/layout.tsx`

### Integration Points
- `app/(admin)/layout.tsx` must coordinate hamburger state between `DashboardHeader` (owns the button) and `Sidebar` (owns the drawer) — extract a `DashboardShell.tsx` client component or lift state into layout
- `/dashboard/qr` page: QR generation code is in `app/(admin)/dashboard/page.tsx` — extract to a shared utility or component callable from both pages
- Landing page lives in `app/(marketing)/page.tsx` — currently a placeholder; replace without touching `app/layout.tsx`

</code_context>

<specifics>
## Specific Ideas

- The user confirmed that `/dashboard/qr` is the **future home of QR customization** (custom colors, styles, logo overlay on QR) — the page should be a clean starting point, not overcrowded with other content.
- Dashboard home must **not change** — the QR card stays there. The `/dashboard/qr` page is additive.
- The hamburger → drawer must work smoothly on mobile. The overlay + auto-close on navigation is the expected behavior.
- `--color-brand-danger` must be at `#DC2626` exactly (matching the existing `bg-red-600` in code) — no visual change to delete buttons, just formalization.

</specifics>

<deferred>
## Deferred Ideas

- **QR customization** — The user mentioned future customization options for the QR (colors, border style, logo overlay). `/dashboard/qr` page is being built now as the foundation for this. The customization UI itself belongs in a future phase.

</deferred>

---

*Phase: 4-Polish & Brand*
*Context gathered: 2026-05-06*
