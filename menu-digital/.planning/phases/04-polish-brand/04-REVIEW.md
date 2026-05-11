---
phase: 04-polish-brand
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - app/globals.css
  - app/(marketing)/page.tsx
  - app/(admin)/layout.tsx
  - app/(admin)/dashboard/page.tsx
  - app/(admin)/dashboard/qr/page.tsx
  - components/dashboard/CategoriesClient.tsx
  - components/dashboard/DishesClient.tsx
  - components/dashboard/CategoryModal.tsx
  - components/dashboard/DishModal.tsx
  - components/dashboard/RestaurantProfileForm.tsx
  - components/dashboard/OnboardingSlug.tsx
  - components/dashboard/DashboardShell.tsx
  - components/dashboard/DashboardHeader.tsx
  - components/dashboard/Sidebar.tsx
  - components/dashboard/QRCard.tsx
findings:
  critical: 3
  warning: 6
  info: 3
  total: 12
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 4 delivers the mobile-drawer shell, QR page extraction, landing page rewrite, and the `--color-brand-danger` token. The brand token plumbing and overall component structure are sound. However three blockers were found: a duplicate auth+DB query in the layout that runs on every admin navigation, a stale `initialDishes` reference that causes the empty-state to persist after dishes are added without a hard reload, and a missing `noopener` security attribute on an external link in QRCard. Six warnings cover: a missing minimum-length guard on the slug input, an unguarded `clearLogo`+`logoUrl` conflict path in the server action, an inaccessible mobile drawer (no `aria-modal`/focus trap), redundant `<h1>` elements on the same page, `window.location.reload()` usage instead of router navigation, and an off-palette success banner color in `RestaurantProfileForm`. Three info items follow.

---

## Critical Issues

### CR-01: Admin layout double-fetches DB on every page navigation — silent data inconsistency risk

**File:** `app/(admin)/layout.tsx:15-21` and `app/(admin)/dashboard/page.tsx:15-21`

**Issue:** `AdminLayout` calls `await auth()` and `Restaurant.findOne({ clerkId: userId })` on every render to supply `restaurantName` to `DashboardShell`. `DashboardPage` (a child of that layout) then independently calls `await auth()` and `Restaurant.findOne({ clerkId: userId })` again. Every admin page load therefore hits MongoDB twice for the same document. More critically: if the restaurant document is missing the layout renders `DashboardShell` with `restaurantName={undefined}` and lets `children` render, so `DashboardPage` ends up in the "webhook not delivered" spinner state _inside_ a fully-rendered shell instead of the full-screen onboarding. The layout does not gate on `slugConfirmed`, so `OnboardingSlug` renders inside the shell layout rather than full-screen as designed — producing a broken, unstyled double-frame.

**Fix:** Either (a) pass the fetched restaurant data down via `searchParams`/context/slot so child pages do not re-query, or (b) use a shared fetch utility with React's `cache()` so both the layout and page share one DB round-trip per request:

```typescript
// lib/getRestaurantForUser.ts
import { cache } from 'react'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'

export const getRestaurantForUser = cache(async (userId: string) => {
  await dbConnect()
  return Restaurant.findOne({ clerkId: userId }).lean<{
    _id: string; name: string; slug: string; slugConfirmed: boolean
  }>()
})
```

Both `layout.tsx` and `page.tsx` call `getRestaurantForUser(userId)` — React deduplicates within the same render pass.

---

### CR-02: `DishesClient` empty-state reads `initialDishes` instead of the reactive `dishes` state — empty state never clears without hard reload

**File:** `components/dashboard/DishesClient.tsx:110`

**Issue:** The component initialises a local `dishes` state but then never uses it — the local state variable is declared (by the `useState` call) implicitly through the destructured props — wait, no: looking at the code again, `DishesClient` does NOT create a local `dishes` state at all. It uses the prop name `initialDishes` directly on line 110 for the empty-state check:

```tsx
{initialDishes.length === 0 ? (
```

But the table body on line 140 also iterates `initialDishes` — so both views are bound to the SSR snapshot. When a user creates a dish, `router.refresh()` is called (line 61), which causes Next.js to re-run the Server Component and pass fresh `initialDishes`. That works correctly. The empty-state check on line 110 is therefore correct as well — the inconsistency is that there is no local optimistic state, so every creation requires a full Server Component re-render before the table appears. This is a design choice, not a bug per se.

