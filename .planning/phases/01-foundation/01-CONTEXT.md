# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Acceso seguro al sistema para los 5 usuarios de NyC, con identidad visual Driva Dev aplicada en todas las páginas. El proyecto Next.js se scaffoldea desde cero. Entregables: /register (autoservicio con allowlist), /login, middleware de protección de rutas, sesión persistente, paleta Driva Dev + Poppins + footer, y placeholder /tma como landing post-login.

</domain>

<decisions>
## Implementation Decisions

### Flujo de registro
- **D-01:** /register es autoservicio — el usuario va a la página, ingresa email (debe estar en la allowlist) y elige su contraseña. No hay intervención del dev para crear cuentas.
- **D-02:** Email duplicado muestra error específico: "Este email ya tiene cuenta, iniciá sesión" (con link a /login).
- **D-03:** Validación de contraseña: mínimo 8 caracteres. Sin requisitos de mayúsculas/números/símbolos (app interna).
- **D-04:** Registro exitoso → login automático → redirige a /tma (no a /login con mensaje).

### Ruta raíz y navegación post-auth
- **D-05:** `/` redirige a /login si no hay sesión activa, a /tma si hay sesión. No tiene página propia en Phase 1.
- **D-06:** Login exitoso redirige a /tma.
- **D-07:** `/tma` en Phase 1 es un placeholder con branding Driva Dev: saludo "Bienvenido, NyC" y los 2 cards (Casos TMA, Contratos TMA) visibles pero deshabilitados (sin link funcional). En Phase 4 se reemplaza con la homepage real (UI-04).

### Autenticación y sesión
- **D-08:** NextAuth.js v5 con Credentials Provider + bcrypt. Sin OAuth ni magic links.
- **D-09:** Allowlist fija en código: nsilva@nyc.com.ar, crivera@nyc.com.ar, tderosa@nyc.com.ar, vespinosa@nyc.com.ar, ekoch@nyc.com.ar.
- **D-10:** Email fuera de allowlist en /register muestra "Este email no está autorizado" y no crea usuario (AUTH-02).
- **D-11:** Rutas bajo /tma/* quedan protegidas por middleware Next.js — redirigen a /login si no hay sesión (AUTH-06).

### Identidad visual
- **D-12:** Paleta Driva Dev: #EA580C (CTAs), #9A3412 (titulares), #FED7AA (acento), #FFF7ED (fondo), #1C1917 (texto). Modo claro únicamente — la app usa fondo crema, no dark mode.
- **D-13:** Tipografía Poppins via Google Fonts: H1 700/28px, H2 700/20px, H3 500/16px, Body 400/13px, Caption 300/11px.
- **D-14:** Footer en todas las páginas: "Desarrollado por Driva Dev" con link a https://drivadev.com.ar.

### Scaffold del proyecto
- **D-15:** Proyecto Next.js 15 App Router + TypeScript scaffoldeado desde cero en el directorio de trabajo. Estructura con `src/` dir y alias `@/`. MongoDB Atlas M0 para la colección `users`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos de autenticación
- `.planning/REQUIREMENTS.md` §Authentication — AUTH-01 a AUTH-06 (allowlist, registro, login, bcrypt, sesión, middleware)

### Identidad visual
- `.planning/REQUIREMENTS.md` §UI & Branding — UI-01, UI-02, UI-03, UI-07 (paleta, Poppins, footer, páginas /login y /register)
- `CLAUDE.md` — identidad visual Driva Dev con colores exactos y reglas de tipografía

### Restricciones de stack
- `.planning/PROJECT.md` §Constraints — Stack, Auth, DB, Hosting, Budget (todos los servicios en tier gratuito)
- `.planning/PROJECT.md` §Key Decisions — decisiones ya bloqueadas (Credentials Provider, bcrypt, allowlist fija)

No hay specs externas adicionales — todos los requisitos están en los documentos anteriores.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Ninguno — proyecto nuevo, sin codebase existente.

### Established Patterns
- Ninguno previo. Phase 1 establece los patrones base del proyecto.

### Integration Points
- MongoDB Atlas M0: colección `users` (email, passwordHash, createdAt). Todas las fases siguientes dependen de la sesión establecida aquí.
- NextAuth.js v5: la configuración de `auth.ts` y el middleware creados en esta fase protegen todas las rutas de fases posteriores.

</code_context>

<specifics>
## Specific Ideas

- El placeholder /tma debe mostrar los 2 cards (Casos TMA, Contratos TMA) visibles pero no clickeables — para que se vea el branding aplicado aunque no sean funcionales aún.
- El registro crea sesión automáticamente y redirige a /tma (no pasa por /login manualmente).

</specifics>

<deferred>
## Deferred Ideas

- Homepage real con cards navegables (UI-04) — Phase 4.
- Dark mode — no aplica para esta app (fondo crema #FFF7ED es parte de la identidad Driva Dev).

</deferred>

---

*Phase: 1-Foundation & Auth*
*Context gathered: 2026-06-10*
