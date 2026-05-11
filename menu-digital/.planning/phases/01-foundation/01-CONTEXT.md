# Phase 1 Context — Foundation

**Phase:** 1 — Foundation
**Date:** 2026-05-04
**Status:** Ready for planning

---

<domain>
## Domain

Phase 1 delivers the backbone every other feature depends on: a working Next.js App Router project with Clerk v6 authentication, a MongoDB Atlas connection singleton safe for Vercel serverless, and the Restaurant document with permanent slug creation.

**When Phase 1 is done:**
- A restaurant owner can register, log in, stay logged in, and sign out
- A `Restaurant` document exists in MongoDB with an immutable unique slug
- The project structure is scaffolded for all future phases to build on

**Requirements in scope:** AUTH-01, AUTH-02, AUTH-03, REST-01, REST-02
**Out of scope for this phase:** any menu content (categories, dishes, images, QR)
</domain>

---

<decisions>
## Decisions

### Restaurant Document Creation
**Decision:** Create the Restaurant document via a **Clerk webhook** (`POST /api/webhooks/clerk`), not on first dashboard load.
- Event to handle: `user.created`
- Webhook must be public (not Clerk-protected) — Clerk's server has no session cookie
- Raw body must be passed to `svix.verify()` without JSON parsing (signature breaks otherwise)
- Add idempotency: `await Restaurant.findOneAndUpdate({ clerkId: userId }, {...}, { upsert: true })`
- For local development: use `ngrok` or `cloudflare tunnel` to expose the endpoint
- Package: `svix` npm package for webhook verification

### Slug Generation UX
**Decision:** **Auto-generate slug from restaurant name with preview and confirm** before the first save.
- Algorithm: `slugify(restaurantName, { lower: true }) + '-' + nanoid(6)`
- Example: "La Trattoria" → `la-trattoria-x8k2mq` → URL: `menudig.com.ar/menu/la-trattoria-x8k2mq`
- UX flow: After name entry, show preview "Tu menú estará en: menudig.com.ar/menu/[generated-slug]" with option to edit before confirming
- Slug is editable ONLY before the first confirm — once the Restaurant document is saved, slug is immutable
- Validation: URL-safe characters only, max 60 chars, must be unique (retry with new nanoid suffix on MongoDB duplicate key error)
- Do NOT expose a slug-update endpoint

### Project Scaffolding
**Decision:** Standard Next.js App Router structure — **no `src/` directory**, TypeScript strict mode.
```
app/
  (admin)/
    layout.tsx          ← dashboard shell with sidebar
    dashboard/
      page.tsx          ← main dashboard
  (public)/
    layout.tsx          ← minimal public layout
    menu/[slug]/
      page.tsx          ← public menu (Phase 3)
  (marketing)/
    page.tsx            ← landing page (Phase 4)
  sign-in/[[...sign-in]]/
    page.tsx
  sign-up/[[...sign-up]]/
    page.tsx
  api/
    webhooks/
      clerk/
        route.ts        ← Clerk webhook (public, Svix verified)
    qr/
      route.ts          ← QR download (Phase 3)
    sign-cloudinary-params/
      route.ts          ← Cloudinary signing (Phase 2)
lib/
  dbConnect.ts          ← Mongoose global connection cache
  utils.ts              ← shared utilities (slug generation, etc.)
models/
  Restaurant.ts
  Category.ts           ← scaffold now, implement Phase 2
  Dish.ts               ← scaffold now, implement Phase 2
components/
  ui/                   ← shared UI primitives (Button, Badge, Input, etc.)
  dashboard/            ← dashboard-specific components
actions/                ← Server Actions (Phase 2+)
```

### Dashboard Shell Scope
**Decision:** Scaffold the **full navigation structure** in Phase 1, with Phase 2+ items visible but disabled/placeholder.
- Sidebar includes: Dashboard (active), Categorías (disabled), Platos (disabled), Mi QR (disabled)
- This prevents nav refactors when Phase 2 builds on top
- Phase 1 dashboard page shows: restaurant name, slug preview, "Menú en: menudig.com.ar/menu/[slug]" link (disabled until Phase 3)
- Brand tokens (colors, font) applied from the start — no white-labeling, Driva Dev palette from day one

