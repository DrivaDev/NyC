# Architecture Research — Menú Digital

**Domain:** Restaurant digital menu SaaS (QR-based, read-only public surface + private admin panel)
**Researched:** 2026-05-04
**Overall confidence:** HIGH — all major decisions backed by official docs or verified sources

---

## Route Structure

### Folder layout (App Router)

Use **route groups** to separate the two surfaces. Route groups wrap a folder in `(parentheses)` and are excluded from the URL — they exist purely for organisation and to attach different layouts.

```
app/
├── (admin)/
│   ├── layout.tsx          ← AdminLayout: sidebar, Clerk UserButton, nav
│   └── dashboard/
│       ├── page.tsx        ← Dashboard home
│       ├── dishes/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/edit/page.tsx
│       ├── categories/
│       │   └── page.tsx
│       └── qr/
│           └── page.tsx
├── (public)/
│   ├── layout.tsx          ← Minimal layout (no auth UI)
│   └── menu/
│       └── [slug]/
│           └── page.tsx    ← Public menu, SSR, no auth
├── (marketing)/
│   └── page.tsx            ← Landing page (/)
├── sign-in/
│   └── [[...sign-in]]/page.tsx   ← Clerk hosted sign-in
├── sign-up/
│   └── [[...sign-up]]/page.tsx   ← Clerk hosted sign-up
└── api/
    └── qr/
        └── route.ts        ← QR PNG download endpoint (GET)
```

**Why this layout:**
- `(admin)` and `(public)` share no layout; the admin gets navigation chrome, the public menu gets a clean blank shell.
- `/menu/[slug]` is explicitly public — no Clerk context needed.
- `/sign-in` and `/sign-up` use Clerk's catch-all pattern `[[...sign-in]]`.
- The only Route Handler needed is `GET /api/qr` for binary PNG download; everything else uses Server Actions.

---

### Clerk Middleware

Clerk's `clerkMiddleware()` is opt-in by default — all routes are public unless you explicitly protect them. Use `createRouteMatcher` to lock down `/dashboard` only.