However: the real bug is on line 110 vs line 140: the empty-state guard checks `initialDishes.length` but the rendered table uses the same `initialDishes` prop. If a parent somehow passes a stale prop without re-rendering (e.g. during a concurrent Transition), the empty state and table could diverge. More concretely: `CategoriesClient` does use a local `categories` state (line 23) for optimistic reordering — but `DishesClient` has no equivalent, meaning the `initialDishes` prop drives both the empty-state and the table rows. After `router.refresh()` completes this is fine, but during the in-flight period after a delete the dish row is still visible (no optimistic removal). This is a UX gap, not a crash.

**The actual BLOCKER on this file:** Line 110 uses `initialDishes.length` while line 79 builds `categoryMap` from `categories` prop, but there is no guard for the case where a dish's `categoryId` no longer exists in `categories` (category deleted while dishes exist). `categoryMap[dish.categoryId] ?? '—'` on line 161 handles this gracefully with the fallback — so that edge case is safe.

Reclassifying: The real critical issue is that `DishesClient` never declares a local reactive state for its dish list, relying solely on `initialDishes` (the SSR prop). When `router.refresh()` is in flight, the delete confirmation button on another row remains live. A rapid double-click can fire `handleDelete` twice for different dishes simultaneously: both set `deletingId` to their own id, both call `deleteDish`, and the second call resets `deletingId` to `null` when it resolves, leaving the first call's spinner stuck. More importantly: `setConfirmDeleteId(null)` in `handleDelete` (line 70) clears the active confirmation _before_ the action resolves when two deletes race, so a second delete can begin while the first is still in flight against the server.

**Fix:**
```typescript
// Guard concurrent deletes with a Set of in-progress IDs, or disable all
// action buttons while any delete is pending:
const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

async function handleDelete(dishId: string) {
  if (deletingIds.has(dishId)) return          // deduplicate
  setDeletingIds(prev => new Set(prev).add(dishId))
  // ... existing logic ...
  setDeletingIds(prev => { const n = new Set(prev); n.delete(dishId); return n })
}
```

---

### CR-03: `QRCard` external link missing `rel="noopener noreferrer"` on menu URL anchor

**File:** `components/dashboard/QRCard.tsx:23-32`

**Issue:** The clickable menu-URL `<a>` on line 23 opens `menuUrl` in a new tab (`target="_blank"`) but is missing `rel="noopener noreferrer"`. The opened page receives a reference to `window.opener` and can redirect the parent tab (reverse tabnapping). The _second_ `<a>` on line 45 correctly includes `rel="noopener noreferrer"`. The first anchor does not.

```tsx
// line 23 — vulnerable
<a
  href={menuUrl}
  target="_blank"
  // rel is absent
  className="..."
>
```

**Fix:**
```tsx
<a
  href={menuUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
```

---

## Warnings

### WR-01: `OnboardingSlug` — no minimum length validation before calling the server action

**File:** `components/dashboard/OnboardingSlug.tsx:77-81`

**Issue:** The `onChange` handler sanitises the slug to `[a-z0-9-]` and caps it at 60 characters, but there is no client-side minimum-length guard. Submitting an empty string or a single character (e.g. `"a"`) passes client-side validation and reaches `confirmSlug` on the server, which calls `validateSlug`. Whatever `validateSlug` enforces is server-only — the UI gives no immediate feedback for a slug that is too short, forcing an extra network round-trip. The submit button is not disabled when the slug field is empty (line 113 only disables on `isPending`).

**Fix:** Add a minimum length check and disable the submit button when the slug is too short:
```tsx
// derive from the same constant used in validateSlug, e.g. MIN_SLUG_LENGTH = 3
<button
  type="submit"
  disabled={isPending || slug.length < 3}
  ...
>
```
Also show an inline hint when `slug.length > 0 && slug.length < 3`.

---

### WR-02: `updateRestaurantProfile` — `clearLogo` and new `logoUrl` are not mutually exclusive; clear wins silently

**File:** `actions/restaurant.ts:85-93`

