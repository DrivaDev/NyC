# Menú Digital — Project Guide

## Project
SaaS de menú digital para restaurantes accesible por QR. Desarrollado por Driva Dev.
- **Dominio:** menudig.com.ar
- **Stack:** Next.js 16 App Router · Clerk v7 · MongoDB Atlas + Mongoose 9 · Cloudinary · qrcode npm · Vercel · Tailwind CSS v4

## GSD Workflow
- Mode: **YOLO** — auto-approve, execute without interruptions
- Granularity: **Coarse** (4 phases)
- Research: enabled · Plan Check: enabled · Verifier: enabled
- Commit docs: yes

## Architecture Rules (Non-negotiable)
1. **Every DB query must filter by `userId` from `await auth()`** — never trust client-supplied IDs
2. **Global Mongoose connection cache** in `lib/dbConnect.ts` — mandatory for Vercel serverless
3. **Clerk v7 patterns only** — `clerkMiddleware` (not `authMiddleware`), async `auth()`, `ClerkProvider` inside `<body>`, `afterSignOutUrl` on `ClerkProvider` (not on `UserButton`)
4. **Server Actions for writes, Server Components for reads** — only exception: `GET /api/qr` (binary PNG)
5. **Signed Cloudinary uploads** — `CLOUDINARY_API_SECRET` never in client code or `NEXT_PUBLIC_` vars
6. **ISR for `/menu/[slug]`** — not SSR; call `revalidatePath` on every dish/category mutation
7. **QR URL** — always from `NEXT_PUBLIC_APP_URL=https://menudig.com.ar`
8. **Slug is immutable** after restaurant creation — no update endpoint
9. **Tailwind v4** — brand tokens defined via `@theme` in `globals.css`, not in `tailwind.config.ts`

## Brand Identity (Driva Dev)
```css
--color-brand-principal: #EA580C;  /* Buttons, CTAs */
--color-brand-titulares: #9A3412;  /* H1, H2 */
--color-brand-acento:    #FED7AA;  /* Badges, secondary backgrounds */
--color-brand-fondo:     #FFF7ED;  /* General background */
--color-brand-texto:     #1C1917;  /* Body text */
```
- Font: **Fira Sans** (Google Fonts) — Bold H1/H2, Medium H3, Regular body, Light caption
- Footer: "Desarrollado por Driva Dev" on every page
- No gradients, no off-palette colors, no excessive shadows

## Phases
| # | Phase | Status |
|---|-------|--------|
| 1 | Foundation (Auth + Restaurant + Slug) | Complete ✓ |
| 2 | Admin Panel (Categories + Dishes + Cloudinary) | Complete ✓ |
| 3 | Public Menu + QR | Complete ✓ |
| 4 | Polish & Brand | Complete ✓ |

## Next Step
All 4 phases complete. Project is production-ready at menudig.com.ar.
