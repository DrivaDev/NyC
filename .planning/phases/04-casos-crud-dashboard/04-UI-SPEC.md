---
phase: 4
slug: casos-crud-dashboard
status: approved
shadcn_initialized: false
preset: none
created: 2026-06-15
---

# Phase 4 — UI Design Contract

> Contrato visual e interactivo para Phase 4: Casos — CRUD & Dashboard.
> Generado por gsd-ui-researcher. Consume: gsd-ui-checker, gsd-planner, gsd-executor, gsd-ui-auditor.

---

## Design System

| Propiedad | Valor |
|-----------|-------|
| Tool | cult-ui + Tailwind v4 (sin shadcn preset) |
| Preset | no aplica |
| Component library | cult-ui: TextureCard, TextureButton (instalados en `tma/src/components/ui/`) |
| Animations | `motion/react` — NO `framer-motion` |
| Icon library | lucide-react (ya instalado — Briefcase, FileText en uso) |
| Font | Poppins (Google Fonts — cargada en root layout, variable `--font-poppins`) |
| Color mode | Claro únicamente — sin dark mode |

Fuente: `tma/src/app/globals.css` + `tma/src/components/ui/texture-card.tsx` + `tma/src/components/ui/texture-button.tsx` (ya instalados).

---

## Spacing Scale

Escala base 8pt (múltiplos de 4). Tailwind v4 — usar clases utilitarias estándar (`p-2` = 8px, etc.).

| Token | Clase Tailwind | Valor | Uso en esta fase |
|-------|---------------|-------|-----------------|
| xs | `gap-1` / `p-1` | 4px | Separación icon-label en sidebar, gaps inline de badge |
| sm | `gap-2` / `p-2` | 8px | Padding interno de badge "Próximamente", gap entre ícono y texto en ítems sidebar |
| md | `gap-4` / `p-4` | 16px | Padding interno de celdas de tabla, spacing entre campos del formulario |
| lg | `gap-6` / `p-6` | 24px | Padding interno de sidebar ítems, padding del formulario |
| xl | `gap-8` / `p-8` | 32px | Separación sidebar–contenido principal |
| 2xl | `gap-12` / `py-12` | 48px | Padding vertical del área de contenido |
| 3xl | `gap-16` / `py-16` | 64px | No usado en esta fase |

Excepciones:
- Touch targets mínimos: 44px de alto en botones y filas clicables en móvil (usar `min-h-[44px]`)
- Ancho sidebar desktop: 240px fijo
- Ancho sidebar móvil: full-width overlay cuando está abierto

---

## Typography

Fuente única: Poppins. Definida en `@theme { --font-poppins }` de `globals.css`.

| Rol | Tamaño | Weight | Line Height | Uso en esta fase |
|-----|--------|--------|-------------|-----------------|
| H1 | 28px | 700 | 1.2 | Título de página: "Dashboard de Asuntos", "Nuevo Asunto" |
| H3 | 16px | 400 | 1.3 | Headers de columna en tabla, label de ítems sidebar |
| Body | 13px | 400 | 1.5 | Contenido de celdas tabla, texto de inputs, texto de dialog |
| Caption | 11px | 400 | 1.4 | Badge "Próximamente", texto auxiliar (contador de asuntos, mensajes de error inline) |

Pesos declarados: 700 (bold) para H1, 400 (regular) para H3/Body/Caption.

Notas de implementación:
- `text-[28px] font-bold` → H1
- `text-[16px] font-normal` → H3 / headers tabla
- `text-[13px] font-normal` → Body
- `text-[11px] font-normal` → Caption / badge

> Footnote: Esta tabla lista únicamente los 4 tamaños instanciados en Phase 4. La escala tipográfica completa del design system (incluyendo H2 a 20px) está definida en REQUIREMENTS.md §UI-02.

Fuente: REQUIREMENTS.md §UI-02 (pre-poblado — no se re-preguntó).

---

## Color

Paleta Driva Dev — definida en `globals.css @theme {}`. Modo claro únicamente.

