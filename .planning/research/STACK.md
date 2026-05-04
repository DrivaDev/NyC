# Stack Research — Menú Digital

**Project:** Menú Digital (restaurant digital menu SaaS by Driva Dev)
**Researched:** 2026-05-04
**Mode:** Ecosystem — existing stack validated, patterns and gotchas investigated

---

## Recommended Versions

| Package | Recommended Version | Rationale |
|---|---|---|
| `next` | `^15.3.x` | Latest stable. App Router is mature. React 19 support included. |
| `react` / `react-dom` | `^19.1.0` | Required by Next.js 15.3+. Server Actions and async transitions are stable. |
| `@clerk/nextjs` | `^6.22.x` | Current major (v6). `auth()` is async in v6 — breaking from v5. `ClerkProvider` placement changed. |
| `mongoose` | `^8.x` | Compatible with Next.js 15. Mongoose 8 dropped Node <16. Use with connection caching pattern. |
| `cloudinary` (Node SDK) | `^2.x` | Used server-side only for signature generation. |
| `next-cloudinary` | `^6.17.x` | Current stable. Provides `CldImage` and `CldUploadWidget`. Wraps `@cloudinary/url-gen`. |
| `qrcode` | `^1.5.x` | Current stable. Full Node.js support: `toDataURL`, `toBuffer`, `toFile`, SVG string output. |
| `@types/qrcode` | `^1.5.x` | TypeScript types. Some Buffer overloads require `// @ts-ignore` — a known quirk. |
| `svix` | `^1.x` | Required for Clerk webhook signature verification. Clerk documentation mandates it. |
| `typescript` | `^5.x` | Assumed — Next.js 15 ships with TS5 support. |

**Confidence:** HIGH for Clerk v6 and Next.js 15 versions (confirmed from official Clerk quickstart repo `package.json`). MEDIUM for Mongoose 8 (no regressions reported, official docs confirm Next.js compatibility). HIGH for next-cloudinary 6.17 (npm registry confirmed).

---

## Integration Patterns

### 1. Clerk + Next.js App Router

#### Middleware (the security layer — everything flows through here)

Place `middleware.ts` at the project root (same level as `app/`). Use `clerkMiddleware` with `createRouteMatcher` to opt-in to protection. All routes are **public by default** — you must explicitly protect admin routes.

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
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

The public menu at `/menu/[slug]` requires NO entry in `isAdminRoute` — it stays public by default.

#### ClerkProvider placement (v6 change)

In Clerk v6, `ClerkProvider` must go **inside** `<html>` and `<body>`, not wrapping them. Wrapping the html element opts the entire app into dynamic rendering.

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
```

#### Reading auth in Server Components and Server Actions (v6: async)

`auth()` is async in v6. Always await it.

```typescript
// In a Server Component or Server Action
import { auth, currentUser } from '@clerk/nextjs/server'

// Lightweight — only returns userId and session claims (no extra fetch)
const { userId } = await auth()

// Heavy — makes a backend API call to get full user object
const user = await currentUser()
// Use user.id to cross-reference with your DB
```

Prefer `auth()` for authorization checks. Use `currentUser()` only when you need profile data like email or name.

#### Protecting Server Actions individually

Middleware protects pages and route handlers. Server Actions can be called from anywhere, so protect them explicitly:

```typescript
// lib/actions/dish.ts
'use server'
import { auth } from '@clerk/nextjs/server'

export async function createDish(data: DishInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  // proceed with DB write
}
```

#### Webhook endpoint for user sync to MongoDB

Clerk webhooks let you mirror user.created / user.updated / user.deleted into your own `restaurants` collection (to store slug, plan, etc.).

```typescript
// app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) throw new Error('Missing CLERK_WEBHOOK_SECRET')

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  // Use raw text body — JSON.parse then re-stringify breaks the signature
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
    // create Restaurant document linked to evt.data.id (Clerk userId)
  }

  return new Response('OK', { status: 200 })
}
```

**Critical gotcha:** The webhook route must be excluded from Clerk's own auth protection, otherwise the endpoint will reject Clerk's incoming request. Add it to a public-routes matcher or ensure the middleware does not call `auth.protect()` on it.

---

### 2. Mongoose + MongoDB Atlas (Multi-Tenant Schema)

#### Connection caching (mandatory for Next.js + Vercel)

Without this pattern, each serverless function invocation opens a new connection, exhausting Atlas's limit (500 on shared clusters). The global variable persists across warm invocations.

```typescript
// lib/db.ts
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
  var mongoose: MongooseCache
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null }
global.mongoose = cached

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,         // Low per-instance pool — prevents Atlas connection storms
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
```

Always call `await connectDB()` at the top of every Server Action, Route Handler, and Server Component that touches the DB.

#### Schema design for this project

Multi-tenancy approach: **shared collection, tenant-scoped by `restaurantId`** (Clerk's `userId` as the tenant key). This is MongoDB's recommended approach for SaaS at this scale — avoid collection-per-tenant (hits 10,000 collection limit) and database-per-tenant (overkill for a small SaaS).

```typescript
// models/Restaurant.ts
import { Schema, model, models } from 'mongoose'

