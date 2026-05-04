---
phase: 01-foundation
verified: 2026-05-04T00:00:00Z
status: human_needed
score: 22/23 must-haves verified
overrides_applied: 0
gaps:
  - truth: "UserButton in sidebar has afterSignOutUrl=\"/sign-in\""
    status: partial
    reason: "Sidebar.tsx renders <UserButton /> with no afterSignOutUrl prop. The prop IS set on ClerkProvider in app/layout.tsx (afterSignOutUrl=\"/sign-in\"), which Clerk v6 propagates globally — so the runtime behavior is likely correct. However the plan acceptance criteria for Plan 03 explicitly requires afterSignOutUrl on the UserButton element itself."
    artifacts:
      - path: "menu-digital/components/dashboard/Sidebar.tsx"
        issue: "Line 107: <UserButton /> — missing afterSignOutUrl=\"/sign-in\" prop"
    missing:
      - "Add afterSignOutUrl=\"/sign-in\" to the UserButton in Sidebar.tsx, OR confirm via override that ClerkProvider-level propagation satisfies the requirement"
human_verification:
  - test: "Register a new account at /sign-up and verify webhook creates Restaurant in Atlas"
    expected: "New document appears in Atlas restaurants collection with slugConfirmed=false within seconds of registration"
    why_human: "Requires live Clerk webhook delivery and Atlas inspection — cannot verify DB write programmatically without running the server and a webhook tunnel"
  - test: "Visit /dashboard immediately after registration"
    expected: "State A: spinner with 'Configurando tu cuenta...' shows briefly, then State B (onboarding slug editor) appears after webhook delivers"
    why_human: "State A is a timing-dependent UI state; requires real-time browser observation"
  - test: "Confirm slug in onboarding form"
    expected: "Success toast appears, then page reloads to State C showing 'Bienvenido, [name]' and the URL card"
    why_human: "Requires live browser interaction and webhook-backed DB state"
  - test: "Sign out via UserButton in sidebar"
    expected: "User is redirected to /sign-in after clicking sign-out in the UserButton dropdown"
    why_human: "UserButton renders Clerk's hosted UI; redirect behavior depends on Clerk SDK runtime and the afterSignOutUrl resolution (ClerkProvider vs prop)"
  - test: "Sign back in after signing out"
    expected: "User lands at /dashboard in State C (slug already confirmed, no onboarding form shown)"
    why_human: "Requires live auth session and DB state verification"
  - test: "Attempt to access /dashboard while unauthenticated"
    expected: "Redirected to /sign-in"
    why_human: "Requires browser session manipulation; middleware redirect can be confirmed but end-to-end flow needs browser"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** A restaurant owner can create an account, log in, and have a permanent unique slug assigned automatically — the backbone every other feature depends on.