| Rol | Hex | Token CSS | Clase Tailwind | Uso específico |
|-----|-----|-----------|----------------|---------------|
| Dominante (60%) | `#FFF7ED` | `--color-brand-background` | `bg-brand-background` | Fondo de página, fondo área contenido, fondo de tabla |
| Secundario (30%) | `#FFFFFF` + borde `#FECBA1` | — | `bg-white` + `border-[#FECBA1]` | Sidebar, cards TextureCard, formulario, header de tabla |
| Acento (10%) | `#FED7AA` | `--color-brand-accent` | `bg-brand-accent` | Badge "Próximamente" en sidebar, ícono container sidebar, estado hover de fila tabla |
| Títulos | `#9A3412` | `--color-brand-title` | `text-brand-title` | H1 de página, labels de ítems sidebar activo, texto de badge, headers columna tabla |
| Texto | `#1C1917` | `--color-brand-text` | `text-brand-text` | Contenido de celdas, placeholders oscuros, texto de inputs |
| CTA / Primario | `#EA580C` | `--color-brand-primary` | `text-brand-primary` / `bg-brand-primary` | Botón "Guardar asunto" (TextureButton variant primario sobreescrito), indicador de ítem sidebar activo, icono de flecha sort activo |
| Destructivo | `#DC2626` | — (usar `text-red-600`) | `text-red-600` / `bg-red-600` | Botón "Eliminar" en dialog de confirmación (TextureButton variant destructive) |
| Texto deshabilitado | `#1C1917` al 45% | — | `text-brand-text/45` | Ítem sidebar "Estadísticas" deshabilitado, placeholder de inputs |

Acento reservado para:
1. Badge "Próximamente" en ítem Estadísticas del sidebar (fondo `#FED7AA`, texto `#9A3412`)
2. Container de ícono en ítem sidebar activo
3. Estado hover de fila de tabla (fondo `#FED7AA/20`)

Fuente: CONTEXT.md §Specific Ideas + REQUIREMENTS.md §UI-01 (pre-poblado).

---

## Component Contracts

### CasosSidebar

Superficie: `div` con `bg-white border-r border-[#FECBA1]`.  
Ancho desktop: `w-60` (240px), altura `min-h-screen`.  
En móvil: oculto por defecto, overlay full-width al abrir.

**Ítems del sidebar** (D-03 — locked):

| Ítem | Ruta | Estado | Ícono |
|------|------|--------|-------|
| Dashboard | `/tma/casos` | Activo cuando pathname === `/tma/casos` | `LayoutDashboard` (lucide) |
| Nuevo asunto | `/tma/casos/nuevo` | Navegable | `PlusCircle` (lucide) |
| Estadísticas | — | Deshabilitado (`aria-disabled="true"`, `cursor-not-allowed`) | `BarChart2` (lucide) |

**Estados de ítem:**
- Activo: fondo `bg-brand-accent/30`, texto `text-brand-title font-normal`, borde izquierdo `border-l-2 border-brand-primary`
- Hover (no activo): fondo `bg-brand-accent/15`, transición `duration-150`
- Deshabilitado: opacidad `opacity-45`, sin hover effect, pointer-events none

**Badge "Próximamente"** (solo en ítem Estadísticas):
- `text-[11px] font-normal px-2 py-1 rounded-full bg-brand-accent text-brand-title`

**Hamburger (móvil):**
- Botón `Menu` / `X` de lucide, posicionado top-left del layout, `z-50`
- Atributo accesible: `aria-label="Abrir menú"` cuando sidebar está cerrado; `aria-label="Cerrar menú"` cuando sidebar está abierto
- Al abrir: overlay sidebar desde izquierda con `motion/react`: `initial={{ x: -240 }} animate={{ x: 0 }}`, `transition={{ duration: 0.22, ease: "easeOut" }}`
- Al cerrar: `animate={{ x: -240 }}`
- Backdrop: `div` semitransparente `bg-black/20` cubriendo el contenido, clic cierra sidebar

**Breakpoint de collapse:** `md` (768px). En `< md` → hamburger. En `>= md` → sidebar fijo visible.

---

### CasosTable

