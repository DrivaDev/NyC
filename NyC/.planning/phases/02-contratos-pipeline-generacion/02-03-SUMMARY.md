---
phase: 02-contratos-pipeline-generacion
plan: 02-03
subsystem: contracts-ai-extraction
tags: [gemini, mammoth, pdf-parse, file-extraction, ai-integration]
dependency_graph:
  requires: [02-01]
  provides: [geminiClient, extractDocText]
  affects: [02-04, 02-05]
tech_stack:
  added: ["@google/generative-ai", "mammoth", "pdf-parse"]
  patterns: ["Gemini JSON mode with responseMimeType", "in-memory file extraction", "1-retry on 429"]
key_files:
  created:
    - tma/src/lib/contracts/geminiClient.ts
    - tma/src/lib/contracts/extractDocText.ts
  modified:
    - tma/src/__tests__/contracts/geminiClient.test.ts
decisions:
  - "gemini-2.0-flash with responseMimeType: application/json ensures structured JSON output without post-processing"
  - "1-retry with 2s delay on 429/RESOURCE_EXHAUSTED before surfacing to caller"
  - "encodeImageToBase64Part returns raw base64 data only (no data:image prefix) as required by Gemini SDK inlineData"
  - "processUploadedFile is the unified dispatcher for all 4 supported MIME types"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-12"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 02 Plan 03: Gemini Client + Doc Extraction Helpers Summary

## One-liner

Gemini API wrapper (gemini-2.0-flash, JSON mode, 429-retry) and in-memory file extraction helpers (mammoth for docx, pdf-parse for PDF, base64 for images) — all 3 tests passing.

## Tasks Completed

| Task  | Name                    | Commit  | Key Files                                    |
|-------|-------------------------|---------|----------------------------------------------|
| 03-A  | Create geminiClient.ts  | 46a3f35 | tma/src/lib/contracts/geminiClient.ts        |
| 03-B  | Create extractDocText.ts| b137394 | tma/src/lib/contracts/extractDocText.ts      |

## What Was Built

### geminiClient.ts

- `buildPrompt(placeholders, extractedTexts, notes)`: builds a Spanish-language prompt for Argentine legal contracts, listing all placeholder IDs with their field context and all extracted document text. Instructs Gemini "NUNCA inventes" — no invented data.
- `callGemini(placeholders, extractedTexts, imageParts, notes)`: calls Gemini `gemini-2.0-flash` with `generationConfig: { responseMimeType: "application/json" }`, parses the JSON response into `Record<string, string>`. Implements one retry after 2000ms on `429`/`RESOURCE_EXHAUSTED` errors before re-throwing.
- Reads `GEMINI_API_KEY` from `process.env` — never logged or returned to client.

### extractDocText.ts

- `extractDocxText(buffer)`: uses `mammoth.extractRawText({ buffer })` to extract plain text from .docx buffers. Returns empty string on error (non-fatal).
- `extractPdfText(buffer)`: uses `pdf-parse(buffer)` to extract text from PDF buffers. Node.js only (not Edge runtime). Returns empty string on error.
- `encodeImageToBase64Part(buffer, mimeType)`: returns `{ inlineData: { mimeType, data } }` where `data` is raw base64 via `buffer.toString("base64")` — no `"data:image/...;base64,"` prefix, as required by Gemini SDK.
- `processUploadedFile(file)`: unified dispatcher for all 4 supported MIME types (image/jpeg, image/png, application/pdf, application/vnd.openxmlformats-...). Returns `{ type: "text", text }` or `{ type: "image", part }` or `null` for unsupported types.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vitest constructor mock for GoogleGenerativeAI**
- **Found during:** Task 03-A test run
- **Issue:** Wave 0 stub test used `vi.fn().mockImplementation(() => ({...}))` with an arrow function for `GoogleGenerativeAI`. In vitest ESM mode, arrow functions cannot be called as constructors (`new GoogleGenerativeAI(...)`), resulting in "is not a constructor" TypeError.
- **Fix:** Changed test mock to use a regular `function` keyword: `vi.fn().mockImplementation(function () { return {...} })`. This satisfies vitest's requirement for constructable mocks.
- **Files modified:** `tma/src/__tests__/contracts/geminiClient.test.ts`
- **Commit:** 46a3f35

## Verification Results

```
Test Files  1 passed (1)
Tests  3 passed (3)
```

All acceptance criteria met:
- `gemini-2.0-flash` hardcoded in model config
- `responseMimeType: "application/json"` in generationConfig
- `GEMINI_API_KEY` read from `process.env`
- `buildPrompt` exports verified via test assertion on prompt content
- `NUNCA inventes` no-invention instruction present in prompt
- `mammoth` and `pdf-parse` imported and used
- `buffer.toString("base64")` used for image encoding — no `data:image` prefix in executable code
- `processUploadedFile` handles all 4 MIME types

## Known Stubs

None — all functions are fully implemented with real logic.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes introduced. `GEMINI_API_KEY` is read server-side only and never exposed to client.

## Self-Check: PASSED

- [x] `tma/src/lib/contracts/geminiClient.ts` exists
- [x] `tma/src/lib/contracts/extractDocText.ts` exists
- [x] Commits 46a3f35 and b137394 present in git log
- [x] All 3 tests pass
