---
phase: 04-casos-crud-dashboard
plan: "01"
subsystem: casos-tdd-red
tags: [tdd, testing, vitest, red-phase, casos]
dependency_graph:
  requires: []
  provides:
    - test-specs/casosRoute
    - test-specs/casoSchema
    - test-specs/casosFiltrado
    - test-specs/CasosSidebar
    - test-specs/TmaPageContent
  affects:
    - tma/src/__tests__/casos/
    - tma/src/__tests__/components/TmaPageContent.test.tsx
tech_stack:
  added: []
  patterns:
    - vitest-environment node (directiva en línea 1 para route tests)
    - vi.mock dinámico con await import para módulos de producción
    - mocks de MongoDB/Mongoose aislados por test
    - lógica pura testada sin montar DOM
key_files:
  created:
    - tma/src/__tests__/casos/casosRoute.test.ts
    - tma/src/__tests__/casos/casoSchema.test.ts
    - tma/src/__tests__/casos/casosFiltrado.test.ts
    - tma/src/__tests__/casos/CasosSidebar.test.tsx
    - tma/src/__tests__/components/TmaPageContent.test.tsx
  modified: []
decisions:
  - casosFiltrado.test.ts usa lógica inline (no importa módulo externo) — permite GREEN inmediato para validar el patrón de filtrado antes de implementar el componente
  - CasosSidebar.test.tsx mockea motion/react y next/navigation igual que Footer.test.tsx — consistencia con tests existentes
  - TmaPageContent.test.tsx espera href='/tma/casos' como RED — activa el contrato que Wave 1 debe satisfacer
metrics:
  duration: "8 minutos"
  completed_date: "2026-06-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 0
---

# Phase 4 Plan 01: TDD Red Phase — Specs de Casos Summary

**One-liner:** 5 archivos de test que definen el contrato completo del módulo Casos antes de escribir una línea de producción.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Test stubs de route y schema | d20707a | casosRoute.test.ts, casoSchema.test.ts |
| 2 | Test stubs de filtrado, sidebar y TmaPageContent | d21d57a | casosFiltrado.test.ts, CasosSidebar.test.tsx, TmaPageContent.test.tsx |

## Test Status (Wave 0 — RED phase)

| Archivo | Estado | Razón del fallo |
|---------|--------|-----------------|
| casosRoute.test.ts | RED | ERR_MODULE_NOT_FOUND: @/app/api/casos/route no existe aún |
| casoSchema.test.ts | RED | casoSchema no exportado en @/lib/validations (undefined.safeParse) |
| casosFiltrado.test.ts | **GREEN** | Lógica pura inline — no depende de módulos externos (7/7 tests) |
| CasosSidebar.test.tsx | RED | Cannot find module @/components/casos/CasosSidebar |
| TmaPageContent.test.tsx | RED (1/3) | href de "Casos TMA" es null en TmaPageContent.tsx actual |

## Comportamiento correcto de TmaPageContent.test.tsx

El test verifica que el card "Casos TMA" tenga `href="/tma/casos"`. Actualmente el módulo tiene `href: null` para ese card (Phase 4 lo activa). El test pasa parcialmente:
- Renderiza el card "Casos TMA": PASS
- href="/tma/casos": FAIL (href=null — RED esperado, Wave 1 activa el href)
- Contratos TMA href="/tma/contratos": PASS

## Mocks usados

- `@/auth`: `vi.fn().mockResolvedValue({ user: { email: "nsilva@nyc.com.ar" } })` — patrón idéntico a generateRoute.test.ts
- `@/lib/mongodb`: `connectDB` mockeado a `undefined` — sin conexión real
- `@/models/Caso`: objeto con `.find().sort().lean()`, `.create()`, `.findByIdAndDelete()` — cadena fluent completa
- `mongoose.isValidObjectId`: mockeado a `true` por defecto, `false` en test puntual
- `motion/react`: reemplazado por elementos HTML planos — patrón de Footer.test.tsx
- `next/navigation`: `usePathname` y `useRouter` mockeados

## Deviations from Plan

None — plan ejecutado exactamente como se especificó.

## Self-Check: PASSED

- [x] tma/src/__tests__/casos/casosRoute.test.ts — existe
- [x] tma/src/__tests__/casos/casoSchema.test.ts — existe
- [x] tma/src/__tests__/casos/casosFiltrado.test.ts — existe (7/7 GREEN)
- [x] tma/src/__tests__/casos/CasosSidebar.test.tsx — existe
- [x] tma/src/__tests__/components/TmaPageContent.test.tsx — existe
- [x] Commit d20707a (Task 1) — verificado en git log
- [x] Commit d21d57a (Task 2) — verificado en git log
- [x] casosRoute.test.ts línea 1: "// @vitest-environment node" — verificado
- [x] casoSchema.test.ts contiene "El nombre del asunto es obligatorio." — verificado
- [x] casosFiltrado.test.ts pasa GREEN — verificado (npm run test:ci output)