const RestaurantSchema = new Schema({
  clerkUserId:  { type: String, required: true, unique: true, index: true },
  name:         { type: String, required: true },
  slug:         { type: String, required: true, unique: true, index: true },
  // slug is the public-facing identifier for /menu/[slug]
}, { timestamps: true })

export const Restaurant = models.Restaurant || model('Restaurant', RestaurantSchema)

// models/Category.ts
const CategorySchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name:         { type: String, required: true },
  order:        { type: Number, default: 0 },
}, { timestamps: true })

// models/Dish.ts
const DishSchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  categoryId:   { type: Schema.Types.ObjectId, ref: 'Category' },
  name:         { type: String, required: true },
  description:  String,
  price:        { type: Number, required: true },
  imageUrl:     String,   // Cloudinary public_id or full URL
  allergens:    [{ type: String }],  // e.g. ['gluten', 'lactose', 'nuts']
  available:    { type: Boolean, default: true },
}, { timestamps: true })

// Compound index for tenant-scoped queries
DishSchema.index({ restaurantId: 1, categoryId: 1 })
DishSchema.index({ restaurantId: 1, allergens: 1 })
```

**Model registration guard:** Always use `models.X || model('X', Schema)`. Without this, Next.js hot-reload re-registers models and throws `OverwriteModelError`.

**Allergens as string array vs. separate collection:** For v1, a flat string array on each `Dish` is correct. A separate `Allergen` collection adds complexity with no benefit until you need internationalization or custom allergen definitions per restaurant.

**Slug generation:** Generate slug from restaurant name with a nanoid suffix to guarantee uniqueness. Do not rely on mongoose-slug-generator plugins — they add complexity for a simple one-time generation on restaurant creation.

```typescript
import { nanoid } from 'nanoid'

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `${base}-${nanoid(6)}`
}
```

---

### 3. Cloudinary Upload Pattern

#### Two-layer architecture: `next-cloudinary` (client widget) + `cloudinary` (server signature)

Never expose `CLOUDINARY_API_SECRET` to the client. The signed upload flow is:

1. Client renders `CldUploadWidget` with `signatureEndpoint` pointing to your API route.
2. Before each upload, the widget calls your endpoint to get a signature.
3. Your endpoint signs the upload params using `cloudinary.utils.api_sign_request`.
4. Widget uploads directly to Cloudinary CDN (no file data passes through your server).

```typescript
// app/api/sign-cloudinary-params/route.ts
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@clerk/nextjs/server'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  const signature = cloudinary.utils.api_sign_request(
    body.paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )
  return Response.json({ signature })
}
```

```tsx
// components/DishImageUpload.tsx  ('use client')
'use client'
import { CldUploadWidget } from 'next-cloudinary'

interface Props {
  onUpload: (publicId: string) => void
}

export function DishImageUpload({ onUpload }: Props) {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/sign-cloudinary-params"
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
      onSuccess={(result) => {
        if (result.info && typeof result.info !== 'string') {
          onUpload(result.info.public_id)
        }
      }}
    >
      {({ open }) => (
        <button type="button" onClick={() => open()}>
          Subir imagen
        </button>
      )}
    </CldUploadWidget>
  )
}
```

#### Folder organization in Cloudinary

Use a consistent folder structure: `menu-digital/{restaurantId}/dishes/{public_id}`. Store only the `public_id` (not the full URL) in MongoDB — reconstruct URLs via `CldImage` at render time. This lets you run Cloudinary transformations without changing DB records.

```tsx
// Displaying a dish image
import { CldImage } from 'next-cloudinary'

<CldImage
  src={dish.imagePublicId}   // e.g. "menu-digital/abc123/dishes/tortilla"
  width={400}
  height={300}
  alt={dish.name}
  crop="fill"
/>
```

#### Environment variables for Cloudinary

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name   # exposed to client (needed by CldImage)
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset    # exposed to client (needed by widget)
CLOUDINARY_API_KEY=your_api_key                     # server only
CLOUDINARY_API_SECRET=your_api_secret               # server only — NEVER NEXT_PUBLIC_
```

---

### 4. QR Code Generation with `qrcode`