**Verified:** 2026-05-04T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | middleware.ts exists at project root (not inside app/) | VERIFIED | File at `menu-digital/middleware.ts`; `menu-digital/app/middleware.ts` does not exist |
| 2 | ClerkProvider is inside `<body>`, not wrapping `<html>` | VERIFIED | `app/layout.tsx` line 25: `<ClerkProvider>` is a child of `<body>` |
| 3 | Brand colors reference Tailwind tokens in JSX class props — no raw hex in class attributes | VERIFIED | All layout/component `className` props use `bg-brand-*`, `text-brand-*`. Raw hex only appears in Clerk `appearance.variables` JS object (required by Clerk API, not class strings) and one Tailwind arbitrary hover value `hover:bg-[#C2410C]` (a shade unavailable as a token — legitimate Tailwind pattern) |
| 4 | .env.local is gitignored and contains all required variable keys | VERIFIED | `.gitignore` line 34: `.env*` (catches `.env.local`). `.env.local` contains `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`, `MONGODB_URI`, `NEXT_PUBLIC_APP_URL` |
| 5 | TypeScript strict mode is enabled | VERIFIED | `tsconfig.json` line 7: `"strict": true` |
| 6 | Fira Sans loaded via next/font/google with --font-fira-sans CSS variable | VERIFIED | `app/layout.tsx`: `Fira_Sans` imported from `next/font/google`; `variable: '--font-fira-sans'` set |
| 7 | /dashboard route protected by Clerk middleware | VERIFIED | `middleware.ts`: `createRouteMatcher(['/dashboard(.*)'])` with `auth.protect()` |
| 8 | lib/dbConnect.ts uses global.mongoose cache pattern | VERIFIED | `lib/dbConnect.ts`: `global.mongoose ?? { conn: null, promise: null }` pattern; `maxPoolSize: 5`, `bufferCommands: false` |
| 9 | Restaurant model has slugConfirmed field defaulting to false | VERIFIED | `models/Restaurant.ts` line 8: `slugConfirmed: { type: Boolean, default: false }` |
| 10 | Model guard (models.X \|\| model('X', schema)) present in all three model files | VERIFIED | Restaurant: `models.Restaurant \|\| model('Restaurant', ...)` · Category: `models.Category \|\| model('Category', ...)` · Dish: `models.Dish \|\| model('Dish', ...)` |
| 11 | Webhook handler uses req.text() — never req.json() before Svix verification | VERIFIED | `app/api/webhooks/clerk/route.ts` line 26: `await req.text()`; `req.json()` does not appear |
| 12 | Webhook handler uses await headers() — async | VERIFIED | `route.ts` line 16: `const headerPayload = await headers()` |
| 13 | Webhook upsert uses $setOnInsert — not $set — for idempotency | VERIFIED | `route.ts` line 59: `{ $setOnInsert: { clerkId, name, slug, slugConfirmed: false } }` |
| 14 | confirmSlug Server Action verifies clerkId ownership and slugConfirmed=false before updating | VERIFIED | `actions/restaurant.ts`: finds by `{ clerkId: userId }`, checks `restaurant.slugConfirmed`, update filter is `{ clerkId: userId, slugConfirmed: false }` |
| 15 | No slug update endpoint exists other than the one-time confirmSlug action | VERIFIED | No `app/api/*/slug*` route files found; `confirmSlug` is the only mutation path and guards `slugConfirmed=false` |
| 16 | price field in Dish schema is Number — not String or Float | VERIFIED | `models/Dish.ts` line 9: `price: { type: Number, required: true }` with comment "stored as cents (integer)" |
| 17 | Dashboard page implements all 3 states: waiting, onboarding, normal | VERIFIED | `app/(admin)/dashboard/page.tsx`: State A (no restaurant → spinner), State B (`!slugConfirmed` → `<OnboardingSlug>`), State C (confirmed → welcome + URL card) |
| 18 | Sidebar disabled items are `<span>` elements, not `<Link>` — non-interactive | VERIFIED | `Sidebar.tsx` lines 71–83: disabled items render as `<span>` with `cursor-not-allowed` |
| 19 | OnboardingSlug component calls the confirmSlug Server Action (not a fetch/API call) | VERIFIED | `OnboardingSlug.tsx` line 5: `import { confirmSlug } from '@/actions/restaurant'`; called directly at line 27: `await confirmSlug(formData)` |
| 20 | After slug confirmation, page reloads — no additional navigation required | VERIFIED | `OnboardingSlug.tsx` lines 31–33: `window.location.reload()` called after 1500ms success delay |
| 21 | Dashboard page re-fetches restaurant from DB server-side | VERIFIED | `app/(admin)/dashboard/page.tsx` is an `async` Server Component that calls `Restaurant.findOne({ clerkId: userId })` on every render |
| 22 | AUTH-03 (sign out from any dashboard page) is satisfied by UserButton in Sidebar | VERIFIED | `Sidebar.tsx` line 107: `<UserButton />` present in sidebar footer — available on all dashboard pages via layout |
| 23 | UserButton in sidebar has afterSignOutUrl="/sign-in" | PARTIAL | `Sidebar.tsx` `<UserButton />` has no `afterSignOutUrl` prop. `ClerkProvider` in `app/layout.tsx` sets `afterSignOutUrl="/sign-in"` globally, which Clerk v6 propagates. Runtime behavior likely correct, but explicit prop is absent from Sidebar per plan spec |

