---
phase: 02-contratos-pipeline-generacion
plan: 02-02
subsystem: contracts
tags: [contracts, xml, pizzip, ooxml, placeholder-extraction, tdd, wave-1]
dependency_graph:
  requires:
    - "pizzip@3.2.0 (02-01)"
    - "TDD RED stubs for extractPlaceholders and fillPlaceholders (02-01)"
  provides:
    - "tma/src/lib/contracts/models.ts — 10-model contract registry"
    - "tma/src/lib/contracts/extractPlaceholders.ts — OOXML highlight + label extraction"
    - "tma/src/lib/contracts/fillPlaceholders.ts — XML fill with escaping + Buffer generation"
  affects:
    - "02-03 geminiClient (Wave 1) — imports Placeholder type"
    - "02-04 generate route (Wave 2) — imports getModelById, loadTemplateXml, fillHighlightPlaceholders, generateDocxBuffer"
    - "02-06 ContratoWizard UI (Wave 2) — imports MODELS, getModelsByGroup"
tech_stack:
  added: []
  patterns:
    - "pizzip synchronous API (.asText(), .generate()) — never .async()"
    - "OOXML w:highlight w:val=yellow detection via regex over document.xml string"
    - "Reverse-order fill to preserve string indices during XML mutation"
    - "XML escape order: & first, then < > \" '"
key_files:
  created:
    - tma/src/lib/contracts/models.ts
    - tma/src/lib/contracts/extractPlaceholders.ts
    - tma/src/lib/contracts/fillPlaceholders.ts
  modified: []
decisions:
  - "Used regex-based XML parsing (not DOMParser) — avoids DOM dependency in Node.js server context"
  - "KNOWN_LABELS array in extractLabelPlaceholders preserves canonical casing for label field (matched case-insensitively)"
  - "fillLabelPlaceholders uses regex replace — sufficient for known label patterns without full XML parser"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 0
---

# Phase 02 Plan 02: Core Library — Models + XML Manipulation (Wave 1) Summary

Implement three pure TypeScript library modules: 10-model contract registry, OOXML placeholder extraction (highlight + label strategies), and placeholder fill with XML escaping and Buffer generation — all verified by 10 passing unit tests.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 02-A | Create models.ts — 10 contract definitions | 0119859 | tma/src/lib/contracts/models.ts |
| 02-B | Create extractPlaceholders.ts + fillPlaceholders.ts | d9064e8 | tma/src/lib/contracts/extractPlaceholders.ts, tma/src/lib/contracts/fillPlaceholders.ts |

## Deviations from Plan

None — plan executed exactly as written. Both files match the plan's code templates exactly, with minor additions to extractLabelPlaceholders (KNOWN_LABELS array instead of inline regex) for maintainability without behavioral change.

## Verification

All 10 tests pass across both test suites:

```
Test Files  2 passed (2)
     Tests  10 passed (10)
  Duration  2.43s
```

Test suites verified:
- `src/__tests__/contracts/extractPlaceholders.test.ts` — 5 tests
- `src/__tests__/contracts/fillPlaceholders.test.ts` — 5 tests

## must_haves Check

- [x] models.ts exports exactly 10 ContractModel items (2 ac + 8 adenda across 3 groups)
- [x] extractHighlightPlaceholders returns 2 placeholders for ADENDA_XML fixture
- [x] fillHighlightPlaceholders replaces w:t content while keeping w:highlight in output
- [x] escapeXml converts & to &amp; and < to &lt; before insertion
- [x] extractLabelPlaceholders returns items for "Nombre" and "CUIT" from AC_PF_XML
- [x] `npm run test:ci -- extractPlaceholders.test.ts` exits 0
- [x] `npm run test:ci -- fillPlaceholders.test.ts` exits 0
- [x] getModelsByGroup exported from models.ts

## Known Stubs

None — all three files are complete implementations with no hardcoded values or placeholder returns.

## Self-Check: PASSED

- [x] tma/src/lib/contracts/models.ts exists (commit 0119859)
- [x] tma/src/lib/contracts/extractPlaceholders.ts exists (commit d9064e8)
- [x] tma/src/lib/contracts/fillPlaceholders.ts exists (commit d9064e8)
- [x] All 10 tests pass
