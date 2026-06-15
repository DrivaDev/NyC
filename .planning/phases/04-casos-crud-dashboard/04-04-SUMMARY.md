---
phase: 04-casos-crud-dashboard
plan: "04"
subsystem: casos-ui
tags: [casos, dashboard, tabla, formulario, server-component, auth]
dependency_graph:
  requires:
    - 04-02 (Caso.ts, casoSchema, /api/casos)
    - 04-03 (CasosSidebar, CasosFilterBar, ConfirmDialog)
  provides:
    - CasosTable (tabla con AnimatePresence, sort, delete)
    - CasosDashboard (Client Component orquestador)
    - CasoForm (formulario de creación con validación Zod)
    - /tma/casos (page.tsx protegida)
    - /tma/casos/nuevo (page.tsx protegida)
    - TmaPageContent card Casos TMA activado
  affects:
    - /tma (home — card ahora navega a /tma/casos)
tech_stack:
  added: []
  patterns:
    - AnimatePresence con motion.tr para exit animation en tabla
    - UI optimista con backup/rollback en eliminación
    - Filtrado AND en memoria sobre array local (no SSR)
    - Doble validación Zod (client CasoForm + server /api/casos)
    - Server Component con auth() → redirect("/login") como primera línea
key_files:
  created:
    - tma/src/components/casos/CasosTable.tsx
    - tma/src/components/casos/CasosDashboard.tsx
    - tma/src/components/casos/CasoForm.tsx
    - tma/src/app/tma/casos/page.tsx
    - tma/src/app/tma/casos/nuevo/page.tsx
  modified:
    - tma/src/components/TmaPageContent.tsx (href: null → href: "/tma/casos")
decisions:
  - "AnimatePresence dentro de tbody (no fuera de table) para evitar DOM inválido"
  - "UI optimista con backup array + rollback ante error de servidor (D-11)"
  - "Filtrado en memoria (todos los casos cargados al montar) — sin paginación ni fetch por filtro"
  - "CasoForm usa fetch a /api/casos directamente (no Server Actions — ver RESEARCH.md anti-patrón)"
metrics:
  duration: "12 min"
  completed_date: "2026-06-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 1
---

# Phase 04 Plan 04: CasosTable + CasosDashboard + CasoForm + Pages Summary

**One-liner:** Dashboard de asuntos completo — tabla con AnimatePresence y sort, formulario de creación con validación Zod client-side, y páginas Server Component protegidas con auth().

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | CasosTable.tsx + CasosDashboard.tsx | 57cb830 | CasosTable.tsx, CasosDashboard.tsx |
| 2 | CasoForm + páginas + card TmaPageContent | 0e9279f | CasoForm.tsx, casos/page.tsx, casos/nuevo/page.tsx, TmaPageContent.tsx |

## What Was Built

### CasosTable.tsx
- Tabla HTML con `AnimatePresence` en `tbody` (DOM válido)
- `motion.tr` con `exit={{ opacity: 0, height: 0 }}` para exit animation al eliminar
- Sort toggle en header "Fecha de vencimiento" con `ChevronUp`/`ChevronDown`
- Skeleton loading (5 divs `animate-pulse`)
- Estado vacío diferenciado: "Sin asuntos registrados" (sin datos) vs "Sin resultados" (filtro activo)
- `formatDate` con timezone `America/Argentina/Buenos_Aires` y heurística `T12:00:00` para fechas ISO-solo-date

### CasosDashboard.tsx
- Client Component orquestador con `"use client"`
- `useEffect` → `fetch("/api/casos")` al montar (filtrado en memoria, no SSR)
- Filtrado AND: `filterNombre.toLowerCase()` AND `filterResponsable.toLowerCase()`
- Sort por `fechaVencimiento` asc/desc tras filtrado
- UI optimista: `backup = [...casos]` → `setCasos(prev => ...)` → fetch DELETE → rollback si `!res.ok`
- `ConfirmDialog` controlado con `pendingDelete` state
- Manejo de `loadError` y `deleteError` con banners rojos

### CasoForm.tsx
- Client Component con validación Zod client-side via `casoSchema.safeParse(values)`
- Errores inline por campo (limpian al editar)
- Spinner `animate-spin` durante submit (`Guardando...`)
- `router.push("/tma/casos")` tras POST exitoso
- Manejo de error servidor genérico ("No se pudo guardar el asunto. Intentá nuevamente.")
- Placeholder "Ej: García c/ López s/ daños" en campo nombre

### Páginas Server Component
- `/tma/casos/page.tsx`: `auth()` + `redirect("/login")` + `<CasosDashboard />`
- `/tma/casos/nuevo/page.tsx`: `auth()` + `redirect("/login")` + `<CasoForm />`
- Patrón idéntico a `contratos/page.tsx` (eje T-4-08, T-4-09 del threat model)

### TmaPageContent.tsx
- Cambio puntual línea 13: `href: null` → `href: "/tma/casos"`
- El card "Casos TMA" ahora renderiza como `<Link>` con hover/tap animations (lógica ya existía)

## Verification Results

```
TypeScript (npx tsc --noEmit):
  Sin errores en archivos de casos ni en páginas /tma/casos/

Tests (TmaPageContent.test.tsx):
  Test Files  1 passed (1)
       Tests  3 passed (3)   ← GREEN
```

## Deviations from Plan

None — plan ejecutado exactamente como estaba especificado.

## Known Stubs

None — todos los componentes tienen datos reales desde /api/casos.

## Threat Flags

None — las amenazas T-4-08, T-4-09, T-4-10, T-4-11, T-4-12 del threat model del plan están mitigadas:
- T-4-08/T-4-09: `auth()` + `redirect("/login")` en ambas pages
- T-4-10: React escapa JSX automáticamente, sin `dangerouslySetInnerHTML`
- T-4-11: Doble validación Zod (client CasoForm + server /api/casos de plan 04-02)
- T-4-12: Mensajes de error genéricos en CasosDashboard y CasoForm

## Self-Check: PASSED

- [x] tma/src/components/casos/CasosTable.tsx — FOUND
- [x] tma/src/components/casos/CasosDashboard.tsx — FOUND
- [x] tma/src/components/casos/CasoForm.tsx — FOUND
- [x] tma/src/app/tma/casos/page.tsx — FOUND
- [x] tma/src/app/tma/casos/nuevo/page.tsx — FOUND
- [x] tma/src/components/TmaPageContent.tsx (modificado) — FOUND
- [x] Commit 57cb830 — Task 1 (CasosTable + CasosDashboard)
- [x] Commit 0e9279f — Task 2 (CasoForm + pages + TmaPageContent)
