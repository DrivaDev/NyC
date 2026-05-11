# Requerimientos v1 — Menú Digital

**Proyecto:** Menú Digital by Driva Dev
**Versión:** 1.0
**Fecha:** 2026-05-04
**Estado:** Aprobado

---

## v1 Requirements

### Autenticación (AUTH)

- [ ] **AUTH-01**: El restaurante puede crear una cuenta con email y contraseña via Clerk
- [ ] **AUTH-02**: El restaurante puede iniciar sesión y mantener la sesión activa entre visitas
- [ ] **AUTH-03**: El restaurante puede cerrar sesión desde cualquier página del dashboard

### Restaurante (REST)

- [ ] **REST-01**: Al registrarse, se crea automáticamente un documento `Restaurant` con slug único e inmutable generado a partir del nombre del restaurante
- [ ] **REST-02**: El slug del restaurante nunca puede modificarse después de su creación (los QR impresos apuntan a él permanentemente)

### Categorías (CAT)

- [ ] **CAT-01**: El restaurante puede crear una categoría con nombre
- [ ] **CAT-02**: El restaurante puede editar el nombre de una categoría existente
- [ ] **CAT-03**: El restaurante puede eliminar una categoría (los platos asociados pierden su categoría o se bloquea la eliminación)
- [ ] **CAT-04**: El restaurante puede reordenar categorías usando botones de subir/bajar posición
- [ ] **CAT-05**: Las categorías se muestran en el menú público en el orden configurado por el restaurante

### Platos (DISH)

- [ ] **DISH-01**: El restaurante puede crear un plato con nombre, descripción, precio y categoría
- [ ] **DISH-02**: El restaurante puede editar cualquier campo de un plato existente
- [ ] **DISH-03**: El restaurante puede eliminar un plato
- [ ] **DISH-04**: El restaurante puede subir una imagen por plato via Cloudinary (upload firmado, sin exponer API secret)
- [ ] **DISH-05**: El restaurante puede marcar un plato como no disponible para ocultarlo temporalmente del menú público sin eliminarlo
- [ ] **DISH-06**: El restaurante puede asignar alérgenos a un plato seleccionando de los 14 alérgenos EU obligatorios (Reglamento 1169/2011)
- [ ] **DISH-07**: Solo los platos marcados como disponibles aparecen en el menú público

### Código QR (QR)

- [ ] **QR-01**: El restaurante puede ver el código QR de su menú en el dashboard
- [ ] **QR-02**: El restaurante puede descargar su código QR como archivo PNG
- [ ] **QR-03**: El restaurante puede acceder a un link directo para abrir su menú público (`/menu/[slug]`) en una nueva pestaña
- [ ] **QR-04**: El QR generado apunta siempre a `https://menudig.com.ar/menu/[slug]` en producción, configurado via `NEXT_PUBLIC_APP_URL=https://menudig.com.ar`

### Menú Público (PUB)

- [ ] **PUB-01**: El comensal puede acceder al menú del restaurante vía `/menu/[slug]` sin necesidad de cuenta ni login
- [ ] **PUB-02**: El comensal ve los platos agrupados por categoría en el orden configurado por el restaurante
- [ ] **PUB-03**: El comensal ve foto, nombre, descripción y precio de cada plato disponible
- [ ] **PUB-04**: El comensal puede filtrar platos por categoría (client-side, sin round-trip a la DB)
- [ ] **PUB-05**: El comensal ve los alérgenos de cada plato representados como íconos con tooltip al hover/tap
- [ ] **PUB-06**: El comensal que accede a un slug inexistente ve una página 404 clara
- [ ] **PUB-07**: El menú público se sirve con ISR (Incremental Static Regeneration) — no SSR en cada escaneo

### Identidad de Marca (BRAND)

