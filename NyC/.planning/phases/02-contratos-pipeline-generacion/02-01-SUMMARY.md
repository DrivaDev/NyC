---
phase: 02-contratos-pipeline-generacion
plan: 02-01
subsystem: contracts
tags: [tdd, dependencies, test-stubs, wave-0, gemini, pizzip, mammoth, pdf-parse]
dependency_graph:
  requires: []
  provides:
    - "@google/generative-ai@0.24.1 installed in tma"
    - "pizzip@3.2.0 installed in tma"
    - "mammoth@1.12.0 installed in tma"
    - "pdf-parse@2.4.5 installed in tma"
    - "GEMINI_API_KEY documented in .env.example"
    - "5 TDD RED test stubs in tma/src/__tests__/contracts/"
    - "pizzip fixture generator in tma/src/__tests__/fixtures/createFixtures.ts"
  affects:
    - "02-02 extractPlaceholders implementation (Wave 1)"
    - "02-03 geminiClient implementation (Wave 1)"
    - "02-04 fillPlaceholders implementation (Wave 1)"
    - "02-05 generate route implementation (Wave 1)"
    - "02-06 ContratoWizard UI implementation (Wave 1)"
tech_stack:
  added:
    - "@google/generative-ai@0.24.1"
    - "pizzip@3.2.0"
    - "mammoth@1.12.0"
    - "pdf-parse@2.4.5"
    - "@types/pdf-parse (devDependency)"
  patterns:
    - "TDD RED phase — test stubs fail on missing imports, not syntax errors"
    - "pizzip for programmatic OOXML .docx buffer generation in tests"
    - "vi.mock for @google/generative-ai and NextAuth isolation"
key_files:
  created:
    - tma/src/__tests__/fixtures/createFixtures.ts
    - tma/src/__tests__/contracts/extractPlaceholders.test.ts
    - tma/src/__tests__/contracts/fillPlaceholders.test.ts
    - tma/src/__tests__/contracts/geminiClient.test.ts
    - tma/src/__tests__/contracts/generateRoute.test.ts
    - tma/src/__tests__/contracts/ContratoWizard.test.tsx
  modified:
    - tma/package.json
    - tma/package-lock.json
    - tma/.env.example
decisions:
  - "@types/mammoth does not exist on npm — mammoth ships bundled TypeScript types; skipped"
  - "Used @types/pdf-parse as it does exist and pdf-parse lacks bundled types"
  - "Wave 0 RED state confirmed: all 5 test files fail with import errors (modules not yet created)"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 3
---

# Phase 02 Plan 01: Dependencies + Test Stubs (Wave 0) Summary

Install 4 npm packages for Phase 2 Contratos pipeline, document GEMINI_API_KEY in .env.example, and create 5 TDD RED test stubs plus 1 fixture generator — establishing the Nyquist compliance layer that unblocks all Wave 1 parallel executors.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 01-A | Install packages + document env var | cb17e19 | package.json, package-lock.json, .env.example |
| 01-B | Create fixture generator + 5 test stubs | 4de510c | createFixtures.ts, 5x *.test.ts/tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] @types/mammoth does not exist on npm**
- **Found during:** Task 01-A
- **Issue:** `npm install --save-dev @types/mammoth @types/pdf-parse` — npm 404 on `@types/mammoth`
- **Fix:** Skipped `@types/mammoth` (mammoth ships its own bundled `.d.ts` files). Installed `@types/pdf-parse` only.
- **Files modified:** tma/package.json, tma/package-lock.json
- **Commit:** cb17e19

## Verification

All 5 test files parse without syntax errors and fail with import errors only (Wave 1 modules not yet created). This is the correct RED state:

```
Test Files  5 failed (5)
      Tests  no tests
   Start at  12:57:19
   Duration  3.32s
```

Failure mode: `Failed to resolve import "@/lib/contracts/extractPlaceholders"` — expected and correct.

## must_haves Check

- [x] `@google/generative-ai@0.24.1` in package.json dependencies
- [x] `pizzip@3.2.0` in package.json dependencies
- [x] `mammoth@1.12.0` in package.json dependencies
- [x] `pdf-parse@2.4.5` in package.json dependencies
- [x] `GEMINI_API_KEY=` present in tma/.env.example
- [x] `node -e "require('@google/generative-ai')"` exits 0
- [x] `node -e "require('pizzip')"` exits 0
- [x] 5 test files exist in tma/src/__tests__/contracts/
- [x] fixture generator exists at tma/src/__tests__/fixtures/createFixtures.ts

## Known Stubs

None — this plan IS the stub creation plan. The 5 test files are intentional stubs that Wave 1 plans will satisfy.

## Self-Check: PASSED
