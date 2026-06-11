---
phase: 01-foundation
plan: "00"
subsystem: testing-infrastructure
tags: [vitest, testing, wave-0, stubs, auth, middleware]
dependency_graph:
  requires: []
  provides:
    - vitest-config
    - auth-register-stubs
    - auth-login-stubs
    - middleware-stubs
  affects:
    - 01-02-plan
    - 01-03-plan
tech_stack:
  added:
    - vitest@4.1.8
    - "@vitejs/plugin-react@6.0.2"
    - "@testing-library/react@16.3.2"
    - "@testing-library/jest-dom@6.9.1"
    - jsdom@29.1.1
  patterns:
    - vi.mock() para aislar dependencias antes de existir implementaciones
    - stubs con expect(true).toBe(true) para estado RED listo
key_files:
  created:
    - tma/src/__tests__/actions/auth.register.test.ts
    - tma/src/__tests__/actions/auth.login.test.ts
    - tma/src/__tests__/middleware.test.ts
  modified:
    - tma/vitest.config.ts
    - tma/package.json
decisions:
  - "Stubs usan expect(true).toBe(true) para pasar en verde — las implementaciones reales se agregan cuando exista el código de producción en planes 01-02 y 01-03"
  - "Footer.test.tsx ya existia con assertions reales (creado por plan 01-01) — no se sobreescribio"
  - "vitest.config.ts ya existia con la configuracion correcta — sin cambios necesarios"
metrics:
  duration: "5 minutos"
  completed_date: "2026-06-11"
requirements_covered:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - AUTH-06
  - UI-03
---

# Phase 01 Plan 00: Vitest Wave 0 — Infraestructura de Testing

**One-liner:** Vitest 4.1.8 con jsdom + alias @/, 4 archivos de test stub (13 tests en verde) listos para que planes 01-02 y 01-03 implementen assertions reales.

## What Was Built

Configuracion de Vitest con soporte React + JSDOM y 3 archivos de test stub para las acciones de autenticacion y middleware. El cuarto archivo de test (Footer.test.tsx) ya existia con assertions reales gracias al plan 01-01.

### Resultado de `npm test -- --run`

```
Test Files  4 passed (4)
     Tests  13 passed (13)
  Duration  3.86s
```

### Vitest version instalada

`vitest@4.1.8`

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Verificar configuracion Vitest (ya existia) | `23a441a` | vitest.config.ts, package.json |
| 2 | Crear 3 archivos de test stub | `56dee45` | auth.register.test.ts, auth.login.test.ts, middleware.test.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Contexto previo] vitest.config.ts ya existia con configuracion correcta**
- **Found during:** Task 1
- **Issue:** El plan 01-01 ya habia instalado Vitest y creado vitest.config.ts con jsdom, alias @/, y setupFiles
- **Fix:** Verificado que la configuracion satisface todos los criterios de aceptacion — sin cambios necesarios
- **Impact:** Ninguno — la config era correcta

**2. [Rule 3 - Contexto previo] Footer.test.tsx ya existia con assertions reales**
- **Found during:** Task 2
- **Issue:** El plan 01-01 habia creado Footer.test.tsx con tests reales (no stubs) que importan el componente Footer real
- **Fix:** No sobreescribir — conservar la implementacion real existente
- **Impact:** El plan tenia stubs para Footer, pero la implementacion real es mejor. Se crearon solo los 3 stubs faltantes.

## Files Created/Modified

### Created
- `tma/src/__tests__/actions/auth.register.test.ts` — 4 stubs para AUTH-01, AUTH-02, AUTH-04
- `tma/src/__tests__/actions/auth.login.test.ts` — 2 stubs para AUTH-03
- `tma/src/__tests__/middleware.test.ts` — 4 stubs para AUTH-06

### Already existing (not modified)
- `tma/vitest.config.ts` — configuracion jsdom + alias @/ (creada por plan 01-01)
- `tma/src/__tests__/components/Footer.test.tsx` — tests reales para UI-03 (creada por plan 01-01)

## Known Stubs

Los archivos de test contienen stubs intencionales documentados:

| File | Stub description | Plan to resolve |
|------|-----------------|-----------------|
| auth.register.test.ts | 4 tests con expect(true).toBe(true) | Plan 01-02 (al crear registerUser action) |
| auth.login.test.ts | 2 tests con expect(true).toBe(true) | Plan 01-03 (al crear loginAction) |
| middleware.test.ts | 4 tests con expect(true).toBe(true) | Plan 01-02 (al crear middleware.ts) |

Estos stubs son **intencionales** — establecen la infraestructura RED lista para que los executores de planes 01-02 y 01-03 implementen las assertions reales una vez que exista el codigo de produccion.

## Self-Check: PASSED

- [x] `tma/vitest.config.ts` existe con jsdom y alias @/
- [x] `tma/src/__tests__/actions/auth.register.test.ts` existe con describe AUTH-01/02/04
- [x] `tma/src/__tests__/actions/auth.login.test.ts` existe con describe AUTH-03
- [x] `tma/src/__tests__/middleware.test.ts` existe con describe AUTH-06
- [x] `tma/src/__tests__/components/Footer.test.tsx` existe con describe UI-03
- [x] `npm test -- --run` sale con codigo 0 (13 tests, 4 archivos)
- [x] Commits `23a441a` y `56dee45` existen en git log
