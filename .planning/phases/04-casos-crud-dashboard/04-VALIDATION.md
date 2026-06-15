---
phase: 4
slug: casos-crud-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 + @testing-library/react 16.3.2 |
| **Config file** | `tma/vitest.config.ts` (existe) |
| **Quick run command** | `cd tma && npm test -- --run src/__tests__/casos/` |
| **Full suite command** | `cd tma && npm run test:ci` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd tma && npm test -- --run src/__tests__/casos/`
- **After every plan wave:** Run `cd tma && npm run test:ci`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| CASOS-01 | 01 | 0 | CASOS-01 | T-4-01 | POST /api/casos crea documento en DB | unit | `npm run test:ci -- src/__tests__/casos/casosRoute.test.ts` | ❌ Wave 0 | ⬜ pending |
| CASOS-02 | 01 | 0 | CASOS-02 | — | casoSchema rechaza campos vacíos | unit | `npm run test:ci -- src/__tests__/casos/casoSchema.test.ts` | ❌ Wave 0 | ⬜ pending |
| CASOS-03 | 01 | 0 | CASOS-03 | T-4-01 | GET /api/casos retorna array de casos | unit | `npm run test:ci -- src/__tests__/casos/casosRoute.test.ts` | ❌ Wave 0 | ⬜ pending |
| CASOS-04/06 | 01 | 0 | CASOS-04, CASOS-06 | — | Filtrado AND client-side por nombre+responsable | unit | `npm run test:ci -- src/__tests__/casos/casosFiltrado.test.ts` | ❌ Wave 0 | ⬜ pending |
| CASOS-05 | 01 | 0 | CASOS-05 | — | Orden por fechaVencimiento asc/desc | unit | `npm run test:ci -- src/__tests__/casos/casosFiltrado.test.ts` | ❌ Wave 0 | ⬜ pending |
| CASOS-07 | 01 | 0 | CASOS-07 | T-4-03 | DELETE /api/casos elimina + valida ObjectId | unit | `npm run test:ci -- src/__tests__/casos/casosRoute.test.ts` | ❌ Wave 0 | ⬜ pending |
| UI-04 | 01 | 0 | UI-04 | — | Card Casos TMA href="/tma/casos" | unit | `npm run test:ci -- src/__tests__/components/TmaPageContent.test.tsx` | ❌ Wave 0 | ⬜ pending |
| UI-05 | 01 | 0 | UI-05 | — | CasosSidebar renderiza 3 ítems correctos | unit | `npm run test:ci -- src/__tests__/casos/CasosSidebar.test.tsx` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tma/src/__tests__/casos/casosRoute.test.ts` — stubs para CASOS-01, CASOS-03, CASOS-07
- [ ] `tma/src/__tests__/casos/casoSchema.test.ts` — stubs para CASOS-02
- [ ] `tma/src/__tests__/casos/casosFiltrado.test.ts` — stubs para CASOS-04, CASOS-05, CASOS-06
- [ ] `tma/src/__tests__/casos/CasosSidebar.test.tsx` — stubs para UI-05
- [ ] Actualizar `tma/src/__tests__/components/TmaPageContent.test.tsx` — verificar href="/tma/casos" para UI-04

**Nota:** Seguir patrón de mocks de `generateRoute.test.ts` para mockear `connectDB` y el modelo Caso en Vitest.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar colapsable en móvil funciona visualmente | UI-05 (D-05) | Requiere browser en viewport < 768px | Abrir `/tma/casos` en DevTools mobile view, verificar hamburger aparece y sidebar anima correctamente |
| Eliminación optimista restaura fila en error | D-11 | Requiere simular error de red | En DevTools Network, bloquear `DELETE /api/casos`, confirmar eliminación, verificar que la fila reaparece |
| Footer visible en /tma/casos/nuevo | UI-03 | Ajuste visual de layout | Abrir `/tma/casos/nuevo`, scroll al final, verificar footer "Desarrollado por Driva Dev" visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
