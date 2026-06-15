# TMA — Roadmap v1.0

**Core value:** El usuario puede cargar documentación de un asunto y obtener un .docx de contrato correctamente completado en segundos, sin escribir datos manualmente.

**Milestone:** v1.0 — App interna Nicholson & Cano lista para producción

---

## Fases

| # | Nombre | Estado | Plans |
|---|--------|--------|-------|
| 1 | Foundation | ✅ Completa | 3 |
| 2 | Contratos básicos | ✅ Completa | ~4 |
| 3 | Contratos multi-locador | ✅ Completa | 5 |
| 4 | Casos CRUD & Dashboard | ✅ Completa | 5 |
| 5 | Integración & Cierre | ⏳ Pendiente | TBD |

---

## Phase 1 — Foundation ✅

**Goal:** App base funcional con auth, layout y diseño Driva Dev.

**Entregables:**
- Auth completo: login, register, allowlist de 5 emails, bcrypt, NextAuth v5
- Middleware de protección de rutas
- Layout con Poppins, tokens de color brand, Footer Driva Dev
- Páginas /login y /register con formularios + feedback inline

---

## Phase 2 — Contratos básicos ✅

**Goal:** Generación de .docx desde plantillas con un solo locador.

**Entregables:**
- ContratoWizard — selección de modelo, upload de docs del locatario
- `/api/contracts/analyze` — extrae texto de PDF/DOCX via mammoth/pdf-parse
- `/api/contracts/generate` — llama a Gemini, completa placeholders amarillos
- 10 plantillas .docx con highlighting amarillo como mecanismo de campos
- Download automático del .docx generado

---

## Phase 3 — Contratos multi-locador ✅

**Goal:** Soporte para contratos con múltiples locadores (hasta N).

**Entregables:**
- UI dinámica para agregar/quitar locadores en el wizard
- Lógica de clonado de filas XML preservando bookmark IDs únicos
- Fix de chars de control XML 1.0 inválidos y mojibake CP1252
- Fix de offsets desfasados entre pasadas de fill (applySplices)
- 55/55 tests verdes

---

## Phase 4 — Casos CRUD & Dashboard ✅

**Goal:** Módulo completo de gestión de asuntos legales.

**Entregables:**
- Mongoose model `Caso` con fechas, responsable
- API `/api/casos` — GET / POST / DELETE con auth
- Dashboard: tabla con filtros AND por nombre/responsable, ordenamiento por vencimiento
- Formulario con máscara de fecha dd/mm/aaaa, clamping día≤31/mes≤12, botón "Hoy"
- Delete optimista con rollback
- Navbar global con módulos + logout
- 82/82 tests verdes

---

## Phase 5 — Integración & Cierre ⏳

**Goal:** Conectar los dos módulos y dejar la app lista para producción.

**Candidatos (a confirmar con usuario):**

### 5A — Integración Casos → Contratos
Desde un caso del dashboard, poder iniciar la generación de un contrato con los datos del caso pre-cargados (nombre del asunto, responsable, fechas). Evita doble entrada de datos.

### 5B — Estadísticas
Panel básico con métricas: asuntos por responsable, por vencimiento próximo, contratos generados. Ya está el placeholder "Próximamente" en la sidebar.

### 5C — Cierre producción
- Variables de entorno documentadas para Vercel
- Seed inicial de plantillas en /templates
- Smoke test en staging
- `maxDuration: 60` verificado en vercel.json

---

## Decisiones arquitectónicas clave

- `pizzip` + XML directo — NO docxtemplater (placeholders son `<w:highlight w:val="yellow"/>`)
- Todo en memoria — NO almacenamiento de archivos subidos
- Credentials Provider — allowlist fija de 5 emails no justifica OAuth
- `maxDuration: 60` en vercel.json — Gemini + pizzip puede tardar hasta 60s
- Edge-compatible proxy.ts separado de middleware.ts (bcryptjs no compatible con Edge)
