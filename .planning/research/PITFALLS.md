# Pitfalls Research — Menú Digital

**Domain:** Multi-tenant restaurant menu SaaS
**Stack:** Next.js App Router + MongoDB Atlas + Clerk + Cloudinary + Vercel
**Researched:** 2026-05-04
**Overall confidence:** HIGH (all pitfalls verified against official docs or official community threads)

---

## Clerk + Next.js App Router

### Pitfall: Using the deprecated `authMiddleware` instead of `clerkMiddleware`

- **Warning signs:** Autocomplete suggests `authMiddleware` from older tutorials; copy-paste from pre-2024 blog posts; routes that should be public get redirected to sign-in, or vice-versa.
- **Prevention:** Always import `clerkMiddleware` and `createRouteMatcher` from `@clerk/nextjs/server`. The old `authMiddleware` is removed in Core 2 and will throw a runtime error on recent SDK versions. Critical behavior difference: `clerkMiddleware` makes **all routes public by default** — you must explicitly call `auth.protect()` for protected routes. The old `authMiddleware` did the opposite (protected everything by default). Starting with the wrong mental model breaks the entire auth layer silently.
- **Phase to address:** Phase 1 (Auth setup). Get the middleware contract right before any other route is built.

---

### Pitfall: Middleware not running on the `/menu/[slug]` public route

- **Warning signs:** Public menu shows a Clerk sign-in redirect in production but works locally; or middleware file is in `/src/middleware.ts` but the matcher only covers `/dashboard`.
- **Prevention:** The default Next.js middleware matcher excludes `_next/static`, `_next/image`, and asset files — but your `middleware.ts` matcher must explicitly include `/menu/(.*)` as a public pattern. Use `createRouteMatcher(['/menu/(.*)'])` and skip `auth.protect()` for those paths. Verify the middleware file is at the correct root (`/middleware.ts` or `/src/middleware.ts` depending on your project structure — mixing both causes only one to be picked up).
- **Phase to address:** Phase 1 (Auth setup). Write a smoke test hitting `/menu/test-slug` without a session to confirm it returns 200 before moving on.

---

### Pitfall: Relying on middleware alone for dashboard route protection

- **Warning signs:** Server Actions in `/dashboard` routes can be called directly via HTTP POST without going through the page; no `auth()` call inside individual route handlers or server actions.
- **Prevention:** Middleware is the front-door check, not the security guarantee. Every Server Action and Route Handler under `/dashboard` must independently call `const { userId } = await auth()` (or `auth.protect()`) at the top. Next.js Server Actions are independent HTTP endpoints — a direct POST bypasses all page-level middleware checks entirely. This is the Data Access Layer pattern: verify identity at the point of data access, not only at the routing layer.
- **Phase to address:** Phase 2 (Dashboard CRUD). Establish a `requireAuth()` utility in the first server action and reuse it everywhere.

---

### Pitfall: Clerk webhook — skipping Svix signature verification

- **Warning signs:** Webhook handler is a simple POST route that reads `req.body` and immediately writes to MongoDB, with no verification step. Works fine locally (no real webhooks) but is exploitable in production.
- **Prevention:** Install the `svix` package and verify every incoming webhook using the three Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`) before touching the database. Store the webhook signing secret in an environment variable. Without this check, any attacker knowing your webhook URL can inject fake `user.created` events, delete users from your DB, or corrupt tenant records.
- **Phase to address:** Phase 1 (Auth setup). The webhook handler is part of the auth integration and must be secured before the first real user signup.

---

### Pitfall: Webhook delivers the same event twice (no idempotency)

- **Warning signs:** Duplicate restaurant records in MongoDB for the same Clerk user ID; occasional duplicate errors in logs.
- **Prevention:** Svix uses at-least-once delivery — the same event can arrive multiple times. Use MongoDB `upsert` (`findOneAndUpdate` with `upsert: true`) on `clerkId` when syncing the user, never a plain `insertOne`. This makes the operation idempotent regardless of how many times the webhook fires.
- **Phase to address:** Phase 1 (Auth setup). Write the webhook handler with upsert from day one; retrofitting is easy to miss.

---

## MongoDB Atlas + Vercel (Serverless)

### Pitfall: Opening a new Mongoose connection on every serverless invocation

- **Warning signs:** Each API route call takes 800ms+ due to TCP handshake; MongoDB Atlas dashboard shows connection count spiking then dropping; `MongooseError: Can't call openUri() after connection was opened` errors in logs.
- **Prevention:** Use the global connection cache pattern. Store the Mongoose connection (and a `isConnected` flag) on the Node.js `global` object so it survives between warm invocations of the same function instance. The pattern is: check `global.mongoose?.conn` — if it exists and is connected, reuse it; otherwise connect and cache it. Set `maxPoolSize: 5` to avoid overwhelming Atlas with connections from multiple concurrent function instances. Also set `bufferCommands: false` so Mongoose does not silently queue operations while disconnected.
- **Phase to address:** Phase 1 (Foundation). Create a `lib/dbConnect.ts` utility before the first database call is written. Every API route/server action imports this function.

