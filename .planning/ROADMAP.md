# Roadmap: TMA — App interna Nicholson & Cano

## Overview

La app se construye en cinco fases naturales: primero la fundación de auth y branding que protege el acceso y establece la identidad visual; luego el pipeline de generación de contratos vía Gemini (el core del producto); luego la lógica multi-locador que extiende ese pipeline; luego el módulo Casos completo (CRUD + filtros); y por último las estadísticas que dependen de datos reales.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Auth** - Acceso seguro + identidad visual Driva Dev ✓ 2026-06-11
- [ ] **Phase 2: Contratos — Pipeline de generación** - Flujo completo de generación de .docx vía Gemini
- [x] **Phase 3: Contratos — Multi-locador** - Soporte para contratos con múltiples locadores ✓ 2026-06-15
- [ ] **Phase 4: Casos — CRUD & Dashboard** - Gestión completa de asuntos con tabla filtrable
- [ ] **Phase 5: Casos — Estadísticas** - Selector de período + gráfico de barras mensual

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Solo los 5 usuarios de NyC pueden acceder a la app, con identidad visual Driva Dev aplicada
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, UI-01, UI-02, UI-03, UI-07
**Success Criteria** (what must be TRUE):
  1. Usuario con email en allowlist puede registrarse y crear cuenta con contraseña
  2. Usuario con email fuera de allowlist ve "Este email no está autorizado" y no puede registrarse
  3. Usuario puede iniciar sesión y la sesión persiste al refrescar el navegador
  4. Rutas protegidas redirigen a /login cuando no hay sesión activa
  5. Todas las páginas muestran la paleta Driva Dev (naranja/crema), tipografía Poppins y footer con link a drivadev.com.ar
**Plans**: 4 planes
Plans:
Wave 0 + Wave 1 *(ejecutar en paralelo — sin dependencias)*
- [x] 01-00-PLAN.md — Wave 0: Vitest + 5 archivos de test stub (AUTH-01/02/03/04/06, UI-03)
- [x] 01-01-PLAN.md — Wave 1: Scaffold del proyecto: dependencias, Tailwind v4 + paleta Driva Dev, Poppins, Footer, root layout, cult-ui, vercel.json

Wave 2 *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Wave 2: Capa de auth: NextAuth v5, User model, mongodb.ts, validations.ts, Server Action de registro, middleware de rutas

Wave 3 *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — Wave 3: Páginas UI: /login, /register, /tma placeholder con TextureCards deshabilitadas, formularios con useActionState y motion

**Cross-cutting constraints:**
- `vespinola@nyc.com.ar` es el email correcto del 5to usuario (confirmado — D-09 actualizado)
- `bcryptjs` (no `bcrypt`) — compatible con Vercel serverless sin node-gyp
- `auth.ts` debe estar en `src/auth.ts`, nunca en `src/app/`
- Tailwind v4: colores en `@theme {}` de globals.css, no en tailwind.config.ts
- `motion` importa desde `"motion/react"`, no `"framer-motion"`
- `npm install next-auth@5` (no `next-auth` que instala v4.x)

**UI hint**: yes

### Phase 2: Contratos — Pipeline de generación
**Goal**: Usuario puede subir documentación de un asunto y descargar el .docx de contrato completado por Gemini
**Depends on**: Phase 1
**Requirements**: CONTR-01, CONTR-02, CONTR-03, CONTR-04, CONTR-05, CONTR-06, CONTR-07, CONTR-08, CONTR-09, CONTR-10, CONTR-13, CONTR-14, CONTR-15, UI-06
**Success Criteria** (what must be TRUE):
  1. Usuario puede seleccionar uno de los 10 modelos de contrato y ver el formulario correspondiente
  2. Usuario puede subir archivos jpg/png, docx y pdf como documentación del asunto
  3. Sistema procesa los archivos y envía el prompt a Gemini; campos con información suficiente se completan, campos sin datos quedan vacíos (nunca inventados)
  4. Usuario puede descargar el .docx generado con resaltado amarillo preservado
  5. Ningún archivo subido persiste en el servidor tras la descarga
**Plans**: 6 planes
Plans:
Wave 0 *(sin dependencias — ejecutar primero)*
- [ ] 02-01-PLAN.md — Wave 0: Instalar paquetes (pizzip, @google/generative-ai, mammoth, pdf-parse) + 5 test stubs + fixtures

Wave 1 *(parallel — ambos dependen solo de Wave 0)*
- [ ] 02-02-PLAN.md — Wave 1a: models.ts + extractPlaceholders.ts + fillPlaceholders.ts
- [ ] 02-03-PLAN.md — Wave 1b: geminiClient.ts + extractDocText.ts

Wave 2 *(blocked on Wave 1)*
- [ ] 02-04-PLAN.md — Wave 2: Route Handler POST /api/contracts/generate — orquestación completa