Generate QR codes **server-side** in a Server Action or Route Handler. The QR encodes the full public menu URL: `https://yourdomain.com/menu/{slug}`.

#### Recommended: return a data URL for in-browser preview + download

```typescript
// lib/actions/qr.ts
'use server'
import QRCode from 'qrcode'
import { auth } from '@clerk/nextjs/server'

export async function generateQRDataURL(slug: string): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/menu/${slug}`

  const dataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1C1917',   // --color-texto from brand
      light: '#FFF7ED',  // --color-fondo from brand
    },
  })

  return dataUrl  // "data:image/png;base64,..."
}
```

On the client, render the data URL in an `<img>` and provide an anchor with `download` attribute for the PNG download:

```tsx
// Client component showing QR
const dataUrl = await generateQRDataURL(restaurant.slug) // called from Server Component

<img src={dataUrl} alt="QR de tu menú" />
<a href={dataUrl} download={`qr-${restaurant.slug}.png`}>
  Descargar QR
</a>
```

#### SVG alternative (for higher quality print output)

```typescript
const svgString = await QRCode.toString(url, { type: 'svg' })
// Returns XML string — embed directly or serve as SVG download
```

SVG is ~2KB vs ~15KB for PNG and scales perfectly for printed menus. For the download experience, PNG is simpler (direct `<a download>`). Offer both.

---

### 5. Vercel Deployment Considerations

#### MongoDB Atlas: IP access must allow all IPs

Vercel uses dynamic, unpredictable IP addresses. You must add `0.0.0.0/0` to Atlas's IP Access List. Atlas will actually add this automatically when you use the official Vercel-MongoDB integration. This is the standard trade-off for serverless + Atlas: rely on auth (strong password + TLS) rather than IP allowlisting.

#### Environment variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
MONGODB_URI                             # Atlas connection string with credentials
CLERK_SECRET_KEY                        # Server-only
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY       # Client-safe
CLERK_WEBHOOK_SECRET                    # For svix verification
CLOUDINARY_API_KEY                      # Server-only
CLOUDINARY_API_SECRET                   # Server-only — never prefix with NEXT_PUBLIC_
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME       # Client-safe
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET    # Client-safe
NEXT_PUBLIC_BASE_URL                    # e.g. https://menudigital.app (for QR URL generation)
```

#### Fluid Compute and connection pooling

Vercel's Fluid Compute (enabled by default on Pro/Hobby) allows function instances to serve multiple requests concurrently, which means global state (the connection cache) is reused. Keep `maxPoolSize: 5` — if you see Atlas connection exhaustion, reduce to 3.

#### `maxDuration` for heavy operations

If a Cloudinary upload signature endpoint or QR generation ever times out (unlikely, but possible on cold starts), set `export const maxDuration = 30` in the route file. Default is 10s on Hobby, 60s on Pro.

---

## What NOT to Do

### Clerk

- **Do NOT use `authMiddleware` (deprecated)** — it was replaced by `clerkMiddleware` in v5/v6. Old tutorials still reference it.
- **Do NOT await `auth()` without the `async` modifier** — `auth()` is async in v6; calling it synchronously returns a Promise, not the Auth object.
- **Do NOT use `currentUser()` for authorization checks** — it makes an extra backend API call. Use `auth()` (which reads the session cookie) for cheap userId checks.
- **Do NOT pass the full `currentUser()` object to client components** — `privateMetadata` is in there and should not reach the browser.
- **Do NOT add the webhook endpoint (`/api/webhooks/clerk`) to protected routes** — Clerk's server calls it without a session cookie, so `auth.protect()` will reject every webhook.
- **Do NOT use `<Link prefetch>` pointing from a public page to a protected page** — the prefetch will hit the redirect and log confusing 401 errors. Use `prefetch={false}`.

### Mongoose / MongoDB

- **Do NOT define models at module level without the `models.X || model(...)` guard** — Next.js hot-reload re-executes module code and Mongoose throws `OverwriteModelError`.
- **Do NOT open a new connection on every request** — always use the connection caching pattern in `lib/db.ts`.
- **Do NOT use collection-per-tenant** — this hits Atlas's 10,000 collection performance boundary and complicates indexes.
- **Do NOT store Cloudinary full URLs in MongoDB** — store `public_id` only. Full URLs embed transformations and environment-specific hostnames.
- **Do NOT query dishes without the `restaurantId` filter** — every DB query touching dishes/categories must scope to the current `restaurantId`. Missing this is the #1 multi-tenant data leak vector.

### Cloudinary

