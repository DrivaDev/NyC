---
phase: 03-public-menu-qr
verified: 2026-05-06T01:00:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 1
overrides:
  - requirement: PUB-04
    decision_ref: "DISCUSSION-LOG — user selected 'Tabs sticky en top + scroll a la sección' over filter/hide behavior"
    context_ref: "03-CONTEXT.md D-16"
    disposition: accepted
    rationale: "Scroll-to-section satisfies the client-side no-page-reload intent of PUB-04. Literal 'filtrar' (hide/show) was explicitly rejected by product owner in favor of anchor-scroll UX. No code change required."
    date: "2026-05-06"
re_verification:
  previous_status: gaps_found
  previous_score: 8/10
  gaps_closed:
    - "QR-03: Restaurant owner can open menu in a new tab from dashboard — two target=_blank anchors added (clickable URL row + 'Ver mi menú' button)"
    - "PUB-06: Non-existent slug shows custom branded Spanish 404 page — app/not-found.tsx created with 'Menú no encontrado' H1"
    - "PUB-04: Override formally recorded in VERIFICATION.md frontmatter (overrides_applied: 1)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "QR download produces a valid PNG file"
    expected: "Clicking 'Descargar QR' downloads a file named qr-{slug}.png that opens as a valid QR code image in an image viewer. Scanning it navigates to https://menudig.com.ar/menu/{slug}."
    why_human: "Download uses href={qrDataUrl} (base64 data URI). Actual file validity and QR scanability require a real browser and device."
  - test: "Allergen tooltip visible on mobile tap"
    expected: "Tapping an allergen badge on a mobile device (or DevTools mobile simulation) shows the tooltip with the Spanish allergen name (e.g., 'Gluten', 'Lácteos')."
    why_human: "The group-focus-within/badge:opacity-100 CSS trigger depends on focus events from tap, which cannot be verified by static code analysis."
  - test: "Active tab tracks scroll position correctly"
    expected: "Scrolling through the menu page causes the tab bar to highlight the category whose section is in the upper viewport zone (20-30% from top)."
    why_human: "IntersectionObserver behavior with rootMargin '-20% 0px -70% 0px' requires real browser scroll events to verify."
  - test: "ISR revalidation on dish mutation"
    expected: "Toggling a dish to unavailable in the admin panel causes it to disappear from the public menu on the next page load — without a server restart."
    why_human: "ISR on-demand revalidation (revalidatePath) requires a running Next.js server and a live MongoDB connection to verify end-to-end."
---

# Phase 3: Public Menu & QR Verification Report

**Phase Goal:** Build the public-facing menu page at /menu/[slug] accessible without authentication, and expose a QR code download from the admin dashboard.
**Verified:** 2026-05-06T01:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (previous: gaps_found 8/10)

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Diner can open /menu/[slug] without logging in | VERIFIED | middleware.ts marks `/menu/(.*)` as public route; no `await auth()` in page.tsx |
| 2  | Dishes grouped by category in restaurant's configured order | VERIFIED | CategoryModel.find({ restaurantId }).sort({ order: 1 }); sections rendered per populatedCategories |
| 3  | Each dish shows thumbnail/placeholder, name, description, price in ARS | VERIFIED | DishRow.tsx renders Image or ImagePlaceholder, name, description, toLocaleString('es-AR', ARS) |
| 4  | Allergen emoji badges appear; tooltip shows full allergen name on hover/tap | VERIFIED | AllergenBadge.tsx: group/badge, group-hover/badge:opacity-100, group-focus-within/badge:opacity-100, tabIndex={0} |
| 5  | Sticky tab bar scrolls to category; active tab tracks viewport | VERIFIED | MenuCategoryNav.tsx: sticky top-0, IntersectionObserver rootMargin -20% 0px -70% 0px, optimistic setActiveId |
| 6  | Non-existent slug returns branded Spanish 404 | VERIFIED | page.tsx: `if (!restaurant) notFound()` — triggers app/not-found.tsx with "Menú no encontrado" H1 |
| 7  | Restaurant header shows logo, name as H1, description | VERIFIED | page.tsx: conditional logo Image, h1 text-brand-titulares, conditional description paragraph |
| 8  | Footer contains "Desarrollado por Driva Dev" | VERIFIED | page.tsx line 145: exact string present |
| 9  | Restaurant owner can see QR and download it as PNG (QR-01, QR-02, QR-04) | VERIFIED | dashboard/page.tsx: QRCode.toDataURL, `<img src={qrDataUrl}>`, `<a href={qrDataUrl} download={`qr-${slug}.png`}>`, menuUrl from NEXT_PUBLIC_APP_URL |
| 10 | Restaurant owner can open menu in a new tab from dashboard (QR-03) | VERIFIED | dashboard/page.tsx lines 78-87: `<a href={menuUrl} target="_blank" rel="noopener noreferrer">` on URL row; lines 100-107: secondary "Ver mi menú" button also `target="_blank"` — 2 anchors confirmed |

