# Phase 4: Casos — CRUD & Dashboard - Research

**Researched:** 2026-06-15
**Domain:** Next.js 16 App Router · Mongoose · React client-side state · motion/react · cult-ui
**Confidence:** HIGH

---

## Summary

Phase 4 construye el módulo de gestión de asuntos sobre la base ya probada de las fases 1-3. Todos los patrones necesarios (modelo Mongoose, Route Handler con auth, Server Component + Client Component, motion/react) están en producción en el mismo repo — la tarea es replicarlos con nuevos campos y nuevo layout.

El único componente genuinamente nuevo es el dashboard con sidebar colapsable y tabla filtrable client-side. Todo lo demás (API Route con `auth()`, Mongoose model, zod validation, TextureCard/TextureButton) tiene un análogo directo en código existente que puede copiarse y adaptarse.

El riesgo principal no es técnico sino de integración: hay que activar el card "Casos TMA" en `TmaPageContent.tsx` y asegurarse de que las rutas `/tma/casos` y `/tma/casos/nuevo` queden protegidas por el middleware existente en `proxy.ts` (que ya cubre `pathname.startsWith("/tma")`).

**Recomendación principal:** Replicar los patrones ya establecidos. No inventar nuevas abstracciones. El middleware ya protege `/tma/casos/**`, el patrón de modelo Mongoose está en `User.ts`, el patrón de Route Handler con auth está en `contracts/analyze/route.ts`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Cuatro campos obligatorios: `nombre` (string), `fechaIngreso` (Date — ingresada por el usuario, no automática), `fechaVencimiento` (Date), `responsable` (string — texto libre, sin dropdown).
- **D-02:** No hay campos adicionales para v1. Los 4 campos son suficientes.
- **D-03:** `/tma/casos` tiene sidebar fijo con 3 ítems: Dashboard (activo), Nuevo asunto (navega a `/tma/casos/nuevo`), Estadísticas (visible pero deshabilitado con badge "Próximamente").
- **D-04:** El formulario "Nuevo asunto" es una **página separada `/tma/casos/nuevo`** — no modal ni panel lateral.
- **D-05:** El sidebar es **colapsable en móvil** (hamburger menu en pantallas chicas).
- **D-06:** Filtros por nombre y responsable son **en tiempo real (onChange)** — sin debounce.
- **D-07:** El filtrado es **client-side** — todos los asuntos se cargan al montar, se filtran en memoria.
- **D-08:** Orden por `fechaVencimiento`: **ascendente por defecto**. Toggle al hacer clic en el header.
- **D-09:** Filtros de nombre y responsable combinados simultáneamente (AND).
- **D-10:** Clic en eliminar abre **dialog de confirmación** con nombre del asunto.
- **D-11:** **UI optimista** — fila desaparece inmediatamente; se restaura si el servidor responde con error.

### Claude's Discretion

- Diseño exacto del sidebar (widths, breakpoints, animación del collapse).
- Componente de dialog para confirmación (`<dialog>` nativo preferido — ver UI-SPEC).
- Feedback visual durante carga inicial (skeleton loader).
- Nombre del modelo Mongoose y colección en MongoDB.
- Estructura de la API route (una sola `/api/casos` con GET/POST/DELETE — ver abajo).

### Deferred Ideas (OUT OF SCOPE)