- **Do NOT use unsigned upload presets in production** — any user can upload arbitrary content to your account. Always use signed uploads for the admin panel.
- **Do NOT set `CLOUDINARY_API_SECRET` as a `NEXT_PUBLIC_` variable** — it exposes your account to unrestricted uploads and deletions.
- **Do NOT upload files through your Next.js server** — the `CldUploadWidget` uploads directly to Cloudinary's CDN. Routing file bytes through your API route wastes bandwidth and hits Vercel's 4.5MB body size limit.
- **Do NOT store full Cloudinary delivery URLs in DB** — see Mongoose note above. Use `public_id` + `CldImage`.

### QR Code

- **Do NOT generate QR codes client-side with a `useEffect`** — it causes hydration flicker and is unnecessary since the slug is available server-side.
- **Do NOT hardcode the domain in QR URL** — use `NEXT_PUBLIC_BASE_URL` env var. Hardcoded domains break on preview deployments.
- **Do NOT use `toFile()` on Vercel** — Vercel's filesystem is read-only (except `/tmp`). Use `toDataURL()` or `toString({ type: 'svg' })` and return the result directly.

### Next.js App Router general

- **Do NOT mark the root `layout.tsx` as `'use client'`** — every page under it loses Server Component capabilities.
- **Do NOT call `connectDB()` inside a component body without `await`** — connection is async; fire-and-forget silently fails.
- **Do NOT use `useSearchParams()` in a Server Component** — it does not exist there. Use `searchParams` prop from the page instead.
- **Do NOT render user-specific data in a statically generated page** — `/menu/[slug]` can be ISR (revalidate on dish updates), but data must be per-restaurant, not globally cached across tenants.

---

## Confidence Levels

| Area | Confidence | Basis |
|---|---|---|
| Clerk v6 API (`auth()` async, `clerkMiddleware`, `ClerkProvider` placement) | HIGH | Official Clerk docs + confirmed package.json from official quickstart repo |
| Middleware matcher pattern for static assets | HIGH | Official Next.js + Clerk documentation |
| Webhook verification with svix (raw body, header extraction) | HIGH | Official Clerk webhook docs, multiple confirmed community guides |
| Mongoose connection caching pattern | HIGH | Official Mongoose Next.js docs + Vercel knowledge base |
| Multi-tenant single-collection pattern (`restaurantId` field) | HIGH | Official MongoDB Atlas multi-tenant architecture docs |
| Model re-registration guard (`models.X || model(...)`) | HIGH | Confirmed in Mongoose official Next.js docs |
| `next-cloudinary` v6 + `CldUploadWidget` signed upload | HIGH | Official next-cloudinary docs, npm registry version confirmed |
| Cloudinary folder/public_id storage pattern | MEDIUM | Official docs + community patterns — no single canonical guide |
| `qrcode` `toDataURL` server-side in Server Actions | MEDIUM | npm package confirmed; dynamic import in server context has minor community reports of edge cases — test early |
| `toFile()` disabled on Vercel read-only filesystem | MEDIUM | Vercel filesystem docs (read-only confirmed) + `/tmp` workaround documented |
| Atlas `0.0.0.0/0` requirement for Vercel | HIGH | Official MongoDB Atlas + Vercel integration docs explicitly state this |
| `maxPoolSize: 5` recommendation | MEDIUM | Vercel knowledge base guidance + community consensus; exact number depends on concurrent function instances |

---

## Sources

- [Clerk Next.js App Router Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [clerkMiddleware() Reference](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Sync Clerk data with webhooks](https://clerk.com/docs/guides/development/webhooks/syncing)
- [Upgrade to @clerk/nextjs v6](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/nextjs-v6)
- [Official Clerk Next.js App quickstart repo (package.json)](https://github.com/clerk/clerk-nextjs-app-quickstart)
- [Mongoose with Next.js — official docs](https://mongoosejs.com/docs/nextjs.html)
- [MongoDB Atlas multi-tenant architecture](https://www.mongodb.com/docs/atlas/build-multi-tenant-arch/)
- [Connection Pooling with Vercel Functions](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [next-cloudinary npm](https://www.npmjs.com/package/next-cloudinary)
- [CldUploadWidget Signed Uploads](https://next.cloudinary.dev/clduploadwidget/signed-uploads)
- [Upload Assets with Server Actions in Next.js (Cloudinary tutorial)](https://cloudinary.com/documentation/upload_assets_with_server_actions_nextjs_tutorial)
- [qrcode npm package](https://www.npmjs.com/package/qrcode)
- [MongoDB Atlas + Vercel integration](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/)
- [Common mistakes with Next.js App Router — Vercel blog](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [Skip Next.js middleware for static files — Clerk blog](https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files)
