---
phase: 04-casos-crud-dashboard
plan: "03"
subsystem: casos-ui-components
tags: [react, motion, sidebar, filter, dialog, lucide]
dependency_graph:
  requires: [04-01]
  provides: [SidebarNavItem, CasosSidebar, CasosFilterBar, ConfirmDialog]
  affects: [04-04]
tech_stack:
  added: []
  patterns: [AnimatePresence slide-in, div-fixed-over-dialog-nativo, controlled-inputs-sin-debounce]
key_files:
  created:
    - tma/src/components/casos/SidebarNavItem.tsx
    - tma/src/components/casos/CasosSidebar.tsx
    - tma/src/components/casos/CasosFilterBar.tsx
    - tma/src/components/casos/ConfirmDialog.tsx
  modified: []
decisions:
  - div-fixed-z50-en-lugar-de-dialog-nativo-para-ConfirmDialog
  - navItems-como-const-con-tipado-readonly
  - scroll-lock-via-useEffect-en-body-overflow
metrics:
  duration: "~2 minutos"
  completed_date: "2026-06-15"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 4 Plan 03: Componentes UI de Casos (Sidebar, FilterBar, ConfirmDialog) Summary

**One-liner:** 4 componentes Client-side con paleta Driva Dev, AnimatePresence motion/react y hamburger sidebar móvil para el módulo Casos TMA.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | SidebarNavItem + CasosSidebar | 1eb27c8 | SidebarNavItem.tsx, CasosSidebar.tsx |
| 2 | CasosFilterBar + ConfirmDialog | 714e081 | CasosFilterBar.tsx, ConfirmDialog.tsx |

## Components Created

### SidebarNavItem.tsx
- **Export:** `SidebarNavItem`
- **Props:** `{ label, href: string | null, icon: LucideIcon, isActive, badge? }`
- **Estados:**
  - Activo: `bg-brand-accent/30 border-l-2 border-brand-primary`
  - Hover: `hover:bg-brand-accent/15`
  - Disabled (`href=null`): `opacity-45 cursor-not-allowed aria-disabled="true"`
- **Badge:** span con `bg-brand-accent text-brand-title` (usado por "Próximamente")

### CasosSidebar.tsx
- **Export:** `CasosSidebar`
- **Desktop:** `aside hidden md:flex w-60 min-h-screen` con border `border-[#FECBA1]`
- **Móvil:** botón hamburger `fixed top-4 left-4 z-50 md:hidden` con `aria-label` dinámico
- **Animación móvil:** `AnimatePresence` con backdrop overlay + `motion.aside` slide-in desde `x: -256`
- **navItems:** Dashboard (`/tma/casos`), Nuevo asunto (`/tma/casos/nuevo`), Estadísticas (href null, badge "Próximamente")
- **activeItem:** determinado via `usePathname()`

### CasosFilterBar.tsx
- **Export:** `CasosFilterBar`
- **Props:** `{ filterNombre, filterResponsable, onNombreChange, onResponsableChange }`
- **Inputs:** 2 inputs controlados con `onChange` sin debounce (D-06), `aria-label` en cada uno
- **Placeholders:** "Buscar por nombre..." y "Buscar por responsable..."
- **Estilo:** `border-[#FECBA1]`, `focus:ring-brand-primary/30`, layout `flex-col sm:flex-row`

### ConfirmDialog.tsx
- **Export:** `ConfirmDialog`
- **Props:** `{ open: boolean, casoNombre: string, onConfirm, onCancel }`
- **Estructura:** `div fixed z-50` (no `<dialog>` nativo — ver decisiones)
- **Animación:** `AnimatePresence` > backdrop blur + `motion.div` con `scale: 0.95→1`
- **Textos exactos:** "¿Eliminar asunto?", "Esta acción no se puede deshacer", "No, mantener", "Eliminar"
- **casoNombre:** interpolado en body con `&ldquo;&rdquo;`
- **Scroll lock:** `useEffect` que bloquea `document.body.style.overflow` cuando `open=true`

## Decisions Made

### 1. `div` fixed en lugar de `<dialog>` nativo para ConfirmDialog
- **Contexto:** La API nativa `dialog.close()` es síncrona y no espera el ciclo `exit` de `AnimatePresence`, resultando en desaparición abrupta sin animación de salida.
- **Decisión:** Se usa `div` con `position: fixed; z-index: 50` + `AnimatePresence`. El overlay usa `onClick={onCancel}` y el panel usa `e.stopPropagation()` para cierre al hacer clic fuera.
- **Trade-off:** Pérdida de accesibilidad nativa de `<dialog>` (focus trap automático). Aceptable para esta herramienta interna de 5 usuarios.

### 2. navItems como `const` con `as const`
- **Motivo:** `href: null` en Estadísticas requiere tipado preciso para que `item.href ?? null` no sea `string | undefined`. `as const` + tipo explícito evita inferencia incorrecta.

### 3. scroll lock via `useEffect` en `document.body`
- **Motivo:** Prevenir scroll del contenido de fondo mientras el dialog está abierto. Cleanup en `return` para manejar desmontaje y cuando `open` cambia a `false`.

## Test Results

```
src/__tests__/casos/CasosSidebar.test.tsx
  CasosSidebar — UI-05
    ✓ renderiza el ítem Dashboard
    ✓ renderiza el ítem Nuevo asunto
    ✓ renderiza el ítem Estadísticas
    ✓ renderiza el badge 'Próximamente' en el ítem Estadísticas (D-03)

Test Files: 4 passed (4)
Tests: 24 passed (24)
```

## Deviations from Plan

None — plan ejecutado exactamente como fue escrito.

## Known Stubs

None — los 4 componentes son puros (UI-only, sin datos hardcodeados que fluyan al DOM como stubs).

## Threat Flags

No nuevas superficies de seguridad fuera del threat_model del plan:
- T-4-05: XSS en `casoNombre` — React escapa automáticamente JSX interpolado. No hay `dangerouslySetInnerHTML`.
- T-4-06: XSS en inputs de filtro — valores van a `useState`, nunca insertados raw en DOM.
- T-4-07: `casoNombre` visible en dialog — dato no-PII aceptable para usuarios ya autenticados.

## Self-Check: PASSED

- tma/src/components/casos/SidebarNavItem.tsx: FOUND
- tma/src/components/casos/CasosSidebar.tsx: FOUND
- tma/src/components/casos/CasosFilterBar.tsx: FOUND
- tma/src/components/casos/ConfirmDialog.tsx: FOUND
- Commit 1eb27c8: FOUND (feat(04-03): SidebarNavItem + CasosSidebar)
- Commit 714e081: FOUND (feat(04-03): CasosFilterBar + ConfirmDialog)
- framer-motion imports en casos/: 0 (ninguno — solo motion/react)
