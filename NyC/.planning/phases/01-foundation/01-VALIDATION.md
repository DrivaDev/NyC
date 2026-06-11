---
phase: 1
slug: foundation-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (none — Wave 0 installs) |
| **Config file** | none — Wave 0 installs `vitest.config.ts` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-scaffold | 01 | 1 | — | — | N/A | manual | `npm run dev` (no errors) | ❌ W0 | ⬜ pending |
| 1-auth-model | 01 | 1 | AUTH-04 | T-bcrypt | Password stored as hash, never plaintext | unit | `npm test -- bcrypt.hash` | ❌ W0 | ⬜ pending |
| 1-register-action | 01 | 2 | AUTH-01, AUTH-02 | T-allowlist | Email outside allowlist → error, no DB insert | unit | `npm test -- registerUser` | ❌ W0 | ⬜ pending |
| 1-login-action | 01 | 2 | AUTH-03 | T-credentials | Valid credentials → session; invalid → error | integration | `npm test -- auth.login` | ❌ W0 | ⬜ pending |
| 1-middleware | 01 | 2 | AUTH-06 | T-middleware | /tma without session → redirect /login | integration | `npm test -- middleware` | ❌ W0 | ⬜ pending |
| 1-footer | 02 | 1 | UI-03 | — | N/A | unit | `npm test -- Footer` | ❌ W0 | ⬜ pending |
| 1-login-page | 02 | 2 | UI-07 | — | N/A | unit | `npm test -- LoginForm` | ❌ W0 | ⬜ pending |
| 1-register-page | 02 | 2 | UI-07 | — | N/A | unit | `npm test -- RegisterForm` | ❌ W0 | ⬜ pending |
| 1-tma-placeholder | 02 | 2 | UI-01, UI-02 | — | N/A | manual | browser inspection | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom` — instalar framework de tests
- [ ] `vitest.config.ts` — configuración con environment `jsdom`
- [ ] `src/__tests__/actions/auth.register.test.ts` — stubs para AUTH-01, AUTH-02, AUTH-04
- [ ] `src/__tests__/actions/auth.login.test.ts` — stubs para AUTH-03
- [ ] `src/__tests__/middleware.test.ts` — stubs para AUTH-06
- [ ] `src/__tests__/components/Footer.test.tsx` — stubs para UI-03
- [ ] `src/__tests__/components/LoginForm.test.tsx` — stubs para UI-07
- [ ] `src/__tests__/components/RegisterForm.test.tsx` — stubs para UI-07

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Paleta Driva Dev aplicada visualmente | UI-01 | CSS visual — no checkeable con grep/test | Abrir browser → verificar bg-brand-background (#FFF7ED), botones #EA580C, títulos #9A3412 |
| Poppins cargada como fuente | UI-02 | Font loading — DevTools necesario | Abrir DevTools → Computed → font-family debe mostrar Poppins |
| Sesión persiste al refrescar | AUTH-05 | Requiere browser real + cookies | Login → refrescar F5 → seguir autenticado en /tma |
| Registro exitoso redirige a /tma automáticamente | AUTH-01 + D-04 | E2E flow — requiere browser | Registrar nuevo usuario → verificar redirect automático a /tma sin pasar por /login |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
