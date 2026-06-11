---
phase: 01-foundation
plan: "02"
subsystem: auth
tags: [nextauth-v5, mongodb, mongoose, bcryptjs, zod, edge-proxy, server-actions]
dependency_graph:
  requires:
    - 01-01-SUMMARY.md (Next.js scaffold + Vitest setup)
  provides:
    - src/auth.ts (NextAuth v5 config, JWT strategy, timing-safe authorize)
    - src/proxy.ts (route protection + root redirect)
    - src/models/User.ts (Mongoose User schema)
    - src/lib/mongodb.ts (connectDB with global caching)
    - src/lib/validations.ts (Zod loginSchema + registerSchema)
    - src/actions/auth.register.ts (Server Action with allowlist + auto-login)
    - src/app/api/auth/[...nextauth]/route.ts (NextAuth handlers)
  affects:
    - All authenticated routes (/tma/*) — now protected by proxy
    - MongoDB Atlas users collection (schema defined)
tech_stack:
  added:
    - next-auth@beta (v5.0.0-beta.31) — already installed, now configured
    - bcryptjs@3 — already installed, now used for hashing + timing-safe compare
    - mongoose@9 — already installed, now used via User model + connectDB
    - zod@4 — already installed, now used for login/register validation
  patterns:
    - NextAuth v5 Credentials Provider with authorize callback
    - JWT session strategy (no DB sessions — Atlas M0 connection limits)
    - Global mongoose caching (prevents connection exhaustion on serverless)
    - Timing-safe password comparison (dummyHash anti-enumeration)
    - NEXT_REDIRECT re-throw pattern for Server Action auto-login
    - Next.js 16 proxy.ts convention (middleware.ts deprecated)
key_files:
  created:
    - tma/src/auth.ts
    - tma/src/proxy.ts
    - tma/src/models/User.ts
    - tma/src/lib/mongodb.ts
    - tma/src/lib/validations.ts
    - tma/src/actions/auth.register.ts
    - tma/src/app/api/auth/[...nextauth]/route.ts
  modified:
    - tma/src/__tests__/actions/auth.register.test.ts (stubs → real assertions)
    - tma/src/__tests__/middleware.test.ts (stubs → real assertions)
    - tma/vitest.config.ts (next/server alias for ESM resolution)
decisions:
  - "Lazy MONGODB_URI check inside connectDB() — not at module load — prevents Next.js build failure when env var not set during static generation"
  - "proxy.ts over middleware.ts — Next.js 16 deprecates the middleware file convention; renamed per docs"
  - "Mock next-auth in Vitest — next-auth/lib/env.js imports 'next/server' without .js, incompatible with Vitest ESM resolver; mock prevents loading"
  - "User.findOne().lean() mock chain — production code uses .lean() for plain objects; test mocks must return { lean: fn } not plain values"
  - "AuthError from next-auth in auth.ts — use AuthError instead of bare Error for type-safe error handling in authorize callback"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-11"
  tasks_completed: 3
  tasks_total: 3
  files_created: 7
  files_modified: 3
---

# Phase 1 Plan 2: Auth Layer Implementation Summary

**One-liner:** NextAuth v5 Credentials Provider with JWT strategy, timing-safe bcryptjs dummyHash, 5-email allowlist enforced before DB, and Next.js 16 proxy.ts route protection.

## What Was Built

Complete authentication infrastructure for the TMA internal app:

1. **`src/auth.ts`** — NextAuth v5 config with Credentials Provider. Implements timing-safe authorize callback: always runs `bcryptjs.compare` even when user doesn't exist (dummyHash prevents timing-based email enumeration — T-02-01 mitigated). Exports `{ handlers, signIn, signOut, auth }`.

2. **`src/lib/mongodb.ts`** — `connectDB()` with global mongoose caching pattern. Lazy `MONGODB_URI` check deferred to function call time (not module load) to avoid build failures in static generation contexts.

3. **`src/lib/validations.ts`** — Zod schemas: `loginSchema` (min 1 password), `registerSchema` (min 8 password per D-03).

4. **`src/models/User.ts`** — Mongoose User schema with `email` (unique, lowercase, trimmed) and `passwordHash` (never `password`). AUTH-04 satisfied.

5. **`src/actions/auth.register.ts`** — Server Action with: (1) Zod validation, (2) allowlist check BEFORE DB query (T-02-03 mitigated), (3) duplicate email check, (4) bcrypt hash cost 12, (5) auto-login via `signIn("credentials", { redirectTo: "/tma" })` with NEXT_REDIRECT re-throw pattern.

6. **`src/proxy.ts`** — Route protection using NextAuth's `auth()` wrapper. Protects `/tma/*`, redirects `/` based on session state. Edge-compatible (no mongoose imports).

7. **`src/app/api/auth/[...nextauth]/route.ts`** — One-liner handler export.

## Tests (15 passing)

- `auth.register.test.ts`: 5 real assertions — allowlist rejection, no-DB-on-unauthorized-email, user creation, passwordHash-only storage, duplicate email error
- `middleware.test.ts`: 5 real assertions — routing logic for AUTH-05 and AUTH-06
- All previous tests (Footer, auth.login) still passing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MONGODB_URI check at module load causes build failure**
- **Found during:** Task 1 verification (npm run build)
- **Issue:** The `if (!MONGODB_URI) throw new Error(...)` at top of `mongodb.ts` runs during Next.js static generation, failing the build when `MONGODB_URI` is not set
- **Fix:** Moved the check inside `connectDB()` function — deferred to actual DB connection time
- **Files modified:** `tma/src/lib/mongodb.ts`
- **Commit:** 97a1889

**2. [Rule 3 - Blocking] Next.js 16 deprecated middleware.ts**
- **Found during:** Task 2 build verification
- **Issue:** Next.js 16 (16.2.9) renames `middleware.ts` to `proxy.ts`. Using `middleware.ts` produces a deprecation warning and would cause issues in future versions
- **Fix:** Created `src/proxy.ts` per the new convention. Default export `auth(...)` wrapper is identical — just the filename changed per Next.js 16 proxy.ts convention
- **Files modified:** Created `src/proxy.ts`, deleted `src/middleware.ts`
- **Commit:** f64d272

**3. [Rule 1 - Bug] Zod v4 changed ZodError API**
- **Found during:** Task 2 TypeScript type check
- **Issue:** `parsed.error.errors[0]` fails TypeScript check — Zod v4 uses `.issues` not `.errors`
- **Fix:** Changed to `parsed.error.issues[0]`
- **Files modified:** `tma/src/actions/auth.register.ts`
- **Commit:** f64d272

**4. [Rule 1 - Bug] Vitest ESM resolution: next-auth imports next/server without .js**
- **Found during:** Task 3 test run
- **Issue:** `next-auth/lib/env.js` contains `import { NextRequest } from "next/server"` (no `.js` extension). Vitest's ESM resolver requires explicit extensions. Even though `@/auth` was mocked, `auth.register.ts` also imports `AuthError` directly from `"next-auth"`, loading the package.
- **Fix 1:** Added `vi.mock("next-auth", ...)` in test file to prevent loading
- **Fix 2:** Added `next/server` alias in `vitest.config.ts`
- **Files modified:** `tma/src/__tests__/actions/auth.register.test.ts`, `tma/vitest.config.ts`
- **Commit:** ef35ef0

**5. [Rule 1 - Bug] User.findOne mock missing .lean() chain**
- **Found during:** Task 3 test execution
- **Issue:** Production code calls `User.findOne(...).lean()` but test mocks returned plain values, causing `TypeError: .lean is not a function`
- **Fix:** Updated mocks to return `{ lean: vi.fn().mockResolvedValue(...) }` mirroring the Mongoose Query API
- **Files modified:** `tma/src/__tests__/actions/auth.register.test.ts`
- **Commit:** ef35ef0

## Known Stubs

None — all test stubs from Plan 01 replaced with real assertions.

## Threat Surface Scan

No new network endpoints or auth paths beyond what the plan's threat model covers. The `proxy.ts` protects `/tma/*` as designed. The `/api/auth/[...nextauth]` endpoint is the standard NextAuth handler — no custom logic, covered by T-02-02 (AUTH_SECRET required before deploy).

## Self-Check

- [x] `tma/src/auth.ts` — exists, exports `{ handlers, signIn, signOut, auth }`
- [x] `tma/src/proxy.ts` — exists, contains `pathname.startsWith("/tma")`
- [x] `tma/src/models/User.ts` — exists, `passwordHash` field, no `password`
- [x] `tma/src/lib/mongodb.ts` — exists, `global.mongoose` caching
- [x] `tma/src/lib/validations.ts` — exists, `min(8` in registerSchema
- [x] `tma/src/actions/auth.register.ts` — exists, 5 allowlist emails including `vespinola`
- [x] `tma/src/app/api/auth/[...nextauth]/route.ts` — exists
- [x] `npm run build` — exits code 0
- [x] `npm test -- --run` — 15 tests passing, code 0

## Self-Check: PASSED