- [ ] **BRAND-01**: Todo el frontend respeta la paleta de colores Driva Dev (`#EA580C`, `#9A3412`, `#FED7AA`, `#FFF7ED`, `#1C1917`)
- [ ] **BRAND-02**: La tipografía es Fira Sans (Google Fonts) con la jerarquía definida (Bold H1/H2, Medium H3, Regular body, Light caption)
- [ ] **BRAND-03**: Los botones primarios usan fondo `#EA580C` con texto blanco; los secundarios usan borde `#EA580C` con fondo transparente
- [ ] **BRAND-04**: El focus de inputs usa borde `#EA580C`; los badges usan fondo `#FED7AA` con texto `#9A3412`
- [ ] **BRAND-05**: El footer de la aplicación contiene "Desarrollado por Driva Dev"
- [ ] **BRAND-06**: No se usan gradientes, sombras excesivas ni colores fuera de la paleta definida

---

## v2 Requirements (Diferidos)

- OAuth (Google, GitHub) — login social
- Drag-and-drop para reordenar categorías y platos
- Filtro de exclusión de platos por alérgeno en menú público
- QR con logo de marca superpuesto
- Analytics de vistas del menú
- Export del menú como PDF

---

## Out of Scope

| Exclusión | Razón |
|-----------|-------|
| Sistema de pedidos online | Cambia la categoría del producto; requiere lógica de cocina/estado |
| Pagos | Implica integración de pasarela, PCI compliance, etc. |
| App móvil nativa | Solo web responsiva en v1 |
| Multi-idioma | Una sola lengua en v1 |
| Multi-restaurante por cuenta | Una cuenta = un restaurante en v1 |
| Inventario / stock | Fuera del scope informativo del menú |
| Personalización del slug después del registro | Los QR impresos son permanentes |
| Alérgenos personalizados (texto libre) | La lista EU de 14 alérgenos es el estándar legal |

---

## Traceability

| REQ-ID | Fase | Plan | Estado |
|--------|------|------|--------|
| AUTH-01 | Phase 1 | — | Pendiente |
| AUTH-02 | Phase 1 | — | Pendiente |
| AUTH-03 | Phase 1 | — | Pendiente |
| REST-01 | Phase 1 | — | Pendiente |
| REST-02 | Phase 1 | — | Pendiente |
| CAT-01 | Phase 2 | — | Pendiente |
| CAT-02 | Phase 2 | — | Pendiente |
| CAT-03 | Phase 2 | — | Pendiente |
| CAT-04 | Phase 2 | — | Pendiente |
| CAT-05 | Phase 2 | — | Pendiente |
| DISH-01 | Phase 2 | — | Pendiente |
| DISH-02 | Phase 2 | — | Pendiente |
| DISH-03 | Phase 2 | — | Pendiente |
| DISH-04 | Phase 2 | — | Pendiente |
| DISH-05 | Phase 2 | — | Pendiente |
| DISH-06 | Phase 2 | — | Pendiente |
| DISH-07 | Phase 2 | — | Pendiente |
| QR-01 | Phase 3 | — | Pendiente |
| QR-02 | Phase 3 | — | Pendiente |
| QR-03 | Phase 3 | — | Pendiente |
| QR-04 | Phase 3 | — | Pendiente |
| PUB-01 | Phase 3 | — | Pendiente |
| PUB-02 | Phase 3 | — | Pendiente |
| PUB-03 | Phase 3 | — | Pendiente |
| PUB-04 | Phase 3 | — | Pendiente |
| PUB-05 | Phase 3 | — | Pendiente |
| PUB-06 | Phase 3 | — | Pendiente |
| PUB-07 | Phase 3 | — | Pendiente |
| BRAND-01 | Phase 4 | — | Pendiente |
| BRAND-02 | Phase 4 | — | Pendiente |
| BRAND-03 | Phase 4 | — | Pendiente |
| BRAND-04 | Phase 4 | — | Pendiente |
| BRAND-05 | Phase 4 | — | Pendiente |
| BRAND-06 | Phase 4 | — | Pendiente |

*Tabla actualizada por el roadmapper y en cada transición de fase.*

---

## Resumen

| Categoría | Reqs v1 |
|-----------|---------|
| Auth | 3 |
| Restaurante | 2 |
| Categorías | 5 |
| Platos | 7 |
| QR | 4 |
| Menú Público | 7 |
| Marca | 6 |
| **Total** | **34** |
