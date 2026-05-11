# Phase 4: Polish & Brand - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-06
**Phase:** 4-Polish & Brand
**Areas discussed:** Landing page, Mobile admin panel, Destructive action colors, Mi QR nav item

---

## Landing Page

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal sign-in card | Hero centered on brand background: logo, tagline, two buttons | ✓ |
| Basic hero section | Full-width hero with headline, feature bullets, CTA buttons | |
| Redirect to /sign-in | Remove page, redirect `/` → `/sign-in` | |

**Card content:**

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + tagline only | Wordmark + one short tagline, then two buttons | ✓ |
| Logo + tagline + feature line | Same but one sentence explaining QR concept | |
| Buttons only | Ultra-minimal, just product name as H1 and buttons | |

**Footer:**

| Option | Description | Selected |
|--------|-------------|----------|
| Include footer | "Desarrollado por Driva Dev" — consistent with all pages | ✓ |
| Omit footer | Cleaner but breaks footer rule | |

**CTA button target:**

| Option | Description | Selected |
|--------|-------------|----------|
| Link to /sign-in and /sign-up | Standard navigation, no Clerk coupling | ✓ |
| Embed Clerk SignIn inline | Auth component directly on landing page | |

**User's choice:** Minimal sign-in card with logo + tagline, footer included, buttons link to /sign-in and /sign-up.
**Notes:** No feature bullets. Clean and fast to build.

---

## Mobile Admin Panel

| Option | Description | Selected |
|--------|-------------|----------|
| Hamburger → slide-out drawer | Sidebar hidden on mobile, hamburger in header opens as drawer | ✓ |
| Bottom navigation bar | Replace sidebar with bottom tab bar on mobile | |
| Icon-only collapsed sidebar | Sidebar shrinks to 48px icons on mobile | |

**Hamburger placement:**

| Option | Description | Selected |
|--------|-------------|----------|
| In DashboardHeader (top-left) | Minimal — one button, already `'use client'` | ✓ |
| Fixed floating button | Floating corner button | |

**Background overlay:**

| Option | Description | Selected |
|--------|-------------|----------|
| Semi-transparent overlay | Dark overlay, tap to close | ✓ |
| No overlay | Slide in only | |

**Auto-close on navigation:**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, close on navigation | Tap nav link → navigate + close drawer | ✓ |
| No, user must close manually | Drawer stays open after navigating | |

**User's choice:** Hamburger in DashboardHeader, slide-out drawer, overlay, auto-close on nav tap.
**Notes:** Standard admin mobile pattern. Reuses existing Sidebar component.

---

## Destructive Action Colors

| Option | Description | Selected |
|--------|-------------|----------|
| Keep semantic red, add @theme token | Add `--color-danger: #DC2626` to globals.css, replace red-* classes | ✓ |
| Replace with brand orange | Use #EA580C for delete buttons | |
| Keep Tailwind red-* as-is | Don't change, interpret success criteria as decorative-only | |

**Danger token value:**

| Option | Description | Selected |
|--------|-------------|----------|
| #DC2626 (Tailwind red-600) | Matches existing code — no visual change | ✓ |
| #EF4444 (Tailwind red-500) | Lighter red | |
| Let Claude decide | Researcher picks WCAG-compliant value | |

**User's choice:** `--color-brand-danger: #DC2626` in @theme, replace all red-* classes.
**Notes:** Zero visual change — just formalizes existing colors into the design system.

---

## Mi QR Nav Item

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it entirely | Delete nav item, QR lives only on dashboard home | |
| Create /dashboard/qr page and enable it | New dedicated page, enable nav item | ✓ |
| Keep disabled, remove Pronto badge | Gray item stays but badge removed | |

**Dashboard home after change:**

**User's choice (free text):** "dashboard home debe contener lo mismo que ahora. Dashboard/qr existirá ya que en un futuro implementaremos ciertas personalizaciones que se le podrá hacer al QR."

**What /dashboard/qr shows in Phase 4:**

| Option | Description | Selected |
|--------|-------------|----------|
| Same QR card as dashboard home | QR preview + download + Ver mi menú | ✓ |
| Larger QR with more whitespace | Full-page destination layout | |

**User's choice:** Create `/dashboard/qr` with same QR card content. Dashboard home unchanged. The page is the foundation for future QR customization.
**Notes:** Key insight: this is about future customization features — colors, styles, logo overlay on QR code. The page should be clean and extensible.

---

## Claude's Discretion

- Exact tagline text for the landing page — researcher/planner can use existing metadata description ("El menú digital de tu restaurante") or similar
- Implementation of the `sidebarOpen` state (whether to use a `DashboardShell.tsx` client wrapper or convert `layout.tsx` to client)
- Whether to extract the QR card into a shared `QRCard` server component or duplicate the code

## Deferred Ideas

- **QR customization** — User explicitly mentioned future customization options for the QR code (colors, border style, logo overlay). The `/dashboard/qr` page is being built as the foundation. Customization UI belongs in a future phase.
