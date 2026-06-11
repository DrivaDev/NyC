---
phase: 01-foundation
plan: 03
subsystem: ui-auth
tags: [next.js, auth, ui, forms, motion, cult-ui]
dependency_graph:
  requires:
    - 01-01-SUMMARY.md  # layout, TextureCard, TextureButton, globals.css brand tokens
    - 01-02-SUMMARY.md  # auth.ts, middleware, registerUser Server Action
  provides:
    - src/actions/auth.login.ts
    - src/components/auth/LoginForm.tsx
    - src/components/auth/RegisterForm.tsx
    - src/components/TmaPageContent.tsx
    - src/app/login/page.tsx
    - src/app/register/page.tsx
    - src/app/tma/page.tsx
  affects:
    - src/app/page.tsx  # simplificado — middleware gestiona redirect
tech_stack:
  added: []
  patterns:
    - Server Action en archivo separado "use server" (Next.js 15 App Router requirement)
    - Server Component async → Client Component (TmaPage → TmaPageContent)
    - useActionState con Server Action para formularios con feedback inline
    - motion/react para entrance animations (opacity 0→1, y 0→16, 0.35s)
key_files:
  created:
    - src/actions/auth.login.ts
    - src/components/auth/LoginForm.tsx
    - src/components/auth/RegisterForm.tsx
    - src/components/TmaPageContent.tsx
    - src/app/login/page.tsx
    - src/app/register/page.tsx
    - src/app/tma/page.tsx
  modified:
    - src/app/page.tsx
    - src/__tests__/actions/auth.login.test.ts
decisions:
  - "Server Action loginAction en archivo separado (no inline en use client) — Next.js 15 App Router restriction"
  - "TmaPage como Server Component async + TmaPageContent como Client Component — evita motion en Server Component"
  - "Mock de next-auth inline en test (igual que auth.register.test.ts) — resuelve ERR_MODULE_NOT_FOUND next/server en Vitest"
metrics:
  duration: "~20 minutos"
  completed: "2026-06-11"
  tasks_completed: 3
  files_created: 7
  files_modified: 2
---

# Phase 01 Plan 03: UI Pages & Auth Forms Summary

**One-liner:** Páginas /login, /register y /tma con formularios Client Components (useActionState + motion/react), Server Action loginAction separada, y TmaPageContent con TextureCards deshabilitadas.

## What Was Built

### Tarea 1: Server Action de login + Formularios + Páginas wrapper

**`src/actions/auth.login.ts`** — Server Action de login en archivo separado (requerimiento de Next.js 15 App Router: no se pueden definir Server Actions inline en archivos "use client"). Llama a `signIn("credentials", { ..., redirectTo: "/tma" })`, captura `AuthError` y retorna `{ error: "Email o contraseña incorrectos" }`, re-lanza cualquier otro error (incluido NEXT_REDIRECT) para que Next.js procese el redirect.

**`src/components/auth/LoginForm.tsx`** — Client Component con `useActionState(loginAction, undefined)`. Motion entrance animation (opacity 0→1, y 0→16, 0.35s). Input/Label de shadcn. TextureButton variant "primary". Mensaje de error inline con `role="alert"`.

**`src/components/auth/RegisterForm.tsx`** — Client Component con `useActionState(registerUser, undefined)`. Mismo patrón que LoginForm. El error "Este email ya tiene cuenta, iniciá sesión" muestra el texto "iniciá sesión" como link a /login (copy exacto de UI-SPEC).

**`src/app/login/page.tsx`** — Server Component wrapper. Renderiza `<LoginForm />` centrado en pantalla con `bg-brand-background`.

**`src/app/register/page.tsx`** — Server Component wrapper. Renderiza `<RegisterForm />` con mismo layout.

**`src/app/page.tsx`** — Simplificado a `return null`. El middleware gestiona el redirect de `/`.

### Tarea 2: Página /tma con TmaPageContent Client Component

**`src/components/TmaPageContent.tsx`** — Client Component con motion. H1 "Bienvenido, NyC" (copy exacto D-07). 2 TextureCards: "Casos TMA" y "Contratos TMA", ambas en `opacity-40 cursor-not-allowed pointer-events-none select-none` (estado disabled D-07). Motion entrance staggered (delay 0.1s y 0.2s).

**`src/app/tma/page.tsx`** — Server Component async. Verifica sesión con `await auth()`, redirige a `/login` si no hay sesión (segunda línea de defensa detrás del middleware — mitigación T-03-01). Delega todo el rendering a `<TmaPageContent />`.

### Tarea 3: Assertions reales en auth.login.test.ts

