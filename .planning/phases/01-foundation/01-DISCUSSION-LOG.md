# Phase 1: Foundation & Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-10
**Phase:** 1-Foundation & Auth
**Areas discussed:** Flujo de registro, Ruta raíz / en Phase 1

---

## Flujo de registro

| Opción | Descripción | Elegida |
|--------|-------------|---------|
| Autoservicio en /register | Cada usuario va a /register, pone email (allowlist) y elige su contraseña | ✓ |
| El dev crea las cuentas en MongoDB | No hay /register visible; el dev inserta documentos directamente | |
| Primera vez solo, luego cerrar /register | /register habilitado durante setup inicial, luego se deshabilita | |

**User's choice:** Autoservicio en /register

---

| Opción | Descripción | Elegida |
|--------|-------------|---------|
| Error claro: "Este email ya tiene cuenta, iniciá sesión" | Mensaje específico con link a /login | ✓ |
| Error genérico: "El email ya está en uso" | Mensaje simple sin redirigir | |

**User's choice:** Error claro con link a /login

---

| Opción | Descripción | Elegida |
|--------|-------------|---------|
| Mínimo 8 caracteres | Sin requisitos de mayúsculas/números/símbolos | ✓ |
| Sin validación especial | Cualquier contraseña no vacía | |

**User's choice:** Mínimo 8 caracteres

---

| Opción | Descripción | Elegida |
|--------|-------------|---------|
| A /login con mensaje de éxito | Usuario ve confirmación y luego inicia sesión manualmente | |
| Login automático + redirige al dashboard | Se inicia sesión inmediatamente tras el registro | ✓ |

**User's choice:** Login automático → /tma

---

## Ruta raíz / en Phase 1

| Opción | Descripción | Elegida |
|--------|-------------|---------|
| Redirige a /login si no autenticado, a /tma si autenticado | Redirect inteligente, sin página propia en Phase 1 | ✓ |
| Placeholder mínimo con branding Driva Dev | Página simple con logo y botón | |
| Redirige siempre a /login | Más simple, sin chequear sesión | |

**User's choice:** Redirect inteligente (/ → /login o /tma según sesión)

---

| Opción | Descripción | Elegida |
|--------|-------------|---------|
| /tma | Ruta raíz del área autenticada | ✓ |
| /tma/casos | Redirige directo al dashboard de casos | |

**User's choice:** /tma

---

| Opción | Descripción | Elegida |
|--------|-------------|---------|
| Placeholder con branding: "Bienvenido, NyC" + 2 cards deshabilitados | Muestra paleta Driva Dev; cards visibles pero no funcionales | ✓ |
| Página en blanco con layout base (header + footer) | Solo el shell | |
| Solo el footer y un título | Mínimo absoluto | |

**User's choice:** Placeholder con branding y cards deshabilitados

---

## Claude's Discretion

- Tipo de sesión (JWT vs database sessions) y duración — el usuario no seleccionó esta área; Claude elige JWT stateless (estándar con NextAuth v5 Credentials, sin overhead de colección sessions) con expiración de 30 días.

## Deferred Ideas

- Homepage real (UI-04) con cards navegables funcionales → Phase 4
- Dark mode → no aplica (identidad Driva Dev usa fondo crema)