**`middleware.ts` (root level):**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtected = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isProtected(req)) {
    auth().protect()   // redirects unauthenticated users to sign-in
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

**Key points:**
- `auth().protect()` redirects to Clerk's sign-in page automatically.
- `/menu/[slug]` is intentionally never added to `isProtected` — public access is the default.
- The matcher regex skips static assets so Clerk does not run on image/font requests.
- Confidence: HIGH (from Clerk official docs).

---

### Server Actions vs Route Handlers

| Operation | Mechanism | Reason |
|-----------|-----------|--------|
| Create dish | Server Action | Internal mutation, form submission, type-safe |
| Edit dish | Server Action | Same |
| Delete dish | Server Action | Same |
| Create category | Server Action | Same |
| Reorder categories | Server Action | Same |
| Upload Cloudinary signature | Server Action | Needs API secret, must stay server-side |
| Download QR as PNG | Route Handler (`GET /api/qr`) | Returns binary buffer, needs `Content-Disposition` header |
| Read menu for public | Server Component data fetch | `async` Server Component calls DB directly, no API layer needed |

**Rule:** Use Server Actions for all writes. Use Server Components for all reads. The only Route Handler is `/api/qr` because it returns a binary PNG with `Content-Disposition: attachment`.

After every mutation, call `revalidatePath('/dashboard/dishes')` (or the relevant segment) inside the Server Action so the router re-fetches fresh data.

---

## Data Model Design

### Multi-tenant scoping strategy

Use a **shared-collection, userId-scoped** model. Every document that belongs to a restaurant carries the `ownerId` field (the Clerk `userId` string), and every query filters by it. This is the correct pattern for this scale — no separate databases or collections per tenant.

**Why `ownerId` and not a separate `Restaurant` ObjectId?**
For v1, the Clerk `userId` is the tenant key. This avoids an extra round-trip to resolve a Restaurant document before every query. When the data model needs a Restaurant-level profile (custom branding, plan tier, etc.), add a `Restaurant` collection then — but don't over-engineer it now.

---

### Schema hierarchy

```
Restaurant (one per Clerk user)
  └── Category (many per restaurant)
        └── Dish (many per category)
              └── Allergen refs (embedded array of strings, not a separate collection)
```

**Allergens as embedded strings, not a collection:** Allergens are a finite, globally-known list (gluten, lactose, nuts, etc.). Store them as an array of enum strings inside the Dish document. Do not normalise them into a separate collection — it adds joins for no benefit.

---

### Mongoose schemas

#### Restaurant

```typescript
const RestaurantSchema = new Schema({
  ownerId:     { type: String, required: true, unique: true }, // Clerk userId
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String },
  createdAt:   { type: Date, default: Date.now },
})

RestaurantSchema.index({ ownerId: 1 })   // dashboard lookups
RestaurantSchema.index({ slug: 1 })      // public menu lookups — most critical
```

#### Category

```typescript
const CategorySchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name:         { type: String, required: true },
  order:        { type: Number, default: 0 },
})

CategorySchema.index({ restaurantId: 1, order: 1 })  // sorted list per restaurant
```

#### Dish

```typescript
const ALLERGEN_LIST = [
  'gluten', 'lactose', 'eggs', 'nuts', 'peanuts',
  'soy', 'fish', 'shellfish', 'sesame', 'mustard',
  'celery', 'sulphites', 'lupin', 'molluscs',
] as const

const DishSchema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  categoryId:   { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name:         { type: String, required: true },
  description:  { type: String },
  price:        { type: Number, required: true },  // store as cents (integer), display as currency
  imageUrl:     { type: String },                  // Cloudinary secure_url
  imagePublicId:{ type: String },                  // Cloudinary public_id (for deletion)
  allergens:    { type: [String], enum: ALLERGEN_LIST, default: [] },
  available:    { type: Boolean, default: true },
  order:        { type: Number, default: 0 },
})

DishSchema.index({ restaurantId: 1, categoryId: 1 })  // public menu query
DishSchema.index({ restaurantId: 1, available: 1 })   // filter hidden dishes
```

**Price as integer cents:** Never store currency as a float. `1250` = €12.50. Avoids floating-point rounding errors. Display with `/100` and `toFixed(2)`.

---

### Slug generation

Generate the slug from the restaurant name at creation time with `slugify`, then append a short random suffix from `nanoid` to guarantee uniqueness without a retry loop.

```typescript
import slugify from 'slugify'
import { nanoid } from 'nanoid'

function generateSlug(name: string): string {
  const base = slugify(name, { lower: true, strict: true })
  const suffix = nanoid(6)   // e.g. "abc123"
  return `${base}-${suffix}` // e.g. "la-parrilla-abc123"
}
```

**Why this approach:**
- Pure algorithmic, no DB read needed to check uniqueness.
- `nanoid(6)` gives 56 billion combinations — collision probability negligible.
- The `unique: true` index on `slug` is a final safety net.
- The slug is set once at registration and never changes (QR codes are printed).

---

### Critical indexes summary

| Collection | Index | Reason |
|------------|-------|--------|
| Restaurant | `{ slug: 1 }` unique | Every public menu load queries by slug |
| Restaurant | `{ ownerId: 1 }` unique | Dashboard: find restaurant for current user |
| Category | `{ restaurantId: 1, order: 1 }` | Sorted category list on public menu and dashboard |
| Dish | `{ restaurantId: 1, categoryId: 1 }` | Public menu: all dishes grouped by category |
| Dish | `{ restaurantId: 1, available: 1 }` | Filter hidden dishes on public menu |

Define indexes in the Mongoose schema (`SchemaName.index(...)`) — Mongoose syncs them on connect with `autoIndex: true` (default). Disable `autoIndex` in production and manage indexes via Atlas UI or migrations.

---

### MongoDB connection singleton (Vercel serverless)

```typescript
// lib/db.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!
let cached = global.mongoose ?? { conn: null, promise: null }

export async function dbConnect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }
  cached.conn = await cached.promise
  return cached.conn
}
```

Call `await dbConnect()` at the top of every Server Action and Server Component that touches the database. Mongoose's internal connection pool handles the rest. Do not close the connection after each request — closing causes connection storms on Vercel.

---

## Image Upload Flow

### Recommended: Signed upload with Server Action

**Never use unsigned uploads for a SaaS.** Unsigned presets allow anyone with the preset name to upload unlimited media to your Cloudinary account. For an admin panel behind Clerk auth, signed uploads are the correct default.

**Flow:**

```
1. User selects file in browser (Client Component)
2. Client requests signature → Server Action generateUploadSignature()
   - Action calls Cloudinary's sign() with timestamp + folder + upload_preset
   - Returns { signature, timestamp, api_key, cloudName, folder }
3. Client POSTs file directly to Cloudinary Upload API
   - Endpoint: https://api.cloudinary.com/v1_1/{cloudName}/image/upload
   - Params: file, signature, timestamp, api_key, folder
4. Cloudinary returns { secure_url, public_id }
5. Client sends secure_url + public_id → Server Action saveDishImage()
   - Action writes both fields to the Dish document
```

**Why client-to-Cloudinary (not server proxy):**
Uploading through your own server doubles bandwidth cost and adds latency. The signed upload pattern keeps the secret on the server (for signing only) while letting Cloudinary handle the actual binary transfer.

**Cloudinary folder per restaurant:**

```typescript
const folder = `menu-digital/${restaurantId}/dishes`
```

This keeps each tenant's images isolated in the Cloudinary media library and makes bulk deletion (when a restaurant cancels) trivial.

**Storing both `imageUrl` and `imagePublicId`:**
- `imageUrl` (the `secure_url`) is what you display in `<img>` or `<CldImage>`.
- `imagePublicId` is needed to delete the old image from Cloudinary when a dish is updated or deleted. Without it you accumulate orphaned assets.

**On dish delete:** Call Cloudinary's `destroy` API with the `public_id` before or after the MongoDB document delete.

---

## QR Code Strategy

### Generate on-demand, do not store

The QR code encodes a static URL: `https://yourdomain.com/menu/{slug}`. This URL never changes after restaurant creation. Therefore:

- There is no value in storing the QR as an image (it would never be stale).
- Generate it on-demand in a Route Handler — the compute cost is negligible (< 5ms).
- Storing it (in Cloudinary or MongoDB) wastes storage and adds a step with no benefit.

**Route Handler: `app/api/qr/route.ts`**

```typescript
import QRCode from 'qrcode'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return new NextResponse('Missing slug', { status: 400 })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/menu/${slug}`

  const buffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#1C1917', light: '#FFF7ED' },  // Driva Dev brand colors
  })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr-${slug}.png"`,
    },
  })
}
```

**Dashboard QR page:** Render a preview using `QRCode.toDataURL()` client-side (or via a Server Component fetching the data URL) for the visual preview. The download button hits `GET /api/qr?slug={slug}` which triggers the browser download.

**Why a Route Handler (not a Server Action) for QR download:**
Server Actions cannot return a binary file response with custom headers. Route Handlers return a proper `NextResponse` with `Content-Disposition: attachment` which the browser interprets as a file download.

---

## Suggested Build Order

Dependencies drive order. You cannot build dishes without categories; you cannot build the public menu without dishes.

### Phase 1 — Foundation (scaffolding, auth, DB)
1. Init Next.js project, configure Tailwind with Driva Dev design tokens
2. Install and configure Clerk — middleware, sign-in/sign-up pages
3. Set up MongoDB Atlas, Mongoose connection singleton (`lib/db.ts`)
4. Create `Restaurant` schema + slug generation utility
5. Post-registration hook: auto-create a Restaurant document for new Clerk users (Clerk webhook or `useEffect` on first dashboard load)

### Phase 2 — Admin panel core
6. Dashboard shell layout (sidebar, nav, Clerk `<UserButton>`)
7. Category CRUD (simpler schema, no images — good first Server Action practice)
8. Dish CRUD without images (name, price, description, allergens, category assignment)
9. Cloudinary integration — signed upload flow for dish images

### Phase 3 — Public menu
10. `GET /menu/[slug]` Server Component — fetch restaurant + categories + dishes
11. Category filter UI (client-side state, no DB round-trip)
12. Allergen filter UI

### Phase 4 — QR
13. QR preview on dashboard (`/dashboard/qr`)
14. `GET /api/qr` Route Handler for PNG download

### Phase 5 — Polish
15. Empty states, loading skeletons, error boundaries
16. Responsive QR page for mobile admin
17. Brand consistency audit (Driva Dev colors, typography, footer)

**Build the database layer before the UI.** Confirm schemas and indexes work with real data before connecting them to Server Actions. This surfaces data model issues early.

---

## Component Boundaries

### Server Components (default — no `'use client'`)

| Component | Location | Why server |
|-----------|----------|-----------|
| `DishList` | `/dashboard/dishes/page.tsx` | Reads directly from MongoDB, no interactivity |
| `CategoryList` | `/dashboard/categories/page.tsx` | Same |
| `PublicMenu` | `/menu/[slug]/page.tsx` | SSR for SEO and performance, read-only |
| `QRPreview` (data URL generation) | `/dashboard/qr/page.tsx` | Can call `qrcode.toDataURL` server-side |

### Client Components (`'use client'`)

| Component | Location | Why client |
|-----------|----------|-----------|
| `DishForm` | `components/dishes/DishForm.tsx` | File input, preview state, form validation |
| `ImageUploader` | `components/ui/ImageUploader.tsx` | Manages upload state, calls Cloudinary directly |
| `CategoryFilter` | `components/menu/CategoryFilter.tsx` | Click state to filter displayed dishes |
| `AllergenFilter` | `components/menu/AllergenFilter.tsx` | Click state for allergen exclusion |
| `DeleteConfirmDialog` | `components/ui/DeleteConfirmDialog.tsx` | Modal state |

### Rule: Push client boundary as deep as possible

The page-level component (`page.tsx`) is always a Server Component that fetches data. Pass data down as props to the smallest interactive leaf that actually needs client state. Example:

```
page.tsx (Server) → DishList (Server) → DishRow (Server) → DeleteButton (Client)
```

The `DeleteButton` triggers a Server Action. The rest of the tree stays server-rendered.

---

### Key shared utilities

| Utility | Path | Purpose |
|---------|------|---------|
| `dbConnect` | `lib/db.ts` | Mongoose connection singleton |
| `generateSlug` | `lib/slug.ts` | Slug generation (slugify + nanoid) |
| `generateUploadSignature` | `lib/cloudinary.ts` | Sign Cloudinary uploads (server-only) |
| Mongoose models | `models/Restaurant.ts`, `models/Category.ts`, `models/Dish.ts` | Schema definitions |
| Design tokens | `tailwind.config.ts` | Driva Dev brand colors as Tailwind custom colors |

---

## Pitfall Callouts

1. **Cloudinary `imagePublicId` missing from schema** — Without storing the `public_id`, you cannot delete images when dishes are updated or deleted. Always persist both `imageUrl` and `imagePublicId`.

2. **`autoIndex: true` in production** — Mongoose syncs indexes on every connect. Under load this causes startup delays. Set `autoIndex: false` in production and manage indexes via Atlas.

3. **Price stored as float** — Use integer cents. `price: 12.50` in MongoDB rounds incorrectly in display math. Use `1250` and format on render.

4. **Slug mutation** — Never allow the slug to change after creation. QR codes are static; if the slug changes, every printed QR breaks.

5. **Missing `ownerId` filter on dashboard queries** — Every query touching the dashboard must include `{ restaurantId }` or `{ ownerId }` scope. A missing filter leaks another tenant's data. Add this check in code review.

6. **Signing Cloudinary requests in a Client Component** — The `CLOUDINARY_API_SECRET` must never appear in a Client Component or be passed to `NEXT_PUBLIC_*` env vars. The signing step must remain in a Server Action.

---

## Sources

- Next.js route groups: [File-system conventions: Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- Clerk middleware: [clerkMiddleware() reference](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- Clerk skip static files: [How to skip Next.js middleware for static files](https://clerk.com/blog/skip-nextjs-middleware-static-and-public-files)
- Server Actions vs Route Handlers: [makerkit.dev comparison](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers)
- revalidatePath pattern: [Next.js mutating data docs](https://nextjs.org/learn/dashboard-app/mutating-data)
- MongoDB multi-tenant: [MongoDB Atlas multi-tenant docs](https://www.mongodb.com/docs/atlas/build-multi-tenant-arch/)
- Mongoose + Next.js connection: [Mongoose Next.js guide](https://mongoosejs.com/docs/nextjs.html)
- Cloudinary signed uploads: [Cloudinary blog — signed uploads in Next.js](https://cloudinary.com/blog/guest_post/signed-uploads-in-cloudinary-with-next-js)
- Cloudinary Server Actions upload: [Cloudinary docs — upload with server actions](https://cloudinary.com/documentation/upload_assets_with_server_actions_nextjs_tutorial)
- qrcode npm: [soldair/node-qrcode GitHub](https://github.com/soldair/node-qrcode)