---

### Pitfall: Atlas M0 free tier 500-connection limit exhausted by Vercel functions

- **Warning signs:** Intermittent `MongoServerSelectionError` in production under moderate traffic; Atlas "Current Connections" metric at or near 500; errors clear up after periods of inactivity.
- **Prevention:** The M0 free cluster allows 500 max connections. Each Vercel function instance can hold its own connection. Under concurrent load (e.g., many simultaneous `/menu/[slug]` requests), you can exhaust connections fast. Keep `maxPoolSize` at 5 or below. For the public menu route specifically, use ISR/static rendering so it does not hit the database at all on most requests. If you outgrow M0 during testing, upgrade to M2/M5 before any public launch.
- **Phase to address:** Phase 1 (Foundation). Set `maxPoolSize: 5` in the dbConnect utility from the start. Phase 3 (Public menu) — switch menu route to ISR to eliminate the connection pressure entirely.

---

### Pitfall: MongoDB Atlas IP Allowlist blocking Vercel production deploys

- **Warning signs:** App works perfectly in local development but returns `MongoServerSelectionError: connection <monitor> to X.X.X.X closed` in Vercel production; error appears only on first request (cold start).
- **Prevention:** Vercel functions use dynamic, unpredictable egress IPs. You cannot whitelist a specific IP range. The only workable solution for Vercel + Atlas is to allow all IPs (`0.0.0.0/0`) in the Atlas Network Access list. This means IP-based access control is effectively disabled — your security model shifts entirely to the strong Atlas username/password authentication in the connection string. Store the connection string in Vercel environment variables, never in code or `.env` committed to git.
- **Phase to address:** Phase 1 (Foundation). Confirm the `0.0.0.0/0` allowlist is set in Atlas before the first Vercel deploy. This blocks development otherwise.

---

## Multi-Tenant Data Isolation

### Pitfall: Forgetting to scope database queries to the authenticated restaurant's `clerkId`

- **Warning signs:** A restaurant owner can see (or modify) another restaurant's dishes by changing the `restaurantId` parameter in a request; API routes accept `restaurantId` from the request body without validating it matches the session.
- **Prevention:** Never trust the `restaurantId` (or any tenant identifier) from the client. Always derive the tenant scope from the server-side session: `const { userId } = await auth()`, then use that `userId` as the mandatory filter on every query (`Dish.find({ clerkId: userId })`). The client has no say in which tenant's data is returned. Consider a Mongoose pre-find middleware hook that automatically injects the tenant filter to create a structural guardrail.
- **Phase to address:** Phase 2 (Dashboard CRUD). Establish this pattern in the very first dish endpoint and code-review every subsequent query for the `clerkId` filter before merging.

---

### Pitfall: Missing indexes on `/menu/[slug]` query path

- **Warning signs:** Public menu loads slowly (>500ms) under normal traffic; MongoDB Atlas Performance Advisor flags collection scans on the `restaurants` and `dishes` collections; the problem is invisible with a small dataset but degrades linearly as dishes grow.
- **Prevention:** Add a unique index on `Restaurant.slug` (the field used to resolve the menu URL) at schema definition time. Add a compound index on `Dish` for `{ restaurantId: 1, category: 1 }` to support the category filter without a collection scan. These indexes should be defined in Mongoose schema options (`index: true` / `unique: true`), not manually added later.
- **Phase to address:** Phase 2 (Restaurant model) for the slug index; Phase 3 (Public menu) for the dish compound index. Do not wait for performance complaints — add indexes when the schema is first created.

---