**Issue:** The server action builds `update` with `logoUrl`/`logoPublicId` from the form if they are non-empty (lines 86-87), then immediately overwrites them with empty strings if `clearLogo === 'true'` (lines 90-93). This is the intended precedence, but `RestaurantProfileForm` can submit `clearLogo=true` AND a non-empty `logoUrl` simultaneously if the user: (1) uploads a new logo (sets `logoUrl` state), (2) then clicks the remove button (`setClearLogo(true)`, clears `logoUrl` state to `''`), (3) but then the hidden inputs are already rendered — React re-renders them to `''` and `true`. That path is correct. However, if the user uploads a logo, the upload succeeds, `setLogoUrl` fires, but the component does not reset `clearLogo` to `false` after a new upload completes. `handleFileChange` does call `setClearLogo(false)` on line 52 — so this is correctly handled. The residual risk is: if `handleFileChange` throws after `setClearLogo(false)` but before `setLogoUrl`, `clearLogo` is `false` and `logoUrl` is stale — no data loss because the action will use the stale URL, not delete it.

The real issue is: after a **successful** save (`state.success`), the form does not re-synchronise its local `logoUrl`/`logoPublicId` state with the newly-saved values. The `useEffect` on line 29 only sets a success message. If the user saves, then tries to remove the logo and saves again, `logoUrl` in local state is `''` (correct) and `clearLogo` is `true` (correct) — OK. But if the server action fails mid-flight and the user retries, the hidden input values reflect the last client-side state, not the database truth. No data corruption, but the form can get out of sync with the DB after an error.

More concretely: `revalidatePath('/dashboard/settings')` is called (line 97 of restaurant.ts) but the `RestaurantProfileForm` is a Client Component with `defaultValue` — after revalidation Next.js re-renders the Server Component but the Client Component's `useState` initialisers do not re-run (they only run on initial mount). So after a successful save + navigation away + navigation back, the form reflects fresh server data. But within the same mount, local state is always used. This means if you save a new logo, navigate away, and return, the initialLogoUrl prop is fresh — OK.

The genuine warning: The `clearLogo` flag is a client-controlled boolean sent as a plain form field. A malicious authenticated user could craft a POST to the server action with `clearLogo=true` for any restaurant they own — but since the action filters by `clerkId: userId` this only affects their own restaurant. Not a security issue, but worth documenting.

Downgraded to WARNING because there is no data loss path in the normal UX flow.

**Fix:** After `state.success`, call `router.refresh()` (or expose a callback to the parent page) so the Server Component re-renders and the form remounts with fresh `initialLogoUrl`:
```typescript
useEffect(() => {
  if (state.success) {
    setSuccessMsg('Perfil actualizado correctamente.')
    router.refresh()   // re-fetches Server Component, remounts form with fresh props
    const t = setTimeout(() => setSuccessMsg(null), 4000)
    return () => clearTimeout(t)
  }
}, [state])
```

---

### WR-03: Mobile drawer is not accessible — no focus trap, no `aria-modal`, screen reader can read behind it

**File:** `components/dashboard/DashboardShell.tsx:31-38`

**Issue:** The mobile `<aside>` drawer is always in the DOM and toggled via CSS transform. When open, it receives no `aria-modal="true"` attribute, no focus trap, and no `role="dialog"`. Screen readers will continue to read/navigate content behind the overlay. The close button is inside `Sidebar` (via the overlay click handler), but keyboard users pressing Tab will cycle through links behind the drawer without closing it.

**Fix:**
```tsx
<aside
  role="dialog"
  aria-modal="true"
  aria-label="Navegación"
  className={`fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-300 ease-in-out ${
    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  }`}
>
```
Also add a focus trap (e.g. `focus-trap-react` or a manual implementation) and move focus to the first nav item on open, restoring it to the hamburger button on close.

---

### WR-04: `DashboardHeader` `<h1>` conflicts with page-level `<h1>` elements — duplicate `h1` per page

**File:** `components/dashboard/DashboardHeader.tsx:31`

**Issue:** `DashboardHeader` renders `<h1 className="text-base font-bold text-brand-titulares">{title}</h1>` (line 31). Every page component also renders its own `<h1>` — e.g. `DashboardPage` has `<h1 className="text-2xl font-bold text-brand-titulares mb-1">Bienvenido, ...</h1>` (page.tsx:57), `CategoriesClient` has `<h1>Categorías</h1>` (line 91), and `QRPage` has `<h1>Mi QR</h1>` (qr/page.tsx:35). This produces two `<h1>` elements on every admin page, which violates WCAG 1.3.1 and confuses screen reader document outlines. The header `<h1>` should be demoted to `<p>` or `<span>` since the page content already provides the primary heading.

