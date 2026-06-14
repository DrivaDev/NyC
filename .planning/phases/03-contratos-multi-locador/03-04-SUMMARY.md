---
phase: 03-contratos-multi-locador
plan: "04"
subsystem: contracts-generation
tags: [multi-locador, route-handler, gemini, ooxml, orchestration]
dependency_graph:
  requires: ["03-02", "03-03"]
  provides: ["03-05"]
  affects: ["tma/src/app/api/contracts/generate/route.ts"]
tech_stack:
  added: []
  patterns:
    - "Promise.all for N parallel Gemini calls (AC branch)"
    - "locadorFileSets: File[][] per-locador file isolation"
    - "Local id remapping lph_0..fieldCount-1 per Gemini call"
    - "vitest-environment node annotation for Request.formData() + Blob compat"
key_files:
  modified:
    - tma/src/app/api/contracts/generate/route.ts
    - tma/src/__tests__/contracts/generateRoute.test.ts
decisions:
  - "Promise.all for parallel N Gemini calls (within 60s maxDuration, <=10 locadores)"
  - "vitest-environment node annotation fixes JSDOM webidl.is.File assertion failure on Blob FormData"
  - "processFiles() helper extracted at module level to avoid duplication between AC and Adenda branches"
metrics:
  duration_minutes: 35
  tasks_completed: 2
  files_modified: 2
  completed_date: "2026-06-14"
---

# Phase 03 Plan 04: Route Multi-locador Orchestration Summary

**One-liner:** Route extended with per-locador FormData parsing, N-parallel Gemini calls for AC (cloneLocadorRow), and single concatenated call for Adenda (pluralizeLocadorRefs), with total-file DoS cap.

## What Was Built

Extended `POST /api/contracts/generate` to orchestrate multi-locador contract generation:

1. **FormData parsing (Task 1):** `locadorCount` parsed and clamped to 1..10; `personFiles_i` collected as `locadorFileSets: File[][]`; total files across all locadores + siteFiles capped at 20 → 400; `processFiles()` helper extracted for reuse across both branches.

2. **AC branch (CONTR-11):** `cloneLocadorRow(xml, locadorCount)` to duplicate the locador identification row; `extractLabelPlaceholders` re-run on cloned XML to get `fieldCount*N` labels; `Promise.all` fires N Gemini calls each with local id remapping (`lph_0..fieldCount-1`), results mapped back to absolute ids; `fillLabelPlaceholders` once with merged values.

3. **Adenda branch (CONTR-12):** `pluralizeLocadorRefs(xml)` applied before extraction when `locadorCount > 1` (D-08); single `callGemini` with all locadores' files concatenated (D-09); `fillHighlightPlaceholders` once.

4. **Single-locador path unchanged:** AC branch with N=1 → `cloneLocadorRow` no-op, 1 Gemini call; Adenda with N=1 → `pluralizeLocadorRefs` not called. Byte-identical to Phase 2 behavior.

5. **`generateDocxBuffer` called exactly once** (Pitfall 5 compliance) after both branches complete.

## Test Results

All 9 route tests GREEN:
- 4 new multi-locador tests (CONTR-11, CONTR-12): AC cloneLocadorRow x2, AC callGemini x2, Adenda pluralize, Adenda callGemini x1
- 5 existing Phase 2 tests: 401, 400 bad modelId, 200 binary, no fs.writeFileSync, 400 >20 files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] JSDOM webidl.is.File assertion fails for Blob+filename in Request.formData()**
- **Found during:** Task 2 verification (npm test run)
- **Issue:** JSDOM 29.1.1 environment uses undici's webidl validation for `Request.formData()`. When a `FormData` entry is created via `fd.append(name, blob, filename)`, undici validates each part with `assert(typeof value === "string" || webidl.is.File(value))`. The `Blob` from JSDOM's global scope does NOT pass `webidl.is.File` (which checks undici's internal `File` constructor). This caused ALL multi-locador tests to get a 400 "FormData inválido" response — the route threw at `request.formData()` before any logic.
- **Fix:** Added `// @vitest-environment node` annotation at the top of `generateRoute.test.ts`. Node environment uses native undici globals where `new Blob([...], type)` passed with a filename creates a proper `File`-compatible entry that passes webidl validation.
- **Files modified:** `tma/src/__tests__/contracts/generateRoute.test.ts`
- **Commit:** 330df5b

## Known Stubs

None — route fully wired. All branches produce real document output.

## Threat Flags

No new network endpoints or auth paths introduced. Existing mitigations from the threat model were applied:
- T-03-07: `locadorCount` clamped 1..10; total files capped at 20; per-file 10MB cap in `processFiles()`
- T-03-08: `Promise.all` used for parallel Gemini calls within 60s maxDuration
- T-03-09: `auth()` check runs before any FormData parsing (unchanged)
- T-03-10: `getModelById` allowlist check unchanged

## Self-Check: PASSED

- `tma/src/app/api/contracts/generate/route.ts` exists and contains `locadorCount`, `cloneLocadorRow`, `pluralizeLocadorRefs`, `Promise.all`
- Commits 99ac8d5 and 330df5b exist in git log
- All 55 tests pass (9 route + 46 other)
