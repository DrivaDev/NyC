---
phase: 03
slug: contratos-multi-locador
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `tma/vitest.config.ts` |
| **Quick run command** | `cd tma && npm run test:ci` |
| **Full suite command** | `cd tma && npm run test:ci` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd tma && npm run test:ci`
- **After every plan wave:** Run `cd tma && npm run test:ci`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | CONTR-11 | — | N/A | unit | `cd tma && npm run test:ci` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 0 | CONTR-12 | — | N/A | unit | `cd tma && npm run test:ci` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | CONTR-11 | — | Row clone preserves OOXML validity | unit | `cd tma && npm run test:ci` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | CONTR-12 | — | Substitution only touches nominative forms | unit | `cd tma && npm run test:ci` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | CONTR-11, CONTR-12 | — | N/A | integration | `cd tma && npm run test:ci` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tma/src/__tests__/contracts/cloneLocadorRow.test.ts` — stubs for CONTR-11
- [ ] `tma/src/__tests__/contracts/pluralizeLocador.test.ts` — stubs for CONTR-12
- [ ] `tma/src/__tests__/contracts/multiLocadorRoute.test.ts` — integration stubs

*Existing infrastructure (Vitest + pizzip fixtures) covers the base. Wave 0 adds new test stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Descarga del .docx con 2 locadores contiene ambas filas en AC PF | CONTR-11 | Requiere abrir el .docx generado en Word | Subir docs de 2 locadores, descargar, abrir en Word y verificar 2 filas de identificación |
| En Adenda con 2 locadores el texto dice "los LOCADORES" | CONTR-12 | Requiere abrir el .docx generado | Subir docs de 2 locadores con modelo Adenda, verificar que el texto legal usa plural |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
