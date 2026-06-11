---
phase: 01-foundation
reviewed: 2026-06-11T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - NyC/tma/src/auth.ts
  - NyC/tma/src/middleware.ts
  - NyC/tma/src/models/User.ts
  - NyC/tma/src/lib/mongodb.ts
  - NyC/tma/src/lib/validations.ts
  - NyC/tma/src/actions/auth.register.ts
  - NyC/tma/src/actions/auth.login.ts
  - NyC/tma/src/app/api/auth/[...nextauth]/route.ts
  - NyC/tma/src/app/page.tsx
  - NyC/tma/src/app/login/page.tsx
  - NyC/tma/src/app/register/page.tsx
  - NyC/tma/src/app/tma/page.tsx
  - NyC/tma/src/app/layout.tsx
  - NyC/tma/src/app/globals.css
  - NyC/tma/src/components/Footer.tsx
  - NyC/tma/src/components/TmaPageContent.tsx
  - NyC/tma/src/components/auth/LoginForm.tsx
  - NyC/tma/src/components/auth/RegisterForm.tsx
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Reviewed the full authentication foundation: NextAuth v5 Credentials provider, MongoDB connection layer, Zod validation schemas, server actions for login and register, middleware-based route protection, and all UI components.

The anti-timing-attack dummy hash approach in `auth.ts` is conceptually sound but has a critical defect that defeats it. The allowlist enforcement in `auth.register.ts` is correctly placed before any DB access. The middleware matcher is solid. The main risks are a broken timing-attack mitigation, a missing `AUTH_SECRET` guard that lets the app boot silently broken, a `MONGODB_URI` connection-failure state that poisons the cached promise, and two type-safety gaps that bypass TypeScript strict mode at runtime boundaries.

---

## Critical Issues

### CR-01: Dummy hash in `auth.ts` is not a valid bcrypt hash — `bcryptjs.compare` returns `false` immediately without doing constant-time work

**File:** `NyC/tma/src/auth.ts:26-30`

**Issue:** The comment says "always run `bcryptjs.compare` to prevent timing attacks on user enumeration." However, the dummy hash `"$2a$12$dummyhashtopreventtimingattackonusernotfound"` is only 47 characters long. A real bcrypt hash is always exactly 60 characters. `bcryptjs` validates the hash format before doing any work: when the hash length is wrong it returns `false` synchronously (or after near-zero async scheduling), skipping the entire KDF computation. An attacker can still distinguish "user does not exist" from "wrong password" by measuring response time — the mitigation does not work.

**Fix:** Replace the dummy hash with a properly-formatted bcrypt hash generated once at startup, or use a precomputed hardcoded real hash (e.g., hash of a random secret). The string must be exactly 60 characters and match the `$2a$NN$...` format:

```typescript
// Precomputed with: bcryptjs.hashSync("__dummy__", 12)
// Replace this value with the actual output of that call — run it once offline.
const DUMMY_HASH =
  "$2a$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345"
//        ^^^ must be exactly 60 chars total including $2a$12$ prefix

// Better: compute once at module load
const DUMMY_HASH = bcryptjs.hashSync("__dummy_sentinel__", 12)
```

The safest approach:
```typescript
// At module scope, runs once at cold start
const DUMMY_HASH = bcryptjs.hashSync("__timing_sentinel__", 12)

// In authorize:
const passwordHash = user?.passwordHash ?? DUMMY_HASH
const valid = await bcryptjs.compare(password, passwordHash)
if (!user || !valid) throw new AuthError("Credenciales inválidas")
```

---

### CR-02: Failed MongoDB connection poisons the global promise cache — all subsequent requests throw permanently until process restart

**File:** `NyC/tma/src/lib/mongodb.ts:26-34`

**Issue:** When `mongoose.connect()` rejects (e.g., network hiccup, Atlas timeout), `cached.promise` is left set to the rejected promise but `cached.conn` stays `null`. The `if (!cached.promise)` guard on line 26 then prevents any future connection attempt — every subsequent call immediately `await`s the already-rejected promise and throws. On Vercel Hobby (single-region, no persistent process), a transient cold-start failure makes auth completely broken until the next cold start assigns a fresh global.