### Clerk v6 Specifics (Locked by Research)
- Use `clerkMiddleware` (NOT `authMiddleware` — removed in Core 2)
- `auth()` must be `await`-ed in every Server Component and Server Action
- `ClerkProvider` goes inside `<body>`, not wrapping `<html>`
- Only `/dashboard(.*)` is explicitly protected — all other routes public by default
- Sign-in: `app/sign-in/[[...sign-in]]/page.tsx` with Clerk's `<SignIn />` component
- Sign-up: `app/sign-up/[[...sign-up]]/page.tsx` with Clerk's `<SignUp />`
- After sign-in/up redirect: `/dashboard`

### MongoDB Connection (Locked by Research)
```typescript
// lib/dbConnect.ts
import mongoose from 'mongoose'

declare global {
  var mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

const MONGODB_URI = process.env.MONGODB_URI!
let cached = global.mongoose ?? { conn: null, promise: null }
global.mongoose = cached

export async function dbConnect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { maxPoolSize: 5 })
  }
  cached.conn = await cached.promise
  return cached.conn
}
```
- Atlas IP allowlist: `0.0.0.0/0` (required for Vercel — no static IPs)
- `autoIndex: false` in production — manage indexes via Atlas UI

### Restaurant Mongoose Model
```typescript
// models/Restaurant.ts
const RestaurantSchema = new Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
}, { timestamps: true })

// Immutability enforced at application layer — no update endpoint for slug
```

### Environment Variables (Phase 1)
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...       ← from Clerk dashboard after creating webhook
MONGODB_URI=...                 ← MongoDB Atlas connection string
NEXT_PUBLIC_APP_URL=https://menudig.com.ar   ← production domain
```

### Mongoose Model Registration Guard
```typescript
// Pattern used in ALL model files
export const Restaurant = models.Restaurant || model('Restaurant', RestaurantSchema)
```
Required to prevent `OverwriteModelError` on Next.js hot reload.

</decisions>

---

<canonical_refs>
## Canonical References

Downstream agents MUST read these before planning or implementing:

- `.planning/PROJECT.md` — project context, brand identity, tech stack
- `.planning/REQUIREMENTS.md` — AUTH-01..03, REST-01..02 are in scope
- `.planning/research/STACK.md` — Clerk v6 patterns, Mongoose caching, library versions
- `.planning/research/ARCHITECTURE.md` — route structure, middleware config, data model
- `.planning/research/PITFALLS.md` — 16 named pitfalls; Phase 1 section is highest priority
- `.planning/research/SUMMARY.md` — synthesized findings and build order

No external ADRs or specs. All architectural decisions are captured above and in the research files.
</canonical_refs>

---

<code_context>
## Code Context

**Existing codebase:** None — greenfield project. No reusable components, no existing patterns.

**Starting point:** `create-next-app` with TypeScript, Tailwind CSS, App Router, ESLint.

**Key packages to install at scaffold time:**
```bash
npm install @clerk/nextjs mongoose svix nanoid slugify
npm install -D @types/mongoose
```

**Tailwind config must include Driva Dev tokens from day one:**
```typescript
// tailwind.config.ts
colors: {
  brand: {
    principal: '#EA580C',
    titulares: '#9A3412',
    acento: '#FED7AA',
    fondo: '#FFF7ED',
    texto: '#1C1917',
  }
}
```

**Google Fonts (Fira Sans) in `app/layout.tsx`:**
```typescript
import { Fira_Sans } from 'next/font/google'
const firaSans = Fira_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })
```
</code_context>

---

<deferred>
## Deferred Ideas

*(Nothing deferred — all suggestions aligned with phase scope)*
</deferred>