**Score:** 10/10 truths verified (PUB-04 counted as VERIFIED per accepted override — scroll-to-section is the documented product decision)

---

### Re-verification: Gap Closure Confirmation

| Previous Gap | Claimed Fix | Evidence Found | Status |
|-------------|-------------|----------------|--------|
| QR-03: No open-in-new-tab link | Two target=_blank anchors added | dashboard/page.tsx line 78: URL row is `<a href={menuUrl} target="_blank">`, line 100: "Ver mi menú" `<a target="_blank">` — grep count = 2 | CLOSED |
| PUB-06: No custom 404 page | app/not-found.tsx created | File exists at app/not-found.tsx; contains "Menú no encontrado" as H1, "Desarrollado por Driva Dev" footer, no `'use client'` directive, export default function NotFound | CLOSED |
| PUB-04: Override not recorded | overrides_applied: 1 added to VERIFICATION.md | Previous VERIFICATION.md frontmatter already contains overrides_applied: 1 and overrides: block with requirement: PUB-04, disposition: accepted | CLOSED |

No regressions detected in files from 03-PLAN-01 or 03-PLAN-02.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `next.config.ts` | Cloudinary remotePatterns | VERIFIED | hostname: 'res.cloudinary.com', pathname: '/**' — confirmed in initial verification |
| `models/Restaurant.ts` | description field | VERIFIED | description: { type: String, default: '' } — confirmed in initial verification |
| `actions/restaurant.ts` | description persistence | VERIFIED | formData.get('description') extracted and included in update object unconditionally |
| `components/dashboard/RestaurantProfileForm.tsx` | Description textarea | VERIFIED | id="restaurant-description", name="description", maxLength={200}, disabled={pending} |
| `app/(admin)/dashboard/settings/page.tsx` | initialDescription prop wiring | VERIFIED | lean type includes description: string; initialDescription={restaurant.description ?? ''} |
| `lib/allergenEmoji.ts` | 14 EU allergen emoji map | VERIFIED | All 14 keys present, typed as Record<AllergenKey, string> |
| `components/menu/AllergenBadge.tsx` | Allergen badge with CSS tooltip | VERIFIED | group/badge, hover + focus-within tooltip, role="img", aria-label, bg-brand-acento, w-6 h-6 rounded-full |
| `components/menu/ImagePlaceholder.tsx` | SVG fork placeholder | VERIFIED | bg-gray-100, aria-hidden="true" on SVG |
| `components/menu/MenuCategoryNav.tsx` | Sticky tab bar with IntersectionObserver | VERIFIED | 'use client', sticky top-0, IntersectionObserver rootMargin -20% 0px -70% 0px, cleanup on unmount |
| `components/menu/DishRow.tsx` | Dish row with price, image, allergens | VERIFIED | toLocaleString ARS, next/image fill+sizes, ImagePlaceholder fallback, AllergenBadge when allergens.length > 0 |
| `app/(public)/menu/[slug]/page.tsx` | Full public menu page | VERIFIED | async params, generateStaticParams returns [], notFound(), available:true filter, no revalidate export, no auth(), Driva Dev footer |
| `app/(admin)/dashboard/page.tsx` | QR card with preview, download, and open-in-new-tab | VERIFIED | QR generated via QRCode.toDataURL, displayed as img, downloadable via data URI, two target=_blank anchors for QR-03 |
| `app/not-found.tsx` | Custom 404 page with Spanish copy | VERIFIED | File exists; "Menú no encontrado" H1, "Desarrollado por Driva Dev" footer, no 'use client', export default function NotFound |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/(public)/menu/[slug]/page.tsx` | `models/Restaurant.ts` | `RestaurantModel.findOne({ slug }).lean()` | WIRED | Import aliased as RestaurantModel; findOne by slug at line 54 |
| `app/(public)/menu/[slug]/page.tsx` | `models/Dish.ts` | `DishModel.find({ restaurantId, available: true })` | WIRED | Dish filtered by restaurantId from slug lookup, available:true enforced |
| `components/menu/DishRow.tsx` | `components/menu/AllergenBadge.tsx` | `dish.allergens.map → AllergenBadge` | WIRED | AllergenBadge imported and rendered when dish.allergens.length > 0 |
| `components/menu/DishRow.tsx` | `components/menu/ImagePlaceholder.tsx` | `dish.imageUrl empty → ImagePlaceholder` | WIRED | ImagePlaceholder rendered in else branch when dish.imageUrl is falsy |
| `app/(public)/menu/[slug]/page.tsx` | `components/menu/MenuCategoryNav.tsx` | `categories prop (serialized { _id, name }[])` | WIRED | MenuCategoryNav receives populatedCategories.map({ _id, name }) |
| `app/(public)/menu/[slug]/page.tsx` | `app/not-found.tsx` | `notFound()` call when restaurant not found | WIRED | if (!restaurant) notFound() at line 55; Next.js App Router routes to app/not-found.tsx |
| `app/(admin)/dashboard/page.tsx` | `menuUrl` | `<a href={menuUrl} target="_blank">` (x2) | WIRED | URL row anchor line 78 + "Ver mi menú" button line 100; both point to menuUrl with target=_blank |
| `app/(admin)/dashboard/settings/page.tsx` | `components/dashboard/RestaurantProfileForm.tsx` | `initialDescription prop` | WIRED | initialDescription={restaurant.description ?? ''} |
| `components/dashboard/RestaurantProfileForm.tsx` | `actions/restaurant.ts` | `formData name="description"` | WIRED | textarea name="description" submits via formAction |
| `actions/restaurant.ts` | `models/Restaurant.ts` | `Restaurant.updateOne $set { name, description }` | WIRED | update object: { name, description } unconditionally |
| `middleware.ts` | `/menu/(.*)` public route | `isPublicRoute matcher` | WIRED | createRouteMatcher includes '/menu/(.*)'; early return prevents auth.protect() |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/(public)/menu/[slug]/page.tsx` | restaurant, categories, dishes | MongoDB via RestaurantModel.findOne + CategoryModel.find + DishModel.find | Yes — live DB queries with no static fallbacks | FLOWING |
| `components/menu/DishRow.tsx` | dish prop | Passed from page.tsx via serializedDishesByCategory | Yes — originates from Dish MongoDB collection | FLOWING |
| `components/menu/MenuCategoryNav.tsx` | categories prop | Passed from page.tsx: populatedCategories.map({ _id, name }) | Yes — originates from Category MongoDB collection | FLOWING |
| `app/(admin)/dashboard/page.tsx` | qrDataUrl | QRCode.toDataURL(menuUrl) where menuUrl = `${NEXT_PUBLIC_APP_URL}/menu/${restaurant.slug}` | Yes — generated from real restaurant slug from DB | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — verification requires a running Next.js server + live MongoDB connection. Key checks (public page accessible without auth, notFound() triggering custom 404, ISR behavior) require browser or HTTP client against a running instance. Delegated to human verification.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PUB-01 | 03-PLAN-02 | Diner accesses /menu/[slug] without account/login | SATISFIED | Middleware public route matcher + no auth() in page |
| PUB-02 | 03-PLAN-02 | Dishes grouped by category in restaurant's order | SATISFIED | CategoryModel.find().sort({order:1}), section per category |
| PUB-03 | 03-PLAN-01, 03-PLAN-02 | Diner sees photo, name, description, price per dish | SATISFIED | DishRow.tsx renders all fields; Cloudinary remotePatterns allows next/image to load photos |
| PUB-04 | 03-PLAN-02 | Filter dishes by category client-side, no page reload | SATISFIED (override) | Scroll-to-section implemented; literal filter/hide rejected by product owner; override accepted — see overrides section |
| PUB-05 | 03-PLAN-02 | Allergen icons with tooltip on hover/tap | SATISFIED | AllergenBadge: emoji in brand-acento circle, CSS tooltip with hover + focus-within |
| PUB-06 | 03-PLAN-02, 03-PLAN-03 | Non-existent slug shows clear 404 | SATISFIED | notFound() → app/not-found.tsx with "Menú no encontrado" H1 and brand palette |
| PUB-07 | 03-PLAN-01, 03-PLAN-02 | ISR — not SSR per scan | SATISFIED | No export const revalidate; generateStaticParams returns []; revalidatePath in all mutations |
| QR-01 | 03-PLAN-03 | QR code visible in dashboard | SATISFIED | dashboard/page.tsx: `<img src={qrDataUrl}>` in QR card |
| QR-02 | 03-PLAN-03 | Download QR as PNG | SATISFIED | `<a href={qrDataUrl} download={`qr-${slug}.png`}>` present |
| QR-03 | 03-PLAN-03 | Direct link to open menu in new tab | SATISFIED | Two `<a href={menuUrl} target="_blank" rel="noopener noreferrer">` anchors: URL row (line 78) + "Ver mi menú" button (line 100) |
| QR-04 | 03-PLAN-03 | QR points to NEXT_PUBLIC_APP_URL/menu/[slug] | SATISFIED | menuUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://menudig.com.ar'}/menu/${restaurant.slug}` |

