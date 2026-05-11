---
status: partial
phase: 03-public-menu-qr
source: [03-VERIFICATION.md]
started: 2026-05-06T00:00:00Z
updated: 2026-05-06T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. QR descarga un PNG válido y escaneable
expected: Hacer clic en "Descargar QR" descarga un archivo `qr-{slug}.png` que abre como imagen QR válida en un visor, y al escanearlo navega a `https://menudig.com.ar/menu/{slug}`.
result: [pending]

### 2. Tooltip de alérgeno visible al tocar en móvil
expected: Al tocar un badge de alérgeno en un dispositivo móvil (o simulación DevTools), aparece el tooltip con el nombre del alérgeno en español (ej. "Gluten", "Lácteos").
result: [pending]

### 3. Tab activo sigue el scroll correctamente
expected: Al hacer scroll lento en `/menu/{slug}` con múltiples categorías, el tab correspondiente a la sección visible en la zona superior del viewport (20–30% desde arriba) se resalta con `border-brand-principal`.
result: [pending]

### 4. ISR revalida al ocultar un plato
expected: Al marcar un plato como "no disponible" en el panel admin y cargar `/menu/{slug}` en incógnito sin reiniciar el servidor, el plato no aparece en el menú público.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
