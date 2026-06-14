---
phase: 03-contratos-multi-locador
plan: "02"
subsystem: contracts/fillPlaceholders
tags: [ooxml, multi-locador, pure-functions, tdd-green]
dependency_graph:
  requires: ["03-01"]
  provides: ["cloneLocadorRow", "pluralizeLocadorRefs"]
  affects: ["03-03", "03-04"]
tech_stack:
  added: []
  patterns: ["string-index-based OOXML manipulation", "paraId seeding for OOXML uniqueness", "word-boundary regex substitution"]
key_files:
  created: []
  modified:
    - tma/src/lib/contracts/fillPlaceholders.ts
    - tma/src/__tests__/fixtures/createFixtures.ts
decisions:
  - "Fixture AC_PF_TABLE_XML updated to use KNOWN_LABELS-compatible labels (Nombre, CUIT, Domicilio, Nacionalidad, Estado civil, Cargo, Empresa, Denominación) so extractLabelPlaceholders can count fieldCount*N entries; original fixture labels were not in KNOWN_LABELS"
  - "Both functions appended after existing exports — no existing function modified"
metrics:
  duration: "~6 minutes"
  completed: "2026-06-14T19:49:00Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 02: Implement cloneLocadorRow and pluralizeLocadorRefs Summary

Two pure XML-transform functions added to `fillPlaceholders.ts`: `cloneLocadorRow` clones the locador identification row N-1 times with fresh unique w14:paraId/textId values seeded at 0xa0000000, and `pluralizeLocadorRefs` converts nominative "el/El LOCADOR" to plural using word-boundary regex without touching "del/al LOCADOR".

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Implement cloneLocadorRow (CONTR-11) | 6bb30b9 | fillPlaceholders.ts, createFixtures.ts |
| 2 | Implement pluralizeLocadorRefs (CONTR-12) | 028a673 | fillPlaceholders.ts |

## Test Results

All 14 fillPlaceholders tests GREEN:
- 4 existing fillHighlightPlaceholders tests: PASS
- 1 generateDocxBuffer test: PASS
- 5 cloneLocadorRow (CONTR-11) tests: PASS
- 4 pluralizeLocadorRefs (CONTR-12) tests: PASS

Note: `generateRoute.test.ts` and `ContratoWizard.test.tsx` failures are expected RED tests from Plan 03-01 for features not yet implemented (Plans 03-03 and 03-04). They are not regressions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AC_PF_TABLE_XML fixture labels did not match extractLabelPlaceholders KNOWN_LABELS**
- **Found during:** Task 1 verification
- **Issue:** The fixture used labels "Nombre y Apellido", "Ciudad", "País", "Código Postal", "Número de teléfono", "Dirección de correo electrónico", "DNI/CUIT" — none of which (except "Domicilio") are in the KNOWN_LABELS list. The test `extractLabelPlaceholders on cloned XML returns fieldCount * N entries` expected 16 but got 2.
- **Fix:** Updated `AC_PF_TABLE_XML` to use 8 labels from KNOWN_LABELS: Nombre, CUIT, Domicilio, Nacionalidad, Estado civil, Cargo, Empresa, Denominación. All 8 match per row × 2 rows = 16.
- **Files modified:** `tma/src/__tests__/fixtures/createFixtures.ts`
- **Commit:** 6bb30b9

## Known Stubs

None. Both functions are complete implementations with no placeholders.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced. Both functions are pure string transforms with no I/O.

## Self-Check: PASSED

- [x] `cloneLocadorRow` exported from fillPlaceholders.ts
- [x] `pluralizeLocadorRefs` exported from fillPlaceholders.ts
- [x] Commits 6bb30b9 and 028a673 exist in git log
- [x] All 14 fillPlaceholders tests GREEN
- [x] No existing test regressions
