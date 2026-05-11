# Phase 2: Admin Panel - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 10 new/modified files
**Analogs found:** 9 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(admin)/dashboard/categories/page.tsx` | page (Server Component) | request-response / CRUD read | `app/(admin)/dashboard/page.tsx` | exact |
| `app/(admin)/dashboard/dishes/page.tsx` | page (Server Component) | request-response / CRUD read | `app/(admin)/dashboard/page.tsx` | exact |
| `actions/categories.ts` | server-action | CRUD | `actions/restaurant.ts` | exact |
| `actions/dishes.ts` | server-action | CRUD + file-I/O | `actions/restaurant.ts` | role-match |
| `app/api/sign-cloudinary-params/route.ts` | route handler | request-response | `app/api/webhooks/clerk/route.ts` | role-match |
| `components/dashboard/CategoryModal.tsx` | component (client) | event-driven | `components/dashboard/OnboardingSlug.tsx` | role-match |
| `components/dashboard/DishModal.tsx` | component (client) | event-driven + file-I/O | `components/dashboard/OnboardingSlug.tsx` | role-match |
| `components/dashboard/DashboardHeader.tsx` | component (client) | request-response | `components/dashboard/Sidebar.tsx` | exact |
| `components/dashboard/Sidebar.tsx` | component (client) — modify only | event-driven | self | exact |
| `lib/allergens.ts` | utility / constant | transform | — | no analog |

---

## Pattern Assignments

### `actions/categories.ts` (server-action, CRUD)

**Analog:** `actions/restaurant.ts`

**Imports pattern** (lines 1–6):
```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { revalidatePath } from 'next/cache'
```

**Auth + ownership guard pattern** (lines 8–31 of `actions/restaurant.ts`):
```typescript
export async function confirmSlug(formData: FormData) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'No autorizado.' }
  }

  // ... input validation ...

  await dbConnect()

  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) {
    return { success: false, error: 'Restaurante no encontrado.' }
  }
  // ... ownership-scoped query ...

  return { success: true }
}
```

**Core CRUD pattern — Category create:**
```typescript
// actions/categories.ts — copy this exact guard and return shape
export async function createCategory(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const name = formData.get('name')?.toString().trim()
  if (!name) return { success: false, error: 'El nombre de la categoría es obligatorio.' }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  const maxOrderDoc = await Category
    .findOne({ restaurantId: restaurant._id })
    .sort({ order: -1 })
    .lean<{ order: number }>()

  await Category.create({
    restaurantId: restaurant._id,
    name,
    order: (maxOrderDoc?.order ?? -1) + 1,
  })

  revalidatePath('/menu/' + restaurant.slug)   // literal path — only this restaurant's cache
  return { success: true }
}
```

**Update + ownership check pattern:**
```typescript
// All update/delete actions: find the target doc scoped to restaurant._id first
const category = await Category.findOne({ _id: categoryId, restaurantId: restaurant._id })
if (!category) return { success: false, error: 'Categoría no encontrada.' }

// Then mutate — never trust the client for restaurantId
await Category.updateOne({ _id: categoryId, restaurantId: restaurant._id }, { $set: { name } })
revalidatePath('/menu/' + restaurant.slug)
return { success: true }
```

**Delete with referential integrity guard:**
```typescript
// deleteCategory — block if dishes exist (CAT-03, D-13)
const dishCount = await Dish.countDocuments({ categoryId: category._id })
if (dishCount > 0) {
  return {
    success: false,
    error: 'No podés eliminar esta categoría porque tiene platos asociados. Eliminá o reasigná los platos primero.',
  }
}
await Category.deleteOne({ _id: categoryId, restaurantId: restaurant._id })
```

**Reorder pattern (swap two adjacent docs):**
```typescript
// reorderCategory — swap order values (D-10, D-11)
const target = await Category.findOne({ _id: categoryId, restaurantId: restaurant._id }).lean<{ order: number }>()
if (!target) return { success: false, error: 'Categoría no encontrada.' }

