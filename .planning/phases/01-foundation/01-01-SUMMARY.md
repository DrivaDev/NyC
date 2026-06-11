---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [nextjs, tailwind-v4, poppins, cult-ui, shadcn, vitest, footer, scaffold]

# Dependency graph
requires: []
provides:
  - Next.js 15 App Router project scaffolded in tma/ directory
  - Tailwind v4 with Driva Dev palette (5 brand tokens via @theme)
  - Poppins font loaded via next/font/google with CSS variable
  - Root layout with Footer in all pages
  - cult-ui TextureCard and TextureButton installed via shadcn registry
  - Vitest test infrastructure with @testing-library/react
  - Footer.test.tsx with 3 real assertions covering UI-03
  - vercel.json with maxDuration: 60 for contracts route
  - .env.example documenting MONGODB_URI and AUTH_SECRET
affects:
  - 01-02 (auth scaffold depends on this project base)
  - 01-03 (UI pages depend on globals.css palette and Footer)
  - all future phases (root layout, brand tokens, test infrastructure)

# Tech tracking
tech-stack:
  added:
    - next@16.2.9
    - next-auth@5.0.0-beta.31 (installed as next-auth@beta — v5 not yet on @latest)
    - mongoose@9.7.0
    - bcryptjs@3.0.3
    - zod@4.4.3
    - motion@12.40.0
    - class-variance-authority@0.7.1
    - clsx@2.1.1
    - tailwind-merge@3.6.0
    - vitest@4.1.8
    - @testing-library/react@16.3.2
    - @testing-library/jest-dom@6.9.1
    - jsdom@29.1.1
  patterns:
    - Tailwind v4 CSS-first config via @theme block (no tailwind.config.ts for colors)
    - next/font/google with variable CSS for Poppins
    - cult-ui registry in components.json for shadcn CLI
    - Vitest with jsdom environment and @/ path alias

key-files:
  created:
    - tma/src/app/globals.css
    - tma/src/app/layout.tsx
    - tma/src/components/Footer.tsx
    - tma/src/lib/utils.ts
    - tma/src/components/ui/texture-card.tsx
    - tma/src/components/ui/texture-button.tsx
    - tma/src/__tests__/components/Footer.test.tsx
    - tma/src/__tests__/setup.ts
    - tma/vitest.config.ts
    - tma/vercel.json
    - tma/.env.example
    - tma/components.json
  modified:
    - tma/package.json (added test scripts and all dependencies)

key-decisions:
  - "next-auth@beta instalado (no @5 ni @latest) — v5 sigue en beta, tag @latest apunta a v4.24.x"
  - "class-variance-authority, clsx, tailwind-merge instalados manualmente — shadcn CLI los requiere pero no los instala automáticamente"
  - "src/lib/utils.ts creado manualmente — shadcn CLI no lo genera sin haber ejecutado shadcn init completo"
  - "Vitest instalado en Plan 01 (no en Plan 00) porque Plan 00 aún no se ejecutó"
  - "@theme inline vs @theme: se usó @theme (sin inline) según Pattern 6 del research"

patterns-established:
  - "Pattern: Tailwind v4 brand tokens via @theme { --color-brand-*: hex } en globals.css"
  - "Pattern: next/font/google con variable CSS y aplicación via className={font.variable} en <html>"
  - "Pattern: Footer como componente separado importado en root layout"
  - "Pattern: Vitest + jsdom + @testing-library/react para unit tests de componentes React"

requirements-completed: [UI-01, UI-02, UI-03]

# Metrics
duration: 35min
completed: 2026-06-11
---

# Phase 01 Plan 01: Foundation & Scaffold Summary

**Next.js 15 App Router scaffolded con paleta Driva Dev via Tailwind v4 @theme, Poppins via next/font/google, Footer en root layout, cult-ui texture components instalados y Vitest con 3 tests reales del Footer pasando en verde**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-11T16:20:00Z
- **Completed:** 2026-06-11T16:55:00Z
- **Tasks:** 3 completadas
- **Files modified:** 14

## Accomplishments

- Proyecto Next.js 15 compilable (`npm run build` sale con código 0)
- Paleta Driva Dev aplicada globalmente via Tailwind v4 `@theme {}` — clases `bg-brand-primary`, `text-brand-title`, etc. disponibles en toda la app
- Poppins cargada como CSS variable `--font-poppins` y aplicada al body via root layout
- Footer "Desarrollado por Driva Dev" con link a drivadev.com.ar renderizado en todas las páginas
- cult-ui TextureCard y TextureButton instalados y disponibles via `@/components/ui/`
- Vitest configurado con jsdom + 3 tests del Footer pasando (texto, href, target/rel)

## Task Commits

