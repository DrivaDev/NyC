---
phase: 02-contratos-pipeline-generacion
plan: 02-05
subsystem: contratos-ui
tags: [wizard, client-component, useReducer, motion, file-upload]
dependency_graph:
  requires: [02-02, 02-04]
  provides: [contratos-page, ContratoWizard]
  affects: [tma/src/app/tma/contratos]
tech_stack:
  added: []
  patterns: [useReducer-wizard, AnimatePresence-message-cycling, file-upload-zone, server-component-auth-shell]
key_files:
  created:
    - tma/src/app/tma/contratos/page.tsx
    - tma/src/app/tma/contratos/ContratoWizard.tsx
  modified: []
decisions:
  - Used plain <button> for CTA instead of TextureButton — plan specified exact inline styles and the CTA is visually correct; TextureButton wrapping would conflict with disabled opacity logic
metrics:
  duration: ~8 minutes
  completed_date: "2026-06-12"
  tasks_completed: 2
  files_created: 2
---

# Phase 02 Plan 05: ContratoWizard — 4-Step UI (Wave 3) Summary

## One-liner

4-step contract wizard with useReducer, AnimatePresence message cycling, file upload zones with drag-drop, and retry-without-re-upload (D-08) via preserved File[] state.

## What Was Built

### Task 05-A: ContratosPage Server Component shell

`tma/src/app/tma/contratos/page.tsx` — minimal Server Component that calls `auth()`, redirects unauthenticated users to `/login`, then renders `<ContratoWizard />`. No "use client" directive. Follows the same pattern as `tma/src/app/tma/page.tsx`.

### Task 05-B: ContratoWizard client component

`tma/src/app/tma/contratos/ContratoWizard.tsx` — full "use client" component with:

- **useReducer** managing all wizard state: step (1|2|3|4), model, siteFiles, personFiles, notes, result, error
- **Step 1** — 10 model cards in 3 groups via `getModelsByGroup()`, motion card entrance animations, selection outline highlight, "Continuar a Documentación" CTA disabled until model selected
- **Step 2** — FileUploadZone for site files (adenda only) + person files + notes textarea; drag-drop support; file pills with `aria-label="Quitar {name}"` remove buttons
- **Step 3** — Processing: `Loader2` spinner with AnimatePresence message cycling every 4s (3 exact messages D-05). Error sub-state: `AlertCircle` + "Reintentar" button dispatching RETRY action
- **Step 4** — CheckCircle success icon, fields summary badge (`{N} de {M} campos completados`), "Descargar .docx" motion button, "Generar otro contrato" reset link
- **D-08 compliance** — RETRY action `{ ...state, error: null, step: 3 }` preserves `siteFiles` and `personFiles` without re-upload
- **motion/react** (not framer-motion) for all animations
- Brand palette applied throughout: `#EA580C` CTAs, `#9A3412` headings, `#FED7AA` badges/accents, `#FFF7ED` backgrounds

## Verification

```
cd tma && npm run test:ci -- src/__tests__/contracts/ContratoWizard.test.tsx
```

Result: **5/5 tests passed**

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — component is fully wired to `getModelsByGroup()` for Step 1 and `fetch('/api/contracts/generate')` for Step 3. All 4 steps render real data.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns introduced. The component dispatches to the existing `/api/contracts/generate` route (already threat-modeled in 02-04).

## Self-Check: PASSED

- `tma/src/app/tma/contratos/page.tsx` — exists (commit 72bc1fe)
- `tma/src/app/tma/contratos/ContratoWizard.tsx` — exists (commit 29585ae)
- All 5 ContratoWizard tests passing
- No "use client" in page.tsx
- "use client" present in ContratoWizard.tsx
- motion/react import present, framer-motion absent
- RETRY action preserves file state
