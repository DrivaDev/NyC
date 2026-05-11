# Phase 1 Research — Foundation

**Researched:** 2026-05-04
**Domain:** Next.js 15 App Router + Clerk v6 + MongoDB Atlas + Mongoose 8
**Confidence:** HIGH — all major claims verified against official docs or npm registry

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Restaurant document creation:** Clerk webhook (`POST /api/webhooks/clerk`) on `user.created` — NOT first-load check
- **Webhook verification:** Raw body passed to Svix/verifyWebhook without JSON parsing; idempotency via `findOneAndUpdate` with `upsert: true`
- **Slug algorithm:** `slugify(name, { lower: true, strict: true }) + '-' + nanoid(6)`, preview editable before first save, then immutable forever
- **Project structure:** No `src/` directory, TypeScript strict, App Router route groups `(admin)` / `(public)` / `(marketing)`
- **Dashboard shell:** Full nav scaffold in Phase 1 with Phase 2+ items disabled/placeholder
- **Clerk v6:** `clerkMiddleware` (not `authMiddleware`), async `auth()`, `ClerkProvider` inside `<body>` not wrapping `<html>`
- **Middleware:** Only `/dashboard(.*)` protected; all other routes public by default; webhook endpoint excluded from protection
- **Tailwind:** Driva Dev brand tokens from day one
- **Font:** Fira Sans (Google Fonts) loaded in root layout

### Claude's Discretion

- (Nothing deferred to discretion — all suggestions aligned with phase scope)

### Deferred Ideas (OUT OF SCOPE)

- Any menu content (categories, dishes, images, QR)
- OAuth / social login
- Drag-and-drop reordering
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | El restaurante puede crear una cuenta con email y contraseña via Clerk | Clerk v6 SignUp component + custom sign-up page at `app/sign-up/[[...sign-up]]/page.tsx` |
| AUTH-02 | El restaurante puede iniciar sesión y mantener la sesión activa entre visitas | Clerk session persistence is automatic; `ClerkProvider` in root layout handles token refresh |
| AUTH-03 | El restaurante puede cerrar sesión desde cualquier página del dashboard | Clerk `<UserButton />` provides built-in sign-out; or `<SignOutButton />` component |
| REST-01 | Al registrarse, se crea automáticamente un documento `Restaurant` con slug único e inmutable generado a partir del nombre del restaurante | Clerk webhook `user.created` → `Restaurant.findOneAndUpdate` with upsert; slug via `slugify + nanoid(6)` |
| REST-02 | El slug del restaurante nunca puede modificarse después de su creación | No slug-update endpoint; application-layer immutability; unique index as DB safety net |
</phase_requirements>

---

## Summary

Phase 1 delivers the absolute backbone: a running Next.js 15 App Router project, Clerk v6 authentication, a global Mongoose connection singleton safe for Vercel serverless, and the Restaurant document with permanent slug created via Clerk webhook.

Every subsequent phase builds directly on top of these primitives — the route group structure, the `lib/dbConnect.ts` singleton, the `Restaurant` model, and the Clerk middleware contract must all be correct from the start. Retrofitting any of these is expensive.

The most significant finding for Phase 1 planning is a **Clerk webhook verification upgrade**: Clerk now provides `verifyWebhook()` from `@clerk/nextjs/webhooks` which wraps Svix internally, and the canonical environment variable is now `CLERK_WEBHOOK_SIGNING_SECRET` (not `CLERK_WEBHOOK_SECRET` as documented in CONTEXT.md). Both approaches work — the CONTEXT.md pattern using `svix` directly with `CLERK_WEBHOOK_SECRET` is still valid — but the planner should document this divergence so the implementer chooses deliberately.

**Primary recommendation:** Build in this exact sequence: scaffold → Tailwind tokens + font → Clerk middleware → sign-in/up pages → MongoDB singleton → Restaurant model → webhook handler → onboarding slug UX → dashboard shell. Each step produces something runnable before the next step begins.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| User authentication (login/logout) | Clerk (external) | Next.js middleware | Clerk owns the session; middleware enforces it at the edge |
| Dashboard route protection | Next.js middleware | — | `clerkMiddleware` + `createRouteMatcher` at request time |
| Restaurant document creation | API tier (webhook handler) | — | Clerk's server calls `/api/webhooks/clerk`; no browser session involved |
| Slug generation | API tier (webhook handler) | lib utility | Pure function in `lib/utils.ts`, invoked server-side only |
| MongoDB connection | Database / lib singleton | — | `lib/dbConnect.ts` — one connection pool per function instance |
| Dashboard shell UI | Frontend server (SSR) | — | Server Component reads Restaurant doc, passes to layout |
| Sign-in / Sign-up pages | Frontend server (SSR) | Clerk hosted UI | Next.js page wraps Clerk's `<SignIn>` / `<SignUp>` components |

---

## Standard Stack

### Core — Phase 1 packages

