---
phase: 01-foundation
fixed_at: 2026-06-12T11:33:00Z
review_path: NyC/.planning/phases/01-foundation/01-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-06-12T11:33:00Z
**Source review:** NyC/.planning/phases/01-foundation/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (3 Critical, 4 Warning)
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Dummy bcrypt hash replaced with properly-computed module-scope constant

**Files modified:** `NyC/tma/src/auth.ts`
**Commit:** 238d4e8
**Applied fix:** Replaced the 47-character dummy hash string with `bcryptjs.hashSync("__timing_sentinel__", 12)` computed once at module scope. `const DUMMY_HASH` is now used in the `authorize` callback via `user?.passwordHash ?? DUMMY_HASH`, ensuring `bcryptjs.compare` always performs the full KDF computation regardless of whether the user exists.

---

### CR-02: MongoDB connection cache cleared on rejection to allow retry

**Files modified:** `NyC/tma/src/lib/mongodb.ts`
**Commit:** 7c00ac5
**Applied fix:** Added `.catch((err) => { cached.promise = null; throw err })` on the `mongoose.connect()` call. A rejected connection now resets `cached.promise` to `null` so the next request can attempt a fresh connection instead of permanently re-awaiting the rejected promise.

---

### CR-03: AUTH_SECRET guard added at auth.ts module top

**Files modified:** `NyC/tma/src/auth.ts`
**Commit:** 238d4e8 (combined with CR-01 — both changes in same file)
**Applied fix:** Added `if (!process.env.AUTH_SECRET) { throw new Error("AUTH_SECRET no está definido en las variables de entorno") }` before the `NextAuth(...)` call, causing the app to fail loudly at startup when the env var is absent.

---

### WR-01: Email normalized to lowercase in both Zod schemas

**Files modified:** `NyC/tma/src/lib/validations.ts`
**Commit:** 2117fcc
**Applied fix:** Added `.transform(v => v.toLowerCase())` to the email field in both `loginSchema` and `registerSchema`. Mixed-case emails submitted by users are now normalized before DB queries, preventing silent login failures.

---

### WR-02: Explicit null guards for formData.get() in loginAction

**Files modified:** `NyC/tma/src/actions/auth.login.ts`
**Commit:** 15e41d6
**Applied fix:** Replaced `formData.get("email") as string` and `formData.get("password") as string` unsafe casts with explicit `typeof email !== "string" || typeof password !== "string"` guard that returns `{ error: "Datos de formulario inválidos" }` when fields are absent.

---

### WR-03: next-auth module augmentation created for session.user.id

**Files modified:** `NyC/tma/src/types/next-auth.d.ts` (new file)
**Commit:** b437768
**Applied fix:** Created `src/types/next-auth.d.ts` declaring `id: string` on `Session["user"]` via module augmentation of `next-auth`, making the `session.user.id = token.id as string` assignment type-safe under strict mode.

---

### WR-04: Authenticated users redirected from login/register; register errors normalized

**Files modified:** `NyC/tma/src/middleware.ts`, `NyC/tma/src/actions/auth.register.ts`
**Commit:** fd5d595
**Applied fix:**
- `middleware.ts`: Added redirect of logged-in users away from `/login` and `/register` to `/tma`.
- `auth.register.ts`: Replaced distinct error messages for non-allowlisted and already-registered emails with a single generic `NOT_AUTHORIZED_MSG` constant (`"Este email no está autorizado para registrarse"`), preventing allowlist oracle attacks.

## Skipped Issues

None — all findings were fixed.

---

**Build verification:** `npm run build` passed (TypeScript check + static generation — 7 routes).
**Test verification:** `npm test -- --run` passed (4 test files, 16 tests).

---

_Fixed: 2026-06-12T11:33:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