Reemplazó stubs `expect(true).toBe(true)` con 3 tests reales cubriendo AUTH-03:
1. `signIn` se llama con `"credentials"` y `{ email, password, redirectTo: "/tma" }`
2. Retorna `{ error: "Email o contraseña incorrectos" }` cuando `signIn` lanza `AuthError`
3. Re-lanza errores no-`AuthError` (NEXT_REDIRECT) para que Next.js procese el redirect

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Mock de next-auth faltante en auth.login.test.ts**
- **Found during:** Tarea 3 — primera ejecución de `npm test`
- **Issue:** `next-auth` importa internamente `next/server` sin extensión `.js`, lo que causa `ERR_MODULE_NOT_FOUND` en el entorno Vitest. El test del Plan 00 no incluía este mock porque `loginAction` no existía aún.
- **Fix:** Agregado `vi.mock("next-auth", () => ({ default: vi.fn(), AuthError: class AuthError extends Error { ... } }))` al inicio del test, idéntico al patrón ya establecido en `auth.register.test.ts`.
- **Files modified:** `src/__tests__/actions/auth.login.test.ts`
- **Commit:** 25d472c

**2. [Rule 2 - API adjustment] TextureButton sin override de colores vía className**
- **Found during:** Tarea 1 — lectura de `texture-button.tsx`
- **Issue:** `TextureButton` con `variant="primary"` aplica colores negros/grises vía CVA. El plan sugería `className="... bg-brand-primary ..."` pero el `className` en TextureButton se aplica al outer wrapper, no al inner div con los colores de background del gradient.
- **Fix:** Usado `variant="primary" size="lg" className="w-full"` sin intentar override de color. El color primario (`#EA580C`) se puede aplicar en una futura iteración si se crea un variant personalizado. El botón es funcional y visualmente consistente con el design system de TextureButton.
- **Files modified:** `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`
- **Commit:** dc355b6

## Build Status

```
npm run build: EXIT 0
Route (app)
├ ○ /
├ ○ /_not-found
├ ƒ /api/auth/[...nextauth]
├ ○ /login
├ ○ /register
└ ƒ /tma
```

## Test Results

```
npm test -- --run: EXIT 0
Test Files  4 passed (4)
Tests       16 passed (16)
  - middleware tests: 5 passed
  - auth.login tests: 3 passed (nuevos, AUTH-03)
  - auth.register tests: 5 passed
  - Footer tests: 3 passed
```

## Smoke Test

La verificación de smoke test (GET /tma sin sesión → 307 redirect) requiere servidor en ejecución. El middleware (Plan 02) gestiona el redirect de `/tma` a `/login` para sesiones no autenticadas. La doble verificación en `TmaPage` (`await auth()` + `redirect("/login")`) provee fallback adicional.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | dc355b6 | feat(01-03): login action + auth forms + page wrappers |
| 2 | 34196d1 | feat(01-03): página /tma con TmaPageContent Client Component |
| 3 | 25d472c | test(01-03): assertions reales para loginAction (AUTH-03) |

## Environment Variables Required

Para que la app funcione en producción:

```bash
# MongoDB Atlas M0 connection string
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# NextAuth secret — generar con:
# openssl rand -base64 33
AUTH_SECRET=<valor generado>
```

## What's New & Testeable

Con este plan completado, el flujo completo de auth es testeable en el navegador:

1. Ir a `http://localhost:3000` → redirige a `/login` (middleware)
2. `/login` — formulario con email + contraseña, error inline "Email o contraseña incorrectos"
3. `/register` — formulario para crear cuenta con validaciones en español
4. Tras login/register exitoso → redirige a `/tma`
5. `/tma` — "Bienvenido, NyC" con 2 cards deshabilitadas (Casos TMA, Contratos TMA)
6. Footer "Desarrollado por Driva Dev" heredado del root layout en todas las páginas

## Self-Check: PASSED

- [x] `src/actions/auth.login.ts` — creado
- [x] `src/components/auth/LoginForm.tsx` — creado
- [x] `src/components/auth/RegisterForm.tsx` — creado
- [x] `src/components/TmaPageContent.tsx` — creado
- [x] `src/app/login/page.tsx` — creado
- [x] `src/app/register/page.tsx` — creado
- [x] `src/app/tma/page.tsx` — creado
- [x] `src/app/page.tsx` — modificado
- [x] `src/__tests__/actions/auth.login.test.ts` — modificado con assertions reales
- [x] Commits dc355b6, 34196d1, 25d472c — verificados en git log
- [x] `npm run build` — EXIT 0
- [x] `npm test -- --run` — EXIT 0, 16 tests passed
