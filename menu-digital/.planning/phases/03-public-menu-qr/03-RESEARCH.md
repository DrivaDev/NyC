# Phase 3: Public Menu & QR — Research

**Researched:** 2026-05-05
**Domain:** Next.js 16 App Router ISR · MongoDB Mongoose · Tailwind v4 · React 19
**Confidence:** HIGH (all findings verified against official Next.js 16.2.4 docs and live codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Full header — logo + name + description. Skip logo gracefully if empty. Name as H1. Description as short paragraph.
- D-02: Add `description: { type: String, default: '' }` to `models/Restaurant.ts`. Editable from `/dashboard/settings` textarea. No new page.
- D-03: `updateRestaurantProfile` server action must accept and persist `description`.
- D-04: Horizontal list rows — image thumbnail (80–96px square, `object-cover`) left, name + description + price stacked right. Full-width row, subtle divider between dishes.
- D-05: No image → neutral placeholder (gray square with fork icon, or no image area). Layout must not break.
- D-06: Sticky tab bar + scroll-to-section. Tab bar sticks to top after restaurant header scrolls away. Tapping triggers smooth scroll to category section anchor.
- D-07: Category names as visible section headers/separators within the dish list.
- D-08: Active tab highlights the category currently in the viewport (IntersectionObserver or manual scroll tracking).
- D-09: Allergen emoji in 24px circles with `bg-brand-acento` background. Tooltip shows full allergen name on hover/tap.
- D-10: Show allergen row only if dish has at least one allergen. Omit entirely if none.
- D-11: Emoji mapping defined (see CONTEXT.md — gluten→🌾, crustaceos→🦐, etc.).
- D-12: `/menu/[slug]` is a Server Component. Data fetched at build/revalidation time. Category and dish queries join via restaurant._id.
- D-13: `notFound()` from `next/navigation` when slug doesn't match any Restaurant document.
- D-14: ISR is on-demand only — no `export const revalidate = N`. Existing `revalidatePath('/menu/' + restaurant.slug)` calls in all mutating server actions are sufficient.
- D-15: Only the sticky tab bar and scroll behavior are client-side. Extracted into a single `'use client'` component `MenuCategoryNav`. Rest of page stays server-rendered.
- D-16: No full page reload when switching categories — all dishes already in HTML, client just scrolls.
- D-17: `/dashboard/settings` gets a new "Descripción" textarea (optional, max ~200 chars suggested). Same card as name + logo. Saves via existing `updateRestaurantProfile` action.

### Claude's Discretion
- Allergen tooltip implementation: CSS tooltip vs. HTML `title` vs. library — researcher/planner decides.
- D-05 placeholder specifics: gray square with fork icon or no image area — researcher's call.
- D-08 implementation: IntersectionObserver or manual scroll tracking — researcher/planner decides.

### Deferred Ideas (OUT OF SCOPE)
- Custom brand colors per restaurant (color picker in settings, dynamic CSS vars in public menu) — deferred to Phase 5 or post-launch.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PUB-01 | Diner can access `/menu/[slug]` without login | Middleware already marks `/menu/(.*)` as public; route group `(public)` exists |
| PUB-02 | Diner sees dishes grouped by category in configured order | Server Component fetches Category sorted by `order`, groups dishes server-side |
| PUB-03 | Diner sees photo, name, description, and price per dish | Dish model has all fields; horizontal row layout with `next/image` thumbnail |
| PUB-04 | Diner can filter/navigate by category (client-side, no DB round-trip) | `MenuCategoryNav` client island + IntersectionObserver; all dishes in HTML |
| PUB-05 | Allergen icons with tooltip on hover/tap | `AllergenBadge` component + CSS tooltip; emoji map in new `lib/allergenEmoji.ts` |
| PUB-06 | Non-existent slug returns 404 | `notFound()` from `next/navigation` when `Restaurant.findOne({ slug })` returns null |
| PUB-07 | Public menu served with ISR | On-demand ISR via `revalidatePath` already called in all 8 mutations; no `revalidate = N` |
</phase_requirements>

---

## Research Summary

Key findings from investigating the codebase and official documentation:

- **Route already scaffolded:** `app/(public)/menu/[slug]/page.tsx` and `app/(public)/layout.tsx` exist as stubs. The public route group is already in place. Middleware already whitelists `/menu/(.*)` as a public route. Zero configuration changes needed for route protection.
- **ISR without `generateStaticParams`:** Returning an empty array from `generateStaticParams` (or omitting it entirely) means all slugs are rendered on first request and cached. With `dynamicParams = true` (the default), unvisited slugs are generated on-demand. `notFound()` correctly triggers the 404 page when the slug is not in MongoDB. Do NOT set `export const revalidate` — the 8 existing `revalidatePath` calls in server actions handle invalidation. [VERIFIED: nextjs.org/docs ISR + generateStaticParams]
- **`params` is async in Next.js 15+:** The page signature must be `params: Promise<{ slug: string }>` with `const { slug } = await params`. This is a breaking change from Next.js 14. [VERIFIED: nextjs.org/docs generateStaticParams]
- **Parallel DB queries with `Promise.all`:** The existing `DishesPage` already demonstrates the pattern. Public menu should use `Promise.all([Category.find(...), Dish.find(...)])` after resolving the restaurant from slug. Grouping dishes by category is a server-side reduce before serializing to the client island.
- **`next/image` requires `remotePatterns`:** `next.config.ts` currently has no image configuration. Cloudinary images will fail unless `res.cloudinary.com` is added to `remotePatterns`. [VERIFIED: nextjs.org/docs Image Component]
- **Tailwind v4 `@theme` tokens confirmed:** `globals.css` defines `--color-brand-principal`, `--color-brand-titulares`, `--color-brand-acento`, `--color-brand-fondo`, `--color-brand-texto`. Components use utility classes `bg-brand-acento`, `text-brand-titulares`, etc. This is the correct pattern — no `tailwind.config.ts` needed. [VERIFIED: codebase grep]
- **`useActionState` pattern confirmed:** `RestaurantProfileForm.tsx` already uses `useActionState` from `'react'` (React 19) — not `useFormState` from `'react-dom'`. The description textarea follows this exact pattern. [VERIFIED: codebase read]
- **Mongoose schema addition is non-breaking:** Adding `description: { type: String, default: '' }` to `RestaurantSchema` does not require a migration. Existing documents without the field will return `''` (the default) on the next read. MongoDB is schema-flexible. [ASSUMED — standard Mongoose behavior, no migration tooling needed]
- **CSS tooltip is the right choice** over `title` attribute (inaccessible on mobile) and a tooltip library (adds bundle weight). A simple `group/tooltip relative` Tailwind pattern achieves hover-on-desktop and tap-on-mobile visibility with no extra dependencies. [ASSUMED — common Next.js 15+ pattern]
- **IntersectionObserver for active tab** is the correct choice over scroll event listeners. It fires only when section boundaries cross the viewport, requiring no scroll math. The `useRef` array pattern works cleanly with a single `'use client'` component. [ASSUMED — widely established pattern]

---

## ISR & Data Fetching

### How On-Demand ISR Works Here

The existing 8 mutating server actions (createCategory, updateCategory, deleteCategory, reorderCategory, createDish, updateDish, deleteDish, toggleDishAvailability) all call `revalidatePath('/menu/' + restaurant.slug)`. This means:

1. At build time, `/menu/[slug]` is NOT pre-generated (no `generateStaticParams` returning real slugs, or returning empty array).
2. First visitor after a mutation triggers fresh render from MongoDB.
3. That render is cached. Subsequent visitors hit the cache (fast).
4. Next mutation calls `revalidatePath`, invalidating the cache.
5. Next request triggers fresh render again.

**No `export const revalidate = N` should be set.** Setting it would create time-based revalidation in addition to on-demand, which is wasteful and not what D-14 specifies. [VERIFIED: nextjs.org/docs ISR]

### Page Signature (Next.js 16 — params is async)

```typescript
// Source: nextjs.org/docs/app/api-reference/functions/generate-static-params
export default async function MenuPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // ...
}
```

**Critical:** `params` is a `Promise` in Next.js 15+. Accessing `params.slug` synchronously (the Next.js 14 pattern) causes a runtime warning and will break in future versions. [VERIFIED: nextjs.org/docs]

### generateStaticParams for On-Demand-Only ISR

```typescript
// Return empty array = no paths built at build time, all generated on-demand
export async function generateStaticParams() {
  return []
}
```

With `dynamicParams = true` (the default), any slug not in the empty list is generated on-demand. If the slug doesn't exist in MongoDB, `notFound()` returns a 404. [VERIFIED: nextjs.org/docs]

### Data Fetching Pattern

```typescript
// Source: existing DishesPage pattern (app/(admin)/dashboard/dishes/page.tsx)
import { notFound } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { Category } from '@/models/Category'
import { Dish } from '@/models/Dish'

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  await dbConnect()
  const restaurant = await Restaurant.findOne({ slug }).lean<{
    _id: string; name: string; slug: string; logoUrl: string; description: string
  }>()
  if (!restaurant) notFound()

  const [categories, dishes] = await Promise.all([
    Category.find({ restaurantId: restaurant._id }).sort({ order: 1 }).lean(),
    Dish.find({ restaurantId: restaurant._id, available: true }).lean(),
  ])

  // Group dishes by categoryId — server-side, no client round-trip
  const dishesByCategory: Record<string, typeof dishes> = {}
  for (const dish of dishes) {
    const key = String(dish.categoryId)
    if (!dishesByCategory[key]) dishesByCategory[key] = []
    dishesByCategory[key].push(dish)
  }

  return (
    // Server-rendered HTML with client island for tab nav
    <MenuLayout
      restaurant={JSON.parse(JSON.stringify(restaurant))}
      categories={JSON.parse(JSON.stringify(categories))}
      dishesByCategory={JSON.parse(JSON.stringify(dishesByCategory))}
    />
  )
}
```

**Why `JSON.parse(JSON.stringify(...))`:** Mongoose `.lean()` returns POJO but with `ObjectId` instances — these are not serializable to client components. The double-parse converts them to plain strings. This is the established project pattern (confirmed in CategoriesPage, DishesPage). [VERIFIED: codebase pattern]

### Price Display

Price is stored as centavos integer (confirmed in STATE.md and Dish model). Display formula: `(price / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })`. [VERIFIED: codebase STATE.md]

---

## Sticky Tab Bar (MenuCategoryNav)

### Architecture

The page is a Server Component. `MenuCategoryNav` is extracted as the sole `'use client'` island — it receives the category list and section IDs as props, handles IntersectionObserver, and renders the sticky tab buttons.

### CSS Sticky Positioning

```tsx
// MenuCategoryNav.tsx
'use client'
<nav className="sticky top-0 z-10 bg-white border-b border-brand-acento overflow-x-auto">
  <div className="flex gap-0 px-4">
    {categories.map(cat => (
      <button
        key={cat._id}
        onClick={() => scrollToSection(cat._id)}
        className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150
          ${activeId === cat._id
            ? 'border-brand-principal text-brand-principal'
            : 'border-transparent text-brand-texto hover:text-brand-titulares'
          }`}
      >
        {cat.name}
      </button>
    ))}
  </div>