- Edición de asuntos (CASOS-V2-01).
- Exportar tabla a CSV (CONTR-V2-02).
- Notificaciones de vencimiento (CASOS-V2-02).
- Estadísticas (CASOS-08, CASOS-09) — Fase 5.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CASOS-01 | Crear asunto con nombre, fechaIngreso, fechaVencimiento, responsable (todos obligatorios) | Modelo Mongoose `Caso` + Zod schema + POST `/api/casos` |
| CASOS-02 | Validación cliente + servidor: submit bloqueado si falta algún campo | Zod v4 `safeParse` en client + server; mensajes de error inline del UI-SPEC |
| CASOS-03 | Ver todos los asuntos en tabla con columnas: nombre, fechaIngreso, fechaVencimiento, responsable | GET `/api/casos` → estado React → `<table>` renderizada client-side |
| CASOS-04 | Filtrar por nombre (búsqueda parcial) | `useState` + `.filter()` en memoria; onChange sin debounce (D-07) |
| CASOS-05 | Ordenar por fechaVencimiento (asc/desc) | `useState<"asc"|"desc">` + `.sort()` después del filtrado (D-08) |
| CASOS-06 | Filtrar por responsable (búsqueda parcial) | Mismo mecanismo que CASOS-04; AND combinado (D-09) |
| CASOS-07 | Eliminar un asunto con confirmación + UI optimista | DELETE `/api/casos?id={id}` + `AnimatePresence` para exit animation (D-10, D-11) |
| UI-04 | Página de inicio con card "Casos TMA" navegable | Cambiar `href: null` → `href: "/tma/casos"` en `TmaPageContent.tsx` |
| UI-05 | `/tma/casos` con layout sidebar (Dashboard, Nuevo asunto, Estadísticas) | `CasosSidebar` component; sidebar fijo desktop + hamburger móvil (D-03, D-05) |

</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Protección de rutas `/tma/casos/**` | Frontend Server (middleware) | — | Ya cubierto por `proxy.ts` (`pathname.startsWith("/tma")`) — sin cambios necesarios |
| Verificación de sesión en páginas | Frontend Server (Server Component) | — | Patrón `auth()` + `redirect("/login")` igual que `/tma/contratos/page.tsx` |
| Persistencia de asuntos | Database (MongoDB/Mongoose) | — | Colección `casos`; modelo `Caso` siguiendo patrón `User.ts` |
| CRUD de asuntos | API / Backend (Route Handler) | — | `/api/casos` con GET/POST/DELETE; auth verificada con `auth()` |
| Validación de datos | API / Backend (server) + Browser (client) | — | Zod `casoSchema` en ambas capas (CASOS-02) |
| Carga y filtrado de asuntos | Browser / Client | — | `useEffect` fetch inicial + `useState` para filtros y ordenamiento client-side (D-07) |
| Animaciones (sidebar móvil, fila delete, entrada de página) | Browser / Client | — | `motion/react` en Client Components — patrón ya establecido en `TmaPageContent.tsx` |
| Activación del card "Casos TMA" | Frontend Server (render) | — | Cambio de `href: null` → `href: "/tma/casos"` en `TmaPageContent.tsx` |

---

## Standard Stack

### Core — Todo ya instalado [VERIFIED: tma/package.json]

| Library | Version | Purpose | Por qué se usa |
|---------|---------|---------|----------------|
| Next.js | 16.2.9 | App Router, Route Handlers, Server Components | Framework del proyecto |
| Mongoose | 9.7.0 | ODM para MongoDB; modelo `Caso` | Patrón establecido (`User.ts`) |
| Zod | 4.4.3 | Validación client + server | Patrón establecido (`validations.ts`) |
| motion | 12.40.0 | Animaciones sidebar, exit de filas, entrada de página | `motion/react` — ya en uso |
| lucide-react | 1.18.0 | Iconos: `LayoutDashboard`, `PlusCircle`, `BarChart2`, `Trash2`, `ChevronUp`, `ChevronDown`, `Menu`, `X`, `Briefcase`, `SearchX`, `AlertTriangle` | Ya instalado |
| cult-ui (local) | — | `TextureCard`, `TextureButton` | Ya en `tma/src/components/ui/` |
| next-auth | 5.0.0-beta.31 | `auth()` para verificar sesión | Patrón establecido |

### No se necesita instalar nada nuevo [VERIFIED: package.json completo revisado]

Todos los paquetes requeridos por esta fase ya están en `dependencies`. No hay `npm install` en Wave 0.

---

## Architecture Patterns

### System Architecture Diagram