const neighbor = await Category.findOne({
  restaurantId: restaurant._id,
  order: direction === 'up' ? target.order - 1 : target.order + 1,
}).lean<{ order: number; _id: string }>()
if (!neighbor) return { success: true }  // already at boundary — no-op

await Category.updateOne({ _id: target._id },    { $set: { order: neighbor.order } })
await Category.updateOne({ _id: neighbor._id },  { $set: { order: target.order } })

revalidatePath('/menu/' + restaurant.slug)
return { success: true }
```

**NOTE — `useActionState` signature:** Every exported action in this file must accept `(prevState: any, formData: FormData)` — not just `(formData: FormData)` — because all are called via `useActionState`.

---

### `actions/dishes.ts` (server-action, CRUD + file-I/O)

**Analog:** `actions/restaurant.ts` (auth/guard pattern) + RESEARCH.md patterns 4 and 5 (Cloudinary deletion)

**Imports pattern:**
```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { Dish } from '@/models/Dish'
```

**Auth + ownership guard:** Identical to `actions/categories.ts` — copy verbatim, substituting `Dish` for `Category`.

**Price conversion (D-12):**
```typescript
// On write: pesos input → centavos integer
const priceStr = formData.get('price')?.toString() ?? ''
const price = Math.round(parseFloat(priceStr) * 100)
if (!isFinite(price) || price < 0) {
  return { success: false, error: 'Ingresá un precio válido en pesos.' }
}
// On read/display: price / 100 — done in the component, not the action
```

**Cloudinary deletion before DB delete (D-06):**
```typescript
// deleteDish — attempt Cloudinary cleanup first, always delete from DB
if (dish.imagePublicId) {
  try {
    await cloudinary.uploader.destroy(dish.imagePublicId)
  } catch (err) {
    console.error('[Cloudinary delete failed]', err)
    // D-06: log and continue — broken DB references > orphaned Cloudinary assets
  }
}
await Dish.deleteOne({ _id: dishId, restaurantId: restaurant._id })
revalidatePath('/menu/' + restaurant.slug)
return { success: true }
```

**Availability toggle (DISH-05 — optimistic-safe):**
```typescript
export async function toggleAvailability(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const dishId = formData.get('dishId')?.toString()

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  const dish = await Dish.findOne({ _id: dishId, restaurantId: restaurant._id })
  if (!dish) return { success: false, error: 'Plato no encontrado.' }

  await Dish.updateOne(
    { _id: dishId, restaurantId: restaurant._id },
    { $set: { available: !dish.available } }
  )

  revalidatePath('/menu/' + restaurant.slug)
  return { success: true, available: !dish.available }
}
```

---

### `app/(admin)/dashboard/categories/page.tsx` (page, Server Component, CRUD read)

**Analog:** `app/(admin)/dashboard/page.tsx`

**Imports pattern** (lines 1–6 of `dashboard/page.tsx`):
```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
// + Category, and client component that receives data as props
```

**Auth + DB fetch pattern** (lines 8–19 of `dashboard/page.tsx`):
```typescript
export default async function CategoriesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
    _id: string
    slug: string
  }>()

  if (!restaurant) redirect('/dashboard')   // no restaurant yet — send to onboarding

  const categories = await Category.find({ restaurantId: restaurant._id })
    .sort({ order: 1 })
    .lean()

  // Pass serialisable data (plain objects) to the client component
  return <CategoriesClient categories={JSON.parse(JSON.stringify(categories))} />
}
```

**Key conventions from analog:**
- `.lean()` on every read query — returns plain JS objects, not Mongoose documents
- `JSON.parse(JSON.stringify(...))` to strip non-serialisable ObjectId before passing to Client Component as props
- No `revalidate` export — ISR revalidation is on-demand via `revalidatePath` in actions
- Guard: `if (!restaurant) redirect('/dashboard')` instead of rendering error UI

---

### `app/(admin)/dashboard/dishes/page.tsx` (page, Server Component, CRUD read)

**Analog:** `app/(admin)/dashboard/page.tsx` (same pattern as categories page above)

**Extended fetch — categories needed for selector:**
```typescript
// Fetch both categories (for the form selector) and dishes in parallel
const [categories, dishes] = await Promise.all([
  Category.find({ restaurantId: restaurant._id }).sort({ order: 1 }).lean(),
  Dish.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).lean(),
])

