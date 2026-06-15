# Phase 4: Casos — CRUD & Dashboard - Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 17 (nuevos/modificados)
**Analogs found:** 14 / 17

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `tma/src/models/Caso.ts` | model | CRUD | `tma/src/models/User.ts` | exact |
| `tma/src/lib/validations.ts` | utility | transform | `tma/src/lib/validations.ts` (extensión) | exact |
| `tma/src/app/api/casos/route.ts` | route | request-response | `tma/src/app/api/contracts/analyze/route.ts` | role-match |
| `tma/src/app/tma/casos/page.tsx` | page (Server Component) | request-response | `tma/src/app/tma/contratos/page.tsx` | exact |
| `tma/src/app/tma/casos/layout.tsx` | layout | — | `tma/src/app/tma/page.tsx` (patrón page simple) | partial |
| `tma/src/app/tma/casos/nuevo/page.tsx` | page (Server Component) | request-response | `tma/src/app/tma/contratos/page.tsx` | exact |
| `tma/src/components/casos/CasosDashboard.tsx` | component | event-driven + CRUD | `tma/src/app/tma/contratos/ContratoWizard.tsx` | role-match |
| `tma/src/components/casos/CasosSidebar.tsx` | component | event-driven | sin análogo directo — patrón nuevo | none |
| `tma/src/components/casos/CasosTable.tsx` | component | event-driven | `tma/src/app/tma/contratos/ContratoWizard.tsx` | partial |
| `tma/src/components/casos/CasosFilterBar.tsx` | component | event-driven | `tma/src/app/tma/contratos/ContratoWizard.tsx` | partial |
| `tma/src/components/casos/ConfirmDialog.tsx` | component | event-driven | sin análogo directo | none |
| `tma/src/components/casos/CasoForm.tsx` | component | request-response | `tma/src/app/tma/contratos/ContratoWizard.tsx` | role-match |
| `tma/src/components/TmaPageContent.tsx` | component | — | sí mismo (modificación puntual) | exact |
| `tma/src/__tests__/casos/casosRoute.test.ts` | test | — | `tma/src/__tests__/contracts/generateRoute.test.ts` | exact |
| `tma/src/__tests__/casos/casoSchema.test.ts` | test | — | `tma/src/__tests__/actions/auth.login.test.ts` | role-match |
| `tma/src/__tests__/casos/casosFiltrado.test.ts` | test | — | `tma/src/__tests__/actions/auth.login.test.ts` | role-match |
| `tma/src/__tests__/casos/CasosSidebar.test.tsx` | test | — | `tma/src/__tests__/components/Footer.test.tsx` | role-match |

---

## Pattern Assignments

### `tma/src/models/Caso.ts` (model, CRUD)

**Analog:** `tma/src/models/User.ts`

**Patrón completo** (líneas 1-21 del análogo — replicar íntegramente):
```typescript
import mongoose, { Schema, Document } from "mongoose"

export interface ICaso extends Document {
  nombre: string
  fechaIngreso: Date
  fechaVencimiento: Date
  responsable: string
  createdAt: Date
}

const CasoSchema = new Schema<ICaso>({
  nombre: { type: String, required: true, trim: true },
  fechaIngreso: { type: Date, required: true },
  fechaVencimiento: { type: Date, required: true },
  responsable: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Caso || mongoose.model<ICaso>("Caso", CasoSchema)
```

**Guard obligatorio** (análogo: `tma/src/models/User.ts` línea 21):
El pattern `mongoose.models.X || mongoose.model(...)` es obligatorio para Next.js hot-reload. Sin el guard, el servidor de desarrollo lanza "Cannot overwrite model once compiled".

---

### `tma/src/lib/validations.ts` (utility, transform) — EXTENSIÓN

**Analog:** `tma/src/lib/validations.ts` (el mismo archivo)

**Imports existentes** (líneas 1 del archivo actual):
```typescript
import { z } from "zod"
```

**Schemas existentes a preservar** (líneas 3-13 del archivo actual):
```typescript
export const loginSchema = z.object({
  email: z.string().email("Email inválido").transform(v => v.toLowerCase()),
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z.object({
  email: z.string().email("Email inválido").transform(v => v.toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export type LoginSchema = z.infer<typeof loginSchema>
export type RegisterSchema = z.infer<typeof registerSchema>
```