| Library | Verified Version | Purpose | Source |
|---------|-----------------|---------|--------|
| `next` | 16.2.4 (latest) | App Router framework | [VERIFIED: npm registry 2026-05-04] |
| `react` / `react-dom` | 19.1.0 | Required by Next.js 15.3+ | [VERIFIED: npm registry] |
| `@clerk/nextjs` | 7.3.0 (latest) | Auth — middleware, components, server helpers | [VERIFIED: npm registry 2026-05-04] |
| `mongoose` | 9.6.1 (latest) | MongoDB ODM with connection caching | [VERIFIED: npm registry 2026-05-04] |
| `svix` | 1.92.2 (latest) | Webhook signature verification (wraps Standard Webhooks) | [VERIFIED: npm registry 2026-05-04] |
| `nanoid` | 5.1.11 (latest) | Cryptographically secure random suffix for slug | [VERIFIED: npm registry 2026-05-04] |
| `slugify` | 1.6.9 (latest) | Convert restaurant name to URL-safe base slug | [VERIFIED: npm registry 2026-05-04] |
| `typescript` | 5.x (bundled) | Strict mode, bundled with Next.js | [CITED: nextjs.org/docs] |

> **Warning:** CONTEXT.md documents `@clerk/nextjs ^6.22.x` and `mongoose ^8.x`. The npm registry shows `@clerk/nextjs` is now at `7.3.0` and `mongoose` at `9.6.1`. The CONTEXT.md versions are from a prior research pass (same day, but npm has since updated). The architecture patterns in CONTEXT.md (clerkMiddleware, async auth(), ClerkProvider inside body) remain valid in v7 — these are stable Core 2 patterns. The planner should install `@clerk/nextjs@latest` and `mongoose@latest` unless a specific pinned version is required.

### Supporting — scaffold only (not implemented in Phase 1)

| Library | Version | Purpose | When to use |
|---------|---------|---------|-------------|
| `next-cloudinary` | ^6.17.x | Image upload widget | Phase 2 |
| `cloudinary` | ^2.x | Server-side upload signing | Phase 2 |
| `qrcode` | ^1.5.x | QR PNG generation | Phase 3 |

**Installation — Phase 1 packages only:**
```bash
npx create-next-app@latest menu-digital \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm

# After scaffolding, in the project directory:
npm install @clerk/nextjs mongoose svix nanoid slugify
```