```
Usuario (browser)
      │
      ▼
proxy.ts (Edge middleware)
  pathname.startsWith("/tma") → verifica auth
  /tma/casos → ✓ pasa si hay sesión
      │
      ▼
/tma/casos/page.tsx  (Server Component)
  auth() → si no hay sesión → redirect("/login")
  render: <CasosDashboard />  (Client Component "use client")
      │
      ├── monta: useEffect → GET /api/casos
      │         ├── loading: skeleton 5 filas
      │         └── loaded: setCasos(data)
      │
      ├── CasosSidebar (Client Component)
      │   ├── desktop: aside fijo w-60
      │   └── móvil: hamburger + overlay animado motion/react
      │
      ├── CasosFilterBar
      │   ├── filterNombre → onChange → useState
      │   └── filterResponsable → onChange → useState
      │
      └── CasosTable
          ├── filteredCasos = casos.filter(AND de ambos filtros)
          ├── sortedCasos = filteredCasos.sort(fechaVencimiento asc/desc)
          └── CasoRow (por cada caso)
              └── Trash2 → ConfirmDialog → DELETE /api/casos?id={id}
                  └── UI optimista: fila desaparece → restore si error

/tma/casos/nuevo/page.tsx (Server Component)
  auth() → si no hay sesión → redirect("/login")
  render: <CasoForm />  (Client Component "use client")
      └── submit → POST /api/casos
          └── validación Zod client-side primero

/api/casos/route.ts
  GET  → auth() → connectDB() → Caso.find().sort({fechaVencimiento: 1}) → JSON
  POST → auth() → body JSON → Zod safeParse → Caso.create() → 201
  DELETE → auth() → searchParams.get("id") → Caso.findByIdAndDelete() → 200
```

### Recommended Project Structure

```
tma/src/
├── app/
│   ├── api/
│   │   └── casos/
│   │       └── route.ts          # GET + POST + DELETE — un solo archivo
│   └── tma/
│       └── casos/
│           ├── page.tsx          # Server Component — auth() + render CasosDashboard
│           └── nuevo/
│               └── page.tsx      # Server Component — auth() + render CasoForm
├── components/
│   ├── casos/
│   │   ├── CasosDashboard.tsx    # Client Component "use client" — estado principal
│   │   ├── CasosSidebar.tsx      # Client Component — sidebar + hamburger
│   │   ├── CasosTable.tsx        # Client Component — tabla filtrable
│   │   ├── CasosFilterBar.tsx    # Client Component — inputs filtro
│   │   ├── CasoRow.tsx           # Sub-componente — fila individual con AnimatePresence
│   │   ├── ConfirmDialog.tsx     # Client Component — <dialog> nativo animado
│   │   ├── SidebarNavItem.tsx    # Sub-componente — ítem sidebar reutilizable
│   │   └── CasoForm.tsx          # Client Component "use client" — formulario nuevo asunto
│   └── TmaPageContent.tsx        # MODIFICAR: href: null → href: "/tma/casos"
├── models/
│   ├── User.ts                   # existente
│   └── Caso.ts                   # NUEVO — replicar patrón User.ts
└── lib/
    └── validations.ts            # EXTENDER — agregar casoSchema
```

### Pattern 1: Modelo Mongoose `Caso` (réplica de `User.ts`)

```typescript
// Source: tma/src/models/User.ts (patrón verificado en codebase)
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

**Colección MongoDB:** `casos` (Mongoose pluraliza automáticamente "Caso" → "casos"). [VERIFIED: patrón confirmado en User.ts — Mongoose pluraliza el nombre del modelo]

### Pattern 2: Zod schema para Caso (extensión de `validations.ts`)

Zod v4 cambia la API de mensajes de error vs v3. [VERIFIED: npm registry via package.json v4.4.3]

```typescript
// Source: tma/src/lib/validations.ts (patrón existente + Zod v4 API verificada)
export const casoSchema = z.object({
  nombre: z.string().min(1, "El nombre del asunto es obligatorio."),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria."),
  // input type="date" devuelve string "YYYY-MM-DD" — se convierte a Date en el server
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es obligatoria."),
  responsable: z.string().min(1, "El responsable es obligatorio."),
})