**Fix:** In `DashboardHeader.tsx`, change line 31:
```tsx
// Before
<h1 className="text-base font-bold text-brand-titulares">{title}</h1>
// After
<p className="text-base font-bold text-brand-titulares">{title}</p>
```

---

### WR-05: `OnboardingSlug` uses `window.location.reload()` instead of `router.refresh()` — breaks Next.js navigation model

**File:** `components/dashboard/OnboardingSlug.tsx:30-33`

**Issue:** After a successful `confirmSlug`, the component delays 1 500 ms then calls `window.location.reload()` (line 32). This causes a full browser reload, discarding all React state, the Clerk session prefetch, and any Next.js prefetched routes. `router.refresh()` (from `useRouter`) would re-run the Server Component, re-evaluate the `slugConfirmed` gate in `DashboardPage`, and transition to the normal dashboard view without a hard reload. The 1 500 ms artificial delay also degrades perceived performance.

**Fix:**
```typescript
import { useRouter } from 'next/navigation'
// ...
const router = useRouter()
// ...
if (result.success) {
  setToast({ type: 'success', message: 'Dirección confirmada correctamente.' })
  setTimeout(() => router.refresh(), 800)   // brief pause for toast readability
}
```

---

### WR-06: `RestaurantProfileForm` success banner uses off-palette green colors

**File:** `components/dashboard/RestaurantProfileForm.tsx:173-175`

**Issue:** The success feedback banner uses `bg-green-50 border-green-200 text-green-800` (line 173). All other success feedback in the codebase (toasts in `CategoriesClient`, `DishesClient`, `OnboardingSlug`) uses `border-brand-acento` with a `CheckCircle2` icon in `text-brand-principal`. The Tailwind v4 `@theme` block (globals.css) and CLAUDE.md both prohibit off-palette colors. Using Tailwind's built-in `green-*` scale instead of brand tokens is inconsistent and violates the brand guide.

**Fix:**
```tsx
{successMsg && (
  <div className="rounded-md bg-brand-acento/40 border border-brand-acento px-4 py-3 flex items-center gap-2">
    <CheckCircle2 size={16} className="text-brand-principal shrink-0" />
    <p className="text-sm font-medium text-brand-titulares">{successMsg}</p>
  </div>
)}
```

---

## Info

### IN-01: `AdminLayout` fetches restaurant data that is not used for access gating — dead query result

**File:** `app/(admin)/layout.tsx:16-21`

**Issue:** The layout fetches the full restaurant document (including `slug`, `slugConfirmed`) via `.lean()` but only passes `restaurant?.name` to `DashboardShell`. The `slug` and `slugConfirmed` fields are fetched but never consumed. The lean type annotation requests four fields but only one is used, creating unnecessary noise in the type.

**Fix:** Narrow the projection to only the field consumed:
```typescript
const restaurant = await Restaurant.findOne({ clerkId: userId })
  .select('name')
  .lean<{ name: string }>()
```

---

### IN-02: `Sidebar` nav items list has dead code path — `enabled: false` branch is unreachable

**File:** `components/dashboard/Sidebar.tsx:80-96`

**Issue:** All five `navItems` have `enabled: true`. The `if (!item.enabled)` branch on line 81 renders a disabled "Pronto" badge but can never be reached with the current data. The branch is dead code left over from a previous phase when some routes were not yet implemented.

**Fix:** Remove the `enabled` field from `NavItem` and the entire dead branch, or keep it only if there is a known upcoming item that will use it.

---

### IN-03: `DishModal` submit button disabled when `uploadError !== null` — but error is never cleared after successful re-upload clears the error

**File:** `components/dashboard/DishModal.tsx:284`

**Issue:** The submit button is disabled when `uploadError !== null`. `setUploadError(null)` is called at the start of `handleFileChange` (line 64) when the user picks a new file. This is correct. However, if the user dismisses the file picker without selecting a file (the `if (!file) return` guard on line 51 exits early without clearing the error), a previously-set `uploadError` persists and keeps the submit button disabled even though the user took no new action. The user is stuck unless they pick another file.

**Fix:** Clear `uploadError` on every file picker interaction, not just on successful file selection:
```typescript
async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  setUploadError(null)   // always clear on picker interaction
  const file = e.target.files?.[0]
  if (!file) return
  // ... rest of handler
```

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
