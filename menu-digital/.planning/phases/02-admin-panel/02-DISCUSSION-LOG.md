# Phase 2: Admin Panel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 2-Admin Panel
**Areas discussed:** Formularios, Imágenes, Alérgenos, Orden categorías

---

## Formularios (Form UX)

| Option | Description | Selected |
|--------|-------------|----------|
| Modal / dialog | El formulario aparece sobre la lista sin salir de la página. Más rápido, sin navegación extra. | ✓ |
| Página dedicada | Rutas como /dashboard/dishes/new y /dashboard/dishes/[id]/edit. Más espacio, más simple de implementar. | |

**User's choice:** Modal / dialog
**Notes:** Single modal reused for create and edit modes.

---

## Imágenes (Image Upload)

| Option | Description | Selected |
|--------|-------------|----------|
| Input de archivo simple | El usuario elige un archivo, se firma server-side y se sube a Cloudinary. Sin dependencias extra. | ✓ |
| Cloudinary Upload Widget | Widget oficial de Cloudinary con drag-drop, crop y previsualización. Requiere cargar su SDK en el cliente. | |

**User's choice:** Input de archivo simple
**Notes:** Signed via `/api/sign-cloudinary-params`. API secret stays server-side.

---

## Alérgenos (Allergen Selection)

| Option | Description | Selected |
|--------|-------------|----------|
| Grid de checkboxes | Los 14 alérgenos EU visibles de una vez con checkbox. Simple, sin ambigüedad. | ✓ |
| Tags / badges clicables | Cada alérgeno es un badge que se activa/desactiva al hacer click. Más visual. | |

**User's choice:** Grid de checkboxes
**Notes:** All 14 EU allergens (Reglamento 1169/2011) shown at once.

---

## Orden categorías (Category Ordering)

| Option | Description | Selected |
|--------|-------------|----------|
| Botones ↑ ↓ | Flechas arriba/abajo en cada fila. Sin dependencias extra, funciona en mobile. | ✓ |
| Drag and drop | Arrastrar filas para reordenar. Requiere librería (dnd-kit). Mejor UX en desktop. | |

**User's choice:** Botones ↑ ↓
**Notes:** Swap `order` values of adjacent categories in a single Server Action.

---

## Claude's Discretion

- Cloudinary deletion strategy on dish delete: synchronous, log error but proceed with DB delete
- ISR: `revalidatePath` on-demand only (no static interval)
- Price conversion: store centavos, display pesos with 2 decimals

## Deferred Ideas

None — discussion stayed within phase scope.
