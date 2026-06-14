---
phase: 03-contratos-multi-locador
plan: 01
subsystem: testing
tags: [vitest, tdd, ooxml, multi-locador, fixtures]

# Dependency graph
requires:
  - phase: 02-contratos-pipeline
    provides: fillPlaceholders.ts, extractPlaceholders.ts, generateRoute.ts, ContratoWizard.tsx test patterns

provides:
  - AC_PF_TABLE_XML fixture (minimal OOXML with one w:tbl/w:tr, 8 yellow-highlighted label paragraphs, unique w14:paraId)
  - ADENDA_LOCADOR_XML fixture (prose with el/El/del/al LOCADOR forms)
  - createAcPfTableFixture() builder function
  - 5 RED tests for cloneLocadorRow (CONTR-11)
  - 4 RED tests for pluralizeLocadorRefs (CONTR-12)
  - 1 RED test for multi-locador lph_ id sequencing across cloned rows
  - 5 RED tests for multi-locador route (locadorCount, N Gemini calls, DoS cap)
  - 3 RED tests for multi-locador wizard UI (Agregar locador button, Locador 2, disabled state)

affects: [03-02, 03-03, 03-04, 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED scaffold: tests written against unimplemented functions to lock API contract before implementation"
    - "Fixture-first: AC_PF_TABLE_XML models real OOXML table structure with unique w14:paraId per paragraph"
    - "Word-boundary guard: pluralizeLocadorRefs tests verify del/al LOCADOR not modified (Pitfall 3)"

key-files:
  created: []
  modified:
    - tma/src/__tests__/fixtures/createFixtures.ts
    - tma/src/__tests__/contracts/fillPlaceholders.test.ts
    - tma/src/__tests__/contracts/extractPlaceholders.test.ts
    - tma/src/__tests__/contracts/generateRoute.test.ts
    - tma/src/__tests__/contracts/ContratoWizard.test.tsx

key-decisions:
  - "Fixtures declared as const XML strings (not built from JS) to match existing createFixtures.ts pattern"
  - "generateRoute mock updated: extractLabelPlaceholders returns 8 label placeholders to reflect AC PF structure"
  - "DoS cap test (T-03-01): 21 files across 2 locadores asserts 400 response"

patterns-established:
  - "Pattern: cloneLocadorRow(xml, N) signature locked — N-1 clones inserted before </w:tbl>"
  - "Pattern: pluralizeLocadorRefs(xml) uses word-boundary regex to protect del/al LOCADOR"
  - "Pattern: locadorCount FormData field drives N Gemini calls for AC, 1 for Adenda"

requirements-completed: [CONTR-11, CONTR-12]

# Metrics
duration: 20min
completed: 2026-06-14
---

# Phase 3 Plan 01: Wave 0 TDD Scaffold Summary

**Failing test suite locking the API contracts for cloneLocadorRow (CONTR-11) and pluralizeLocadorRefs (CONTR-12) across fixtures, fill, extract, route, and wizard layers**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-14T19:32:00Z
- **Completed:** 2026-06-14T19:52:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- AC_PF_TABLE_XML fixture with 8 yellow-highlighted label paragraphs and unique w14:paraId per element, ready for cloneLocadorRow unit tests
- ADENDA_LOCADOR_XML fixture with all four LOCADOR forms (el/El/del/al) for word-boundary regression coverage
- 18 new RED tests across 4 test files; 16 existing tests remain GREEN (no regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add AC_PF_TABLE_XML fixture** - `e01687b` (feat)
2. **Task 2: Add RED tests for cloneLocadorRow and pluralizeLocadorRefs** - `794a784` (test)
3. **Task 3: Add RED tests for multi-locador route and wizard UI** - `411b6b5` (test)

## Files Created/Modified

- `tma/src/__tests__/fixtures/createFixtures.ts` - Added AC_PF_TABLE_XML, ADENDA_LOCADOR_XML constants and createAcPfTableFixture() builder; extended exports
- `tma/src/__tests__/contracts/fillPlaceholders.test.ts` - Added import of new fixtures; 5 RED tests for cloneLocadorRow, 4 RED tests for pluralizeLocadorRefs
- `tma/src/__tests__/contracts/extractPlaceholders.test.ts` - Added import of AC_PF_TABLE_XML; 1 RED test for sequential lph_ id assignment across cloned rows
- `tma/src/__tests__/contracts/generateRoute.test.ts` - Updated mocks (8 label placeholders, cloneLocadorRow/pluralizeLocadorRefs spies); 5 RED multi-locador route tests
- `tma/src/__tests__/contracts/ContratoWizard.test.tsx` - Added 3 RED multi-locador step 2 UI tests

## Decisions Made

- Used `const` XML strings for fixtures rather than programmatic builders — matches existing ADENDA_XML/AC_PF_XML pattern in createFixtures.ts
- extractLabelPlaceholders mock in generateRoute.test.ts updated to return 8 entries (reflecting real AC PF field count) so route branch tests are realistic
- DoS cap test (T-03-01 from threat model) included in route tests — 21 files across 2 locadores must return 400

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — this plan creates no production code. All files are test-only.

## Threat Flags

None — no new production surface introduced. Tests validate T-03-01 (DoS cap) mitigation.

## TDD Gate Compliance

This plan is Wave 0 (RED only). No GREEN or REFACTOR gate expected here.

- RED gate: All test commits use `test(03-01):` prefix. Suite confirms 18 new tests fail as expected.
- GREEN gate: Will be established in Plan 03-02 (cloneLocadorRow implementation) and Plan 03-03 (route + wizard implementation).

## Next Phase Readiness

- Plans 03-02 through 03-05 can proceed: test contracts are locked and will verify GREEN state after implementation
- Wave 1 (Plan 03-02) can implement cloneLocadorRow and pluralizeLocadorRefs and run `npm test -- --run contracts/fillPlaceholders` to confirm GREEN
- Wave 2 (Plan 03-03) will extend route.ts and ContratoWizard.tsx against the locked RED tests

---
*Phase: 03-contratos-multi-locador*
*Completed: 2026-06-14*