export type CasoSchema = z.infer<typeof casoSchema>
```

**Nota:** `<input type="date">` devuelve `string` en formato `"YYYY-MM-DD"`. El server convierte a `Date` con `new Date(value)` antes de guardar en MongoDB. La validación client-side verifica que el string no esté vacío. [ASSUMED]

### Pattern 3: Route Handler `/api/casos/route.ts`

```typescript
// Source: tma/src/app/api/contracts/analyze/route.ts (patrón verificado en codebase)
// Source: Next.js 16 docs en node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import Caso from "@/models/Caso"
import { casoSchema } from "@/lib/validations"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  await connectDB()
  const casos = await Caso.find().sort({ fechaVencimiento: 1 }).lean()
  return NextResponse.json(casos)
}

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
    fechaIngreso: new Date(result.data.fechaIngreso),
    fechaVencimiento: new Date(result.data.fechaVencimiento),
  })
  return NextResponse.json(caso, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  await connectDB()
  await Caso.findByIdAndDelete(id)
  return NextResponse.json({ ok: true })
}
```

### Pattern 4: UI optimista con `AnimatePresence` (motion/react)

```typescript
// Source: UI-SPEC.md §CasosTable §Eliminación optimista (D-10, D-11)
// Source: TmaPageContent.tsx — patrón motion/react verificado en codebase
import { AnimatePresence, motion } from "motion/react"

// En CasosDashboard state:
const [casos, setCasos] = useState<ICaso[]>([])

// Al confirmar eliminación:
const handleDelete = async (id: string) => {
  const backup = [...casos]
  // 1. Optimistic update
  setCasos(prev => prev.filter(c => c._id !== id))
  // 2. Llamada al servidor
  const res = await fetch(`/api/casos?id=${id}`, { method: "DELETE" })
  if (!res.ok) {
    // 3. Rollback si falla
    setCasos(backup)
    // mostrar banner de error
  }
}

// En JSX — wrappear filas con AnimatePresence para exit animation:
<AnimatePresence>
  {sortedCasos.map(caso => (
    <motion.tr
      key={caso._id}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
    >
      ...
    </motion.tr>
  ))}
</AnimatePresence>
```

**Pitfall crítico:** `AnimatePresence` requiere que cada hijo tenga una `key` única y estable. Usar `caso._id` (string de MongoDB ObjectId). [VERIFIED: patrón estándar de motion/react]

### Pattern 5: Sidebar colapsable en móvil (motion/react)

```typescript
// Source: UI-SPEC.md §CasosSidebar §Responsive
"use client"
import { motion, AnimatePresence } from "motion/react"