1. **Tarea 1: Scaffold del proyecto y dependencias** - `d5f76e9` (chore)
2. **Tarea 2: Tailwind v4 paleta + Poppins + Footer + layout** - `91fb0ba` (feat)
3. **Tarea 3: Footer.test.tsx con assertions reales** - `e0a46fb` (test)

## Files Created/Modified

- `tma/src/app/globals.css` - @import tailwindcss + @theme con 5 tokens de paleta Driva Dev
- `tma/src/app/layout.tsx` - Root layout con Poppins, Footer, brand-background aplicado
- `tma/src/components/Footer.tsx` - Componente Footer con link a drivadev.com.ar
- `tma/src/lib/utils.ts` - Helper cn() con clsx + tailwind-merge
- `tma/src/components/ui/texture-card.tsx` - cult-ui TextureCard instalado via shadcn CLI
- `tma/src/components/ui/texture-button.tsx` - cult-ui TextureButton instalado via shadcn CLI
- `tma/src/__tests__/components/Footer.test.tsx` - 3 tests reales de UI-03
- `tma/src/__tests__/setup.ts` - Setup de @testing-library/jest-dom
- `tma/vitest.config.ts` - Config Vitest con jsdom y alias @/
- `tma/vercel.json` - maxDuration: 60 para route de contratos
- `tma/.env.example` - Variables de entorno documentadas
- `tma/components.json` - shadcn config con cult-ui registry
- `tma/package.json` - Todas las dependencias + scripts test/test:ci

## Decisions Made

- `next-auth@beta` en lugar de `next-auth@5`: la versión 5 no existe como tag estable en npm — el tag `@5` falla con ETARGET. Se usa `@beta` que resuelve a `5.0.0-beta.31`.
- `class-variance-authority`, `clsx`, `tailwind-merge` instalados manualmente porque shadcn CLI los requiere internamente pero el flow sin `shadcn init` completo no los agrega al package.json.
- `src/lib/utils.ts` creado manualmente con `cn()` — shadcn no lo genera sin el init completo.
- Vitest instalado en este plan porque Plan 00 (Wave 0 testing stub) aún no se ejecutó. Se instaló junto con los tests reales del Footer directamente.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] class-variance-authority y dependencias faltantes para button.tsx**
- **Found during:** Tarea 1 (verificación de build)
- **Issue:** El build fallaba con "Cannot find module 'class-variance-authority'" — shadcn instala button.tsx que requiere esta dependencia pero el CLI no la agrega automáticamente sin `shadcn init` completo
- **Fix:** `npm install class-variance-authority clsx tailwind-merge` + creación de `src/lib/utils.ts`
- **Files modified:** package.json, src/lib/utils.ts
- **Verification:** `npm run build` sale con código 0
- **Committed in:** d5f76e9 (Tarea 1)

**2. [Rule 2 - Missing Critical] Vitest instalado en este plan (no en Plan 00)**
- **Found during:** Tarea 3 (Footer.test.tsx)
- **Issue:** Plan 00 (Wave 0 Vitest) no se ejecutó antes de este plan — la infraestructura de tests no existía
- **Fix:** Instalar vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/jest-dom, jsdom + crear vitest.config.ts y setup.ts
- **Files modified:** package.json, vitest.config.ts, src/__tests__/setup.ts
- **Verification:** `npm test -- --run` reporta "3 passed"
- **Committed in:** e0a46fb (Tarea 3)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking, 1 Rule 2 missing critical)
**Impact on plan:** Ambas correcciones necesarias para que el build compile y los tests corran. Sin scope creep.

## Issues Encountered

- `next-auth@5` no existe en npm (tag ETARGET). El paquete v5 sigue en beta — se instala como `next-auth@beta` que resuelve a `5.0.0-beta.31`. La API es idéntica a la documentada.
- El globals.css generado por create-next-app usa `@theme inline` con variables de Geist font — se reemplazó completamente con la paleta Driva Dev como especifica el plan.

## User Setup Required

Antes de ejecutar la app en producción:
- Crear cluster MongoDB Atlas M0 y obtener `MONGODB_URI`
- Generar `AUTH_SECRET` con `openssl rand -base64 33`
- Agregar ambas variables en Vercel Dashboard (o `.env.local` para desarrollo)

## Next Phase Readiness

- Base compilable lista para Plan 02 (NextAuth v5 + MongoDB auth)
- Paleta Driva Dev disponible como clases Tailwind (`bg-brand-primary`, `text-brand-title`, etc.)
- cult-ui TextureCard y TextureButton listos para usar en formularios de login/register
- Test infrastructure lista para tests de auth actions en Plan 02

---
*Phase: 01-foundation*
*Completed: 2026-06-11*