**Nuevo schema a agregar al final** (Zod v4 API — string directo en `.min()`):
```typescript
export const casoSchema = z.object({
  nombre: z.string().min(1, "El nombre del asunto es obligatorio."),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria."),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es obligatoria."),
  responsable: z.string().min(1, "El responsable es obligatorio."),
})

export type CasoSchema = z.infer<typeof casoSchema>
```

**Nota crítica Zod v4:** El proyecto usa Zod v4.4.3. En v4 los mensajes de error se pasan como string directo (`.min(1, "mensaje")`), no como objeto `{ message: "..." }` como en v3.

---

### `tma/src/app/api/casos/route.ts` (route, request-response)

**Analog:** `tma/src/app/api/contracts/analyze/route.ts`

**Imports pattern** (análogo líneas 1-6):
```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import Caso from "@/models/Caso"
import { casoSchema } from "@/lib/validations"
import mongoose from "mongoose"
```

**Directiva de cache obligatoria** (análogo línea 16 — también en `contracts/generate/route.ts`):
```typescript
export const dynamic = "force-dynamic"
```

**Auth pattern** (análogo líneas 23-26 — aplicar en TODOS los handlers):
```typescript
const session = await auth()
if (!session) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}
```

**GET handler** (patrón nuevo — sin análogo directo, pero siguiendo convención):
```typescript
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  await connectDB()
  const casos = await Caso.find().sort({ fechaVencimiento: 1 }).lean()
  return NextResponse.json(casos)
}
```

**POST handler con Zod safeParse** (análogo: patrón de validación del analyze route, líneas 29-35):
```typescript
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()
  const result = casoSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: result.error.issues }, { status: 400 })
  }

  await connectDB()
  const caso = await Caso.create({
    ...result.data,
    fechaIngreso: new Date(result.data.fechaIngreso + "T12:00:00"),
    fechaVencimiento: new Date(result.data.fechaVencimiento + "T12:00:00"),
  })
  return NextResponse.json(caso, { status: 201 })
}
```

**DELETE handler con validación de ObjectId** (ver pitfall 3 en RESEARCH.md):
```typescript
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const id = request.nextUrl.searchParams.get("id")
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  await connectDB()
  const deleted = await Caso.findByIdAndDelete(id)
  if (!deleted) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
```

---

### `tma/src/app/tma/casos/page.tsx` (page Server Component, request-response)

**Analog:** `tma/src/app/tma/contratos/page.tsx` (líneas 1-10 — patrón completo)

**Patrón completo a replicar**:
```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CasosDashboard } from "@/components/casos/CasosDashboard"

export default async function CasosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <CasosDashboard />
}
```

**Por qué CasosDashboard es Client Component:** el estado de `casos` debe vivir en el cliente para permitir el optimistic delete (D-11). No se pasan datos como props desde el Server Component.

---

### `tma/src/app/tma/casos/layout.tsx` (layout)

**Nota de RESEARCH.md (anti-patrón §Pattern 3):** No se recomienda layout.tsx para el sidebar ya que `/tma/casos/nuevo` NO tiene sidebar. El layout simplemente pasa children sin agregar sidebar.

**Patrón mínimo** (si se decide crear el layout):
```typescript
export default function CasosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

**Alternativa preferida:** No crear `layout.tsx`. El sidebar va dentro de `CasosDashboard` directamente. La página `/tma/casos/nuevo` no tiene sidebar por diseño (UI-SPEC).

---

### `tma/src/app/tma/casos/nuevo/page.tsx` (page Server Component, request-response)

**Analog:** `tma/src/app/tma/contratos/page.tsx` (mismo patrón auth + redirect)

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CasoForm } from "@/components/casos/CasoForm"

export default async function CasosNuevoPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <CasoForm />
}
```

---

### `tma/src/components/casos/CasosDashboard.tsx` (component, event-driven + CRUD)

**Analog:** `tma/src/app/tma/contratos/ContratoWizard.tsx` (Client Component con estado complejo)

**Imports pattern** (análogo líneas 1-16):
```typescript
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
```

**Estado principal** (derivado de D-06/D-07/D-08/D-09):
```typescript
const [casos, setCasos] = useState<ICaso[]>([])
const [loading, setLoading] = useState(true)
const [filterNombre, setFilterNombre] = useState("")
const [filterResponsable, setFilterResponsable] = useState("")
const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
const [error, setError] = useState<string | null>(null)
```

