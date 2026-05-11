---
plan: 04-03
phase: 04-polish-brand
status: complete
completed: 2026-05-11
key-files:
  created:
    - components/dashboard/DashboardShell.tsx
  modified:
    - components/dashboard/DashboardHeader.tsx
    - components/dashboard/Sidebar.tsx
    - app/(admin)/layout.tsx
---

## What Was Built

Created `DashboardShell.tsx` as a `'use client'` component owning `sidebarOpen` boolean state. It renders the desktop static sidebar (hidden on mobile via `hidden md:flex`), a mobile drawer overlay that fades in via opacity transition, and a mobile drawer panel that slides in via CSS transform. `DashboardHeader` received a hamburger button (`md:hidden`) wired to the `onOpenSidebar` callback. `Sidebar` received the optional `onNavigate` prop, called on every enabled Link click so tapping a nav item auto-closes the mobile drawer. `app/(admin)/layout.tsx` was simplified to a clean server component that delegates all layout rendering to `DashboardShell`.

## Tasks Completed

1. **DashboardShell + DashboardHeader + Sidebar** — Shell (`'use client'`) created with `sidebarOpen` state, animated overlay, CSS-transform drawer panel, and desktop `hidden md:flex` sidebar. Header received `onOpenSidebar` prop and `<Menu>` hamburger button. Sidebar received `onNavigate?` prop on all enabled `<Link>` elements.
2. **layout.tsx delegation** — Removed inline `Sidebar` + `DashboardHeader` + layout JSX; now simply wraps `{children}` in `<DashboardShell restaurantName={restaurant?.name}>`. Server component auth/db logic untouched.

## Self-Check

- [x] `DashboardShell.tsx` has `'use client'` and `sidebarOpen` useState (3 occurrences)
- [x] Mobile overlay: `fixed inset-0 bg-black/40 z-40 md:hidden` with opacity transition
- [x] Mobile drawer panel: `translate-x-0` / `-translate-x-full` with `duration-300 ease-in-out`
- [x] `DashboardHeader` has `onOpenSidebar` prop (3 occurrences) and `<Menu>` hamburger with `md:hidden`
- [x] `Sidebar` Links call `onNavigate?.()` on click (3 occurrences)
- [x] `layout.tsx` has no `'use client'` — remains server component
- [x] Both tasks committed individually
