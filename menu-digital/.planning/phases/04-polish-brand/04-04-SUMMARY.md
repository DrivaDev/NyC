---
plan: 04-04
phase: 04-polish-brand
status: complete
completed: 2026-05-11
key-files:
  created:
    - components/dashboard/QRCard.tsx
    - app/(admin)/dashboard/qr/page.tsx
  modified:
    - app/(admin)/dashboard/page.tsx
    - components/dashboard/Sidebar.tsx
---

## What Was Built

Extracted the inline QR card JSX from `dashboard/page.tsx` into a reusable `QRCard.tsx` server component with props `{ menuUrl, qrDataUrl, slug }`. Created a dedicated `/dashboard/qr` page that replicates the auth+db pattern from the dashboard home and renders `QRCard` in a `max-w-sm` container with an H1 "Mi QR" heading. Updated `dashboard/page.tsx` to use `<QRCard>` instead of the inline JSX. Enabled the Mi QR nav item in `Sidebar.tsx` (changed `enabled: false` → `enabled: true`), making it a clickable link and removing the "Pronto" badge.

## Tasks Completed

1. **QRCard.tsx + dashboard/page.tsx** — Server component extracted with props interface; `Download` icon moved into QRCard; dashboard home replaces 40-line block with single `<QRCard>` element; `Acciones rápidas` card unchanged.
2. **/dashboard/qr page + Sidebar enable** — New page with `await auth()` guard, `Restaurant.findOne({ clerkId: userId })` scoped query, redirect for unauthenticated or unconfirmed-slug state, QRCard rendered inside `max-w-sm`. Sidebar Mi QR item now `enabled: true`; all 5 nav items enabled.

## Self-Check

- [x] QRCard.tsx is a Server Component (no 'use client'), accepts `{ menuUrl, qrDataUrl, slug }` props
- [x] QRCard contains download button with bg-brand-principal and hover:bg-[#C2410C]
- [x] QRCard contains "Ver mi menú" secondary link
- [x] /dashboard/qr page has H1 "Mi QR" in text-brand-titulares
- [x] /dashboard/qr page redirects to /dashboard if restaurant not found or slug not confirmed
- [x] dashboard/page.tsx uses <QRCard> — no inline QR JSX duplication; Acciones rápidas card intact
- [x] Sidebar Mi QR: enabled: true; no "Pronto" badge
- [x] Both tasks committed individually