**Fetch inicial** (patrón useEffect — ver RESEARCH.md Pitfall 6):
```typescript
useEffect(() => {
  fetch("/api/casos")
    .then(r => r.json())
    .then(data => { setCasos(data); setLoading(false) })
    .catch(() => { setError("Error al cargar asuntos"); setLoading(false) })
}, [])
```

**Lógica de filtrado y ordenamiento** (D-06/D-07/D-08/D-09):
```typescript
const filteredCasos = casos.filter(c =>
  c.nombre.toLowerCase().includes(filterNombre.toLowerCase()) &&
  c.responsable.toLowerCase().includes(filterResponsable.toLowerCase())
)

const sortedCasos = [...filteredCasos].sort((a, b) =>
  sortDir === "asc"
    ? new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    : new Date(b.fechaVencimiento).getTime() - new Date(a.fechaVencimiento).getTime()
)
```

**UI optimista para DELETE** (D-10/D-11):
```typescript
const handleDelete = async (id: string) => {
  const backup = [...casos]
  setCasos(prev => prev.filter(c => String(c._id) !== id))  // optimistic
  const res = await fetch(`/api/casos?id=${id}`, { method: "DELETE" })
  if (!res.ok) {
    setCasos(backup)  // rollback
    setError("Error al eliminar el asunto. Intente nuevamente.")
  }
}
```

---

### `tma/src/components/casos/CasosSidebar.tsx` (component, event-driven)

**Sin análogo directo.** Patrón nuevo de sidebar colapsable con motion/react.

**Imports** (convención del proyecto — análogo TmaPageContent.tsx líneas 1-5):
```typescript
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { LayoutDashboard, PlusCircle, BarChart2, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
```

**Paleta de colores a usar** (de `TmaPageContent.tsx` y CLAUDE.md):
```
fondo sidebar:  #FFF7ED  (brand-background)
borde:          #FECBA1  (acento)
título activo:  #9A3412  (brand-title)
CTA:            #EA580C  (brand-cta)
```

**Patrón de sidebar desktop + hamburger móvil** (de RESEARCH.md Pattern 5):
```typescript
// Desktop: aside fijo (oculto en móvil)
<aside className="hidden md:flex w-60 shrink-0 flex-col min-h-screen"
  style={{ background: "#FFF7ED", borderRight: "1px solid #FECBA1" }}>
  {/* nav items */}
</aside>

// Móvil: botón hamburger fijo
<button className="fixed top-4 left-4 z-50 md:hidden" onClick={() => setIsOpen(!isOpen)}>
  {isOpen ? <X /> : <Menu />}
</button>

// Móvil: overlay + sidebar animado
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/20 md:hidden"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
      />
      <motion.aside
        className="fixed top-0 left-0 h-full w-64 z-50 flex flex-col md:hidden"
        style={{ background: "#FFF7ED", borderRight: "1px solid #FECBA1" }}
        initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* nav items */}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

**Items del sidebar** (D-03):
```typescript
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/tma/casos", disabled: false },
  { label: "Nuevo asunto", icon: PlusCircle, href: "/tma/casos/nuevo", disabled: false },
  { label: "Estadísticas", icon: BarChart2, href: null, disabled: true, badge: "Próximamente" },
]
```

**Badge "Próximamente"** (análogo: TmaPageContent.tsx líneas 122-128):
```typescript
<span
  className="text-[11px] font-medium px-2.5 py-1 rounded-full"
  style={{ backgroundColor: "#FED7AA", color: "#9A3412" }}
>
  Próximamente
</span>
```

---

### `tma/src/components/casos/CasosTable.tsx` (component, event-driven)

**Analog:** `tma/src/app/tma/contratos/ContratoWizard.tsx` (patrón de Client Component con AnimatePresence)

**Imports**:
```typescript
"use client"

import { motion, AnimatePresence } from "motion/react"
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react"
```

**Patrón AnimatePresence en tabla** (RESEARCH.md Pitfall 1 — AnimatePresence va DENTRO de tbody):
```typescript
<table>
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Fecha de ingreso</th>
      <th onClick={toggleSort} className="cursor-pointer select-none">
        Vencimiento {sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </th>
      <th>Responsable</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    <AnimatePresence>
      {sortedCasos.map(caso => (
        <motion.tr
          key={String(caso._id)}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* celdas */}
        </motion.tr>
      ))}
    </AnimatePresence>
  </tbody>