Superficie: tabla HTML (`<table>`) dentro de `TextureCard` con padding `p-0`.  
`overflow-x-auto` en el wrapper para scroll horizontal en móvil.

**Columnas** (REQUIREMENTS.md §CASOS-03):

| Header | Key | Ancho | Sorteable |
|--------|-----|-------|----------|
| Nombre | `nombre` | auto (flex-grow) | No |
| Fecha de ingreso | `fechaIngreso` | `w-36` | No |
| Fecha de vencimiento | `fechaVencimiento` | `w-40` | Sí (D-08) |
| Responsable | `responsable` | `w-36` | No |
| Acciones | — | `w-16` | No |

**Header de columna sorteable:**
- Texto + ícono `ChevronUp` / `ChevronDown` de lucide
- Ícono asc: `ChevronUp` color `text-brand-primary`
- Ícono desc: `ChevronDown` color `text-brand-primary`
- Estado default (primera carga): ascendente (D-08)
- `cursor-pointer`, hover: `text-brand-title`

**Fila (CasoRow):**
- Altura: `h-12` (48px) — touch-friendly
- Hover: `bg-brand-accent/20 transition-colors duration-100`
- Eliminación optimista (D-11): la fila desaparece con `motion/react` `animate={{ opacity: 0, height: 0 }}` en `duration: 0.18s`. Si el servidor responde con error, la fila reaparece con `animate={{ opacity: 1, height: "auto" }}`
- Fechas formateadas como `dd/mm/yyyy` (REQUIREMENTS.md §CASOS-03)

**Botón eliminar (por fila):**
- `TextureButton` variant `icon` size `icon`
- Ícono `Trash2` de lucide, color `text-red-500`
- Tooltip: "Eliminar asunto" (`title` attr)
- Al hacer clic: abre `ConfirmDialog` (D-10)

**Estado vacío (sin asuntos):**
- Celda `colspan={5}`, altura `h-48`, contenido centrado
- Ícono `Briefcase` de lucide, tamaño 32px, color `text-brand-accent`
- Heading: `"Sin asuntos registrados"` — `text-[16px] font-normal text-brand-title`
- Body: `"Creá el primer asunto desde el botón \"Nuevo asunto\"."` — `text-[13px] text-brand-text/60`

**Estado vacío por filtro activo:**
- Ícono `SearchX` de lucide, tamaño 32px, color `text-brand-accent`
- Heading: `"Sin resultados"` — `text-[16px] font-normal text-brand-title`
- Body: `"Ningún asunto coincide con los filtros aplicados."` — `text-[13px] text-brand-text/60`

**Estado de carga inicial:**
- Skeleton: 5 filas de `div` con `bg-brand-accent/30 animate-pulse rounded h-10` separadas por `gap-2`

---

### CasosFilterBar

Superficie: `div` con `flex gap-4` encima de la tabla.

**Input "Buscar por nombre":**
- `<input type="text">` con estilos: `border border-[#FECBA1] rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30`
- Placeholder: `"Buscar por nombre..."`
- Ancho: `w-full max-w-[220px]`
- onChange en tiempo real (D-06) — sin debounce

**Input "Buscar por responsable":**
- Mismo estilo que nombre
- Placeholder: `"Buscar por responsable..."`
- Ancho: `w-full max-w-[220px]`
- onChange en tiempo real (D-06)

Comportamiento: filtros AND simultáneos (D-09). Filtrado client-side (D-07).

---

### ConfirmDialog

Implementación: `<dialog>` HTML nativo o componente shadcn `AlertDialog` — a discreción del executor (el proyecto no tiene shadcn inicializado, usar `<dialog>` nativo con estilos Driva Dev).

**Superficie:** `rounded-2xl bg-white border border-[#FECBA1] shadow-lg p-6 max-w-[400px] w-full`

**Animación de entrada:** `motion/react` — `initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}` en `duration: 0.18s ease-out`.