return (
  <DishesClient
    dishes={JSON.parse(JSON.stringify(dishes))}
    categories={JSON.parse(JSON.stringify(categories))}
  />
)
```

---

### `app/api/sign-cloudinary-params/route.ts` (route handler, request-response)

**Analog:** `app/api/webhooks/clerk/route.ts`

**Route handler export pattern** (lines 8, 37 of `webhooks/clerk/route.ts`):
```typescript
export async function POST(req: Request) {
  // ... validation ...
  return new Response('OK', { status: 200 })
}
```

**Full signing route pattern (from RESEARCH.md Pattern 3 — verified against Cloudinary docs):**
```typescript
import { v2 as cloudinary } from 'cloudinary'

// Call config once at module scope — not inside the request handler
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,  // NEVER NEXT_PUBLIC_
})

export async function POST() {
  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = { timestamp, folder: 'menu-digital' }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  )

  return Response.json({
    signature,
    timestamp,
    api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  })
}
```

**Auth note:** This route does NOT require Clerk auth. Signatures are time-limited (1 hour) and scoped to a folder — there is no user-sensitive data to protect. The signing route is already protected implicitly by the short window and the fact that the API secret never leaves the server.

---

### `components/dashboard/CategoryModal.tsx` (client component, event-driven)

**Analog:** `components/dashboard/OnboardingSlug.tsx`

**Client component header + state pattern** (lines 1–16 of `OnboardingSlug.tsx`):
```typescript
'use client'

import { useState, useTransition } from 'react'
import { Loader2, X } from 'lucide-react'
import { createCategory, updateCategory } from '@/actions/categories'
```

**useActionState pattern (React 19 — not useFormState):**
```typescript
// Per RESEARCH.md Pitfall 3 and Anti-Patterns — use useActionState from 'react'
import { useActionState } from 'react'

const initialState = { success: false, error: undefined as string | undefined }

export function CategoryModal({ mode, category, onClose }: Props) {
  const action = mode === 'create' ? createCategory : updateCategory
  const [state, formAction, pending] = useActionState(action, initialState)

  // Reset and close on success
  // ...

  return (
    <form id="modal-form" action={formAction}>
      <input type="text" name="name" defaultValue={category?.name ?? ''} />
      {state.error && (
        <p role="alert" className="text-xs text-red-600">{state.error}</p>
      )}
    </form>
  )
}
```

**Native dialog pattern (from RESEARCH.md Pattern 7):**
```typescript
import { useRef } from 'react'

const dialogRef = useRef<HTMLDialogElement>(null)

