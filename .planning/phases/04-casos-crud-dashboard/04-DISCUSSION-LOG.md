# Phase 4: Casos — CRUD & Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 4-Casos-CRUD-Dashboard
**Areas discussed:** Modelo de datos — Caso, Layout del dashboard, Filtros y ordenamiento, Eliminación de asuntos

---

## Modelo de datos — Caso

| Option | Description | Selected |
|--------|-------------|----------|
| Texto libre | El usuario escribe el nombre del responsable. Sin dependencia de la lista de usuarios. | ✓ |
| Dropdown de los 5 usuarios | Selector fijo con los emails de la allowlist. | |

**User's choice (responsable):** Texto libre

| Option | Description | Selected |
|--------|-------------|----------|
| Automática (Date.now) | Se registra al hacer submit sin campo extra en el formulario. | |
| La ingresa el usuario | Campo de fecha en el formulario. Permite fechas retroactivas. | ✓ |

**User's choice (fechaIngreso):** La ingresa el usuario

| Option | Description | Selected |
|--------|-------------|----------|
| No, los 4 campos son suficientes | nombre + fechaIngreso + fechaVencimiento + responsable. | ✓ |
| Sí, falta número de expediente | Campo de texto para identificar el expediente judicial. | |
| Sí, falta tipo/estado | Categorizar por tipo (civil, laboral) o estado (activo, cerrado). | |

**User's choice (campos extra):** No, los 4 campos son suficientes

---

## Layout del dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Panel/sección dentro de la misma página | Formulario aparece debajo o al lado de la tabla. Sin navegación. | |
| Página separada /tma/casos/nuevo | Navegación completa a otra ruta. | ✓ |
| Modal/dialog | Abre un diálogo sobre la tabla. | |

**User's choice (Nuevo asunto):** Página separada `/tma/casos/nuevo`

| Option | Description | Selected |
|--------|-------------|----------|
| Fijo, siempre visible | Más simple. App interna usada en desktop. | |
| Colapsable en móvil | Hamburger menu en pantallas chicas. | ✓ |

**User's choice (sidebar):** Colapsable en móvil

| Option | Description | Selected |
|--------|-------------|----------|
| Visible pero deshabilitado | Badge "Próximamente". Consistente con patrón de la home. | ✓ |
| Oculto hasta Fase 5 | Solo muestra Dashboard y Nuevo asunto. | |

**User's choice (Estadísticas en sidebar):** Visible pero deshabilitado — mismo patrón que card "Casos TMA" en la home

---

## Filtros y ordenamiento

| Option | Description | Selected |
|--------|-------------|----------|
| Tiempo real (onChange) | Filtra mientras tipea. UX ágil con debounce. | ✓ |
| Botón Buscar (submit) | El usuario tipea y presiona Enter o botón. | |

**User's choice (filtros):** Tiempo real

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side | Cargar todos los asuntos al montar, filtrar en memoria. | ✓ |
| Server-side | Cada keystroke dispara una API call a MongoDB. | |

**User's choice (estrategia de filtrado):** Client-side

| Option | Description | Selected |
|--------|-------------|----------|
| Ascendente por defecto | Vence antes → aparece primero. Clic en header invierte. | ✓ |
| Sin orden por defecto | Muestra en orden de creación. | |

**User's choice (orden inicial):** Ascendente por fechaVencimiento

---

## Eliminación de asuntos

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmación con dialog | "Esta acción no se puede deshacer. ¿Eliminar asunto X?". | ✓ |
| Eliminación directa | Clic → eliminado. Sin protección contra errores. | |

**User's choice (confirmación):** Dialog de confirmación

| Option | Description | Selected |
|--------|-------------|----------|
| UI optimista | Fila desaparece inmediato; se restaura si falla el servidor. | ✓ |
| Espera el servidor | Fila queda hasta que el servidor confirma DELETE. | |

**User's choice (optimismo):** UI optimista

---

## Claude's Discretion

- Diseño exacto del sidebar (widths, breakpoints, animación del collapse)
- Componente de dialog para confirmación (nativo `<dialog>` o shadcn/cult-ui)
- Feedback visual durante carga inicial (skeleton o spinner)
- Nombre del modelo Mongoose y colección en MongoDB
- Estructura de la API route (`/api/casos` unificado o routes separadas)

## Deferred Ideas

- Edición de asuntos (CASOS-V2-01) — out-of-scope v1
- Exportar tabla a CSV — v2
- Notificaciones de vencimiento — v2
- Estadísticas — Fase 5