</table>
```

**Formateo de fechas** (RESEARCH.md Code Examples — evitar timezone issue):
```typescript
function formatDate(dateStr: string | Date): string {
  const s = typeof dateStr === "string" ? dateStr : dateStr.toISOString()
  const d = new Date(s.length === 10 ? s + "T12:00:00" : s)
  return d.toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })
}
```

---

### `tma/src/components/casos/CasosFilterBar.tsx` (component, event-driven)

**Analog:** `tma/src/app/tma/contratos/ContratoWizard.tsx` (inputs controlados con useState)

**Patrón de inputs** (onChange sin debounce — D-06):
```typescript
"use client"

interface CasosFilterBarProps {
  filterNombre: string
  filterResponsable: string
  onNombreChange: (v: string) => void
  onResponsableChange: (v: string) => void
}

// Input pattern — estilo consistente con paleta Driva Dev
<input
  type="text"
  value={filterNombre}
  onChange={e => onNombreChange(e.target.value)}
  placeholder="Buscar por nombre..."
  className="border rounded-lg px-3 py-2 text-[13px] text-brand-text outline-none
             focus:ring-2 focus:ring-[#EA580C]/30"
  style={{ borderColor: "#FECBA1" }}
/>
```

---

### `tma/src/components/casos/ConfirmDialog.tsx` (component, event-driven)

**Sin análogo directo.** Patrón de `<dialog>` nativo con motion/react (de RESEARCH.md Code Examples).

**Imports**:
```typescript
"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
```

**Props interface**:
```typescript
interface ConfirmDialogProps {
  open: boolean
  casoNombre: string
  onConfirm: () => void
  onCancel: () => void
}
```

**Patrón `<dialog>` nativo** (RESEARCH.md Code Examples §dialog nativo):
```typescript
export function ConfirmDialog({ open, casoNombre, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="p-0 bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-sm rounded-2xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="rounded-2xl bg-white p-6 max-w-[400px] w-full"
        style={{ border: "1px solid #FECBA1" }}
      >
        <p className="text-[15px] text-brand-text mb-1 font-semibold">Eliminar asunto</p>
        <p className="text-[13px] text-brand-text/70 mb-5">
          Esta acción no se puede deshacer. ¿Eliminar asunto <strong>{casoNombre}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-[13px] rounded-lg border"
            style={{ borderColor: "#FECBA1", color: "#9A3412" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-[13px] rounded-lg text-white"
            style={{ backgroundColor: "#EA580C" }}>
            Eliminar
          </button>
        </div>
      </motion.div>
    </dialog>
  )
}
```

**Alternativa si `dialog.close()` rompe AnimatePresence:** Usar un `div` con `position: fixed; inset: 0; z-index: 50` visible solo cuando `open === true`, sin `<dialog>` nativo. La UI-SPEC acepta ambas. Ver RESEARCH.md Open Question 2.

---

### `tma/src/components/casos/CasoForm.tsx` (component, request-response)

**Analog:** patrón de Client Component con fetch a API (no Server Action — ver anti-patrón en RESEARCH.md)

**Imports**:
```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { casoSchema } from "@/lib/validations"
```

**Patrón de estado y submit**:
```typescript
const [values, setValues] = useState({ nombre: "", fechaIngreso: "", fechaVencimiento: "", responsable: "" })
const [errors, setErrors] = useState<Record<string, string>>({})
const [submitting, setSubmitting] = useState(false)
const [serverError, setServerError] = useState<string | null>(null)
const router = useRouter()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // Validación client-side con Zod
  const result = casoSchema.safeParse(values)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    result.error.issues.forEach(issue => {
      if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message
    })
    setErrors(fieldErrors)
    return
  }
  setSubmitting(true)
  const res = await fetch("/api/casos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  })
  setSubmitting(false)
  if (res.ok) {
    router.push("/tma/casos")
  } else {
    setServerError("Error al crear el asunto. Intente nuevamente.")
  }
}
```

**Entrada de fecha** (input type="date" — convención del proyecto):
```typescript
<input
  type="date"
  value={values.fechaIngreso}
  onChange={e => setValues(v => ({ ...v, fechaIngreso: e.target.value }))}
  className="border rounded-lg px-3 py-2 text-[13px] w-full"
  style={{ borderColor: errors.fechaIngreso ? "#EA580C" : "#FECBA1" }}
/>
{errors.fechaIngreso && (
  <p className="text-[11px] mt-1" style={{ color: "#EA580C" }}>{errors.fechaIngreso}</p>
)}
```

---

### `tma/src/components/TmaPageContent.tsx` (component) — MODIFICACIÓN

**Analog:** sí mismo

**Cambio puntual** (línea 13 del archivo actual):
```typescript
// ANTES (línea 13):
href: null, // disabled — Phase 4

// DESPUÉS:
href: "/tma/casos",
```

**Impacto en render:** Cuando `href` cambia de `null` a string, el componente ya toma automáticamente el branch `href ? (Link wrapper) : (motion.div disabled)` del `.map()` en líneas 43-131. No hay más cambios estructurales necesarios.

---

### `tma/src/__tests__/casos/casosRoute.test.ts` (test, node environment)

**Analog:** `tma/src/__tests__/contracts/generateRoute.test.ts`

**Directiva de entorno** (análogo línea 1 — obligatorio para Route Handlers):
```typescript
// @vitest-environment node
import { describe, it, expect, vi } from "vitest"
```

**Mock de auth** (análogo líneas 5-7):
```typescript
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { email: "nsilva@nyc.com.ar" } }),
}))
```

**Mock de connectDB y modelo Mongoose** (adaptar del análogo):
```typescript
vi.mock("@/lib/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/models/Caso", () => {
  const mockCaso = {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
    }),
    create: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011", nombre: "Test" }),
    findByIdAndDelete: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" }),
  }
  return { default: mockCaso }
})
```

**Mock de mongoose.isValidObjectId** (para el DELETE handler):
```typescript
vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose")
  return { ...actual, isValidObjectId: vi.fn().mockReturnValue(true) }
})
```

**Patrón de test de 401** (análogo líneas 155-165):
```typescript
it("retorna 401 cuando no hay sesión", async () => {
  const authMock = await import("@/auth")
  vi.mocked(authMock.auth).mockResolvedValueOnce(null)
  const { GET } = await import("@/app/api/casos/route")
  const request = new Request("http://localhost/api/casos")
  const response = await GET()
  expect(response.status).toBe(401)
})
```

---

### `tma/src/__tests__/casos/casoSchema.test.ts` (test, jsdom environment)

**Analog:** `tma/src/__tests__/actions/auth.login.test.ts`

**Patrón** (tests unitarios de Zod schema — sin mocks externos):
```typescript
import { describe, it, expect } from "vitest"
import { casoSchema } from "@/lib/validations"