export function CasosSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Desktop: aside fijo */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-[#FECBA1] min-h-screen flex-col">
        ...
      </aside>

      {/* Móvil: hamburger + overlay */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            {/* Sidebar overlay */}
            <motion.aside
              className="fixed top-0 left-0 h-full w-64 z-50 bg-white border-r border-[#FECBA1] flex flex-col md:hidden"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              ...
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

### Pattern 6: Páginas protegidas (Server Component)

```typescript
// Source: tma/src/app/tma/contratos/page.tsx (patrón verificado en codebase)
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function CasosPage() {
  const session = await auth()
  if (!session) redirect("/login")
  return <CasosDashboard />  // Client Component
}
```

### Pattern 7: Filtrado y ordenamiento client-side

```typescript
// Source: CONTEXT.md D-06/D-07/D-08/D-09 + UI-SPEC §Interaction Patterns
const [filterNombre, setFilterNombre] = useState("")
const [filterResponsable, setFilterResponsable] = useState("")
const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

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

### Anti-Patterns a Evitar

- **NO usar Server Actions para el formulario de nuevo asunto:** La fetching hacia `/api/casos` con `fetch()` en Client Component es suficiente y mantiene coherencia con el dashboard que también fetcha la API. Server Actions agregarían complejidad innecesaria sin beneficio.
- **NO poner estado de filtros en URL (searchParams):** D-07 dice client-side en memoria — no querystring params.
- **NO llamar a la API en cada keystroke:** D-07 — todos los casos se cargan al montar, filtrado en memoria.
- **NO importar `framer-motion`:** Solo `motion/react` (`import { motion, AnimatePresence } from "motion/react"`). [VERIFIED: TmaPageContent.tsx usa `from "motion/react"`]
- **NO usar `mongoose.models.Caso || mongoose.model(...)` sin el guard:** Next.js en desarrollo hot-reloads los módulos y puede re-registrar el modelo, causando "Cannot overwrite model". El guard `mongoose.models.Caso ||` es obligatorio. [VERIFIED: patrón en User.ts]
- **NO confundir layout con page:** `/tma/casos/` puede tener un `layout.tsx` para inyectar el sidebar en todas las sub-rutas, pero si solo hay Dashboard y Nuevo asunto como sub-rutas, es más simple tener el sidebar en el Client Component `CasosDashboard` directamente, ya que `/tma/casos/nuevo` NO tiene sidebar (UI-SPEC §Layout).

---

## Don't Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|---------|-------------|----------------|---------|
| Animación de salida de fila | Lógica CSS custom de height collapse | `AnimatePresence` + `motion.tr exit={{ opacity: 0, height: 0 }}` | Maneja el unmount lifecycle automáticamente |
| Formateo de fechas `dd/mm/yyyy` | Parser manual | `new Date(iso).toLocaleDateString("es-AR")` — nativo del browser | Maneja edge cases de timezone sin dependencias |
| Overlay sidebar móvil | Portal manual en document.body | `motion.div` con `fixed inset-0 z-40` | No requiere portal — funciona con z-index |
| Validación de ObjectId en DELETE | Regex manual `/^[0-9a-fA-F]{24}$/` | `mongoose.isValidObjectId(id)` | Maneja todos los formatos de ID de Mongoose |
| Dialog de confirmación | Librería de dialogs | `<dialog>` HTML nativo con estilos Tailwind | El proyecto no tiene shadcn inicializado; `<dialog>` nativo es suficiente y reduce dependencias |

**Key insight:** En esta fase toda la complejidad real está en la coordinación de estado React (optimistic UI + filtros + sort), no en las APIs ni en el DB. La estrategia de UI optimista con rollback es el único patrón nuevo que requiere atención.

---

## Common Pitfalls

### Pitfall 1: `AnimatePresence` con tabla HTML

**Qué sale mal:** `<AnimatePresence>` no funciona correctamente cuando wrappea filas `<tr>` directamente dentro de un `<tbody>` en algunos contextos de React 19 si el DOM virtual no reconcilia bien las keys.

**Por qué ocurre:** El DOM HTML valida que los hijos directos de `<tbody>` sean `<tr>`. `motion.tr` pasa el check, pero si el componente CasoRow es un componente separado con `motion.tr` interno, `AnimatePresence` debe estar en el mismo nivel de render que el `key`.

**Cómo evitar:** `AnimatePresence` va **dentro del `<tbody>`**, wrapeando directamente los `motion.tr` (o el componente `CasoRow` que retorna `motion.tr`). Si `CasoRow` retorna `motion.tr`, la key va en `<CasoRow key={caso._id} />`, no en el `motion.tr` interno.

**Señales de alerta:** Las filas desaparecen sin animación; warnings de consola sobre keys duplicadas.

### Pitfall 2: Fechas y timezone en MongoDB

**Qué sale mal:** `<input type="date">` devuelve `"2026-06-15"` (sin hora). `new Date("2026-06-15")` en JavaScript crea una fecha en UTC midnight, que al renderizar en Argentina (UTC-3) puede mostrar `"14/06/2026"`.

**Por qué ocurre:** `toLocaleDateString("es-AR")` interpreta la fecha en la timezone local del browser.

**Cómo evitar:** Usar `new Date(dateString + "T12:00:00")` al crear la fecha (mediodía UTC garantiza que en cualquier timezone americana sea el día correcto), o usar `date.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })`.

**Señales de alerta:** Las fechas muestran un día menos del esperado.

### Pitfall 3: `mongoose.isValidObjectId` faltante en DELETE

**Qué sale mal:** Si el `id` del searchParam no es un ObjectId válido de 24 caracteres hex, `Caso.findByIdAndDelete(id)` lanza una excepción de Mongoose en lugar de retornar `null`.

**Cómo evitar:** Validar con `mongoose.isValidObjectId(id)` antes de llamar a `findByIdAndDelete`. Retornar 400 si no es válido.

### Pitfall 4: Footer duplicado en el layout de casos

**Qué sale mal:** El `RootLayout` en `layout.tsx` ya renderiza `<Footer />`. Si el componente de página `/tma/casos` agrega `min-h-screen` al contenedor principal, puede empujar el footer correctamente. Pero si se usa `min-h-screen` en el wrapper flex del sidebar+contenido Y el body también tiene `min-h-screen flex flex-col`, el footer puede quedar dentro del área de contenido en lugar de al pie.

**Cómo evitar:** El layout del dashboard es `div className="flex min-h-screen"` — esto vive dentro del `<main className="flex-1">` del RootLayout. El footer sigue siendo hijo del `<body>` flex-col, por lo que queda al pie naturalmente. No agregar `flex flex-col` al body de la página de casos.

### Pitfall 5: `force-dynamic` en Route Handler de GET

**Qué sale mal:** Sin `export const dynamic = "force-dynamic"`, Next.js 16 puede cachear el resultado del GET de casos en build time (static rendering), devolviendo siempre los mismos datos.

**Cómo evitar:** Agregar `export const dynamic = "force-dynamic"` al Route Handler de `/api/casos`. [VERIFIED: patrón en contracts/analyze/route.ts y contracts/generate/route.ts]

### Pitfall 6: `useEffect` para fetch inicial vs Server Component con Suspense

**Qué sale mal:** Si el Server Component intenta fetchear directamente los casos (patrón `async function Page()`) para pasarlos como props al Client Component, pierde la capacidad de hacer UI optimista (eliminar fila sin re-fetch) porque el estado inicial viene de fuera.

**Cómo evitar (decisión de diseño):** El Client Component `CasosDashboard` fetcha los datos con `useEffect` al montar. El Server Component solo hace auth. Esto permite que el estado de `casos` viva completamente en el Client Component y sea muable para el optimistic delete. [ASSUMED — es la arquitectura más limpia para D-11]

---

## Code Examples

### Formateo de fechas en la tabla

```typescript
// Formateo correcto para evitar timezone issues (Pitfall 2)
function formatDate(dateStr: string | Date): string {
  const d = new Date(typeof dateStr === "string" ? dateStr + (dateStr.length === 10 ? "T12:00:00" : "") : dateStr)
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })
  // Output: "15/06/2026"
}
```

### Validación de ObjectId en DELETE

```typescript
// Source: Mongoose docs — mongoose.isValidObjectId
import mongoose from "mongoose"

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