Wave 3 *(blocked on Wave 2)*
- [ ] 02-05-PLAN.md — Wave 3: /tma/contratos page.tsx + ContratoWizard.tsx (wizard completo 4 pasos)

Wave 4 *(blocked on Wave 3)*
- [ ] 02-06-PLAN.md — Wave 4: Activar card "Contratos TMA" en TmaPageContent.tsx + checkpoint humano

**UI hint**: yes

### Phase 3: Contratos — Multi-locador
**Goal**: Contratos con múltiples locadores se generan correctamente según el tipo de modelo
**Depends on**: Phase 2
**Requirements**: CONTR-11, CONTR-12
**Success Criteria** (what must be TRUE):
  1. En Anexo AC con 2+ locadores, el .docx generado contiene una fila de identificación por cada locador
  2. En modelos no-Anexo AC con 2+ locadores, las referencias a "el LOCADOR" se adaptan a "los LOCADORES" sin alterar cláusulas ni numeración
**Plans**: 5 planes
Plans:
Wave 1 *(sin dependencias — ejecutar primero)*
- [x] 03-01-PLAN.md — Wave 0/TDD: fixture AC multi-fila + tests RED (cloneLocadorRow, pluralizeLocadorRefs, route multi-locador, wizard +/− locador) ✓ 2026-06-14

Wave 2 *(parallel — ambos dependen solo de 03-01)*
- [x] 03-02-PLAN.md — Backend: cloneLocadorRow (CONTR-11) + pluralizeLocadorRefs (CONTR-12) en fillPlaceholders.ts ✓ 2026-06-14
- [x] 03-03-PLAN.md — Frontend: ContratoWizard.tsx step 2 con secciones colapsables de locador (+/−), validación y FormData locadorCount/personFiles_N ✓ 2026-06-14

Wave 3 *(blocked on 03-02 + 03-03)*
- [x] 03-04-PLAN.md — Route: orquestación multi-locador (AC N llamadas + clonado, Adenda pluralize + 1 llamada), caps DoS ✓ 2026-06-14

Wave 4 *(blocked on 03-04)*
- [ ] 03-05-PLAN.md — Verificación GREEN del suite + checkpoint humano (Word abre AC 2-locador sin "reparar")

**UI hint**: yes

### Phase 4: Casos — CRUD & Dashboard
**Goal**: Usuarios pueden crear, ver, filtrar y eliminar asuntos desde un dashboard funcional
**Depends on**: Phase 1
**Requirements**: CASOS-01, CASOS-02, CASOS-03, CASOS-04, CASOS-05, CASOS-06, CASOS-07, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Usuario puede crear un asunto con los 4 campos obligatorios y verlo inmediatamente en la tabla
  2. Submit con campo vacío muestra error de validación y no guarda el asunto
  3. Usuario puede buscar asuntos por nombre parcial y por responsable parcial
  4. Usuario puede ordenar la tabla por fechaVencimiento (ascendente y descendente)
  5. Usuario puede eliminar un asunto de la tabla y desaparece inmediatamente
**Plans**: 5 planes
Plans:
Wave 0 *(sin dependencias — crear tests RED primero)*
- [ ] 04-01-PLAN.md — Wave 0: 5 archivos de test stub RED (casosRoute, casoSchema, casosFiltrado, CasosSidebar, TmaPageContent)

Wave 1 *(parallel — ambos dependen solo de Wave 0)*
- [ ] 04-02-PLAN.md — Wave 1a: Backend — Caso.ts model + casoSchema en validations.ts + route.ts (GET/POST/DELETE)
- [ ] 04-03-PLAN.md — Wave 1b: Componentes UI — SidebarNavItem + CasosSidebar + CasosFilterBar + ConfirmDialog

Wave 2 *(blocked on Wave 1a + 1b)*
- [ ] 04-04-PLAN.md — Wave 2: CasosTable + CasosDashboard + CasoForm + páginas /tma/casos y /tma/casos/nuevo + activar card TmaPageContent

Wave 3 *(blocked on Wave 2)*
- [ ] 04-05-PLAN.md — Wave 3: Suite GREEN + checkpoint humano (5 escenarios de UI)

**UI hint**: yes

### Phase 5: Casos — Estadísticas
**Goal**: Usuarios pueden analizar la carga de trabajo por período con contadores y gráfico mensual
**Depends on**: Phase 4
**Requirements**: CASOS-08, CASOS-09
**Success Criteria** (what must be TRUE):
  1. Usuario ve contador de asuntos creados para el período seleccionado (último mes / 3 meses / año)
  2. Usuario ve gráfico de barras Recharts con los 12 meses del año actual, con 0 en meses futuros
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 4/4 | Complete | 2026-06-11 |
| 2. Contratos — Pipeline de generación | 0/6 | Not started | - |
| 3. Contratos — Multi-locador | 4/5 | In progress | - |
| 4. Casos — CRUD & Dashboard | 0/5 | Ready to execute | - |
| 5. Casos — Estadísticas | 0/TBD | Not started | - |