### Pitfall: Slug collision — two restaurants claiming the same slug

- **Warning signs:** Second restaurant registration fails with an opaque MongoDB duplicate key error; or worse, if uniqueness is not enforced, the wrong restaurant's menu is returned.
- **Prevention:** Enforce uniqueness at two levels: (1) MongoDB unique index on `Restaurant.slug`, and (2) slug availability check in the registration flow before attempting the insert. Provide meaningful error messaging ("This URL is already taken") rather than exposing a raw MongoDB error. Auto-suggest a slug based on the restaurant name with a numeric suffix as fallback.
- **Phase to address:** Phase 1/2 (Restaurant model + registration flow). This is foundational to the QR code system — a slug change after QR distribution breaks all printed codes.

---

## Cloudinary

### Pitfall: Exposing `CLOUDINARY_API_SECRET` in client-side upload code

- **Warning signs:** The `CLOUDINARY_API_SECRET` appears in browser DevTools network tab or in a client component's environment variable reference (`process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET`); unsigned upload preset used without any restriction configuration.
- **Prevention:** Never expose the API secret to the client. Use one of two patterns: (A) **Signed uploads via a server endpoint** — the client requests a signature from a Next.js Route Handler (`/api/cloudinary/sign`), which uses the secret server-side and returns a short-lived signature; the client uses the signature to upload directly to Cloudinary. (B) **Unsigned preset with strict restrictions** — configure the preset in the Cloudinary dashboard to restrict file types, max file size, and folder destination. Option A is strongly preferred for a multi-tenant SaaS because it allows per-upload validation (e.g., confirm the user is authenticated before issuing a signature).
- **Phase to address:** Phase 2 (Image upload). Design the upload flow with signed uploads from the start — retrofitting security onto unsigned uploads is error-prone.

---

### Pitfall: No file size or type validation before Cloudinary upload

- **Warning signs:** Users upload 30MB RAW photos as dish images; video files are uploaded; bandwidth quota is consumed rapidly; Cloudinary free tier is suspended.
- **Prevention:** Validate on both the client and server before uploading. Client-side: reject files above ~5MB and non-image MIME types immediately with an inline error. Server-side (in the signature endpoint): re-validate so a crafted request cannot bypass the UI. Configure the upload preset in Cloudinary to enforce `allowed_formats: jpg,png,webp` and `max_file_size` as a backend safety net. Display accepted formats and the size limit visibly in the upload UI.
- **Phase to address:** Phase 2 (Image upload). This is part of the upload component spec, not an afterthought.

---

### Pitfall: Cloudinary free tier account suspension from bandwidth overuse

- **Warning signs:** Free plan provides 25 credits/month (1 credit = 1GB bandwidth or 1,000 transformations); a modest number of menu views with full-size images can exhaust bandwidth; account is suspended — not just rate-limited — when quota is exceeded, making all images inaccessible until resolved.
- **Prevention:** Always request Cloudinary-transformed images at the display size needed, never the original. Use `CldImage` with explicit `width` and `height` so Cloudinary delivers an optimally sized derivative. Enable `f_auto` (automatic format — WebP/AVIF where supported) and `q_auto` (automatic quality) on every image URL. For the public menu, images should be delivered via the Cloudinary CDN cached URL, not regenerated per request. If the product gains real users, budget for the Cloudinary paid plan before launch; the free tier is development-only.
- **Phase to address:** Phase 2 (Image upload) for transformation parameters; Phase 3 (Public menu) for CDN delivery confirmation.

---

## QR Code Generation

### Pitfall: QR codes generated pointing to `localhost` or the Vercel preview URL

- **Warning signs:** QR code works during development but fails when scanned after printing; the QR stores `http://localhost:3000/menu/mi-restaurante` or `https://proyecto-git-main-xxx.vercel.app/menu/...` instead of the production domain.
- **Prevention:** The QR URL must be constructed from a `NEXT_PUBLIC_APP_URL` environment variable set explicitly per environment. Never use `window.location.origin` in a server component or hardcode any domain. Define `NEXT_PUBLIC_APP_URL=https://menudigital.com` in Vercel production environment variables and `NEXT_PUBLIC_APP_URL=http://localhost:3000` locally. The QR generation function reads only from this variable: `` `${process.env.NEXT_PUBLIC_APP_URL}/menu/${slug}` ``.
- **Phase to address:** Phase 2 (QR generation). Add the env variable to Vercel project settings before the first QR feature is tested in a preview deploy.

