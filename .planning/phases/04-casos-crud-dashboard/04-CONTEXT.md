# Phase 4: Casos — CRUD & Dashboard - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Los usuarios pueden crear, ver, filtrar, ordenar y eliminar asuntos jurídicos desde un dashboard con tabla filtrable. Entregables: modelo Mongoose `Caso`, API routes CRUD, página `/tma/casos` con sidebar + tabla + filtros client-side, página `/tma/casos/nuevo` con formulario, y activación del card "Casos TMA" en la home.

</domain>

<decisions>
## Implementation Decisions

### Modelo de datos — Caso
- **D-01:** Cuatro campos obligatorios: `nombre` (string), `fechaIngreso` (Date — **ingresada por el usuario**, no automática), `fechaVencimiento` (Date), `responsable` (string — **texto libre**, sin dropdown).
- **D-02:** No hay campos adicionales para v1. Los 4 campos son suficientes.

### Layout del dashboard
- **D-03:** `/tma/casos` tiene sidebar fijo con 3 ítems: Dashboard (activo), Nuevo asunto (navega a `/tma/casos/nuevo`), Estadísticas (visible pero deshabilitado con badge "Próximamente" — se activa en Fase 5). Mismo patrón que el card "Casos TMA" en la home.
- **D-04:** El formulario "Nuevo asunto" es una **página separada `/tma/casos/nuevo`** — no modal ni panel lateral.
- **D-05:** El sidebar es **colapsable en móvil** (hamburger menu en pantallas chicas).

### Filtros y ordenamiento
- **D-06:** Filtros por nombre (CASOS-04) y responsable (CASOS-06) son **en tiempo real (onChange)** — filtran mientras el usuario tipea.
- **D-07:** El filtrado es **client-side** — todos los asuntos se cargan al montar, se filtran en memoria. Sin queries al servidor por cada keystroke.
- **D-08:** Orden por fechaVencimiento (CASOS-05): **ascendente por defecto** (vence antes → aparece primero). El usuario puede invertir haciendo clic en el header de la columna.
- **D-09:** Los filtros de nombre y responsable se pueden combinar simultáneamente (AND).

### Eliminación de asuntos
- **D-10:** Clic en eliminar abre un **dialog de confirmación**: "Esta acción no se puede deshacer. ¿Eliminar asunto [nombre]?". Dos botones: Cancelar / Eliminar.
- **D-11:** Tras confirmar: **UI optimista** — la fila desaparece inmediatamente del state local. Si el servidor responde con error, la fila se restaura y se muestra mensaje de error.

### Claude's Discretion
- Diseño exacto del sidebar (widths, breakpoints, animación del collapse).
- Componente de dialog para confirmación (puede usar `<dialog>` nativo o componente de shadcn/cult-ui).
- Feedback visual durante carga inicial de asuntos (skeleton loader o spinner).
- Nombre del modelo Mongoose y colección en MongoDB.
- Estructura de la API route (puede ser `/api/casos` con métodos GET/POST/DELETE o routes separadas).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos de Casos
- `.planning/REQUIREMENTS.md` §Casos — CASOS-01 a CASOS-07, UI-04, UI-05 (definición exacta del comportamiento requerido)

### Modelo de autenticación y sesión
- `tma/src/auth.ts` — `auth()` para verificar sesión en Server Components (patrón ya establecido en `tma/src/app/tma/page.tsx`)
- `tma/src/lib/mongodb.ts` — conexión Mongoose compartida (reutilizar para modelo Caso)
- `tma/src/models/User.ts` — patrón de modelo Mongoose a replicar para `Caso`

### Patrones de UI establecidos
- `tma/src/components/TmaPageContent.tsx` — card "Casos TMA" con `href: null` → cambiar a `href: "/tma/casos"` al activar esta fase
- `tma/src/app/tma/contratos/page.tsx` — patrón de página protegida con `auth()` + redirect

### Server Actions (patrón de formularios)
- `tma/src/actions/auth.login.ts` — patrón de Server Action con validación zod + `useActionState`
- `tma/src/lib/validations.ts` — patrón de schemas zod a extender para validación de Caso

### Restricciones críticas de stack
- `CLAUDE.md` — paleta Driva Dev, Tailwind v4 con `@theme {}`, `motion/react` (no `framer-motion`), cult-ui TextureCard/TextureButton
- `.planning/PROJECT.md` §Constraints — MongoDB Atlas M0, Vercel Hobby, budget $0

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tma/src/lib/mongodb.ts` — conexión Mongoose; importar y usar igual que en el modelo User.
- `tma/src/models/User.ts` — patrón exacto para el modelo `Caso`: Schema + interface + `mongoose.models.X || mongoose.model(...)`.
- `tma/src/lib/validations.ts` — schemas zod; agregar `casoSchema` aquí.
- `tma/src/actions/auth.login.ts` / `auth.register.ts` — patrón de Server Action con `useActionState`, retorna `{ error?: string }`.
- `tma/src/components/ui/texture-card.tsx` / `texture-button.tsx` — usar para cards del sidebar y botones del formulario.

### Established Patterns
- Tailwind v4: colores en `@theme {}` de `globals.css`, no en `tailwind.config.ts`.
- `motion/react` (no `framer-motion`) para transiciones de página y micro-interacciones.
- Server Components para páginas (`async function Page()` + `auth()` + redirect); Client Components para interactividad (`"use client"`).
- Paleta Driva Dev: fondo `#FFF7ED`, títulos `#9A3412`, CTAs `#EA580C`, acento `#FED7AA`, texto `#1C1917`.
- Modo claro únicamente.

### Integration Points
- **`TmaPageContent.tsx`**: cambiar `href: null` → `href: "/tma/casos"` y quitar badge "Próximamente" del card Casos TMA.
- **`tma/src/proxy.ts`** (middleware de rutas): verificar que `/tma/casos` y `/tma/casos/nuevo` queden protegidas por la misma lógica de auth que `/tma/contratos`.
- **Nueva colección MongoDB**: `casos` — sin impacto en colección `users` existente.

</code_context>

<specifics>
## Specific Ideas

- El orden ascendente por defecto en la tabla hace que los asuntos que vencen antes aparezcan arriba — útil para un estudio jurídico donde los plazos son críticos.
- El sidebar colapsable en móvil debe seguir la paleta Driva Dev (fondo `#FFF7ED`, bordes `#FECBA1`).
- El dialog de confirmación de eliminación debe mostrar el nombre del asunto: "¿Eliminar asunto [nombre]?" para que el usuario sepa qué está borrando.
- Los filtros de nombre y responsable pueden ser inputs simples (no debounced artificialmente — el filtrado client-side es instantáneo).

</specifics>

<deferred>
## Deferred Ideas

- Edición de asuntos (CASOS-V2-01) — explícitamente out-of-scope en v1.
- Exportar tabla a CSV (CONTR-V2-02) — v2.
- Notificaciones de vencimiento (CASOS-V2-02) — v2.
- Estadísticas (CASOS-08, CASOS-09) — Fase 5.

</deferred>

---

*Phase: 4-Casos-CRUD-Dashboard*
*Context gathered: 2026-06-15*