**Fix:** Clear `cached.promise` on rejection so the next request can retry:

```typescript
export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI no está definido en las variables de entorno")
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 5000 })
      .catch((err) => {
        cached.promise = null // allow retry on next request
        throw err
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}
```

---

### CR-03: `AUTH_SECRET` is never validated at startup — app boots silently broken when env var is absent, signing JWTs with `undefined`

**File:** `NyC/tma/src/auth.ts:9`

**Issue:** NextAuth v5 reads `AUTH_SECRET` from the environment to sign/verify JWTs. If the variable is not set in the deployment, NextAuth may fall back to an insecure default or produce tokens signed with an empty/undefined secret. There is no guard that fails loudly at startup. The result is that sessions either cannot be verified (runtime crashes on any protected route) or — worse in some NextAuth beta versions — tokens are accepted signed with a predictable value.

**Fix:** Add an explicit guard at the top of `auth.ts` before the `NextAuth(...)` call:

```typescript
if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET no está definido en las variables de entorno")
}
```

This turns a silent production misconfiguration into a loud build/startup failure.

---

## Warnings

### WR-01: `auth.register.ts` allowlist check uses `email.toLowerCase()` but Zod schema does not normalize case — a mixed-case email passes validation and reaches the allowlist check un-normalized

**File:** `NyC/tma/src/actions/auth.register.ts:37`

**Issue:** `registerSchema` (in `validations.ts`) does not call `.toLowerCase()` or `.transform()`. If a user submits `NSilva@NyC.com.ar`, Zod passes it through as-is. The check on line 37 (`email.toLowerCase()`) does normalize before comparing, so the allowlist check itself is correct. However, line 43 passes `email.toLowerCase()` to `User.findOne`, and line 50 creates the user with `email.toLowerCase()` — these are correct. The risk is in `auth.ts` line 25: `User.findOne({ email })` receives the raw (un-normalized) value from Zod `loginSchema`, which also does not normalize. The Mongoose schema sets `lowercase: true` on the field, so stored values are always lowercase. But a query for `NSilva@NyC.com.ar` will NOT match a stored record `nsilva@nyc.com.ar` unless MongoDB collation or a case-insensitive index is used — and neither is configured. Login would silently fail for any user who types their email in mixed case.

**Fix:** Normalize in both schemas, or add a `.transform(v => v.toLowerCase())` to the email field:

```typescript
// validations.ts
export const loginSchema = z.object({
  email: z.string().email("Email inválido").transform(v => v.toLowerCase()),
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z.object({
  email: z.string().email("Email inválido").transform(v => v.toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})
```

---

### WR-02: `loginAction` casts `formData.get()` to `string` with no null check — passes `null` to `signIn` when fields are absent

**File:** `NyC/tma/src/actions/auth.login.ts:12-13`

**Issue:** `formData.get("email") as string` returns `null` if the field is missing from the form (e.g., if JavaScript modifies the DOM or the action is called programmatically). The `as string` cast silences TypeScript. The `null` is then passed to `signIn`, which forwards it to the `authorize` callback. In `auth.ts`, `loginSchema.safeParseAsync` will catch this and throw `AuthError`, so there is no security breach. However, the `AuthError` is caught and surfaces as a generic "Email o contraseña incorrectos" rather than a validation error, and the null coercion is an unnecessary type-safety hole that could break if the flow changes.

**Fix:** Use explicit null guards or let Zod do the work via FormData parsing:

```typescript
export async function loginAction(
  _: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const email = formData.get("email")
  const password = formData.get("password")
  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Datos de formulario inválidos" }
  }
  try {
    await signIn("credentials", { email, password, redirectTo: "/tma" })
  } catch (error) {
    if (error instanceof AuthError) return { error: "Email o contraseña incorrectos" }
    throw error
  }
}
```

---

### WR-03: `session.user.id` assignment in `auth.ts` callback writes to a property not declared on the NextAuth `Session` type — TypeScript strict mode will error without a module augmentation

**File:** `NyC/tma/src/auth.ts:46`