// Called by parent to open
useImperativeHandle(ref, () => ({
  open:  () => dialogRef.current?.showModal(),
  close: () => dialogRef.current?.close(),
}))
```

**Toast pattern** — copy directly from `OnboardingSlug.tsx` lines 139–154:
```typescript
{toast && (
  <div className="fixed bottom-6 right-6 z-50">
    <div
      className={`bg-white rounded-lg shadow-sm px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-xs border ${
        toast.type === 'success' ? 'border-brand-acento' : 'border-red-200'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 size={18} className="text-brand-principal shrink-0" />
      ) : (
        <XCircle size={18} className="text-red-500 shrink-0" />
      )}
      <p className="text-sm font-medium text-brand-texto">{toast.message}</p>
    </div>
  </div>
)}
```

**Button loading pattern** — copy from `OnboardingSlug.tsx` lines 112–133:
```typescript
<button
  type="submit"
  disabled={pending}
  className="
    bg-brand-principal text-white text-sm font-medium
    rounded-lg px-4 py-3 min-h-[44px]
    hover:bg-[#C2410C]
    focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors duration-150
  "
>
  {pending ? (
    <span className="flex items-center justify-center gap-2">
      <Loader2 size={14} className="animate-spin" />
      Guardando...
    </span>
  ) : (
    mode === 'create' ? 'Crear categoría' : 'Guardar cambios'
  )}
</button>
```

**Input field pattern** — copy from `OnboardingSlug.tsx` lines 77–92:
```typescript
<input
  id="name"
  type="text"
  name="name"
  className="
    w-full border border-gray-200 rounded-md px-3 py-3
    text-sm font-normal text-brand-texto bg-white
    placeholder:text-gray-400
    focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal
    transition-colors duration-100
    disabled:border-gray-100 disabled:bg-gray-50
  "
  placeholder="Ej. Entradas, Principales, Postres"
/>
```

---

### `components/dashboard/DishModal.tsx` (client component, event-driven + file-I/O)

**Analog:** `components/dashboard/OnboardingSlug.tsx` (form/state/toast structure)

**All patterns from CategoryModal apply.** Additional patterns specific to DishModal:

**Image upload handler (D-04 — sign then upload):**
```typescript
const [isUploading, setIsUploading] = useState(false)
const [imageUrl, setImageUrl]       = useState(dish?.imageUrl ?? '')
const [imagePublicId, setImagePublicId] = useState(dish?.imagePublicId ?? '')

async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return

  // Client-side validation before signing (D-04)
  if (file.size > 5 * 1024 * 1024) {
    setUploadError('La imagen supera el límite de 5 MB. Elegí una imagen más pequeña.')
    return
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    setUploadError('Formato no permitido. Usá JPG, PNG o WebP.')
    return
  }

  setIsUploading(true)
  setUploadError(null)
  try {
    // 1. Get signature from our server
    const signRes = await fetch('/api/sign-cloudinary-params', { method: 'POST' })
    const { signature, timestamp, api_key, cloud_name } = await signRes.json()

    // 2. POST file directly to Cloudinary
    const body = new FormData()
    body.append('file', file)
    body.append('api_key', api_key)
    body.append('timestamp', String(timestamp))
    body.append('signature', signature)
    body.append('folder', 'menu-digital')

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
      { method: 'POST', body }
    )
    const data = await uploadRes.json()
    setImageUrl(data.secure_url)
    setImagePublicId(data.public_id)
  } catch {
    setUploadError('No pudimos subir la imagen. Verificá tu conexión e intentá de nuevo.')
  } finally {
    setIsUploading(false)
  }
}
```

**Allergen checkbox grid pattern (D-08, D-09):**
```typescript
import { ALLERGENS } from '@/lib/allergens'

// Inside the form body:
<div className="grid grid-cols-2 gap-2">
  {ALLERGENS.map(allergen => (
    <label
      key={allergen.key}
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 cursor-pointer
                 hover:bg-brand-fondo transition-colors duration-100
                 has-[:checked]:border-brand-acento has-[:checked]:bg-brand-acento/30"
    >
      <input
        type="checkbox"
        name="allergens"
        value={allergen.key}
        defaultChecked={dish?.allergens?.includes(allergen.key)}
        className="w-4 h-4 accent-brand-principal"
      />
      <span className="text-sm font-normal text-brand-texto">{allergen.label}</span>
    </label>
  ))}
</div>
```

**Price field pattern (D-12):**
```typescript
// Store hidden fields for imageUrl/imagePublicId so they travel via FormData
<input type="hidden" name="imageUrl"      value={imageUrl} />
<input type="hidden" name="imagePublicId" value={imagePublicId} />

// Price input — display pesos, action converts to centavos
<input
  type="number"
  name="price"
  min="0"
  step="0.01"
  defaultValue={dish ? (dish.price / 100).toFixed(2) : ''}
  placeholder="0.00"
/>
```

---

### `components/dashboard/DashboardHeader.tsx` (client component, request-response)

**Analog:** `components/dashboard/Sidebar.tsx`

**usePathname pattern** (lines 1–4, 52 of `Sidebar.tsx`):
```typescript
'use client'

import { usePathname } from 'next/navigation'

export function DashboardHeader() {
  const pathname = usePathname()
  // ...
}
```

**Title map pattern** — directly from RESEARCH.md Pattern 8:
```typescript
const titles: Record<string, string> = {
  '/dashboard':            'Dashboard',
  '/dashboard/categories': 'Categorías',
  '/dashboard/dishes':     'Platos',
}

const title = titles[pathname] ?? 'Dashboard'
```

**Header HTML structure** — copy from `app/(admin)/layout.tsx` lines 27–29:
```typescript
<header className="h-14 bg-white border-b border-brand-acento flex items-center px-6 justify-between shrink-0">
  <h1 className="text-base font-bold text-brand-titulares">{title}</h1>
</header>
```

---

### `components/dashboard/Sidebar.tsx` — modification only

**Change:** Set `enabled: true` for `Categorías` and `Platos` nav items.

**Target lines** (lines 27–37 of current `Sidebar.tsx`):
```typescript
// BEFORE (lines 27–37):
{
  label: 'Categorías',
  href: '/dashboard/categories',
  icon: <Tag size={16} />,
  enabled: false,          // <-- change to true
},
{
  label: 'Platos',
  href: '/dashboard/dishes',
  icon: <UtensilsCrossed size={16} />,
  enabled: false,          // <-- change to true
},
```

**Confirmed hrefs match routes:** Pages created at `app/(admin)/dashboard/categories/page.tsx` resolve to URL `/dashboard/categories` — matches `href: '/dashboard/categories'` in the sidebar. No href change needed.

---

## Shared Patterns

### Authentication (applies to all Server Actions and page Server Components)

**Source:** `actions/restaurant.ts` lines 8–10, `app/(admin)/dashboard/page.tsx` lines 9–10

```typescript
// Server Action auth guard — always first two lines of every action
const { userId } = await auth()
if (!userId) return { success: false, error: 'No autorizado.' }

// Server Component auth guard — always redirect, never render error
const { userId } = await auth()
if (!userId) redirect('/sign-in')
```

### DB Connection (applies to all Server Actions and page Server Components)

**Source:** `lib/dbConnect.ts` — `app/(admin)/dashboard/page.tsx` lines 14–15

```typescript
// Call after auth, before any Mongoose query — mandatory for Vercel serverless
await dbConnect()
```

### Restaurant Ownership Derivation (applies to all Server Actions)

**Source:** `actions/restaurant.ts` lines 28–31

```typescript
// NEVER trust a client-supplied restaurantId — always derive from clerkId
const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }
// All subsequent queries: { restaurantId: restaurant._id }
```

### Return Shape Contract (applies to all Server Actions)

**Source:** `actions/restaurant.ts` lines 10–50 — every branch returns:

```typescript
// Success
return { success: true }
// or with data:
return { success: true, available: !dish.available }

// Failure — always { success: false, error: string }
return { success: false, error: 'Human-readable Spanish error.' }
```

### revalidatePath Call (applies to every mutating Server Action)

**Source:** RESEARCH.md Pattern 5 (verified against Next.js 16.2.4 docs)

```typescript
import { revalidatePath } from 'next/cache'

// Inside every action that mutates categories or dishes:
// Use literal slug — not the template '/menu/[slug]'
revalidatePath('/menu/' + restaurant.slug)
```

### Mongoose .lean() + JSON serialisation (applies to all Server Component reads)

**Source:** `app/(admin)/dashboard/page.tsx` lines 13–21

```typescript
// .lean() returns plain objects; JSON.parse(JSON.stringify(...)) strips ObjectId before prop drilling
const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; ... }>()
// For arrays passed as props to Client Components:
const categories = await Category.find(...).lean()
// Pass as: JSON.parse(JSON.stringify(categories))
```

### Toast Notification (applies to all Client Components with mutations)

**Source:** `components/dashboard/OnboardingSlug.tsx` lines 14, 28–38, 139–154

```typescript
// State:
const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

// On action result:
if (result.success) {
  setToast({ type: 'success', message: 'Acción realizada correctamente.' })
  setTimeout(() => setToast(null), 4000)
} else {
  setToast({ type: 'error', message: result.error ?? 'Algo salió mal. Intentá de nuevo.' })
  setTimeout(() => setToast(null), 4000)
}

// JSX — fixed bottom-right, z-50:
{toast && (
  <div className="fixed bottom-6 right-6 z-50">
    <div className={`bg-white rounded-lg shadow-sm px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-xs border ${
      toast.type === 'success' ? 'border-brand-acento' : 'border-red-200'
    }`}>
      {toast.type === 'success'
        ? <CheckCircle2 size={18} className="text-brand-principal shrink-0" />
        : <XCircle size={18} className="text-red-500 shrink-0" />
      }
      <p className="text-sm font-medium text-brand-texto">{toast.message}</p>
    </div>
  </div>
)}
```

### Brand Token Classes (applies to all components)

**Source:** `app/(admin)/layout.tsx`, `components/dashboard/Sidebar.tsx`, `components/dashboard/OnboardingSlug.tsx`

```
bg-brand-fondo       → #FFF7ED  page backgrounds
bg-brand-acento      → #FED7AA  badges, hover states, modal borders
bg-brand-principal   → #EA580C  primary buttons, focus rings, toggle-on
text-brand-titulares → #9A3412  H1, H2, active nav, modal titles
text-brand-texto     → #1C1917  body text, labels, table cells
border-brand-acento  → #FED7AA  card borders, dividers
hover:bg-[#C2410C]              primary button hover (one shade darker)
```

**Destructive deviation (only allowed red usage):**
```
text-red-600   → error messages, delete confirmation text
border-red-200 → delete button border, error toast border
bg-red-600     → "Sí, eliminar" confirmation button bg
text-red-500   → delete icon button icon color
hover:bg-red-50 → delete button hover
```

### Model Registration Guard (applies if any new model is added — none in Phase 2)

**Source:** `models/Category.ts` line 12, `models/Dish.ts` line 18, `models/Restaurant.ts` line 14

```typescript
// Every model export must use this guard — prevents OverwriteModelError on hot reload
export const Category = models.Category || model('Category', CategorySchema)
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib/allergens.ts` | utility / constant | transform | No existing constants/config files in the project; this is a pure data constant — no pattern needed, just a typed `as const` array export |

---

## Implementation Notes for Planner

### Route path verification
Pages at `app/(admin)/dashboard/categories/page.tsx` → URL `/dashboard/categories`. This matches the existing sidebar hrefs (`/dashboard/categories`, `/dashboard/dishes`). The route group `(admin)` is transparent in URLs; `dashboard/` is a real segment.

### `useActionState` vs `useFormState`
This project runs React 19.2.4. Import `useActionState` from `'react'` (not `useFormState` from `'react-dom'`). All Server Actions called via `useActionState` must accept `(prevState: any, formData: FormData)` as their signature.

### Cloudinary config at module scope
Call `cloudinary.config(...)` once at the top of `app/api/sign-cloudinary-params/route.ts` (module scope), not inside the `POST` function. The SDK is idempotent but repeated calls are unnecessary.

### Image upload timing (Pitfall 2)
Sign on `onChange` of the file input — not at modal open time. The 1-hour signature window is sufficient, but pre-fetching at page load risks stale signatures after a long idle.

### `.lean<TypeHint>()` generic usage
All Mongoose reads in Server Components and Server Actions use `.lean()`. Add a generic type hint (`.lean<{ _id: string; slug: string }>()`) to keep TypeScript happy without a full Mongoose document type import.

---

## Metadata

**Analog search scope:** `menu-digital/actions/`, `menu-digital/app/(admin)/`, `menu-digital/components/dashboard/`, `menu-digital/models/`, `menu-digital/lib/`, `menu-digital/app/api/`, `menu-digital/middleware.ts`
**Files scanned:** 10 source files read directly
**Pattern extraction date:** 2026-05-04