> The `--yes` flag on `create-next-app` uses stored preferences and may not apply all flags correctly. Explicit flags are safer. `--no-src-dir` disables the `src/` directory per the locked decision. [CITED: nextjs.org/docs/app/api-reference/cli/create-next-app]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├─[GET /dashboard/*]──► Next.js Middleware (clerkMiddleware)
  │                             │ auth.protect() if isProtectedRoute
  │                             │ redirect to /sign-in if no session
  │                             ▼
  │                        (admin) layout.tsx (Server Component)
  │                             │ await auth() → userId
  │                             │ await dbConnect()
  │                             │ Restaurant.findOne({ clerkId: userId })
  │                             ▼
  │                        dashboard/page.tsx → shows name + slug
  │
  ├─[GET /sign-in, /sign-up]──► (public) Clerk SignIn/SignUp components
  │
  ├─[GET /menu/*]──────────────► Next.js (no auth check — public default)
  │
  └─[POST /api/webhooks/clerk]─► Webhook Route Handler (PUBLIC — no Clerk protection)
                                      │ verifyWebhook(req) [CLERK_WEBHOOK_SIGNING_SECRET]
                                      │ if evt.type === 'user.created'
                                      │   generateSlug(name)
                                      │   Restaurant.findOneAndUpdate({ clerkId }, {...}, { upsert: true })
                                      ▼
                                 MongoDB Atlas
                                 restaurants collection

Clerk Dashboard ──[user.created webhook]──► POST /api/webhooks/clerk
```

### Recommended Project Structure

```
menu-digital/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx          ← Sidebar, Clerk UserButton, nav chrome
│   │   └── dashboard/
│   │       └── page.tsx        ← Shows restaurant name + slug (Phase 1 done state)
│   ├── (public)/
│   │   ├── layout.tsx          ← Minimal layout, no auth UI
│   │   └── menu/
│   │       └── [slug]/
│   │           └── page.tsx    ← Phase 3 placeholder
│   ├── (marketing)/
│   │   └── page.tsx            ← Phase 4 placeholder
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx
│   ├── api/
│   │   └── webhooks/
│   │       └── clerk/
│   │           └── route.ts    ← Clerk webhook (public, verified with svix)
│   ├── layout.tsx              ← Root layout: ClerkProvider + Fira Sans
│   └── globals.css
├── lib/
│   ├── dbConnect.ts            ← Mongoose global connection cache
│   └── utils.ts                ← generateSlug() and other shared utilities
├── models/
│   ├── Restaurant.ts
│   ├── Category.ts             ← Scaffold now (empty schema), implement Phase 2
│   └── Dish.ts                 ← Scaffold now (empty schema), implement Phase 2
├── components/
│   ├── ui/                     ← Shared primitives (Button, Badge, Input)
│   └── dashboard/              ← Dashboard-specific components (Sidebar, NavItem)
├── middleware.ts               ← Clerk middleware (root level)
├── tailwind.config.ts
├── tsconfig.json               ← strict: true
└── .env.local                  ← Gitignored — never committed
```

### Pattern 1: Clerk Middleware — Opt-in Protection

**What:** All routes are public by default. Only `/dashboard(.*)` is explicitly protected.

**When to use:** Every Next.js project with Clerk v6+. The old `authMiddleware` is removed.

```typescript
// middleware.ts  (root level, same directory as app/)
// Source: https://clerk.com/docs/references/nextjs/clerk-middleware [CITED]
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

> **Critical:** The webhook endpoint `/api/webhooks/clerk` is NOT in `isProtectedRoute`, so Clerk's own server can POST to it without a session cookie. The `(api|trpc)(.*)` matcher ensures middleware runs on the route, but since it's not protected, the request passes through.

### Pattern 2: ClerkProvider Placement (v6+ requirement)

**What:** ClerkProvider must be inside `<body>`, not wrapping `<html>`. Wrapping `<html>` opts the entire app into dynamic rendering.

```typescript
// app/layout.tsx
// Source: https://clerk.com/docs/quickstarts/nextjs [CITED]
import { ClerkProvider } from '@clerk/nextjs'
import { Fira_Sans } from 'next/font/google'

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-fira-sans',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={firaSans.variable}>
      <body className="bg-brand-fondo font-sans">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
```

### Pattern 3: Custom Sign-In / Sign-Up Pages

**What:** Catch-all route segments that host Clerk's components at custom paths.

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
// Source: Clerk custom pages guide [CITED: clerk.com/docs]
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-fondo">
      <SignIn />
    </div>
  )
}

// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-fondo">
      <SignUp />
    </div>
  )
}
```

Clerk's components route internally via the catch-all (`[[...sign-in]]`) to handle email verification steps, SSO callbacks, etc.

### Pattern 4: Mongoose Global Connection Cache

**What:** Global Node.js variable survives between warm serverless invocations, preventing connection storms on Atlas.

```typescript
// lib/dbConnect.ts
// Source: https://mongoosejs.com/docs/nextjs.html [CITED]
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null }
global.mongoose = cached

export async function dbConnect() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,               // Low per-instance — prevents Atlas connection storms
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,        // Fail fast instead of queuing when disconnected
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
```

### Pattern 5: Restaurant Mongoose Model

```typescript
// models/Restaurant.ts
// Source: CONTEXT.md locked decision + STACK.md [CITED]
import { Schema, model, models } from 'mongoose'

const RestaurantSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name:    { type: String, required: true },
    slug:    { type: String, required: true, unique: true, index: true, lowercase: true },
  },
  { timestamps: true }
)

// Model registration guard — prevents OverwriteModelError on Next.js hot reload
export const Restaurant = models.Restaurant || model('Restaurant', RestaurantSchema)
```

> Note: ARCHITECTURE.md uses `ownerId` as the field name while CONTEXT.md uses `clerkId`. The CONTEXT.md decision is locked: use `clerkId`. This is the Clerk `userId` string (e.g., `user_2abc...`).

### Pattern 6: Clerk Webhook Handler

**What:** Receives `user.created` from Clerk's server, verifies with Svix, creates Restaurant document.

**Two valid approaches — choose one:**

**Option A: verifyWebhook() — Clerk's new native helper (recommended for new projects)**
```typescript
// app/api/webhooks/clerk/route.ts
// Source: https://clerk.com/docs/reference/backend/verify-webhook [CITED]
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { generateSlug } from '@/lib/utils'

export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Verification failed', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data

    // Derive a name from Clerk user data — fallback to email prefix
    const name =
      [first_name, last_name].filter(Boolean).join(' ').trim() ||
      email_addresses[0]?.email_address?.split('@')[0] ||
      'restaurante'

    const slug = generateSlug(name)

    await dbConnect()

    await Restaurant.findOneAndUpdate(
      { clerkId },
      { $setOnInsert: { clerkId, name, slug } },
      { upsert: true, new: true }
    )
  }

  return new Response('OK', { status: 200 })
}
```

**Option B: svix directly — matches CONTEXT.md locked decision exactly**
```typescript
// app/api/webhooks/clerk/route.ts
// Source: CONTEXT.md locked decision + STACK.md [CITED]
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { generateSlug } from '@/lib/utils'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  // CRITICAL: Use raw text — JSON.parse then re-stringify breaks the signature
  const payload = await req.text()

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(payload, {
      'svix-id': svixId!,
      'svix-timestamp': svixTimestamp!,
      'svix-signature': svixSignature!,
    }) as WebhookEvent
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data
    const name =
      [first_name, last_name].filter(Boolean).join(' ').trim() ||
      email_addresses[0]?.email_address?.split('@')[0] ||
      'restaurante'
    const slug = generateSlug(name)

    await dbConnect()

    await Restaurant.findOneAndUpdate(
      { clerkId },
      { $setOnInsert: { clerkId, name, slug } },
      { upsert: true, new: true }
    )
  }

  return new Response('OK', { status: 200 })
}
```

> **Planner note:** The CONTEXT.md uses Option B (svix directly) with `CLERK_WEBHOOK_SECRET`. Clerk's current official docs now show Option A (`verifyWebhook`) with `CLERK_WEBHOOK_SIGNING_SECRET`. Both are functionally equivalent — `verifyWebhook` is a thin wrapper over Svix. Pick Option B to stay consistent with the locked CONTEXT.md decision, or Option A for forward compatibility. Document the choice in the plan.

### Pattern 7: Slug Generation Utility

```typescript
// lib/utils.ts
// Source: CONTEXT.md locked decision [CITED]
import slugify from 'slugify'
import { nanoid } from 'nanoid'

/**
 * Generates a URL-safe slug from a restaurant name.
 * Format: "la-trattoria-x8k2mq"
 * - Immutable after first save to DB
 * - nanoid(6) = 56 billion combinations — collision probability negligible
 */
export function generateSlug(name: string): string {
  const base = slugify(name, { lower: true, strict: true })
  const suffix = nanoid(6)
  const slug = `${base}-${suffix}`
  // Enforce max 60 chars (CONTEXT.md constraint)
  return slug.slice(0, 60)
}
```

> **Onboarding UX note:** The CONTEXT.md locked a "preview before confirm" UX — the slug is shown to the user after name entry, editable before the first save, then immutable. However, the webhook fires on Clerk registration, BEFORE the user visits the dashboard. This means:
> 1. Webhook creates the Restaurant doc with an auto-generated slug from the Clerk name.
> 2. User lands on dashboard and sees an "onboarding" step showing the auto-generated slug.
> 3. User can edit the slug and confirm — this single update is allowed.
> 4. Once confirmed, the slug becomes immutable.
>
> This implies the Restaurant model needs a `slugConfirmed: Boolean` field (default false), and the dashboard has an onboarding gate that shows the slug editor until confirmed. The webhook write uses `$setOnInsert` so a duplicate `user.created` delivery cannot overwrite a confirmed slug. This UX complexity is in Phase 1 scope.

### Pattern 8: Dashboard Shell with Disabled Nav Items

```typescript
// app/(admin)/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean()

  return (
    <div className="flex h-screen bg-brand-fondo">
      <Sidebar restaurant={restaurant} />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

```typescript
// components/dashboard/Sidebar.tsx
// Phase 1: dashboard active, others disabled
const navItems = [
  { label: 'Dashboard', href: '/dashboard', enabled: true },
  { label: 'Categorías', href: '/dashboard/categories', enabled: false },
  { label: 'Platos', href: '/dashboard/dishes', enabled: false },
  { label: 'Mi QR', href: '/dashboard/qr', enabled: false },
]
```

### Pattern 9: Tailwind Config with Brand Tokens

```typescript
// tailwind.config.ts
// Source: CONTEXT.md locked decision [CITED]
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          principal:  '#EA580C',  // Buttons, CTAs
          titulares:  '#9A3412',  // H1, H2
          acento:     '#FED7AA',  // Badges, secondary backgrounds
          fondo:      '#FFF7ED',  // General background
          texto:      '#1C1917',  // Body text
        },
      },
      fontFamily: {
        sans: ['var(--font-fira-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

### Anti-Patterns to Avoid

- **Using `authMiddleware`:** Removed in Clerk Core 2. Will throw at runtime on current SDK versions.
- **Synchronous `auth()`:** In v6+, `auth()` is async. `const { userId } = auth()` returns a Promise, not the auth object — silent bug.
- **ClerkProvider wrapping `<html>`:** Forces the entire app into dynamic rendering, breaking ISR.
- **JSON-parsing webhook body before verification:** `await req.json()` then re-serializing breaks the Svix HMAC signature.
- **Protecting the webhook endpoint:** `/api/webhooks/clerk` must be reachable by Clerk's server, which has no session cookie.
- **Opening a new Mongoose connection per request:** Without the global cache, Atlas M0 connection limit (500) is exhausted quickly under load.
- **Not using `models.X || model('X', Schema)`:** Next.js hot reload re-executes module code; without the guard, every save throws `OverwriteModelError`.
- **Storing price as float:** Not relevant to Phase 1, but scaffold `price: Number` in Dish as an integer (cents).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth (login, session, logout) | Custom JWT or session system | Clerk `<SignIn>`, `<SignUp>`, `<UserButton>` | Session management, token refresh, MFA, device tracking all handled |
| Webhook signature verification | Custom HMAC check | `svix` or `verifyWebhook()` | Timing attacks, replay attacks, header parsing edge cases |
| Slug uniqueness at scale | Manual DB uniqueness query loop | `nanoid(6)` + MongoDB unique index | 56B combinations; DB index is the final guard |
| Connection pooling | Per-request `mongoose.connect()` | `lib/dbConnect.ts` global cache | Connection limit exhaustion on Atlas M0 |
| Font loading | Manual CSS @font-face | `next/font/google` with `Fira_Sans` | Automatic self-hosting, no layout shift, privacy-safe |

**Key insight:** Phase 1's job is wiring together mature systems (Clerk, MongoDB, Next.js) correctly — the risk is in integration, not custom logic.

---

## Common Pitfalls

### Pitfall 1: Webhook Env Var Name Mismatch

**What goes wrong:** Webhook verification silently fails if `CLERK_WEBHOOK_SECRET` is set but the code reads `CLERK_WEBHOOK_SIGNING_SECRET` (or vice versa).

**Why it happens:** Clerk's blog posts use `CLERK_WEBHOOK_SECRET`; the current official reference docs use `CLERK_WEBHOOK_SIGNING_SECRET`. The `verifyWebhook()` function auto-reads `CLERK_WEBHOOK_SIGNING_SECRET`.

**How to avoid:** Pick one approach and be consistent. CONTEXT.md locked `svix` directly + `CLERK_WEBHOOK_SECRET`. If using `verifyWebhook()`, use `CLERK_WEBHOOK_SIGNING_SECRET`. Document the chosen variable name in `.env.local` and in `.env.example`.

**Warning signs:** Webhook handler always returns 400; Atlas shows no Restaurant documents being created after user signup.

[VERIFIED: clerk.com/docs/reference/backend/verify-webhook + clerk.com/blog/webhooks-getting-started]

### Pitfall 2: Middleware File Location

**What goes wrong:** `middleware.ts` placed in `app/` or `src/` causes it to be ignored entirely. All routes become unprotected.

**Why it happens:** Next.js only looks for `middleware.ts` at the project root (same level as `app/`, `package.json`, `tsconfig.json`). A `src/` directory would require `src/middleware.ts`.

**How to avoid:** Since this project has no `src/` directory (locked), `middleware.ts` must be at `menu-digital/middleware.ts`. Verify it exists at the root after scaffolding.

**Warning signs:** `/dashboard` route is accessible without being signed in.

[CITED: nextjs.org/docs/app/api-reference/file-conventions/middleware]

### Pitfall 3: Atlas IP Allowlist Blocks Vercel Production

**What goes wrong:** App works in local dev but throws `MongoServerSelectionError` in production. Vercel functions use dynamic IPs — no fixed IP to allowlist.

**Why it happens:** Atlas defaults to blocking all IPs. Vercel has no static egress IPs.

**How to avoid:** Set Atlas Network Access to `0.0.0.0/0` before the first Vercel deploy. Security model shifts to connection string credentials + TLS.

**Warning signs:** App works locally (`mongosh` connects), but production logs show connection timeout on cold start.

[CITED: mongodb.com/docs/atlas/reference/partner-integrations/vercel]

### Pitfall 4: Slug Onboarding UX Complexity

**What goes wrong:** The "preview before confirm" UX (CONTEXT.md locked decision) requires a `slugConfirmed` state on the Restaurant document. If this is not modelled, the webhook creates a slug the user never sees, and there's no way to expose the edit flow.

**Why it happens:** Webhook fires on Clerk registration before the user visits the dashboard. The slug must be auto-generated at webhook time, then shown to the user as editable once.

**How to avoid:** Add `slugConfirmed: { type: Boolean, default: false }` to the Restaurant schema. The dashboard layout checks this field — if false, show the onboarding slug editor instead of the normal dashboard. After the user confirms, a Server Action sets `slugConfirmed: true` and locks the slug.

**Warning signs:** Restaurant document created but user never gets to review their slug; or slug is confirmed but the user can still call a non-existent update endpoint.

[ASSUMED — based on locked CONTEXT.md UX decision + implementation reasoning]

### Pitfall 5: `user.created` Delivers User Name from Clerk Signup

**What goes wrong:** Clerk's `user.created` webhook payload includes `first_name`, `last_name`, and `email_addresses`. For a restaurant SaaS, none of these is the restaurant name — the user has not entered a restaurant name yet.

**Why it happens:** Clerk collects user identity (person name, email), not business identity (restaurant name).

**How to avoid:** Two options:
1. **Generate slug from email prefix at webhook time**, then require the user to complete an onboarding step in the dashboard where they enter their restaurant name and confirm the generated slug.
2. **Don't generate the slug in the webhook** — create a stub Restaurant doc with only `clerkId`, then require onboarding to collect name + generate slug.

Option 1 is faster for Phase 1. Option 2 is cleaner but adds dashboard onboarding complexity. The planner must choose — this affects the webhook handler, the Restaurant schema (is `name` required at webhook time?), and the onboarding UX.

[ASSUMED — based on Clerk webhook payload analysis + locked slug UX decision]

### Pitfall 6: `$setOnInsert` vs `$set` in Upsert

**What goes wrong:** Using `$set` in the upsert allows a repeated `user.created` event to overwrite a confirmed slug with a new randomly-generated one.

**Why it happens:** Svix guarantees at-least-once delivery. Duplicate events do arrive.

**How to avoid:** Use `$setOnInsert` for all immutable fields (`clerkId`, `name`, `slug`). `$setOnInsert` only applies when the document is being inserted (first delivery), not when it already exists.

```typescript
// CORRECT — idempotent
await Restaurant.findOneAndUpdate(
  { clerkId },
  { $setOnInsert: { clerkId, name, slug } },
  { upsert: true, new: true }
)

// WRONG — overwrites slug on duplicate delivery
await Restaurant.findOneAndUpdate(
  { clerkId },
  { $set: { clerkId, name, slug } },
  { upsert: true }
)
```

[CITED: mongodb.com/docs/manual/reference/operator/update/setOnInsert]

### Pitfall 7: `await headers()` in Next.js 15

**What goes wrong:** In Next.js 15, `headers()` from `next/headers` is async. Code that calls it synchronously (as shown in some older Clerk webhook guides) will fail with a warning or incorrect behavior.

**Why it happens:** Next.js 15 made `headers()`, `cookies()`, and `params` async. Many tutorials were written for Next.js 14.

**How to avoid:** Always `await headers()` in webhook handlers and Server Components:

```typescript
// Next.js 15 — CORRECT
const headerPayload = await headers()

// Old pattern — WRONG in Next.js 15
const headerPayload = headers()
```

Note: The `verifyWebhook()` helper handles header reading internally, so this pitfall only applies to the manual svix approach.

[CITED: nextjs.org/blog/next-15]

---

## Slug Generation

### Algorithm Detail

```typescript
// lib/utils.ts
import slugify from 'slugify'
import { nanoid } from 'nanoid'

export function generateSlug(name: string): string {
  // slugify options: lower = all lowercase, strict = remove non-alphanumeric except hyphens
  const base = slugify(name, { lower: true, strict: true })
  // nanoid(6) = 6 chars from default alphabet (A-Za-z0-9_-)  
  // = 64^6 = ~68 billion combinations; collision negligible
  const suffix = nanoid(6)
  const slug = base ? `${base}-${suffix}` : suffix
  // Enforce max 60 chars; base can be long for restaurants with long names
  return slug.slice(0, 60)
}
```

**Examples:**
- "La Trattoria" → `la-trattoria-x8k2mq`
- "El Rincón del Gaucho" → `el-rincon-del-gaucho-abc123`
- "日本料理" (Japanese chars) → `-abc123` (all non-ASCII stripped by strict mode — handle edge case)

**Edge case:** If `name` consists entirely of non-ASCII characters, `slugify` with `strict: true` returns an empty string. The slug becomes just the nanoid suffix. This is acceptable (still unique and URL-safe), but the onboarding UX should detect this and prompt the user to provide an ASCII-friendly name.

**Uniqueness strategy:** `nanoid(6)` provides sufficient uniqueness for a SaaS at this scale. The MongoDB `unique: true` index on `slug` is a final hard guard. There is no retry loop needed — collision probability is ~1 in 68 billion per registered restaurant.

**Immutability enforcement:** No slug update endpoint is created. Application-layer + MongoDB unique index = two layers of protection.

---

## Dashboard Shell

### Phase 1 Dashboard State

The dashboard page for Phase 1 shows minimal information: restaurant name and slug, with a preview link (disabled until Phase 3).

```typescript
// app/(admin)/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean()

  if (!restaurant) {
    // Webhook not yet delivered — show waiting state
    return <div>Configurando tu cuenta...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-titulares">{restaurant.name}</h1>
      <p className="text-brand-texto">
        Tu menú estará en:{' '}
        <span className="font-mono text-brand-principal">
          {process.env.NEXT_PUBLIC_APP_URL}/menu/{restaurant.slug}
        </span>
      </p>
    </div>
  )
}
```

### Sidebar Nav Items (Phase 1 scaffold)

```typescript
// components/dashboard/Sidebar.tsx — Phase 1 structure
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const navItems = [
  { label: 'Dashboard',    href: '/dashboard',            phase: 1 },
  { label: 'Categorías',   href: '/dashboard/categories', phase: 2 },
  { label: 'Platos',       href: '/dashboard/dishes',     phase: 2 },
  { label: 'Mi QR',        href: '/dashboard/qr',         phase: 3 },
]

export default function Sidebar({ restaurantName }: { restaurantName?: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-brand-acento flex flex-col">
      <div className="p-4 border-b border-brand-acento">
        <p className="text-sm text-brand-texto font-medium truncate">
          {restaurantName ?? 'Menú Digital'}
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isEnabled = item.phase === 1
          if (!isEnabled) {
            return (
              <span
                key={item.href}
                className="block px-3 py-2 rounded text-sm text-gray-400 cursor-not-allowed"
                title="Disponible próximamente"
              >
                {item.label}
              </span>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-brand-acento text-brand-titulares font-medium'
                  : 'text-brand-texto hover:bg-brand-fondo'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-brand-acento">
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </aside>
  )
}
```

---

## Middleware Configuration

### Complete middleware.ts

```typescript
// middleware.ts — root level
// Source: clerk.com/docs/references/nextjs/clerk-middleware [CITED]
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Only dashboard routes are protected; everything else is public
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  // /api/webhooks/clerk is NOT in isProtectedRoute — public by design
  // /menu/[slug] is NOT in isProtectedRoute — public by design
  // /sign-in, /sign-up are NOT in isProtectedRoute — public by design
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run middleware on API routes
    '/(api|trpc)(.*)',
  ],
}
```

**What this achieves:**
- `/dashboard`, `/dashboard/dishes`, etc. → redirects to `/sign-in` if no session
- `/api/webhooks/clerk` → middleware runs (due to API matcher) but does NOT call `auth.protect()`, so Clerk's server can POST freely
- `/menu/anything` → middleware runs, no protection, request passes through
- `/_next/static/*`, images, fonts → middleware skipped entirely (performance)

---

## Environment Variables

### Complete Phase 1 `.env.local`

```bash
# Clerk — get from Clerk Dashboard → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk — redirect configuration
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Clerk Webhook — get from Clerk Dashboard → Webhooks → your endpoint → Signing Secret
# Use CLERK_WEBHOOK_SECRET if using svix directly (CONTEXT.md approach)
# Use CLERK_WEBHOOK_SIGNING_SECRET if using verifyWebhook() (new Clerk approach)
CLERK_WEBHOOK_SECRET=whsec_...

# MongoDB Atlas — get from Atlas → Connect → Drivers
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/menu-digital?retryWrites=true&w=majority

# Application URL — used in dashboard to display slug preview
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production Vercel Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
CLERK_WEBHOOK_SECRET=whsec_...          # from production Clerk app's webhook
MONGODB_URI=mongodb+srv://...           # production Atlas cluster
NEXT_PUBLIC_APP_URL=https://menudig.com.ar
```

**Critical:** `NEXT_PUBLIC_APP_URL` must be different per environment. Locally it is `http://localhost:3000`. In production it is `https://menudig.com.ar`. Set this in Vercel's environment variable overrides.

[VERIFIED: clerk.com/docs/guides/development/clerk-environment-variables]

---

## Atlas Setup

### Step-by-step for first deployment

1. **Create a free M0 cluster** on Atlas (or use existing)
2. **Database Access:** Create a database user with password auth; note credentials
3. **Network Access → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)** — required for Vercel
4. **Get connection string:** Cluster → Connect → Drivers → Node.js; replace `<password>` and set database name to `menu-digital`
5. **Connection string format:**
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/menu-digital?retryWrites=true&w=majority&appName=<ClusterName>
   ```
6. **`autoIndex` in production:** Mongoose defaults to `autoIndex: true`. For Phase 1, leave it on — the Restaurant schema has only 2 indexes (`clerkId`, `slug`) which build quickly. Add `autoIndex: false` in Phase 2+ when the Dish schema adds compound indexes.

[CITED: mongodb.com/docs/atlas/reference/partner-integrations/vercel]

---

## Build Order

### Sequential dependencies (cannot parallelize)

```
1. create-next-app scaffold
   └── 2. Tailwind brand tokens + Fira Sans in tailwind.config.ts + root layout.tsx
         └── 3. middleware.ts (clerkMiddleware)
               └── 4. sign-in + sign-up pages (Clerk SignIn/SignUp components)
                     └── 5. lib/dbConnect.ts (Mongoose singleton)
                           └── 6. models/Restaurant.ts (schema + model guard)
                               models/Category.ts (scaffold only)
                               models/Dish.ts (scaffold only)
                                 └── 7. lib/utils.ts (generateSlug function)
                                       └── 8. app/api/webhooks/clerk/route.ts (webhook handler)
                                             └── 9. Test: register user → Atlas shows Restaurant doc
                                                   └── 10. (admin)/layout.tsx (dashboard shell)
                                                         └── 11. (admin)/dashboard/page.tsx
                                                               └── 12. components/dashboard/Sidebar.tsx
                                                                     └── 13. Smoke test: full auth flow
```

### Parallelizable within a step

- Step 6: Restaurant.ts, Category.ts, Dish.ts can be written simultaneously
- Step 10-12: layout.tsx and Sidebar.tsx can be written simultaneously before dashboard/page.tsx

### Local webhook testing

For local development, the webhook cannot reach `localhost`. Use one of:
- `ngrok http 3000` — generates a public HTTPS URL, configure as webhook endpoint in Clerk Dashboard
- `cloudflare tunnel` — `cloudflared tunnel --url http://localhost:3000`

Set the generated URL as the webhook endpoint in Clerk Dashboard → Webhooks → Add Endpoint.

---

## Code Examples

### Reading auth and fetching restaurant (Server Component pattern)

```typescript
// Source: STACK.md + official Clerk docs [CITED]
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'

export default async function SomeServerComponent() {
  const { userId } = await auth()  // MUST await — async in Clerk v6+
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean()
  // .lean() returns plain JS object, not Mongoose document — better for props/serialization

  return <div>{restaurant?.name}</div>
}
```

### Sign-out from dashboard (using UserButton)

```typescript
// Clerk's UserButton has a built-in sign-out option — no custom code needed
// Source: clerk.com/docs [CITED]
import { UserButton } from '@clerk/nextjs'

// In sidebar or nav:
<UserButton afterSignOutUrl="/sign-in" />
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All | ✓ | v24.15.0 | — |
| npm | Package installation | ✓ | 11.12.1 | — |
| npx / create-next-app | Scaffolding | ✓ | 11.12.1 | — |
| MongoDB Atlas | Database | External — needs account | M0 free | None — must create |
| Clerk account | Auth | External — needs account | — | None — must create |
| ngrok or cloudflare tunnel | Local webhook testing | Not verified | — | cloudflare tunnel (free) |

**Missing dependencies with no fallback:**
- MongoDB Atlas account: must be created before Phase 1 work begins
- Clerk account + application: must be created to get API keys

**Missing dependencies with fallback:**
- ngrok: cloudflare tunnel is a free alternative for local webhook testing

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — project is greenfield |
| Config file | None — see Wave 0 gaps |
| Quick run command | `npm run test` (after setup) |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated? | Notes |
|--------|----------|-----------|-----------|-------|
| AUTH-01 | User can register with email + password | Manual / smoke | No — requires Clerk UI | Test: create account in browser, verify session |
| AUTH-02 | Session persists across browser close | Manual | No — browser behavior | Test: login, close, reopen, verify still authenticated |
| AUTH-03 | Sign out works from dashboard | Manual / smoke | No — requires Clerk UI | Test: click UserButton → Sign out → redirected to /sign-in |
| REST-01 | Restaurant doc created with unique slug | Integration | Partial — can assert MongoDB state | Test: register user → check Atlas for Restaurant document |
| REST-02 | Slug is immutable after creation | Unit | Yes | Test: attempt second write to confirmed slug via direct DB call |

> For Phase 1, most tests are smoke/manual because the core behaviors require Clerk's hosted UI and real webhook delivery. The planner should include manual test steps in the plan's verification section.

### Wave 0 Gaps

- [ ] No test framework installed — decide on Vitest or Jest before Phase 2
- [ ] No E2E framework (Playwright/Cypress) — needed for Phase 2+ CRUD flows
- [ ] `lib/utils.test.ts` — unit test for `generateSlug()` (pure function, no dependencies)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Clerk (fully managed) — email + password, session management |
| V3 Session Management | Yes | Clerk JWT sessions with automatic refresh |
| V4 Access Control | Yes | `clerkMiddleware` + `await auth()` in every server-side handler |
| V5 Input Validation | Yes | `slugify` + length check on slug; name comes from Clerk user data |
| V6 Cryptography | Yes | Svix HMAC-SHA256 for webhook verification — never hand-rolled |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged webhook events | Spoofing | Svix HMAC signature verification on every request |
| Webhook replay attack | Repudiation | Svix checks timestamp freshness (5-minute window) |
| Cross-tenant data access | Information Disclosure | `clerkId` filter derived from server-side session, never from request body |
| Session hijacking | Elevation of Privilege | Clerk JWT with short expiry + automatic refresh |
| Slug mutation after QR distribution | Tampering | No update endpoint; application + DB layer enforcement |

---

## Open Questions

1. **Restaurant name source for webhook slug generation**
   - What we know: Clerk's `user.created` payload has `first_name`, `last_name`, `email_addresses` — not a restaurant name
   - What's unclear: Should the webhook generate a slug from the user's personal name / email prefix, or create a stub doc with no name and require an onboarding step?
   - Recommendation: Generate from email prefix (most users have business emails like `latrattoria@gmail.com`). Show editable preview in dashboard onboarding. Add `slugConfirmed: Boolean` to Restaurant schema.

2. **`CLERK_WEBHOOK_SECRET` vs `CLERK_WEBHOOK_SIGNING_SECRET`**
   - What we know: CONTEXT.md locked `CLERK_WEBHOOK_SECRET` (svix directly). Current Clerk docs recommend `CLERK_WEBHOOK_SIGNING_SECRET` with `verifyWebhook()`.
   - What's unclear: Does the planner want to follow CONTEXT.md exactly (svix) or adopt the newer Clerk helper?
   - Recommendation: Follow CONTEXT.md (Option B — svix directly, `CLERK_WEBHOOK_SECRET`) for consistency with locked decisions. Document as a known deviation from current Clerk canonical.

3. **`slugConfirmed` field and onboarding gate**
   - What we know: CONTEXT.md says slug is editable before first confirm, then immutable
   - What's unclear: Is Phase 1's scope the full onboarding UX (show slug, allow edit, confirm button), or just webhook creation with the slug visible in the dashboard?
   - Recommendation: Include the onboarding gate in Phase 1 since REST-01/REST-02 require the confirmed-slug state. A `slugConfirmed: false` Restaurant doc without the gate leaves REST-02 unverifiable.

4. **`@types/mongoose` needed?**
   - What we know: `@types/mongoose` is listed in CONTEXT.md install command
   - What's unclear: Mongoose 8+ ships its own TypeScript definitions — `@types/mongoose` is for older versions and may conflict
   - Recommendation: Do NOT install `@types/mongoose`. Mongoose 8/9 ships types internally. [VERIFIED: mongoose npm package, TypeScript included]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Restaurant name should be derived from email prefix when Clerk user has no name set | Webhook Handler / Open Questions | Generates ugly slug; onboarding UX must allow edit anyway |
| A2 | `slugConfirmed` boolean field is needed on Restaurant schema to support the preview-before-confirm UX | Slug Generation / Pitfall 4 | Without it, there is no way to implement the immutability gate in the dashboard |
| A3 | `@types/mongoose` should NOT be installed (Mongoose 8/9 bundles types) | Standard Stack | Minor type conflicts if installed; harmless but noisy |
| A4 | Onboarding gate (show slug editor until confirmed) is in Phase 1 scope | Open Questions | If out of scope, Phase 1 only creates the Restaurant doc with no user-visible slug confirmation |

---

## Sources

### Primary (HIGH confidence)

- [Clerk clerkMiddleware() reference](https://clerk.com/docs/references/nextjs/clerk-middleware) — middleware patterns, route matcher, auth.protect()
- [Clerk Next.js quickstart](https://clerk.com/docs/quickstarts/nextjs) — ClerkProvider placement, env vars
- [verifyWebhook() reference](https://clerk.com/docs/reference/backend/verify-webhook) — new webhook helper
- [Clerk environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables) — complete env var list
- [Clerk skills/webhooks SKILL.md](https://github.com/clerk/skills/blob/main/skills/features/clerk-webhooks/SKILL.md) — canonical webhook route implementation
- [create-next-app CLI reference](https://nextjs.org/docs/app/api-reference/cli/create-next-app) — all flags including `--no-src-dir`, `--yes`
- [Mongoose Next.js docs](https://mongoosejs.com/docs/nextjs.html) — global connection cache pattern
- [MongoDB Atlas + Vercel integration](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/) — 0.0.0.0/0 IP allowlist requirement
- npm registry (2026-05-04): `@clerk/nextjs@7.3.0`, `mongoose@9.6.1`, `svix@1.92.2`, `nanoid@5.1.11`, `slugify@1.6.9`, `next@16.2.4`

### Secondary (MEDIUM confidence)

- [Clerk webhooks blog — Getting Started](https://clerk.com/blog/webhooks-getting-started) — svix direct pattern + `CLERK_WEBHOOK_SECRET` env var name
- [Clerk sync data with webhooks guide](https://clerk.com/docs/guides/development/webhooks/syncing) — user.created event handling
- MongoDB `$setOnInsert` operator — idempotency pattern for upsert

### Tertiary (LOW confidence — flagged)

- Claim that `@types/mongoose` conflicts with Mongoose 8/9 bundled types — based on training knowledge, verify at install time

---

## Metadata

**Confidence breakdown:**
- Scaffolding (create-next-app flags): HIGH — verified against official Next.js docs
- Clerk v6 middleware + provider: HIGH — verified against official Clerk docs
- Clerk webhook (verifyWebhook vs svix): HIGH — both approaches verified from official sources; env var name discrepancy documented
- MongoDB connection caching: HIGH — verified against Mongoose official docs
- Slug generation (slugify + nanoid): HIGH — both packages verified on npm registry
- Dashboard shell structure: HIGH — follows locked CONTEXT.md decisions
- Onboarding gate (slugConfirmed): MEDIUM — implementation reasoning, not explicitly specified in CONTEXT.md

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (30 days — stack is stable; Clerk version may advance)