**Score:** 22/23 truths verified (1 partial)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `menu-digital/middleware.ts` | Clerk middleware protecting /dashboard | VERIFIED | Exists at root, correct patterns |
| `menu-digital/app/layout.tsx` | Root layout with ClerkProvider + Fira Sans | VERIFIED | ClerkProvider inside body, font variable set |
| `menu-digital/tailwind.config.ts` | Brand color tokens | VERIFIED | All 5 brand colors, font family configured |
| `menu-digital/tsconfig.json` | TypeScript strict mode | VERIFIED | `"strict": true` present |
| `menu-digital/lib/dbConnect.ts` | MongoDB singleton cache | VERIFIED | global.mongoose pattern, correct options |
| `menu-digital/models/Restaurant.ts` | Restaurant model with slugConfirmed | VERIFIED | All required fields, model guard present |
| `menu-digital/models/Category.ts` | Category scaffold model | VERIFIED | Model guard present |
| `menu-digital/models/Dish.ts` | Dish scaffold model with Number price | VERIFIED | price is Number, model guard present |
| `menu-digital/app/api/webhooks/clerk/route.ts` | Webhook handler | VERIFIED | req.text(), await headers(), $setOnInsert |
| `menu-digital/actions/restaurant.ts` | confirmSlug Server Action | VERIFIED | 'use server', auth(), ownership check, slugConfirmed guard |
| `menu-digital/app/(admin)/layout.tsx` | Admin dashboard layout | VERIFIED | auth(), Sidebar, DB fetch, brand classes |
| `menu-digital/app/(admin)/dashboard/page.tsx` | Dashboard with 3 states | VERIFIED | All three states implemented |
| `menu-digital/components/dashboard/Sidebar.tsx` | Sidebar with UserButton | PARTIAL | UserButton present but missing afterSignOutUrl prop |
| `menu-digital/components/dashboard/OnboardingSlug.tsx` | Slug onboarding form | VERIFIED | Calls Server Action, reload on success |
| `menu-digital/.env.local` | Environment variables | VERIFIED | All required keys present |
| `menu-digital/.env.example` | Example env file | VERIFIED | All keys with placeholder values |
| `menu-digital/.gitignore` | .env.local gitignored | VERIFIED | `.env*` pattern covers .env.local |
| `menu-digital/lib/utils.ts` | Slug generation utilities | VERIFIED | generateSlug and validateSlug implemented |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `middleware.ts` | `/dashboard` route | `createRouteMatcher` + `auth.protect()` | VERIFIED | Pattern `'/dashboard(.*)'` with protect() call |
| `OnboardingSlug.tsx` | `confirmSlug` Server Action | direct import + call | VERIFIED | Import from `@/actions/restaurant`, called with FormData |
| `confirmSlug` action | `Restaurant` model | `Restaurant.findOne({ clerkId: userId })` | VERIFIED | Ownership verified before update |
| Webhook handler | `Restaurant` model | `Restaurant.findOneAndUpdate` with `$setOnInsert` | VERIFIED | Idempotent upsert wired correctly |
| `dashboard/page.tsx` | `Restaurant` model | `Restaurant.findOne({ clerkId: userId }).lean()` | VERIFIED | Server-side fetch per request |
| `Sidebar.tsx` | sign-out redirect | `UserButton` (no `afterSignOutUrl` prop) | PARTIAL | Redirect set at ClerkProvider level, not Sidebar prop |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `dashboard/page.tsx` | `restaurant` | `Restaurant.findOne({ clerkId: userId })` | Yes — MongoDB query | FLOWING |
| `OnboardingSlug.tsx` | `initialSlug` | Passed as prop from `dashboard/page.tsx` (server-fetched) | Yes — from DB | FLOWING |
| `Sidebar.tsx` | `restaurantName` | Passed from `(admin)/layout.tsx` (server-fetched) | Yes — from DB | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED for server-dependent behaviors (Clerk auth, MongoDB Atlas, webhook delivery). Static checks confirmed all code paths are substantive.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| AUTH-01 | Plan 01 | User can create an account | SATISFIED | Sign-up page with Clerk SignUp component; middleware redirects to /sign-in when unauthenticated |
| AUTH-02 | Plan 01 | User can sign in | SATISFIED | Sign-in page with Clerk SignIn component; post-auth redirect to /dashboard |
| AUTH-03 | Plan 03 | User can sign out from any dashboard page | SATISFIED | UserButton in Sidebar (present on all admin pages via layout) |
| REST-01 | Plans 02, 03 | Restaurant document created automatically on registration | SATISFIED | Webhook handler creates Restaurant via $setOnInsert on user.created event |
| REST-02 | Plans 02, 03 | Slug is permanent/immutable after confirmation | SATISFIED | confirmSlug guards slugConfirmed=false; no other update endpoint; no edit UI after confirmation |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/sign-in/.../page.tsx` | 19-24 | Raw hex in Clerk `appearance.variables` JS object | INFO | Clerk's API requires hex strings — not class names. Not a JSX className violation. Not a blocker. |
| `app/sign-up/.../page.tsx` | 19-24 | Raw hex in Clerk `appearance.variables` JS object | INFO | Same as above. |
| `OnboardingSlug.tsx` | 119 | `hover:bg-[#C2410C]` arbitrary Tailwind value | INFO | This is a legitimate Tailwind JIT arbitrary value for a hover shade not available as a brand token. Does not replace a named token. Not a blocker. |
| `Sidebar.tsx` | 107 | `<UserButton />` without `afterSignOutUrl` prop | WARNING | Plan spec requires explicit prop; ClerkProvider provides global fallback. Runtime likely correct but deviates from spec. |

---

### Human Verification Required

#### 1. Webhook — Restaurant document creation

**Test:** Register a new account at `/sign-up` using a real email + password. After email verification, navigate to MongoDB Atlas and inspect the `restaurants` collection.
**Expected:** A document exists with the new user's `clerkId`, a generated `slug`, and `slugConfirmed: false`.
**Why human:** Requires live Clerk webhook delivery to a tunnel URL and direct Atlas inspection. Cannot automate without a running server and external tunnel.

#### 2. Dashboard State A (webhook pending spinner)

**Test:** Immediately after registration (before webhook fires), navigate to `/dashboard`.
**Expected:** A spinner with "Configurando tu cuenta..." is shown briefly until the webhook delivers and the restaurant document exists.
**Why human:** State A is timing-dependent and requires real-time browser observation.

#### 3. Onboarding slug confirmation flow (State B → C)

**Test:** With a fresh account (webhook delivered, slug not confirmed), visit `/dashboard`. Edit the pre-filled slug in the input, then click "Confirmar dirección".
**Expected:** Success toast appears, then after 1.5 seconds the page reloads and shows State C: "Bienvenido, [name]" heading and a URL card with the confirmed slug.
**Why human:** Requires live browser + DB interaction; State C depends on DB mutation completing.

#### 4. Sign-out redirect

**Test:** From `/dashboard` in State C, click the Clerk UserButton in the sidebar footer, then click the sign-out option.
**Expected:** User is redirected to `/sign-in`.
**Why human:** Redirect depends on Clerk SDK runtime resolution of `afterSignOutUrl` (from ClerkProvider prop, since Sidebar lacks the explicit prop). This is the one behavioral gap to confirm: does ClerkProvider-level `afterSignOutUrl` apply?

#### 5. Persistent State C after sign-in

**Test:** After signing out, sign back in via `/sign-in`.
**Expected:** Redirect to `/dashboard` shows State C immediately (slug already confirmed, no onboarding).
**Why human:** Requires live session and DB state verification.

#### 6. Unauthenticated /dashboard access

**Test:** Open a private/incognito browser window and navigate directly to `/dashboard`.
**Expected:** Redirected to `/sign-in` with no dashboard content exposed.
**Why human:** Middleware behavior with real browser requests; cannot replicate with static file checks.

---

### Gaps Summary

One partial gap identified: `Sidebar.tsx` renders `<UserButton />` without the `afterSignOutUrl="/sign-in"` prop that the Plan 03 acceptance criteria explicitly requires. The global `ClerkProvider` in `app/layout.tsx` has `afterSignOutUrl="/sign-in"` set, which Clerk v6 propagates to all UserButton instances. The runtime behavior is almost certainly correct, but this deviates from the stated acceptance criterion and should be confirmed via human testing (item 4 above) or resolved with a one-line fix or an explicit override.

No other gaps found. All data layer, model, webhook, Server Action, and dashboard UI requirements are substantively implemented and correctly wired.

---

_Verified: 2026-05-04T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
