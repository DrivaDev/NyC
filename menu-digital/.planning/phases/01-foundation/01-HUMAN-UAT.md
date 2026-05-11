---
status: partial
phase: 01-foundation
source: [01-VERIFICATION.md]
started: 2026-05-04T00:00:00Z
updated: 2026-05-04T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Webhook — Creación del documento Restaurant
expected: Al registrar una cuenta nueva, aparece un documento en la colección `restaurants` de Atlas con `clerkId`, `slug` generado, y `slugConfirmed: false`
result: [pending]

### 2. Dashboard — Estado A (spinner webhook pending)
expected: Inmediatamente después del registro (antes de que llegue el webhook), `/dashboard` muestra el spinner "Configurando tu cuenta..." brevemente antes de mostrar el formulario de slug
result: [pending]

### 3. Onboarding slug — flujo Estado B → C
expected: Con cuenta nueva (webhook entregado), editar el slug y hacer clic en "Confirmar dirección" → toast de éxito → recarga → Estado C con "Bienvenido, [nombre]" y tarjeta de URL
result: [pending]

### 4. Sign-out y redirect a /sign-in
expected: Al hacer clic en "Sign out" desde el UserButton del sidebar → redirige a `/sign-in`
result: [pending]

### 5. Estado C persistente después de iniciar sesión
expected: Cerrar sesión e iniciar sesión de nuevo → `/dashboard` muestra Estado C directamente (slug ya confirmado, sin formulario de onboarding)
result: [pending]

### 6. Acceso a /dashboard sin autenticar
expected: Navegar a `/dashboard` en ventana privada → redirige a `/sign-in`
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
