---
phase: 2
slug: contratos-pipeline-generacion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD — planner fills this after plans are created | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/contratos/` — test stubs for CONTR-05, CONTR-06, CONTR-07, CONTR-08, CONTR-09, CONTR-10, CONTR-13, CONTR-15
- [ ] Shared fixtures: sample .docx buffer, mock Gemini response JSON
- [ ] vitest infrastructure already installed (Phase 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wizard 4-step navigation renders correctly | UI-06 | Visual/interactive | Open /tma/contratos, verify step transitions with motion animations |
| .docx download works in browser | CONTR-13 | Browser API (createObjectURL) | Click download, verify file opens in Word |
| No temp files persist after generation | CONTR-15 | Filesystem side-effect | Check /tmp after generation, confirm no uploaded files remain |
| Gemini completes real contract fields | CONTR-08, CONTR-09 | Requires live Gemini API + real template | Upload sample docs, verify fields filled without invented data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