**Contenido:**
- Ícono: `AlertTriangle` de lucide, 24px, color `text-red-500`, centrado
- Título: `"¿Eliminar asunto?"` — `text-[16px] font-bold text-brand-title`
- Body: `"Esta acción no se puede deshacer. Se eliminará el asunto \"[nombre del asunto]\"."` — `text-[13px] text-brand-text/70 text-center mt-2`
- Botones: dos, alineados en `flex gap-3 mt-6 justify-end`
  - Cancelar: `TextureButton` variant `secondary`, label `"No, mantener"`, cierra dialog sin acción
  - Eliminar: `TextureButton` variant `destructive`, label `"Eliminar"`, ejecuta delete optimista (D-11)

**Backdrop:** overlay `bg-black/30 backdrop-blur-sm`

---

### CasoForm (página /tma/casos/nuevo)

Layout: página separada (D-04). Server Component wrapper + Client Component para interactividad.

**Superficie principal:** `TextureCard` centrada, `max-w-[540px] mx-auto mt-12 p-8`

**Título de página:** `"Nuevo Asunto"` — H1 `text-[28px] font-bold text-brand-title`

**Campos del formulario** (CASOS-01 — todos obligatorios):

| Campo | Label | Tipo input | Placeholder |
|-------|-------|-----------|-------------|
| nombre | `"Nombre del asunto"` | `text` | `"Ej: García c/ López s/ daños"` |
| fechaIngreso | `"Fecha de ingreso"` | `date` | — (selector nativo) |
| fechaVencimiento | `"Fecha de vencimiento"` | `date` | — (selector nativo) |
| responsable | `"Responsable"` | `text` | `"Nombre del responsable"` |

**Estilos de input:**
- `w-full border border-[#FECBA1] rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-brand-text`
- Label: `text-[13px] font-normal text-brand-text mb-1 block`
- Gap entre campos: `gap-4` (16px)

**Errores de validación (CASOS-02):**
- Mensaje inline debajo del input: `text-[11px] text-red-600 mt-1`
- Input en error: borde `border-red-400 focus:ring-red-300/30`
- Mensajes específicos:
  - nombre vacío: `"El nombre del asunto es obligatorio."`
  - fechaIngreso vacía: `"La fecha de ingreso es obligatoria."`
  - fechaVencimiento vacía: `"La fecha de vencimiento es obligatoria."`
  - responsable vacío: `"El responsable es obligatorio."`

**Botones:**
- Principal: `TextureButton` variant `primary` — label `"Guardar asunto"` — `w-full mt-6`
- Secundario: link `← Volver al Dashboard` — `text-[13px] text-brand-primary underline-offset-2 hover:underline mt-3 block text-center`

**Estado de envío:**
- Botón muestra spinner `animate-spin` + texto `"Guardando..."` mientras pendiente
- Botón deshabilitado durante envío (`disabled` attr)

**Error de servidor (post-submit):**
- Banner arriba del formulario: `bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700`
- Texto: `"No se pudo guardar el asunto. Intentá nuevamente."`

---

### SidebarNavItem

Componente reutilizable para ítems del sidebar.

Props:
```typescript
interface SidebarNavItemProps {
  label: string          // "Dashboard" | "Nuevo asunto" | "Estadísticas"
  href: string | null    // null = deshabilitado
  icon: LucideIcon
  isActive: boolean
  badge?: string         // "Próximamente"
}
```

Estados: activo, hover, deshabilitado (ver CasosSidebar arriba).

---

## Layout Architecture

### /tma/casos — Layout Principal

```
┌─────────────────────────────────────────────────────┐
│ [CasosSidebar 240px] │ [Área de contenido flex-1]   │
│                      │                               │
│  ○ Dashboard  ←activo│  H1: Dashboard de Asuntos     │
│  ○ Nuevo asunto      │                               │
│  ○ Estadísticas 🔒   │  [CasosFilterBar]             │
│                      │  [nombre input] [resp input]  │
│                      │                               │
│                      │  [CasosTable]                 │
│                      │  nombre | f.ingreso | f.venc↑ │
│                      │  responsable | acciones        │
│                      │  fila 1...                     │
│                      │  fila 2...                     │
└─────────────────────────────────────────────────────┘
```

