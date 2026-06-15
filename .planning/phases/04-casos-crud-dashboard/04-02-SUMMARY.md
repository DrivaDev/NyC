---
phase: "04-casos-crud-dashboard"
plan: "02"
subsystem: "backend/casos"
tags: [mongoose, zod, api-route, crud, auth]
dependency_graph:
  requires: ["04-01"]
  provides: ["Caso model", "casoSchema", "GET /api/casos", "POST /api/casos", "DELETE /api/casos"]
  affects: ["04-03 (frontend consuming this API)", "04-04 (dashboard reading casos)"]
tech_stack:
  added: []
  patterns: ["mongoose guard model (models.X || model(...))", "auth()-first handler pattern", "zod safeParse before DB write", "T12:00:00 timezone normalization for date strings"]
key_files:
  created:
    - tma/src/models/Caso.ts
    - tma/src/app/api/casos/route.ts
  modified:
    - tma/src/lib/validations.ts
decisions:
  - "Used new URL(request.url).searchParams instead of request.nextUrl.searchParams for DELETE — ensures compatibility with native Request in Vitest node environment while being equivalent in Next.js runtime"
  - "T12:00:00 suffix on date strings prevents off-by-one-day errors from UTC midnight timezone shift"
metrics:
  duration: "~10 min"
  completed: "2026-06-15"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 4 Plan 02: Backend Casos (Model + Validation + API Route) Summary

**One-liner:** Mongoose model ICaso con 4 campos requeridos, casoSchema Zod con mensajes en español, y Route Handler GET/POST/DELETE con auth-first y validaciones de seguridad ASVS V4.

## Artifacts Created

### tma/src/models/Caso.ts
- `ICaso` interface extends `Document` con campos: `nombre`, `fechaIngreso` (Date), `fechaVencimiento` (Date), `responsable`, `createdAt`
- Guard obligatorio: `mongoose.models.Caso || mongoose.model<ICaso>("Caso", CasoSchema)` — evita "Cannot overwrite model" en hot-reload de Next.js

### tma/src/lib/validations.ts (extendido)
- `casoSchema` exportado al final del archivo — `loginSchema` y `registerSchema` no modificados
- 4 campos validados con mensajes exactos del UI-SPEC:
  - `nombre`: "El nombre del asunto es obligatorio."
  - `fechaIngreso`: "La fecha de ingreso es obligatoria."
  - `fechaVencimiento`: "La fecha de vencimiento es obligatoria."
  - `responsable`: "El responsable es obligatorio."
- `CasoSchema` type exportado via `z.infer`

### tma/src/app/api/casos/route.ts
- `export const dynamic = "force-dynamic"` — previene caché estático de Next.js
- **GET /api/casos**: auth() primero → connectDB() → `Caso.find().sort({ fechaVencimiento: 1 }).lean()` → 200
- **POST /api/casos**: auth() primero → `casoSchema.safeParse(body)` → connectDB() → `Caso.create(result.data)` con fechas + T12:00:00 → 201
- **DELETE /api/casos**: auth() primero → `new URL(request.url).searchParams.get("id")` → `mongoose.isValidObjectId(id)` → `findByIdAndDelete(id)` → 200

## Security (Threat Model Coverage)

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-4-01: Elevation of Privilege | `auth()` como primer statement en los 3 handlers | Implementado |
| T-4-02: Tampering (POST body) | `casoSchema.safeParse()` + solo `result.data` pasa a `Caso.create()` | Implementado |
| T-4-03: Tampering (DELETE id) | `mongoose.isValidObjectId(id)` antes de `findByIdAndDelete` | Implementado |
| T-4-04: Information Disclosure | Mensajes de error genéricos (401/400/404) — aceptado | Aceptado |

## Tests

| Suite | Tests | Status |
|-------|-------|--------|
| casoSchema.test.ts (CASOS-02) | 5/5 | GREEN |
| casosRoute.test.ts (CASOS-01, 03, 07) | 8/8 | GREEN |
| **Total** | **13/13** | **GREEN** |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Compatibility] `new URL(request.url).searchParams` en lugar de `request.nextUrl.searchParams`**
- **Found during:** Task 2 — análisis del test
- **Issue:** El test de DELETE usa `new Request("http://localhost/api/casos?id=...", ...)` casteado a `NextRequest`. En el entorno Vitest node, la Request nativa no expone `nextUrl` (propiedad de NextRequest). Usar `request.nextUrl.searchParams.get("id")` habría causado `TypeError: Cannot read properties of undefined`.
- **Fix:** Se usa `new URL(request.url).searchParams.get("id")` — semánticamente equivalente en Next.js runtime y funciona correctamente en los tests.
- **Files modified:** tma/src/app/api/casos/route.ts
- **Commit:** dd4c758

## Commits

| Hash | Message | Task |
|------|---------|------|
| 509205c | feat(04-02): add Caso model and casoSchema validation | Task 1 |
| dd4c758 | feat(04-02): implement /api/casos route handler with GET, POST, DELETE | Task 2 |

## Known Stubs

None — todos los handlers conectan a MongoDB real y retornan datos reales. La capa de datos está completamente cableada.

## Threat Flags

None — no se introdujeron nuevas superficies de red más allá de las documentadas en el threat model del plan.

## Self-Check: PASSED

- tma/src/models/Caso.ts — FOUND
- tma/src/lib/validations.ts (casoSchema) — FOUND
- tma/src/app/api/casos/route.ts — FOUND
- Commit 509205c — FOUND
- Commit dd4c758 — FOUND
- 13/13 tests GREEN — VERIFIED
