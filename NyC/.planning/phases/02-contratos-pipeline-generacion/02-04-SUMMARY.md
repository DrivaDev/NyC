---
phase: 02-contratos-pipeline-generacion
plan: 02-04
subsystem: contracts-pipeline
tags: [route-handler, api, contracts, gemini, security, auth]
dependency_graph:
  requires: [02-02, 02-03]
  provides: [POST /api/contracts/generate]
  affects: [wizard-step-3-fetch]
tech_stack:
  added: []
  patterns: [next-route-handler, formdata-multipart, binary-response, force-dynamic]
key_files:
  created:
    - tma/src/app/api/contracts/generate/route.ts
  modified:
    - tma/src/__tests__/contracts/generateRoute.test.ts
decisions:
  - "auth() called before formData parsing to prevent resource consumption on unauthenticated requests"
  - "Uint8Array wrapper used for docxBuffer in Response body to satisfy TypeScript BodyInit type"
  - "labelPlaceholders extracted once and reused in fillLabelPlaceholders to avoid double XML parse"
  - "fillHighlightPlaceholders re-extracts from xml for adenda (positions must be fresh for fill logic)"
metrics:
  duration: "~15 min"
  completed: "2026-06-12"
  tasks_completed: 1
  files_created: 1
  files_modified: 1
---

# Phase 02 Plan 04: Route Handler — Full Pipeline Orchestration Summary

## One-liner

POST /api/contracts/generate orchestrates auth + modelId validation + in-memory file processing + Gemini call + docx fill and returns binary .docx with X-Fields-Completed header.

## What Was Built

Single Route Handler that wires all Wave 1 library modules into the complete contract generation pipeline. The route is the only server-side entry point for the wizard's Step 3 fetch() call.

Pipeline steps implemented:
1. `export const maxDuration = 60` + `export const dynamic = "force-dynamic"` at module level
2. `auth()` called first — returns 401 if no session (T-02-01)
3. FormData parsed — modelId, notes, siteFiles[], personFiles[]
4. `getModelById(modelId)` — returns 400 if unknown (T-02-02, path traversal prevention)
5. File count capped at 20, per-file size capped at 10 MB (T-02-04 DoS protection)
6. Files processed in-memory via `processUploadedFile()` — texts and image parts collected
7. Template loaded via `loadTemplateXml(model.filename)` — filename comes from validated MODELS map only
8. Placeholders extracted by strategy: `extractHighlightPlaceholders` (adenda) or `extractLabelPlaceholders` (ac)
9. `callGemini()` called — errors sanitized before returning to client (T-02-05)
10. Placeholders filled by strategy: `fillHighlightPlaceholders` or `fillLabelPlaceholders`
11. `generateDocxBuffer()` produces binary Buffer — no fs.writeFile calls (CONTR-15)
12. Response returned with Content-Type docx, Content-Disposition, X-Fields-Completed N/M

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed fs mock missing writeFileSync in generateRoute.test.ts**
- **Found during:** Task 04-A — running tests
- **Issue:** `vi.mock("fs", ...)` only provided `readFileSync`; `vi.spyOn(fs, "writeFileSync")` threw "property not defined" because writeFileSync was absent from the mock object
- **Fix:** Added `writeFileSync: vi.fn()` to the fs mock so vi.spyOn can attach the spy
- **Files modified:** `tma/src/__tests__/contracts/generateRoute.test.ts`
- **Commit:** 72783bd

**2. [Rule 1 - Bug] TypeScript fixes on PizZip type and Buffer BodyInit**
- **Found during:** tsc --noEmit check
- **Issue 1:** `import("pizzip").default` is not a valid type reference — PizZip has no exported `default` namespace member
- **Issue 2:** `Buffer` is not assignable to `BodyInit` in the Web `Response` constructor
- **Fix 1:** Added `import PizZip from "pizzip"` at top level and typed `zip: PizZip`
- **Fix 2:** Wrapped buffer in `new Uint8Array(docxBuffer)` for Response body
- **Files modified:** `tma/src/app/api/contracts/generate/route.ts`
- **Commit:** 72783bd (same commit, pre-commit fix)

## Security Coverage

All STRIDE threats from the plan's threat model are mitigated:

| Threat | Mitigation in route |
|--------|---------------------|
| T-02-01 Elevation of Privilege | `auth()` first, 401 on null session |
| T-02-02 Tampering (path traversal) | `getModelById()` validates modelId against MODELS constant |
| T-02-03 Tampering (malicious docx) | mammoth extracts plain text only — no XML injection |
| T-02-04 DoS (file size/count) | 20-file cap + 10 MB per-file check before processing loop |
| T-02-05 Info Disclosure (API key) | Gemini errors caught and message-only sanitized before response |

## Self-Check

### Files exist
- `tma/src/app/api/contracts/generate/route.ts` — FOUND

### Commits exist
- 72783bd — FOUND

## Self-Check: PASSED
