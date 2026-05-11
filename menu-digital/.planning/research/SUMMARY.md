# Research Summary — Menú Digital

**Project:** Menú Digital (restaurant digital menu SaaS by Driva Dev)
**Domain:** QR-based read-only restaurant menu SaaS, multi-tenant
**Researched:** 2026-05-04
**Confidence:** HIGH

---

## Executive Summary

Menú Digital es un SaaS multi-tenant donde cada restaurante obtiene un panel admin para gestionar platos, categorías y alérgenos, y un menú público accesible en `/menu/[slug]` que los comensales alcanzan escaneando un QR. La arquitectura se divide limpiamente en dos superficies — un admin protegido (Clerk-authenticated) y un menú público (completamente abierto, ISR) — y esta separación debe guiar cada decisión estructural.

El stack está bien establecido: Next.js 15 App Router con Clerk v6 para auth, MongoDB Atlas + Mongoose para datos, Cloudinary para imágenes, y `qrcode` para QR. Todos los patrones de integración están confirmados contra documentación oficial.

La ruta crítica hacia un primer demo funcional es más corta de lo que parece: auth → category CRUD → dish CRUD → public menu en `/menu/[slug]` ya es un producto enviable. Cloudinary, filtros de alérgenos y descarga QR se agregan encima sin bloquear nada.

Los riesgos dominantes caen en tres categorías: **data leakage multi-tenant** (cada query debe filtrar por `userId` derivado de la sesión), **Clerk v6 breaking changes** (rutas son públicas por defecto; `auth()` es async; `ClerkProvider` va dentro de `<body>`), y **connection exhaustion en serverless** (el patrón Mongoose global cache es obligatorio desde el día uno). La ley EU de alérgenos (Reglamento 1169/2011) hace que la declaración de los 14 alérgenos sea un requisito legal, no una feature opcional.

---

## Recommended Stack

| Tecnología | Versión | Notas |
|-----------|---------|-------|
| `next` | ^15.3.x | App Router, Server Actions, ISR para menú público |
| `react` | ^19.1.0 | Server Components nativos |
| `@clerk/nextjs` | ^6.22.x | v6 tiene breaking changes vs v5 |
| `svix` | ^1.x | Verificación de webhooks Clerk |
| `mongoose` | ^8.x | Requiere patrón global connection cache en Vercel |
| `next-cloudinary` | ^6.17.x | Upload widget en cliente |
| `cloudinary` | ^2.x | Solo server-side, para firmar uploads |
| `qrcode` | ^1.5.x | Generación server-side; usar `toDataURL()` y `toBuffer()` |
| `nanoid` | latest | Sufijo único del slug |
| `slugify` | latest | Slug base desde nombre del restaurante |

**Advertencia Clerk v6:** `authMiddleware` fue removido. `auth()` es async (falta de `await` devuelve Promise silencioso). `ClerkProvider` no debe envolver `<html>`. No copiar tutoriales pre-2025.

---

## Table Stakes Features

### Admin Panel (restaurante, autenticado)

| Feature | Notas |
|---------|-------|
| CRUD de platos (nombre, descripción, precio) | Precio como cents enteros — nunca float |
| CRUD de categorías con orden | Campo numérico `order`; sin drag-and-drop en v1 |
| Asignación plato → categoría | Plato sin categoría es invisible en el menú |
| Asignación de alérgenos (14 EU) | **Legalmente obligatorio** — enum fijo, sin texto libre |
| Upload de imagen (Cloudinary) | Signed uploads únicamente; guardar `public_id` + `secure_url` |
| Toggle de visibilidad del plato | Campo `available: Boolean` |
| Vista y descarga del QR | URL debe venir de `NEXT_PUBLIC_APP_URL` |
| Slug único e inmutable | Generado en el registro; nunca editable después |
| Link de preview del menú | Link a `/menu/[slug]` en nueva pestaña |
| Login / logout | Delegado a Clerk |

### Menú Público (comensal, sin auth)

| Feature | Notas |
|---------|-------|
| Listado de platos por categoría | Categorías ordenadas por campo `order` |
| Nombre, descripción, precio | Símbolo de moneda siempre visible |
| Fotos de platos | `CldImage` con `f_auto,q_auto` + LQIP blur placeholder |
| Íconos de alérgenos por plato | Legalmente requerido; visualmente prominente |
| Filtro por categoría | Client-side, sin round-trip a DB |
| Filtro por alérgeno (exclusión) | Multi-select: oculta platos que contengan el alérgeno seleccionado |
| Layout mobile-first | 95%+ de los scans son en móvil |
| Sin login requerido | Acceso público completo |
| Estado "restaurante no encontrado" | Página 404 para slugs inválidos |
| Carga inicial rápida | ISR con `revalidate` — no SSR en cada scan |

---

## Architecture Decisions

### Estructura de rutas

```
app/
  (admin)/layout.tsx          ← sidebar, Clerk UserButton, nav chrome
    dashboard/...             ← todas las páginas admin
  (public)/layout.tsx         ← shell mínimo, sin UI de auth
    menu/[slug]/page.tsx      ← menú público, ISR
  (marketing)/page.tsx        ← landing page
  sign-in/[[...sign-in]]/
  sign-up/[[...sign-up]]/
  api/
    qr/route.ts               ← único Route Handler; PNG binario con Content-Disposition
    webhooks/clerk/route.ts   ← webhook Clerk (debe ser público, no protegido)
    sign-cloudinary-params/   ← endpoint de firma (protegido)
```