</nav>
```

`sticky top-0` keeps the nav pinned after the restaurant header scrolls out of view. `overflow-x-auto` allows horizontal scroll on mobile when categories overflow. `z-10` ensures it layers above dish rows.

### IntersectionObserver for Active Tab

```tsx
// Source: established web platform pattern [ASSUMED — standard approach]
useEffect(() => {
  const observers: IntersectionObserver[] = []

  categories.forEach(cat => {
    const section = document.getElementById(`category-${cat._id}`)
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActiveId(cat._id)
      },
      {
        rootMargin: '-20% 0px -70% 0px', // trigger when section is in upper 30% of viewport
        threshold: 0,
      }
    )
    observer.observe(section)
    observers.push(observer)
  })

  return () => observers.forEach(o => o.disconnect())
}, [categories])
```

`rootMargin: '-20% 0px -70% 0px'` means the active tab switches when a section enters the upper 30% of the viewport — giving a natural "you are here" feel while scrolling down. [ASSUMED — recommended rootMargin for sticky nav patterns]

### Smooth Scroll on Tab Click

```tsx
function scrollToSection(categoryId: string) {
  const el = document.getElementById(`category-${categoryId}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
```

No CSS `scroll-behavior: smooth` on `html` needed — `scrollIntoView` with `behavior: 'smooth'` is sufficient and scoped. [ASSUMED — standard DOM API]

### Section Anchors in Server HTML

Each category section in the server-rendered dish list needs a matching `id`:

```tsx
<section id={`category-${cat._id}`} key={cat._id}>
  <h2 className="text-lg font-bold text-brand-titulares px-4 py-3 bg-brand-fondo sticky top-12">
    {cat.name}
  </h2>
  {/* dishes... */}
</section>
```

Note: `top-12` (48px) offsets the category header below the sticky tab bar height (~48px) when it sticks during scroll. Adjust to match actual tab bar height. [ASSUMED — typical sticky header offset]

---

## Allergen Display

### New File: `lib/allergenEmoji.ts`

Do NOT modify `lib/allergens.ts`. Add a separate mapping file:

```typescript
// lib/allergenEmoji.ts — new file
// Source: D-11 from CONTEXT.md
import type { AllergenKey } from './allergens'

export const ALLERGEN_EMOJI: Record<AllergenKey, string> = {
  gluten:              '🌾',
  crustaceos:          '🦐',
  huevos:              '🥚',
  pescado:             '🐟',
  cacahuetes:          '🥜',
  soja:                '🫘',
  lacteos:             '🥛',
  frutos_de_cascara:   '🌰',
  apio:                '🥬',
  mostaza:             '🌻',
  sesamo:              '🫙',
  dioxido_de_azufre:   '🍷',
  altramuces:          '🌼',
  moluscos:            '🦪',
}
```

### AllergenBadge Component

Use a CSS `group` tooltip pattern — no library needed, no JS bundle cost. Works on desktop hover and mobile tap (via `focus-visible` or a tap toggle). [ASSUMED — established Tailwind pattern]

```tsx
// components/menu/AllergenBadge.tsx — new file
// Source: Tailwind v4 group tooltip pattern [ASSUMED]
import { ALLERGENS } from '@/lib/allergens'
import { ALLERGEN_EMOJI } from '@/lib/allergenEmoji'
import type { AllergenKey } from '@/lib/allergens'

interface Props {
  allergenKey: AllergenKey
}

export function AllergenBadge({ allergenKey }: Props) {
  const label = ALLERGENS.find(a => a.key === allergenKey)?.label ?? allergenKey
  const emoji  = ALLERGEN_EMOJI[allergenKey] ?? '?'

  return (
    <span
      className="relative group/badge"
      role="img"
      aria-label={label}
    >
      {/* Circle */}
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-acento text-sm select-none cursor-default">
        {emoji}
      </span>
      {/* Tooltip */}
      <span
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1
                   bg-brand-titulares text-white text-xs font-normal rounded whitespace-nowrap
                   opacity-0 group-hover/badge:opacity-100 pointer-events-none
                   transition-opacity duration-150 z-20"
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  )
}
```

**Why CSS tooltip over `title` attribute:** `title` is not shown on touch devices (mobile) and cannot be styled. The CSS group pattern works on all platforms. [ASSUMED — documented limitation of `title` on touch devices]

**Usage in dish row:**

```tsx
{dish.allergens.length > 0 && (
  <div className="flex items-center gap-1 flex-wrap mt-1">
    {dish.allergens.map(key => (
      <AllergenBadge key={key} allergenKey={key as AllergenKey} />
    ))}
  </div>
)}
```

---

## Restaurant Model Extension

### Schema Change

Add `description` field to `models/Restaurant.ts`:

```typescript
// Existing field pattern — add after logoPublicId
description: { type: String, default: '' },
```

Full updated schema:

```typescript
const RestaurantSchema = new Schema(
  {
    clerkId:       { type: String, required: true, unique: true, index: true },
    name:          { type: String, required: true },
    slug:          { type: String, required: true, unique: true, index: true, lowercase: true },
    slugConfirmed: { type: Boolean, default: false },
    logoUrl:       { type: String, default: '' },
    logoPublicId:  { type: String, default: '' },
    description:   { type: String, default: '' },   // NEW — Phase 3
  },
  { timestamps: true }
)
```

### Migration Required?

No. MongoDB is schema-flexible. Existing documents without the `description` field will return `''` (the Mongoose default) on the next read — no Atlas migration script needed. Adding a new optional field with a default is always backwards-compatible in Mongoose. [ASSUMED — standard Mongoose behavior]

---

## Settings Page Update

### Changes Required

Three files need changes (no new files):

**1. `models/Restaurant.ts`** — add `description` field (see above).

**2. `actions/restaurant.ts` — `updateRestaurantProfile`**

Add `description` extraction and persist it:

```typescript
// Add after `const name = ...`
const description = formData.get('description')?.toString().trim() ?? ''

// Add to update object
const update: Record<string, string> = { name, description }
```

**3. `components/dashboard/RestaurantProfileForm.tsx`**

Add `initialDescription` prop and a controlled textarea. Follow the exact same disabled/pending/focus pattern as the existing name input:

```tsx
// Add to Props interface
initialDescription: string

// Add state
const [description, setDescription] = useState(initialDescription)

// Add hidden field or direct name attr
<div className="flex flex-col gap-1.5">
  <label className="text-sm font-medium text-brand-texto" htmlFor="restaurant-description">
    Descripción <span className="text-xs font-light text-brand-texto">(opcional)</span>
  </label>
  <textarea
    id="restaurant-description"
    name="description"
    defaultValue={initialDescription}
    placeholder="Ej. Cocina italiana casera en el corazón de Palermo..."
    maxLength={200}
    rows={3}
    disabled={pending}
    className="w-full border border-gray-200 rounded-md px-3 py-3 text-sm font-normal text-brand-texto bg-white placeholder:text-gray-400 focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal transition-colors duration-100 disabled:border-gray-100 disabled:bg-gray-50 resize-none"
  />
  <p className="text-xs font-light text-brand-texto">Máximo 200 caracteres. Se muestra en tu menú público.</p>
</div>
```

Note: The textarea can use `defaultValue` (uncontrolled) since there is no programmatic reset needed — the form action reads `formData.get('description')` directly. This matches the approach used for the `name` field. [VERIFIED: codebase — name input uses `defaultValue`]

**4. `app/(admin)/dashboard/settings/page.tsx`**

Add `description` to the `.lean()` type annotation and pass it to the form:

```typescript
const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
  _id: string
  name: string
  slug: string
  logoUrl: string
  logoPublicId: string
  description: string   // NEW
}>()

// In JSX:
<RestaurantProfileForm
  initialName={restaurant.name}
  initialLogoUrl={restaurant.logoUrl ?? ''}
  initialLogoPublicId={restaurant.logoPublicId ?? ''}
  initialDescription={restaurant.description ?? ''}   // NEW
/>
```

---

## Image Handling

### `next/image` for Cloudinary Thumbnails

`next.config.ts` currently has no `images` configuration. Cloudinary images served from `res.cloudinary.com` will fail with a 400 error if `remotePatterns` is not set. This is a **required change**. [VERIFIED: nextjs.org/docs Image Component]

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
```

### Dish Thumbnail Usage

For 80–96px thumbnails in the horizontal list row:

```tsx
import Image from 'next/image'

// Within dish row:
<div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-gray-100">
  {dish.imageUrl ? (
    <Image
      src={dish.imageUrl}
      alt={dish.name}
      fill
      sizes="80px"
      className="object-cover"
    />
  ) : (
    <DishPlaceholder />
  )}
</div>
```

`fill` + `sizes="80px"` tells Next.js Image to serve the smallest available width (128px in the default device size breakpoints), minimizing bandwidth for thumbnails. The parent `div` must have `position: relative` (the `relative` utility class provides this). [VERIFIED: nextjs.org/docs Image Component]

### D-05: Placeholder for Missing Dish Images

Use an inline SVG placeholder — no extra component file needed:

```tsx
// Inline in the dish row (or extracted to a tiny DishPlaceholder component)
function DishPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
        {/* Fork and knife icon */}
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    </div>
  )
}
```

This keeps the `w-20 h-20` slot filled with a neutral gray that matches neither brand colors nor dish content, clearly indicating "no photo". No layout shifts occur. [ASSUMED — established inline SVG placeholder pattern]

### Logo in Restaurant Header

The restaurant logo (if present) uses a regular `<img>` tag — consistent with how `RestaurantProfileForm.tsx` already renders the logo preview (`<img src={logoUrl}>` with `eslint-disable-next-line @next/next/no-img-element`). For the public header, use `next/image` with `width` and `height` props (since the logo container has a known size), or keep the `<img>` pattern to avoid the `eslint-disable` comment propagating into public routes. Either works — `next/image` is recommended for CDN optimization.

---

## Tailwind v4 Brand Tokens

### Confirmed Token Names

From `app/globals.css` (verified in codebase):

```css
@theme {
  --color-brand-principal: #EA580C;
  --color-brand-titulares: #9A3412;
  --color-brand-acento:    #FED7AA;
  --color-brand-fondo:     #FFF7ED;
  --color-brand-texto:     #1C1917;
  --font-sans: var(--font-fira-sans), sans-serif;
}
```

**Utility class names in Tailwind v4:**

| CSS Variable | Tailwind Utility |
|---|---|
| `--color-brand-principal` | `bg-brand-principal`, `text-brand-principal`, `border-brand-principal` |
| `--color-brand-titulares` | `bg-brand-titulares`, `text-brand-titulares` |
| `--color-brand-acento` | `bg-brand-acento`, `text-brand-acento`, `border-brand-acento` |
| `--color-brand-fondo` | `bg-brand-fondo` |
| `--color-brand-texto` | `text-brand-texto` |

[VERIFIED: codebase — all admin panel components use these exact class names]

**Do NOT use** `tailwind.config.ts` for brand tokens — Tailwind v4 uses `@theme` in CSS. [VERIFIED: CLAUDE.md rule #9]

### Public Menu Color Application

- Page background: `bg-brand-fondo`
- Restaurant name H1: `text-brand-titulares font-bold`
- Category section headers: `text-brand-titulares font-bold` (H2)
- Dish name: `text-brand-texto font-medium`
- Price: `text-brand-titulares font-bold`
- Active tab indicator: `border-brand-principal text-brand-principal`
- Allergen badge background: `bg-brand-acento`
- Sticky tab bar background: `bg-white` (not brand-fondo, for visual separation)

---

## Route Configuration

### Current Middleware State

```typescript
// middleware.ts — VERIFIED from codebase
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/menu/(.*)',     // ← Already present, Phase 3 route is already whitelisted
])
```

**No middleware changes needed.** `/menu/(.*)` is already in `isPublicRoute`. The middleware exits early (`return`) for public routes without calling `auth.protect()`. [VERIFIED: codebase — middleware.ts]

### Route Group Structure

The `(public)` route group already exists:

```
app/
├── (public)/
│   ├── layout.tsx          ← PassThrough layout (returns children as-is)
│   └── menu/
│       └── [slug]/
│           └── page.tsx    ← Stub exists; needs full implementation
├── (admin)/
│   ├── layout.tsx
│   └── dashboard/...
└── layout.tsx              ← Root layout (ClerkProvider, Fira Sans, globals.css)
```

The `(public)/layout.tsx` is a passthrough (`return <>{children}</>`) — this means public menu pages use the root layout (ClerkProvider, Fira Sans, brand CSS vars) but NOT the admin shell (Sidebar + DashboardHeader). This is correct. [VERIFIED: codebase]

### No Clerk Auth in Public Route

The public menu page must NOT call `await auth()` — it is a public route and no userId is available. Dishes must be fetched using `slug → Restaurant._id` join, not `userId → Restaurant._id`. [VERIFIED: CLAUDE.md architecture rule #1 — "filter by userId from auth()" applies to admin routes only; public menu uses slug]

---

## Validation Architecture

### What to Verify After Execution

Since this project has no automated test framework installed (confirmed: no jest.config, vitest.config, or test directories in the codebase), validation is manual smoke testing.

| Req ID | Verification Step | Method |
|--------|-------------------|--------|
| PUB-01 | Visit `/menu/[slug]` in incognito (no Clerk session) | Manual — expect page loads, no redirect |
| PUB-02 | Verify categories appear in correct order; reorder in admin, revisit public menu | Manual — order matches dashboard order |
| PUB-03 | Verify photo, name, description, price visible for each dish | Manual — visual inspection |
| PUB-04 | Tap each tab; verify smooth scroll to section; active tab highlights | Manual — mobile + desktop |
| PUB-05 | Hover allergen badge on desktop; tap on mobile; verify tooltip shows label | Manual — both platforms |
| PUB-06 | Visit `/menu/nonexistent-slug` — expect Next.js 404 page | Manual — browser |
| PUB-07 | Update a dish in admin; verify public menu shows change without full server restart | Manual — confirms ISR revalidation |
| D-17 | Add description in settings; verify it appears in public menu header | Manual — end-to-end |
| D-05 | Create dish with no image; verify placeholder shows without layout break | Manual — visual |

**Build-time check:** `next build` must complete without TypeScript errors. The async `params` signature change and `remotePatterns` addition are type-checked at build.

---

## Risks & Pitfalls

### Pitfall 1: Synchronous `params` Access (Breaking Change)

**What goes wrong:** Writing `params.slug` instead of `(await params).slug` in the page component. This is the Next.js 14 pattern and does not work in Next.js 15+.

**Why it happens:** Training data and older tutorials show synchronous params. Next.js 15 made params async.

**How to avoid:** Always destructure params with `const { slug } = await params`. [VERIFIED: nextjs.org/docs]

**Warning signs:** Next.js will emit a deprecation warning in dev mode if params is accessed synchronously.

---

### Pitfall 2: Missing `remotePatterns` for Cloudinary

**What goes wrong:** `next/image` returns a 400 Bad Request for any `src` pointing to `res.cloudinary.com` because the domain is not whitelisted.

**Why it happens:** `next.config.ts` starts with empty config. `next/image` blocks all external domains by default for security.

**How to avoid:** Add `remotePatterns` to `next.config.ts` before using `next/image` for dish thumbnails. [VERIFIED: nextjs.org/docs Image Component]

**Warning signs:** Browser shows broken image; Next.js server logs a 400 for `/_next/image` requests.

---

### Pitfall 3: ObjectId Serialization Error

**What goes wrong:** Passing Mongoose document or `.lean()` result directly as a prop to a `'use client'` component throws "Objects with toJSON or toPOJO..." or silent serialization failures.

**Why it happens:** Mongoose ObjectId instances are not plain JSON. React Server Components serialize props to JSON.

**How to avoid:** Always `JSON.parse(JSON.stringify(data))` before passing to client components. This is already the project pattern in CategoriesPage and DishesPage. [VERIFIED: codebase pattern]

**Warning signs:** "Only plain objects can be passed to Client Components from Server Components" error in the Next.js error overlay.

---

### Pitfall 4: ISR Not Firing Due to Missing `revalidatePath` in New Mutations

**What goes wrong:** A new server action that mutates dish/category data (if any are added) does not call `revalidatePath('/menu/' + restaurant.slug)`, so the public menu stays stale.

**Why it happens:** Phase 3 adds `updateRestaurantProfile` with `description` — and the existing action already calls `revalidatePath('/menu/' + restaurant.slug)`. This is already handled. But any future mutations must follow the same pattern.

**How to avoid:** Verify `updateRestaurantProfile` in `actions/restaurant.ts` already calls `revalidatePath('/menu/' + restaurant.slug)` after saving description — it does (line 97). [VERIFIED: codebase]

---

### Pitfall 5: Sticky Tab Bar Height Not Accounted in Section Scroll Offset

**What goes wrong:** Tapping a tab scrolls the section header directly behind the sticky tab bar, hiding it.

**Why it happens:** `scrollIntoView({ block: 'start' })` scrolls to the top of the element, not accounting for sticky elements above.

**How to avoid:** Use `scroll-margin-top` CSS on each section, or offset the scroll with JavaScript. Recommended: add a Tailwind class like `scroll-mt-12` (48px) to each `<section id="category-...">` element to push the scroll target below the tab bar. [ASSUMED — established sticky nav workaround]

---

### Pitfall 6: `description` Field Missing from `updateRestaurantProfile` Update Object

**What goes wrong:** The `update` object in `updateRestaurantProfile` is built with conditional assignments (`if (newLogoUrl) update.logoUrl = ...`). If `description` is added only to the conditional block, an empty description (clearing the field) would not be persisted.

**Why it happens:** The existing update logic is defensive for logo fields (only set if non-empty, to avoid overwriting with empty string). Description should always be written — including empty string (clearing the description is valid).

**How to avoid:** Add `description` directly to the base `update` object (not in a conditional), similar to `name`:

```typescript
const update: Record<string, string> = { name, description }
```

[VERIFIED: codebase — `actions/restaurant.ts` pattern reviewed]

---

### Pitfall 7: Public Menu Route Group Layout Contamination

**What goes wrong:** Adding Sidebar or DashboardHeader markup to `app/(public)/layout.tsx` would wrap the public menu in the admin shell.

**Why it happens:** Forgetting that `(public)/layout.tsx` is intentionally a passthrough.

**How to avoid:** Keep `(public)/layout.tsx` as `return <>{children}</>`. The public menu page's own JSX handles the full page chrome (header, tab bar, dish list, footer). [VERIFIED: codebase — layout.tsx confirmed as passthrough]

---

## Sources

### Primary (HIGH confidence)
- `nextjs.org/docs/app/guides/incremental-static-regeneration` — ISR on-demand, revalidatePath behavior, dynamicParams defaults [VERIFIED: 2026-05-05, version 16.2.4]
- `nextjs.org/docs/app/api-reference/functions/generate-static-params` — async params signature, empty array pattern [VERIFIED: 2026-05-05, version 16.2.4]
- `nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/dynamicParams` — default true, on-demand generation [VERIFIED: 2026-05-05, version 16.2.4]
- `nextjs.org/docs/app/api-reference/components/image` — remotePatterns for Cloudinary, fill + sizes pattern [VERIFIED: 2026-05-05, version 16.2.4]
- Codebase: `middleware.ts`, `models/Restaurant.ts`, `models/Dish.ts`, `models/Category.ts`, `lib/allergens.ts`, `app/globals.css`, `actions/restaurant.ts`, `components/dashboard/RestaurantProfileForm.tsx`, `app/(public)/layout.tsx`, `app/(public)/menu/[slug]/page.tsx` [VERIFIED: 2026-05-05]
- Codebase: `app/(admin)/dashboard/dishes/page.tsx` — Promise.all pattern [VERIFIED: 2026-05-05]
- `CLAUDE.md` — architecture rules, brand tokens, Tailwind v4 directive [VERIFIED: 2026-05-05]

### Tertiary (LOW confidence — ASSUMED)
- IntersectionObserver rootMargin recommendation for sticky nav
- CSS group/tooltip pattern for allergen badges
- DishPlaceholder inline SVG approach
- Mongoose non-breaking schema field addition (no migration needed)
- `scroll-mt-12` sticky offset technique

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Adding `description` field with `default: ''` to Mongoose schema does not require a DB migration — existing documents return `''` on next read | Restaurant Model Extension | Low — would require a one-time Atlas update script, not a breaking change |
| A2 | CSS `group/badge` tooltip pattern works on mobile tap (via touch/focus state) without JS | Allergen Display | Medium — if touch devices don't trigger hover, allergen labels are desktop-only; mitigation: add `focus-visible` or a click toggle |
| A3 | IntersectionObserver `rootMargin: '-20% 0px -70% 0px'` feels natural for this layout | Sticky Tab Bar | Low — rootMargin is tunable; wrong value just means active tab switches at an awkward scroll position |
| A4 | Inline SVG fork icon (gray, `#9CA3AF`) reads clearly as "no dish photo" placeholder | Image Handling | Low — cosmetic only |
| A5 | `scroll-mt-12` (48px) on section elements matches the sticky tab bar height | Sticky Tab Bar | Low — value must be adjusted once actual tab bar height is measured; wrong value causes header to hide under tab bar |

---

## RESEARCH COMPLETE