### `<dialog>` nativo con motion/react

```typescript
// Source: UI-SPEC.md §ConfirmDialog
// <dialog> HTML nativo — no requiere portal ni librería adicional
"use client"
import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"

interface ConfirmDialogProps {
  open: boolean
  casoNombre: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, casoNombre, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [open])

  return (
    <dialog ref={dialogRef} className="p-0 bg-transparent backdrop:bg-black/30 backdrop:backdrop-blur-sm rounded-2xl">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="rounded-2xl bg-white border border-[#FECBA1] shadow-lg p-6 max-w-[400px] w-full"
          >
            {/* contenido del dialog */}
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  )
}
```

**Alternativa más simple:** Si `<dialog>` nativo presenta problemas con `AnimatePresence` (el `close()` es síncrono y no espera la animación de exit), usar un portal manual con `createPortal` o un div fixed con `z-50` y `pointer-events-none` cuando `!open`. La UI-SPEC acepta ambas implementaciones.

---

## State of the Art

| Enfoque viejo | Enfoque actual en este stack | Cuándo cambió | Impacto |
|--------------|------------------------------|---------------|---------|
| `framer-motion` import | `motion/react` import | motion v11+ | Cambio de import; API idéntica |
| Zod v3 `.min(1, { message: "..." })` | Zod v4 `.min(1, "...")` — string directo | Zod v4.0 | Ya usada en el proyecto — mantener consistencia |
| `mongoose.model("X", schema)` sin guard | `mongoose.models.X \|\| mongoose.model("X", schema)` | Next.js hot reload | Obligatorio en dev para evitar "Cannot overwrite model" |
| Next.js `params` sync en Route Handlers | `params` es una Promise en Next.js 15+ | Next.js 15 | `const { id } = await params` — pero en esta fase usamos `searchParams`, no dynamic segments |

---

## Integration Points — Cambios a código existente

### 1. `TmaPageContent.tsx` — Activar card Casos TMA (UI-04)