### Middleware Clerk — protección opt-in

`clerkMiddleware` hace todas las rutas públicas por defecto. Solo `/dashboard(.*)` se protege explícitamente. El endpoint `/api/webhooks/clerk` debe quedar desprotegido.

### Modelo de datos

- Colecciones compartidas, documentos scopeados por `ownerId` (Clerk `userId`)
- Jerarquía: `Restaurant → Category → Dish (alérgenos como array de strings)`
- Precio en cents enteros
- Alérgenos como `[String]` enum en Dish — sin colección separada
- Guardar ambos `imageUrl` y `imagePublicId` en Dish
- Índices críticos: `slug` (único), `ownerId`, `{ restaurantId, categoryId }`

### Server Actions para writes, Server Components para reads

El único Route Handler es `GET /api/qr` (retorna PNG binario con `Content-Disposition`). Todas las mutaciones usan Server Actions + `revalidatePath`.

### Flujo de upload Cloudinary

Cliente (`CldUploadWidget`) → solicita firma a `/api/sign-cloudinary-params` → sube directo a Cloudinary CDN → devuelve `{ public_id, secure_url }` → Server Action escribe ambos en Dish. `CLOUDINARY_API_SECRET` nunca se expone al cliente.

### Menú público — ISR, no SSR

`/menu/[slug]` usa ISR (`revalidate: 60`). Llamar `revalidatePath` en los Server Actions de guardado para invalidación inmediata.

### Generación QR — on-demand, sin almacenar

Route Handler usa `toBuffer()` para descarga PNG. Preview en dashboard via `toDataURL()`. URL siempre desde `NEXT_PUBLIC_APP_URL`.

---

## Critical Pitfalls to Avoid

1. **Query sin `userId` scope** — Cada Server Action debe derivar el tenant de `await auth()` server-side, nunca del body del request. Un filtro faltante expone datos de otro restaurante.

2. **Trampas de Clerk v6** — No usar `authMiddleware` (removido), `auth()` sincrónico (ahora async), ni `ClerkProvider` envolviendo `<html>`. No copiar código de tutoriales pre-2025.

3. **Sin patrón global de conexión Mongoose** — Sin el cache global en `lib/dbConnect.ts`, cada invocación serverless abre una nueva conexión Atlas. El tier M0 permite 500 conexiones máximo — se agota rápidamente bajo carga real.

4. **`CLOUDINARY_API_SECRET` expuesto al cliente** — Nunca en variable `NEXT_PUBLIC_`. Siempre usar el patrón de upload firmado desde el servidor.

5. **QR apuntando a localhost o preview URL** — El QR encoda `${NEXT_PUBLIC_APP_URL}/menu/${slug}`. Producción: `NEXT_PUBLIC_APP_URL=https://menudig.com.ar`. Configurar explícitamente por entorno en Vercel.

6. **Mutación del slug** — El slug es la identidad permanente del QR impreso. Si cambia, todos los QR en circulación se rompen. Inmutabilidad obligatoria a nivel API.

7. **SSR en el menú público** — Cada scan QR golpeando MongoDB directamente agota conexiones. El menú público es read-only — ISR desde el primer deploy.

---

## Build Order

### Fase 1 — Foundation
Scaffolding del proyecto, Tailwind con tokens Driva Dev, Clerk v6 (`clerkMiddleware`, páginas sign-in/up), singleton de conexión MongoDB (`lib/dbConnect.ts`), modelo `Restaurant` + generación de slug, Clerk webhook handler (verificación Svix + upsert MongoDB), Atlas allowlist `0.0.0.0/0`, separación de variables de entorno.

### Fase 2 — Admin CRUD
Shell del dashboard (route group, sidebar, `<UserButton>`), Category CRUD, Dish CRUD completo (con allergens, toggle de disponibilidad), integración de upload Cloudinary (endpoint de firma + `CldUploadWidget`).

### Fase 3 — Menú Público
`/menu/[slug]` como Server Component ISR, filtro de categorías (client-side), filtro de alérgenos por exclusión (multi-select, persiste entre categorías), `CldImage` con LQIP, 404 para slugs inválidos.

### Fase 4 — QR
Preview en `/dashboard/qr`, Route Handler para descarga PNG, validación de URL con `NEXT_PUBLIC_APP_URL`.

### Fase 5 — Polish
Empty states, skeletons de carga, error boundaries, auditoría mobile admin, paso de consistencia de marca (tokens, tipografía, footer "Desarrollado por Driva Dev").

---

## Open Questions for Planning

1. **Slug durante onboarding** — ¿Auto-generado con preview editable, o entrada manual? Afecta alcance de Fase 1.
2. **Estrategia ISR** — ¿`revalidatePath` on-demand es suficiente, o también `revalidate: 60` como fallback?
3. **Eliminación de assets Cloudinary** — ¿Síncrono en el mismo Server Action, o diferido?
4. **Formato de display de alérgenos** — ¿Ícono con tooltip, badge con nombre abreviado, o etiqueta expandida? Tiene peso legal.
5. **Ordering UX en admin** — ¿Botones arriba/abajo, campo numérico manual, o drag-and-drop diferido? El campo `order: Number` soporta los tres.
6. **`autoIndex` en producción** — Deshabilitar y gestionar índices via Atlas UI o script de migración.

---

*Investigación completada: 2026-05-04 — Lista para roadmap*