---

### Pitfall: Overly dense QR code from a long URL

- **Warning signs:** QR code scans unreliably, especially when printed small (business cards, table tents); scanning requires multiple attempts or fails on older phone cameras; QR module size is visually very small.
- **Prevention:** The `/menu/[slug]` URL pattern is already good — keep slugs short (3-30 alphanumeric characters, hyphens only). The full URL `https://domain.com/menu/casa-pepe` is well within the safe range for QR Version 3-5, producing a low-density code that scans reliably even when printed at 2cm. Avoid query parameters in the QR URL. Set error correction level to `M` (medium, ~15% recovery) in the `qrcode` npm package — not `H` (high) since that increases density unnecessarily for a stable URL.
- **Phase to address:** Phase 2 (QR generation). Validate slug length at registration time (max 40 chars) and test the generated QR code by actually scanning it before shipping the feature.

---

## Public Menu Performance

### Pitfall: Using SSR (`fetch` with no cache) for the public `/menu/[slug]` route

- **Warning signs:** Every scan of a QR code hits the database; response time is 300–800ms cold; under concurrent scans (busy restaurant), MongoDB connection count spikes; the page has no meaningful caching.
- **Prevention:** The public menu is read-only and changes only when the restaurant owner saves an edit. This is the ideal ISR use case. Use `next/cache` revalidation: fetch menu data with `{ next: { revalidate: 60 } }` (or `revalidatePath('/menu/[slug]')` on save). The first request after a revalidation period hits the database; all subsequent requests within the window are served from Vercel's edge cache — zero database connections. For extra speed, use `generateStaticParams` to pre-build the most active menus at deploy time.
- **Phase to address:** Phase 3 (Public menu). Do not ship the public menu as a plain SSR page — design it as ISR from the first implementation.

---

### Pitfall: No blur placeholder or skeleton for Cloudinary dish images

- **Warning signs:** Public menu loads text instantly but shows empty white boxes where images should be; images pop in abruptly causing layout shift; poor perceived performance on mobile connections.
- **Prevention:** Use `next-cloudinary`'s `CldImage` component with `placeholder="blur"` and a low-quality image placeholder (LQIP) generated by Cloudinary (`e_blur:1000,q_1,f_auto` transformation). This provides a blurred thumbnail inline while the full image loads, eliminating layout shift and improving perceived performance significantly. Also set `sizes` prop correctly to avoid downloading a 1200px image for a 300px thumbnail slot.
- **Phase to address:** Phase 3 (Public menu UI). Build the dish card component with placeholder from the start, not as a polish pass.

---

## Environment & Configuration

### Pitfall: Committing `.env.local` with Clerk keys, MongoDB URI, or Cloudinary secret

- **Warning signs:** `.env.local` is not in `.gitignore`; secret keys appear in GitHub commit history; `CLOUDINARY_API_SECRET` or `MONGODB_URI` in a public repository.
- **Prevention:** `.env.local` must be in `.gitignore` before the first commit. Use `.env.example` with placeholder values as documentation. Rotate any key that has ever been committed, even briefly. In Vercel, set all secrets through the project's Environment Variables dashboard, never through code.
- **Phase to address:** Phase 0 (Project setup). This is a pre-commit checklist item, not a feature.

---

### Pitfall: Using a single set of environment variables across development, preview, and production

- **Warning signs:** Webhooks from Clerk go to the production MongoDB in development; a test restaurant created locally corrupts production data; Cloudinary uploads from dev pollute the production media library.
- **Prevention:** Create separate Clerk applications (dev vs. production), separate MongoDB Atlas clusters or databases (`menudigital_dev` vs. `menudigital_prod`), and separate Cloudinary folders/presets per environment. Vercel supports per-environment variable overrides natively — use them. This separation prevents a development bug from affecting real restaurant data.
- **Phase to address:** Phase 1 (Foundation). Set up environment separation before the first deployment.

---

## Phase-Specific Warning Summary