---

### Anti-Patterns Found

No blockers or new warnings detected in gap-closure files.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No anti-patterns found in modified files | — | — |

The two previously flagged issues (plain-text menuUrl span, missing not-found.tsx) are both resolved.

---

### Human Verification Required

### 1. QR Download File Validity

**Test:** Navigate to /dashboard (with a confirmed slug). Click "Descargar QR". Open the downloaded file in an image viewer or scan it with a QR reader.
**Expected:** File opens as a valid QR code image; scanning it navigates to https://menudig.com.ar/menu/{slug}.
**Why human:** The download mechanism uses a base64 data URI as the href — browsers convert this to a file, but actual QR scanability requires a real device or scanner.

### 2. Allergen Tooltip on Mobile Tap

**Test:** Open /menu/{slug} on a mobile device or Chrome DevTools mobile emulation. Tap an allergen badge.
**Expected:** A tooltip appears above the badge showing the Spanish allergen name (e.g., "Gluten", "Lácteos").
**Why human:** The group-focus-within/badge:opacity-100 CSS trigger depends on focus events from tap, which cannot be verified by static code analysis.

### 3. Active Tab Scroll Tracking

**Test:** Open /menu/{slug} with multiple categories (at least 3). Scroll slowly through the page.
**Expected:** As each category section enters the upper viewport zone, the corresponding tab highlights with border-brand-principal color.
**Why human:** IntersectionObserver with rootMargin '-20% 0px -70% 0px' requires real browser scroll events.