**Issue:** `session.user.id = token.id as string` writes to `id` on the NextAuth `User`/`Session` type. In NextAuth v5, the base `User` type does not include an `id` field on the session (it is on the JWT token type). Without a `next-auth.d.ts` module augmentation declaring `id: string` on `Session["user"]`, this line either fails TypeScript compilation in strict mode or requires the `as string` cast that already appears (`token.id as string`). No `src/types/next-auth.d.ts` or similar file exists in the repository. If the project is currently building, it is because the type error is being suppressed silently (likely `ts-ignore` elsewhere or because the field accidentally exists on the type in this beta version). This is fragile across NextAuth beta upgrades.

**Fix:** Add a type declaration file:

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}
```

---

### WR-04: `/register` route is publicly accessible and not protected by middleware — an allowlisted user who already registered can re-register, and non-allowlisted users can probe the allowlist via error messages

**File:** `NyC/tma/src/middleware.ts:16`

**Issue:** The middleware only protects `/tma/*`. The `/register` route is unprotected. There is no redirect of authenticated users away from `/register` (or `/login`). A logged-in user who visits `/register` sees the registration form and can attempt to create a duplicate account (caught by the unique-email DB check, but they reach the DB). More importantly, any anonymous user — outside the allowlist — can submit arbitrary emails to `/register` and receive informative error messages: "Este email no está autorizado" (not on allowlist) vs "Este email ya tiene cuenta" (on allowlist and registered) vs success (on allowlist and not yet registered). This leaks which allowlisted emails have already registered.

**Fix 1:** In the middleware, redirect authenticated users away from `/login` and `/register`:

```typescript
if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
  return NextResponse.redirect(new URL("/tma", req.url))
}
```

**Fix 2:** Normalize the error response for non-allowlisted emails to be identical to the "already registered" message, removing the oracle. Return the same generic message for both cases:

```typescript
if (!ALLOWLIST.includes(email.toLowerCase())) {
  return { error: "Este email no está autorizado para registrarse" }
}
// and later:
if (existing) {
  return { error: "Este email no está autorizado para registrarse" }
}
```

---

## Info

### IN-01: CSS custom property self-reference in `globals.css` — `--font-poppins: var(--font-poppins)` is a circular reference

**File:** `NyC/tma/src/app/globals.css:12`

**Issue:** The `@theme` block declares `--font-poppins: var(--font-poppins)`. This is a CSS custom property referencing itself. Browsers treat this as an invalid/cyclic value and resolve it to the initial value (empty string). The actual font works because Next.js injects the `--font-poppins` CSS variable via the `poppins.variable` class on `<html>`, so it is resolved at the `:root` or `html` level outside this declaration. The `@theme` line is effectively dead/incorrect — it does nothing useful and is misleading.

**Fix:** Remove the self-referencing line from `@theme`, or reference the injected variable correctly if needed:

```css
@theme {
  /* Remove the font line — Next.js injects --font-poppins via className on <html> */
  --color-brand-primary: #EA580C;
  /* ... rest of colors ... */
}
```

---

### IN-02: `createdAt` field in `User.ts` schema is redundant — Mongoose does not use it as a proper timestamp

**File:** `NyC/tma/src/models/User.ts:18`

**Issue:** The schema declares `createdAt: { type: Date, default: Date.now }` manually. This works, but Mongoose's built-in `timestamps: true` schema option provides both `createdAt` and `updatedAt` automatically and is the idiomatic approach. The manual declaration also does not have an index, meaning time-range queries on `createdAt` would be a full collection scan. Not a bug for current usage (no such queries exist yet), but technical debt.

**Fix:**
```typescript
const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)
```

---

### IN-03: `registerSchema` in `validations.ts` has no maximum password length — bcrypt silently truncates passwords longer than 72 bytes

**File:** `NyC/tma/src/lib/validations.ts:11-13`

**Issue:** bcrypt (including `bcryptjs`) silently truncates input at 72 bytes. A user who sets a password longer than 72 characters will be able to log in with any prefix of 72 characters. This is a known bcrypt limitation. The schema has a minimum of 8 but no maximum. For the current use case (5 internal users) the practical risk is very low, but it is worth documenting/enforcing.

**Fix:** Add a maximum and a comment:

```typescript
password: z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no puede tener más de 72 caracteres (límite de bcrypt)"),
```

---

_Reviewed: 2026-06-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