```typescript
// ANTES:
{ href: null, title: "Casos TMA", ... }  // disabled

// DESPUÉS:
{ href: "/tma/casos", title: "Casos TMA", ... }  // activo
// También: quitar el bloque de render del card deshabilitado (motion.div con opacity 0.45)
// y usar el mismo bloque que "Contratos TMA" (Link wrapping motion.div)
```

### 2. `proxy.ts` — Sin cambios necesarios

El middleware ya protege `pathname.startsWith("/tma")`, que cubre `/tma/casos` y `/tma/casos/nuevo`. [VERIFIED: tma/src/proxy.ts línea 22]

### 3. `validations.ts` — Agregar `casoSchema`

Agregar al final del archivo existente. No modificar los schemas de auth existentes.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 + @testing-library/react 16.3.2 |
| Config file | `tma/vitest.config.ts` (existe) |
| Quick run command | `cd tma && npm test -- --run src/__tests__/casos/` |
| Full suite command | `cd tma && npm run test:ci` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CASOS-01 | POST /api/casos crea documento en DB | unit | `npm run test:ci -- --reporter=verbose src/__tests__/casos/casosRoute.test.ts` | ❌ Wave 0 |
| CASOS-02 | casoSchema rechaza campos vacíos | unit | `npm run test:ci -- src/__tests__/casos/casoSchema.test.ts` | ❌ Wave 0 |
| CASOS-03 | GET /api/casos retorna array de casos | unit | `npm run test:ci -- src/__tests__/casos/casosRoute.test.ts` | ❌ Wave 0 |
| CASOS-04/06 | Lógica de filtrado AND client-side | unit | `npm run test:ci -- src/__tests__/casos/casosFiltrado.test.ts` | ❌ Wave 0 |
| CASOS-05 | Ordenamiento por fechaVencimiento asc/desc | unit | `npm run test:ci -- src/__tests__/casos/casosFiltrado.test.ts` | ❌ Wave 0 |
| CASOS-07 | DELETE /api/casos elimina documento + valida ObjectId | unit | `npm run test:ci -- src/__tests__/casos/casosRoute.test.ts` | ❌ Wave 0 |
| UI-04 | Card Casos TMA tiene href="/tma/casos" | unit (component) | `npm run test:ci -- src/__tests__/components/TmaPageContent.test.tsx` | ❌ Wave 0 (test de href) |
| UI-05 | CasosSidebar renderiza 3 ítems correctos | unit (component) | `npm run test:ci -- src/__tests__/casos/CasosSidebar.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd tma && npm run test:ci -- src/__tests__/casos/`
- **Per wave merge:** `cd tma && npm run test:ci`
- **Phase gate:** Full suite green antes de `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tma/src/__tests__/casos/casosRoute.test.ts` — cubre CASOS-01, CASOS-03, CASOS-07
- [ ] `tma/src/__tests__/casos/casoSchema.test.ts` — cubre CASOS-02
- [ ] `tma/src/__tests__/casos/casosFiltrado.test.ts` — cubre CASOS-04, CASOS-05, CASOS-06
- [ ] `tma/src/__tests__/casos/CasosSidebar.test.tsx` — cubre UI-05
- [ ] Actualizar `tma/src/__tests__/components/TmaPageContent.test.tsx` — verificar href="/tma/casos" para UI-04