### 4. ISR On-Demand Revalidation

**Test:** In the admin panel, toggle a dish to unavailable. Without restarting the server, load /menu/{slug} in incognito.
**Expected:** The toggled dish does not appear on the public menu — ISR cache was invalidated by revalidatePath.
**Why human:** Requires a running Next.js server with real MongoDB connection. Cannot verify from static code inspection alone.

---

## Gaps Summary

No gaps remain. All three previously identified gaps are confirmed closed:

- **QR-03 CLOSED:** dashboard/page.tsx now contains two `target="_blank"` anchors pointing to menuUrl — the URL row itself is a clickable anchor and a secondary "Ver mi menú" outline button appears below the download button. Both include `rel="noopener noreferrer"`. Grep confirmed count = 2.

- **PUB-06 CLOSED:** app/not-found.tsx exists as a Next.js App Router server component with "Menú no encontrado" as H1, branded palette (bg-brand-fondo, text-brand-titulares, bg-brand-principal), "Desarrollado por Driva Dev" footer, and a "Volver al inicio" CTA. No `'use client'` directive.

- **PUB-04 CLOSED (override):** The scroll-to-section deviation is formally recorded in VERIFICATION.md frontmatter with overrides_applied: 1. The override references the DISCUSSION-LOG decision and CONTEXT.md D-16. No code change was needed.

All 10 must-have truths are satisfied. Phase goal is fully achieved pending human UAT of QR file validity, allergen tooltip mobile behavior, scroll tracking, and ISR revalidation.

---

_Verified: 2026-05-06T01:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after 03-PLAN-03 gap closure_