describe("casoSchema — CASOS-02", () => {
  it("acepta datos válidos", () => {
    const result = casoSchema.safeParse({
      nombre: "Caso López",
      fechaIngreso: "2026-06-15",
      fechaVencimiento: "2026-12-31",
      responsable: "C. Rivera",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza nombre vacío", () => {
    const result = casoSchema.safeParse({
      nombre: "",
      fechaIngreso: "2026-06-15",
      fechaVencimiento: "2026-12-31",
      responsable: "C. Rivera",
    })
    expect(result.success).toBe(false)
  })
})
```

---

### `tma/src/__tests__/casos/casosFiltrado.test.ts` (test, jsdom environment)

**Patrón** (lógica pura sin DOM — importar función utilitaria o testear inline):
```typescript
import { describe, it, expect } from "vitest"

// La lógica de filtrado es pura — testear directamente sin montar componentes
const mockCasos = [
  { _id: "1", nombre: "López", responsable: "Rivera", fechaVencimiento: new Date("2026-12-31") },
  { _id: "2", nombre: "García", responsable: "Koch", fechaVencimiento: new Date("2026-06-30") },
]

describe("filtrado client-side — CASOS-04/05/06", () => {
  it("filtra por nombre (parcial, insensible a mayúsculas)", () => {
    const result = mockCasos.filter(c =>
      c.nombre.toLowerCase().includes("lópez")
    )
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe("1")
  })

  it("ordena por fechaVencimiento asc", () => {
    const sorted = [...mockCasos].sort((a, b) =>
      new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    )
    expect(sorted[0]._id).toBe("2") // junio antes que diciembre
  })
})
```

---

### `tma/src/__tests__/casos/CasosSidebar.test.tsx` (test, jsdom environment)

**Analog:** `tma/src/__tests__/components/Footer.test.tsx`

**Patrón de test de componente** (análogo líneas 1-26):
```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// Mockear next/navigation para usePathname
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/tma/casos"),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}))

import { CasosSidebar } from "@/components/casos/CasosSidebar"

describe("CasosSidebar — UI-05", () => {
  it("renderiza 3 ítems de navegación", () => {
    render(<CasosSidebar />)
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Nuevo asunto")).toBeInTheDocument()
    expect(screen.getByText("Estadísticas")).toBeInTheDocument()
  })

  it("Estadísticas tiene badge 'Próximamente'", () => {
    render(<CasosSidebar />)
    expect(screen.getByText("Próximamente")).toBeInTheDocument()
  })
})
```

---

## Shared Patterns

### Autenticación en Route Handlers
**Fuente:** `tma/src/app/api/contracts/analyze/route.ts` (líneas 23-26)
**Aplicar a:** `tma/src/app/api/casos/route.ts` — los tres handlers (GET, POST, DELETE)
```typescript
const session = await auth()
if (!session) {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}
```

### Autenticación en Server Components (páginas)
**Fuente:** `tma/src/app/tma/contratos/page.tsx` (líneas 1-9) y `tma/src/app/tma/page.tsx` (líneas 1-12)
**Aplicar a:** `tma/src/app/tma/casos/page.tsx` y `tma/src/app/tma/casos/nuevo/page.tsx`
```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"

const session = await auth()
if (!session) redirect("/login")
```

### Directiva de no-cache en Route Handlers
**Fuente:** `tma/src/app/api/contracts/analyze/route.ts` (línea 16)
**Aplicar a:** `tma/src/app/api/casos/route.ts`
```typescript
export const dynamic = "force-dynamic"
```

### Paleta Driva Dev y tipografía
**Fuente:** `tma/src/components/TmaPageContent.tsx` (líneas 55-68, 122-128) + `CLAUDE.md`
**Aplicar a:** todos los componentes de UI nuevos
```
background:  #FFF7ED  (CSS var: brand-background)
títulos:     #9A3412  (CSS var: brand-title)
CTAs:        #EA580C  (CSS var: brand-cta)
acento:      #FED7AA
borde:       #FECBA1
texto:       #1C1917  (CSS var: brand-text)
```

**Cards con gradiente y borde** (TmaPageContent.tsx líneas 57-61):
```typescript
style={{
  background: "linear-gradient(145deg, #FFFFFF 0%, #FFF7ED 100%)",
  border: "1px solid #FECBA1",
  boxShadow: "0 1px 3px 0 rgba(154,52,18,0.06), 0 1px 2px -1px rgba(154,52,18,0.04)",
}}
```

### motion/react — import y animación de entrada de página
**Fuente:** `tma/src/components/TmaPageContent.tsx` (líneas 4, 28-35)
**Aplicar a:** CasosDashboard, CasoForm, y páginas con entrada animada
```typescript
import { motion, AnimatePresence } from "motion/react"

// Animación de entrada estándar del proyecto:
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
>
```

### Guard Mongoose para hot-reload
**Fuente:** `tma/src/models/User.ts` (línea 21)
**Aplicar a:** `tma/src/models/Caso.ts`
```typescript
export default mongoose.models.Caso || mongoose.model<ICaso>("Caso", CasoSchema)
```

### Mock de next-auth en tests
**Fuente:** `tma/src/__tests__/actions/auth.login.test.ts` (líneas 5-13)
**Aplicar a:** todos los tests de actions y routes que importen `@/auth`
```typescript
vi.mock("next-auth", () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {
    constructor(message?: string) { super(message); this.name = "AuthError" }
  },
}))
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { email: "nsilva@nyc.com.ar" } }),
}))
```

---

## No Analog Found

| File | Role | Data Flow | Razón |
|------|------|-----------|-------|
| `tma/src/components/casos/CasosSidebar.tsx` | component | event-driven | No existe ningún sidebar colapsable en el proyecto. Patrón extraído de RESEARCH.md Pattern 5 y de los imports motion/react de TmaPageContent.tsx |
| `tma/src/components/casos/ConfirmDialog.tsx` | component | event-driven | No existe ningún dialog en el proyecto. Patrón extraído de RESEARCH.md Code Examples §dialog nativo |

El planner debe referenciar los patrones de RESEARCH.md Pattern 5 y Code Examples respectivamente para estos dos archivos.

---

## Metadata

**Scope de búsqueda:** `tma/src/` (models, app/api, app/tma, components, actions, lib, __tests__)
**Archivos leídos:** 13 archivos fuente + 2 archivos de contexto
**Fecha de extracción:** 2026-06-15
**Próxima expiración:** 2026-07-15 (stack estable)
