---
plan: 03-03
phase: 03-contratos-multi-locador
status: complete
completed: 2026-06-14
key-files:
  created: []
  modified:
    - tma/src/app/tma/contratos/ContratoWizard.tsx
commits:
  - "4cc4313: feat(03-03): extend ContratoWizard with multi-locador step 2 UI"
self-check: PASSED
---

# Plan 03-03 Summary — ContratoWizard Multi-locador UI

## What was built

Extended `ContratoWizard.tsx` to support N locadores in step 2 (Documentación), per D-01/D-02/D-03 from `03-CONTEXT.md`.

### State changes
- Replaced `personFiles: File[]` with `locadores: LocadorEntry[]` in `WizardState`
- `LocadorEntry`: `{ id: string; files: File[]; open: boolean }` — local React key, files, collapsible state
- Four new reducer actions: `ADD_LOCADOR`, `REMOVE_LOCADOR`, `SET_LOCADOR_FILES`, `TOGGLE_LOCADOR`
- `RESET` creates a fresh `crypto.randomUUID()` for the initial locador to avoid stale shared reference

### FormData changes
- `handleGenerate` now appends `locadorCount` (string) and `personFiles_${i}` per locador
- `siteFiles` append unchanged (Adenda only)

### UI changes (step 2)
- Single "Personas relacionadas" FileUploadZone replaced with "Locadores" section
- "+ Agregar locador" button (CTA #EA580C) adds new collapsible locador
- Each locador renders as a card with toggle button ("▾ Locador N") and "−" remove button
- Remove button hidden when only 1 locador (state.locadores.length > 1 guard)
- AnimatePresence + motion.div: smooth opacity+height animation on add/remove
- `step2RequiredFulfilled`: `allLocadoresFilled = state.locadores.every(l => l.files.length > 0)`
- Adenda still requires `siteFiles.length > 0 && allLocadoresFilled`

### Processing messages
- `processingMessages` computed dynamically: if `model.type === "ac" && locadores.length > 1`, generates per-locador messages ("Analizando documentación del Locador 1...", "Completando datos del Locador 1...", etc.)
- Falls back to static `PROCESSING_MESSAGES` for single-locador or Adenda

## Tests
All Plan 03-01 wizard RED tests should turn GREEN with this implementation:
- "+ Agregar locador" button present in step 2
- "Locador 2" appears after clicking add
- "Generar contrato" disabled until all locadores have files

## Deviations
None — implementation follows plan exactly.