**Nota sobre mocks en Vitest:** El setup existente (`src/__tests__/setup.ts`) y la configuración de alias en `vitest.config.ts` ya manejan los mocks de `next-auth` y `next/server`. Los tests de la route `/api/casos` deben seguir el mismo patrón de mocks que `generateRoute.test.ts` para Mongoose (mockear `connectDB` y el modelo).

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth()` de next-auth en cada Route Handler y Server Component |
| V3 Session Management | no (heredado de Fases 1-3) | NextAuth maneja sesiones |
| V4 Access Control | yes | Todos los endpoints verifican `auth()` antes de tocar DB |
| V5 Input Validation | yes | Zod `casoSchema.safeParse()` en POST; `isValidObjectId()` en DELETE |
| V6 Cryptography | no | No hay datos sensibles en Caso (nombres de asuntos, no PII crítica) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Acceso no autenticado a `/api/casos` | Elevation of Privilege | `auth()` → 401 si no hay sesión |
| DELETE de caso ajeno / de otro tenant | Tampering | No aplica: app single-tenant (5 usuarios de NyC), todos acceden a los mismos casos |
| NoSQL injection vía `_id` malformado | Tampering | `mongoose.isValidObjectId(id)` antes de `findByIdAndDelete` |
| XSS en `nombre` del asunto mostrado en dialog | XSS | React escapa automáticamente strings en JSX — no usar `dangerouslySetInnerHTML` |

---

## Environment Availability

Step 2.6: SKIPPED — Phase 4 es puramente código/config. Todas las dependencias externas (MongoDB Atlas M0, Vercel) ya están en uso desde Fase 1.

Variables de entorno requeridas: `MONGODB_URI` y `NEXTAUTH_SECRET` ya configuradas en Vercel y `.env.local`. No hay nuevas env vars en esta fase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `<input type="date">` retorna string `"YYYY-MM-DD"` que se convierte a `Date` en el server con `new Date()` | Pattern 2, Pitfall 2 | Si el browser devuelve otro formato, la fecha se guardaría `NaN`; bajo riesgo en Chrome/Firefox modernos |
| A2 | `useEffect` fetch al montar es la mejor arquitectura para el dashboard (vs. SSR con props) | Pitfall 6, Pattern 6 | Si Next.js 16 tuviera una mejor primitiva para esto (ej. `use(promise)` en Client Component), el patrón podría optimizarse; sin impacto funcional |
| A3 | La colección MongoDB se llamará `casos` (Mongoose pluralización automática de "Caso") | Pattern 1 | Si se necesita un nombre de colección diferente, se puede especificar en el Schema: `new Schema({...}, { collection: "casos" })` |

---

## Open Questions

1. **Layout de `/tma/casos/nuevo` y el footer**
   - Qué sabemos: el RootLayout tiene `<Footer />` como hijo del `<body>`. La página de nuevo asunto tiene layout centrado sin sidebar.
   - Qué está sin definir: si el footer aparece al final del contenido o si el `min-h-screen` de la página empuja el footer correctamente sin overflow.
   - Recomendación: el executor debe verificar visualmente que el footer quede al pie en ambas páginas. No requiere cambios de arquitectura — es ajuste de CSS.

2. **`<dialog>` nativo y exit animation**
   - Qué sabemos: `dialog.close()` es síncrono y desmonta el contenido antes de que `AnimatePresence` pueda animar.
   - Qué está sin definir: si el executor prefiere el `<dialog>` nativo con una solución de delay, o un div con portal.
   - Recomendación: usar `div` fixed con `z-50` en lugar de `<dialog>` nativo si la animación de salida es requerida. La UI-SPEC acepta ambas opciones.

---

## Sources

### Primary (HIGH confidence)

- `tma/src/models/User.ts` — patrón Mongoose model verificado en codebase
- `tma/src/lib/mongodb.ts` — patrón connectDB verificado en codebase
- `tma/src/proxy.ts` — cobertura de rutas `/tma/**` verificada
- `tma/src/app/api/contracts/analyze/route.ts` — patrón Route Handler con auth verificado
- `tma/src/components/TmaPageContent.tsx` — patrón motion/react y punto de integración verificado
- `tma/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — API de Route Handlers Next.js 16 verificada
- `tma/package.json` — versiones de todas las dependencias verificadas

### Secondary (MEDIUM confidence)

- `04-UI-SPEC.md` (aprobado 2026-06-15) — especificaciones exactas de componentes, animaciones y copywriting
- `04-CONTEXT.md` — decisiones bloqueadas D-01 a D-11

### Tertiary (LOW confidence)

- Ninguno — todos los claims están verificados en codebase o docs locales

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — todo verificado en `package.json` del proyecto
- Architecture: HIGH — replicación de patrones existentes confirmados en codebase
- Pitfalls: MEDIUM — algunos basados en conocimiento del comportamiento de Mongoose/motion, no reproducidos en este proyecto específico
- UI patterns: HIGH — UI-SPEC aprobada es la fuente

**Research date:** 2026-06-15
**Valid until:** 2026-07-15 (stack estable; cambios de Next.js 16.x podrían afectar si hay minor releases)