| Phase | Topic | Most Likely Pitfall | Mitigation |
|-------|-------|--------------------|-----------| 
| 1 | Middleware setup | Wrong `clerkMiddleware` opt-in model (all routes public by default) | Read Clerk Core 2 docs before writing a single line of middleware |
| 1 | DB connection | New connection on every cold start | Implement global `dbConnect` utility on day 1 |
| 1 | Atlas networking | `0.0.0.0/0` not set → production connection refused | Set IP allowlist before first Vercel deploy |
| 1 | Webhook security | No Svix signature verification | Install `svix`, verify headers before any DB write |
| 2 | CRUD auth | Missing `clerkId` scope on queries → cross-tenant data leak | Derive tenant from session, never from request body |
| 2 | Image upload | API secret in client code | Signed upload endpoint from day 1 |
| 2 | Slug uniqueness | Duplicate slug on registration → wrong menu served | Unique index + availability check in registration |
| 2 | QR URL | QR pointing to localhost or preview URL | `NEXT_PUBLIC_APP_URL` env variable, verified before QR feature ships |
| 3 | Public menu | SSR on every scan → DB hammering | ISR with `revalidate` or `revalidatePath` on menu save |
| 3 | Image loading | Layout shift, no placeholders | `CldImage` with LQIP blur placeholder in dish card component |
| 3 | Bandwidth | Cloudinary free tier suspended from raw-size image delivery | `f_auto,q_auto` + sized transformations on every menu image |

---

## Sources

- [Clerk clerkMiddleware() reference — Clerk Docs](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Clerk Core 2 upgrade guide](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/core-2/nextjs)
- [Clerk auth() was called but clerkMiddleware not detected — Clerk Docs](https://clerk.com/docs/reference/nextjs/errors/auth-was-called)
- [How to sync Clerk user data to your database — Clerk](https://clerk.com/articles/how-to-sync-clerk-user-data-to-your-database)
- [Complete Auth Guide for Next.js App Router 2025 — Clerk](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
- [MongoDB Atlas free cluster limits — MongoDB Docs](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- [MongoDB Atlas IP access list — MongoDB Docs](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [Integrate with Vercel — Atlas MongoDB Docs](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/)
- [MongoDB connection pooling in serverless — OneUptime Blog](https://oneuptime.com/blog/post/2026-03-31-mongodb-how-to-handle-connection-pooling-in-serverless-with-mongodb/view)
- [MongoDB multiple connections Vercel Concurrency — Vercel Community](https://community.vercel.com/t/mongodb-multiple-connections-and-new-concurrency-mode/2877)
- [Cloudinary unsigned upload security considerations — Cloudinary Support](https://support.cloudinary.com/hc/en-us/articles/360018796451-What-are-the-security-considerations-for-unsigned-uploads)
- [Server-signed Uploads in Cloudinary with Next.js — Cloudinary Blog](https://cloudinary.com/blog/guest_post/signed-uploads-in-cloudinary-with-next-js)
- [What happens if I exceed Cloudinary plan limits — Cloudinary Support](https://support.cloudinary.com/hc/en-us/articles/202521702-What-happens-if-I-exceed-the-usage-limits-of-my-account-s-plan)
- [Adding image placeholders — Next Cloudinary Docs](https://next.cloudinary.dev/guides/placeholders)
- [Next.js Data Security Guide — Next.js Docs](https://nextjs.org/docs/app/guides/data-security)
- [Authorization in Next.js — Robin Wieruch](https://www.robinwieruch.de/next-authorization/)
- [Preventing Cross-Tenant Data Leakage — Agnite Studio](https://agnitestudio.com/blog/preventing-cross-tenant-leakage/)
- [Multi-tenant SaaS Architecture in Next.js — DEV Community](https://dev.to/whoffagents/multi-tenant-saas-architecture-in-nextjs-organizations-roles-and-resource-isolation-1n91)
- [QR code best practices — QR Code Generator](https://www.qr-code-generator.com/blog/making-short-urls-technical-qr-code-best-practices/)
- [qrcode npm package](https://www.npmjs.com/package/qrcode)
- [The time I tried Clerk webhooks with MongoDB (and what went wrong) — Medium](https://akramboutzouga.medium.com/the-time-i-tried-clerk-webhooks-to-persist-users-in-mongodb-and-what-went-wrong-f0566e40ea11)
- [Serverless functions and IP whitelisting trap — QuotaGuard Blog](https://www.quotaguard.com/blog/serverless-static-ip-mongodb-atlas-whitelist)
