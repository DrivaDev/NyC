# Phase 3: Public Menu & QR - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 3-Public Menu & QR
**Areas discussed:** Header del menú público, Layout de platos, Navegación por categorías, Display de alérgenos, Campo descripción del restaurante

---

## Header del menú público

| Option | Description | Selected |
|--------|-------------|----------|
| Logo + nombre + barra de categorías | Logo (si existe), nombre grande, tabs debajo. Simple y profesional. | |
| Solo nombre + barra de categorías | Sin logo — nombre como título único. Más limpio si el logo es opcional. | |
| Header full con logo, nombre y descripción | Logo + nombre + descripción corta del restaurante. Requiere campo `description` en el modelo. | ✓ |

**User's choice:** Header full con logo, nombre y descripción
**Notes:** Requiere agregar campo `description` (String) al modelo Restaurant y un textarea en `/dashboard/settings`.

---

## Layout de platos

| Option | Description | Selected |
|--------|-------------|----------|
| Lista horizontal (imagen izq, info der) | Imagen cuadrada 80–96px a la izquierda, nombre + descripción + precio a la derecha. Compacto, funciona en móvil. | ✓ |
| Cards en grilla 2 columnas | Imagen grande arriba, info abajo. Más visual pero ocupa más espacio. | |
| Lista sin imagen | Solo texto: nombre, descripción, precio. | |

**User's choice:** Lista horizontal (imagen izq, info der)
**Notes:** Ninguna nota adicional.

---

## Navegación por categorías

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs sticky en top + scroll a la sección | Barra de tabs pegada al top. Al tocar un tab, scroll suave a esa sección. Categorías como separadores visibles. | ✓ |
| Solo tabs (filtra client-side) | Los tabs cambian qué categoría es visible, escondiendo las demás. | |
| Solo scroll continuo con separadores | Sin tabs. Solo lista larga con separadores de categoría. | |

**User's choice:** Tabs sticky en top + scroll a la sección
**Notes:** Tab bar sticky + smooth scroll to section anchors. Active tab highlights current viewport section.

---

## Display de alérgenos

| Option | Description | Selected |
|--------|-------------|----------|
| Badges de texto | Chips pequeños con el nombre del alérgeno. Siempre visibles, sin tooltip. | |
| Íconos circulares + tooltip al hover/tap | Círculos 24px con emoji. Nombre en tooltip al hover (desktop) o tap (móvil). | ✓ |
| Badges de texto colapsables | Muestra los primeros 3 y '+N más'. Al tap se expanden. | |

**User's choice:** Íconos circulares + tooltip al hover/tap
**Notes:** Emoji en círculo con bg-brand-acento (#FED7AA). Emoji mapping definido en CONTEXT.md D-11.

---

## Campo descripción del restaurante

| Option | Description | Selected |
|--------|-------------|----------|
| En /dashboard/settings junto al nombre y logo | Textarea en la página de configuración existente. Un campo más, mismo flujo. | ✓ |
| En una sección aparte del dashboard | Nueva sub-página o card separada. | |

**User's choice:** En /dashboard/settings junto al nombre y logo
**Notes:** Textarea opcional, max ~200 chars. Persiste via `updateRestaurantProfile` server action.

---

## Claude's Discretion

- Placeholder visual para platos sin imagen (D-05) — researcher/planner decide el estilo exacto.
- Implementación del active tab tracking (IntersectionObserver vs scroll listener) — planner decides.
- Emoji mapping exacto para los 14 alérgenos — propuesto en D-11, planner puede ajustar.

## Deferred Ideas

- **Colores personalizables por restaurante**: El dueño podría elegir los colores del menú público. Candidato a Fase 5 o post-launch. Requiere modelo, UI picker, y lectura dinámica de colores en el menú público.