Implementación:
- Outer: `div className="flex min-h-screen bg-brand-background"`
- Sidebar: `aside className="w-60 shrink-0 bg-white border-r border-[#FECBA1] min-h-screen hidden md:flex flex-col"`
- Contenido: `main className="flex-1 p-8 overflow-x-hidden"`

### /tma/casos/nuevo — Página Formulario

Layout centrado, sin sidebar.

```
┌─────────────────────────────────────────────────────┐
│                    Nuevo Asunto                      │
│              ← Volver al Dashboard                   │
│  ┌─────────────────────────────────────────────┐    │
│  │ TextureCard (max-w-540px)                   │    │
│  │  nombre input                               │    │
│  │  fechaIngreso input                         │    │
│  │  fechaVencimiento input                     │    │
│  │  responsable input                          │    │
│  │  [Guardar asunto]                           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

Fondo: `bg-brand-background min-h-screen py-12 px-4`

### Responsive / Móvil (< 768px / breakpoint `md`)

- Sidebar oculto (`hidden md:flex`)
- Botón hamburger: `fixed top-4 left-4 z-50`, `TextureButton` variant `icon` size `icon`, ícono `Menu` / `X`
- Cuando sidebar abierto: overlay `fixed inset-0 z-40 bg-black/20` + sidebar `fixed top-0 left-0 h-full w-64 z-50 bg-white border-r border-[#FECBA1]`
- Tabla con `overflow-x-auto` — scroll horizontal en columnas que no caben
- FilterBar: `flex flex-col gap-3` en móvil (en lugar de `flex-row`)

---

## Interaction Patterns

### Filtrado en tiempo real (D-06, D-07, D-09)

- Estado: `const [filterNombre, setFilterNombre] = useState("")` + `const [filterResponsable, setFilterResponsable] = useState("")`
- Lógica: `casos.filter(c => c.nombre.toLowerCase().includes(filterNombre.toLowerCase()) && c.responsable.toLowerCase().includes(filterResponsable.toLowerCase()))`
- Sin debounce — el filtrado client-side es instantáneo
- Al cambiar filtros: no hay animación de salida de filas — re-render inmediato (performance)

### Ordenamiento por fechaVencimiento (D-08)

- Estado: `const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")`
- Al hacer clic en header: toggle `"asc"` ↔ `"desc"`
- Indicador visual: ícono `ChevronUp` (asc) / `ChevronDown` (desc) color `text-brand-primary`
- Orden aplicado después del filtrado: `[...filteredCasos].sort((a, b) => sortDir === "asc" ? new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento) : new Date(b.fechaVencimiento) - new Date(a.fechaVencimiento))`

### Eliminación optimista (D-10, D-11)

1. Usuario hace clic en `Trash2` → abre `ConfirmDialog`
2. Usuario confirma → `setCasos(prev => prev.filter(c => c._id !== id))` inmediatamente
3. En paralelo: `DELETE /api/casos?id={id}`
4. Si respuesta OK: nada adicional (ya eliminado de UI)
5. Si respuesta error: `setCasos(prev => [...prev, casoEliminado])` (restaurar) + mostrar toast/banner `"No se pudo eliminar el asunto. Intentá nuevamente."`
6. Animación de salida de fila: `motion/react` `exit={{ opacity: 0, height: 0 }}` — requiere `AnimatePresence` wrapper en la lista de filas

### Animación de sidebar móvil (D-05)

```tsx
// Sidebar overlay
<motion.aside
  initial={{ x: -256 }}
  animate={{ x: isOpen ? 0 : -256 }}
  transition={{ duration: 0.22, ease: "easeOut" }}
/>
```

### Transición de entrada de página

Patrón establecido en `TmaPageContent.tsx`:
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
/>
```
Aplicar al H1 y al contenido principal de ambas páginas (`/tma/casos` y `/tma/casos/nuevo`).

### Carga inicial de asuntos

- Fetch `GET /api/casos` al montar el componente (`useEffect` o Server Component con Suspense)
- Mientras carga: skeleton de 5 filas con `animate-pulse`
- Si fetch falla: banner `"No se pudieron cargar los asuntos. Recargá la página."` — `bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700`

---

## Copywriting Contract

Toda la app está en español (firma de abogados argentina).

### Sidebar

| Elemento | Texto |
|----------|-------|
| Ítem 1 | `"Dashboard"` |
| Ítem 2 | `"Nuevo asunto"` |
| Ítem 3 | `"Estadísticas"` |
| Badge ítem 3 | `"Próximamente"` |

### Página /tma/casos

| Elemento | Texto |
|----------|-------|
| Título H1 | `"Dashboard de Asuntos"` |
| Placeholder filtro nombre | `"Buscar por nombre..."` |
| Placeholder filtro responsable | `"Buscar por responsable..."` |
| Header col nombre | `"Nombre"` |
| Header col fechaIngreso | `"Fecha de ingreso"` |
| Header col fechaVencimiento | `"Fecha de vencimiento"` |
| Header col responsable | `"Responsable"` |
| Header col acciones | `"Acciones"` |
| Empty state (sin asuntos) heading | `"Sin asuntos registrados"` |
| Empty state (sin asuntos) body | `"Creá el primer asunto desde el botón \"Nuevo asunto\"."` |
| Empty state (filtro activo) heading | `"Sin resultados"` |
| Empty state (filtro activo) body | `"Ningún asunto coincide con los filtros aplicados."` |
| Error carga | `"No se pudieron cargar los asuntos. Recargá la página."` |
| Error delete (restauración) | `"No se pudo eliminar el asunto. Intentá nuevamente."` |
| Tooltip botón eliminar | `"Eliminar asunto"` |

### Página /tma/casos/nuevo

| Elemento | Texto |
|----------|-------|
| Título H1 | `"Nuevo Asunto"` |
| Link volver | `"← Volver al Dashboard"` |
| Label nombre | `"Nombre del asunto"` |
| Placeholder nombre | `"Ej: García c/ López s/ daños"` |
| Label fechaIngreso | `"Fecha de ingreso"` |
| Label fechaVencimiento | `"Fecha de vencimiento"` |
| Label responsable | `"Responsable"` |
| Placeholder responsable | `"Nombre del responsable"` |
| CTA principal | `"Guardar asunto"` |
| CTA cargando | `"Guardando..."` |
| Error nombre vacío | `"El nombre del asunto es obligatorio."` |
| Error fechaIngreso vacía | `"La fecha de ingreso es obligatoria."` |
| Error fechaVencimiento vacía | `"La fecha de vencimiento es obligatoria."` |
| Error responsable vacío | `"El responsable es obligatorio."` |
| Error servidor | `"No se pudo guardar el asunto. Intentá nuevamente."` |

### Dialog de confirmación

| Elemento | Texto |
|----------|-------|
| Título | `"¿Eliminar asunto?"` |
| Body | `"Esta acción no se puede deshacer. Se eliminará el asunto \"[nombre del asunto]\"."` |
| Botón cancelar | `"No, mantener"` |
| Botón confirmar | `"Eliminar"` |

---

## Registry Safety

| Registry | Componentes usados | Safety Gate |
|----------|-------------------|-------------|
| cult-ui (local) | `TextureCard`, `TextureCardContent`, `TextureCardFooter`, `TextureButton` | Ya instalados en `tma/src/components/ui/` — no se requiere gate |
| lucide-react | `LayoutDashboard`, `PlusCircle`, `BarChart2`, `Trash2`, `ChevronUp`, `ChevronDown`, `Menu`, `X`, `Briefcase`, `SearchX`, `AlertTriangle` | Paquete npm estándar — no requiere gate |
| motion/react | Animaciones (ya en uso en `TmaPageContent.tsx`) | Paquete npm estándar — no requiere gate |

No se declaran registros de terceros adicionales. No se ejecuta gate de seguridad (no aplica).

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS (FLAG: "Eliminar" single word — contextually justified)
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-06-15

---

*Phase: 4 — Casos CRUD & Dashboard*
*UI-SPEC generado: 2026-06-15*
*Fuentes: CONTEXT.md D-01/D-11, REQUIREMENTS.md UI-01/UI-02/UI-05/CASOS-01-07, globals.css, TmaPageContent.tsx, texture-card.tsx, texture-button.tsx*
