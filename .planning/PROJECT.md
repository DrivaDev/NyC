# Menú Digital — by Driva Dev

## What This Is

Plataforma web SaaS que permite a restaurantes tener un menú digital accesible mediante código QR. Los restaurantes gestionan sus platos desde un panel de administración privado. Los comensales escanean el QR y ven el menú sin necesidad de cuenta ni interacción.

**Core value:** Un restaurante puede crear su menú digital, obtener su QR y compartirlo con sus clientes — todo en minutos, sin fricción técnica.

## Context

- **Producto:** SaaS desarrollado por Driva Dev
- **Estado:** Greenfield — construir desde cero
- **Dominio:** menudig.com.ar (comprado)
- **Deploy target:** Vercel
- **Repositorio:** GitHub

## Who It's For

**Panel de administración:** Dueños o encargados de restaurantes que quieren digitalizar su menú sin depender de un mozo o carta física.

**Menú público:** Comensales que escanean el QR en la mesa y ven el menú actualizado, sin instalar nada ni crear cuenta.

## System Units

### Panel de administración (privado)
- Autenticación via Clerk (login/registro del restaurante)
- CRUD de platos (nombre, descripción, precio, imagen, alérgenos, categoría)
- CRUD de categorías
- Gestión de alérgenos posibles
- Vista y descarga del código QR propio del restaurante

### Menú público (sin login)
- Acceso vía `/menu/[slug]` único por restaurante
- Listado de platos con filtros (por categoría, alérgenos)
- Sin cuenta, sin interacción — solo lectura

## Tech Stack (Definido)

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js (App Router) |
| Base de datos | MongoDB Atlas + Mongoose |
| Autenticación | Clerk |
| Imágenes | Cloudinary |
| Generación QR | npm `qrcode` |
| Deploy | Vercel |
| Repositorio | GitHub |

## Brand Identity (Driva Dev)

### Colores
```css
--color-principal:  #EA580C;  /* Botones, CTAs */
--color-titulares:  #9A3412;  /* H1, H2 */
--color-acento:     #FED7AA;  /* Fondos secundarios, badges */
--color-fondo:      #FFF7ED;  /* Fondo general */
--color-texto:      #1C1917;  /* Cuerpo de texto */
```

### Tipografía
- Fuente: **Fira Sans** (Google Fonts)
- H1/H2: Bold 700, color `#9A3412`
- H3: Medium 500
- Body: Regular 400
- Caption: Light 300
- Mínimo: 12px en pantalla

### Reglas UI
- Botón primario: fondo `#EA580C`, texto blanco
- Botón secundario: borde `#EA580C`, texto `#EA580C`, fondo transparente
- Badges: fondo `#FED7AA`, texto `#9A3412`
- Focus inputs: borde `#EA580C`
- Border radius moderado y consistente
- Sin gradientes, sombras excesivas ni efectos fuera de guía
- Footer obligatorio: "Desarrollado por Driva Dev"

## Key Decisions

| Decisión | Rationale | Outcome |
|----------|-----------|---------|
| Clerk para auth | No reinventar autenticación, seguridad probada | — Pendiente |
| Cloudinary para imágenes | Upload, optimización y CDN incluidos | — Pendiente |
| MongoDB Atlas | Esquema flexible para platos/categorías/alérgenos | — Pendiente |
| Slug único por restaurante | URL limpia y memorable para el QR | — Pendiente |
| Next.js App Router | SSR para menú público (SEO y performance) | — Pendiente |

## Requirements

### Validated

(None yet — to be validated on launch)

### Active

- [ ] Restaurante puede registrarse e iniciar sesión
- [ ] Restaurante puede crear, editar y eliminar platos
- [ ] Restaurante puede crear y gestionar categorías
- [ ] Restaurante puede asignar alérgenos a platos
- [ ] Restaurante tiene un slug único para su menú
- [ ] Restaurante puede ver y descargar su QR
- [ ] Comensal accede al menú via `/menu/[slug]` sin login
- [ ] Comensal puede filtrar platos por categoría
- [ ] Comensal puede filtrar platos por alérgenos
- [ ] Imágenes de platos subidas y optimizadas via Cloudinary
- [ ] Frontend respeta identidad visual Driva Dev completa

### Out of Scope

- Sistema de pedidos online — el menú es solo informativo
- Pagos — fuera del scope v1
- Multi-idioma — una sola lengua en v1
- App móvil nativa — solo web responsiva
- Analytics/métricas de vistas — fuera del scope v1

## Evolution

Este documento evoluciona en cada transición de fase y milestone.

**Tras cada fase:** actualizar Validated/Active según lo entregado.
**Tras cada milestone:** revisión completa de secciones.

---
*Última actualización: 2026-05-04 — inicialización del proyecto*
