# Requirements: TMA — App interna Nicholson & Cano

**Defined:** 2026-06-10
**Core Value:** El usuario puede cargar documentación de un asunto y obtener un .docx de contrato correctamente completado en segundos, sin escribir datos manualmente.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: Usuario puede registrarse si su email está en la allowlist (5 emails de NyC)
- [ ] **AUTH-02**: Intento de registro con email fuera de allowlist muestra "Este email no está autorizado" y no crea el usuario
- [ ] **AUTH-03**: Usuario puede iniciar sesión con email y contraseña (NextAuth Credentials Provider)
- [ ] **AUTH-04**: Contraseñas hasheadas con bcrypt antes de guardar en MongoDB
- [ ] **AUTH-05**: Sesión persiste al refrescar el navegador
- [ ] **AUTH-06**: Rutas protegidas redirigen a /login si no hay sesión activa (middleware)

### Casos (Case Management)

- [ ] **CASOS-01**: Usuario puede crear un asunto con nombre, fechaIngreso, fechaVencimiento y responsable (todos obligatorios)
- [ ] **CASOS-02**: Validación cliente + servidor: submit bloqueado si falta algún campo
- [ ] **CASOS-03**: Usuario ve todos los asuntos en tabla con columnas: nombre, fechaIngreso (dd/mm/yyyy), fechaVencimiento (dd/mm/yyyy), responsable
- [ ] **CASOS-04**: Usuario puede filtrar asuntos por nombre (búsqueda parcial en texto)
- [ ] **CASOS-05**: Usuario puede ordenar asuntos por fechaVencimiento (ascendente/descendente)
- [ ] **CASOS-06**: Usuario puede filtrar asuntos por responsable (búsqueda parcial en texto)
- [ ] **CASOS-07**: Usuario puede eliminar un asunto de la tabla
- [ ] **CASOS-08**: Usuario ve contador de asuntos creados en: último mes / últimos 3 meses / último año (selector de período)
- [ ] **CASOS-09**: Usuario ve gráfico de barras (Recharts) con asuntos ingresados por mes para el año actual (12 meses, meses futuros en 0)

### Contratos (Contract Generation)

- [ ] **CONTR-01**: Usuario puede seleccionar uno de los 10 modelos de contrato predefinidos
- [ ] **CONTR-02**: Para modelos no-Anexo AC: formulario con contrato anterior (opcional), información del sitio, personas relacionadas (ambos obligatorios), notas (opcional texto libre)
- [ ] **CONTR-03**: Para Anexo AC (AC PF / AC PJ): formulario solo con personas relacionadas y notas
- [ ] **CONTR-04**: Sistema acepta archivos jpg/jpeg/png, docx y pdf en los campos de documentación
- [ ] **CONTR-05**: Sistema extrae texto de docx vía mammoth, de pdf vía pdf-parse, envía imágenes como inline base64 a Gemini Vision
- [ ] **CONTR-06**: Sistema carga el .docx modelo desde /templates, descomprime con pizzip, parsea word/document.xml
- [ ] **CONTR-07**: Sistema identifica todos los runs `<w:r>` con `<w:highlight w:val="yellow"/>` en su `<w:rPr>`, asigna IDs únicos, extrae contexto del párrafo circundante
- [ ] **CONTR-08**: Sistema envía a Gemini: lista de placeholders + contexto + contenido de docs subidos + notas; recibe JSON estricto `{ "placeholder_id": "texto" | "" }`
- [ ] **CONTR-09**: Gemini devuelve string vacío para campos sin información suficiente (nunca inventa datos)
- [ ] **CONTR-10**: Sistema reemplaza `<w:t>` de cada run identificado con el valor de Gemini, conservando el resaltado amarillo
- [ ] **CONTR-11**: Multi-locador en Anexo AC: sistema clona el `<w:tr>` de identificación de locadores N-1 veces, genera IDs únicos por copia, completa cada fila con datos de cada locador
- [ ] **CONTR-12**: Multi-locador en modelos no-Anexo AC: sistema adapta referencias singulares a plurales (ej. "el LOCADOR" → "los LOCADORES") sin alterar cláusulas, numeración ni estructura
- [ ] **CONTR-13**: Usuario puede descargar el .docx generado con un botón
- [ ] **CONTR-14**: Route de generación tiene maxDuration: 60 en vercel.json
- [ ] **CONTR-15**: Ningún archivo subido por el usuario se persiste; todo se procesa en memoria y se descarta

### UI & Branding

- [ ] **UI-01**: App usa paleta Driva Dev: #EA580C (CTAs), #9A3412 (titulares), #FED7AA (acento), #FFF7ED (fondo), #1C1917 (texto)
- [ ] **UI-02**: Tipografía Poppins (Google Fonts): H1 700 28px, H2 700 20px, H3 500 16px, Body 400 13px, Caption 300 11px
- [ ] **UI-03**: Footer en todas las páginas: "Desarrollado por Driva Dev" con link a https://drivadev.com.ar
- [ ] **UI-04**: Página de inicio (/) con descripción de la app y 2 cards de navegación (Casos TMA, Contratos TMA)
- [ ] **UI-05**: /tma/casos tiene layout con sidebar (Dashboard, Nuevo asunto, Estadísticas)
- [ ] **UI-06**: /tma/contratos tiene flujo de 4 pasos (Selección → Documentación → Procesamiento → Descarga)
- [ ] **UI-07**: Páginas /login y /register con formularios y branding Driva Dev

## v2 Requirements

### Casos

- **CASOS-V2-01**: Usuario puede editar un asunto existente (actualizar nombre, fechas, responsable)
- **CASOS-V2-02**: Sistema envía alerta/notificación cuando un asunto está próximo a vencer

### Contratos

- **CONTR-V2-01**: Historial de contratos generados (registrar qué modelo + fecha de generación)
- **CONTR-V2-02**: Usuario puede exportar la tabla de asuntos a CSV o Excel

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth / login social | Allowlist de 5 emails hace innecesaria la integración con proveedores externos |
| Almacenamiento permanente de archivos | Requisito de costo $0; procesamiento en memoria es suficiente para el caso de uso |
| Roles diferenciados (admin vs usuario) | Los 5 usuarios tienen acceso completo; no hay necesidad de restricciones internas |
| Mobile app nativa | Web-first; branding Driva Dev en responsive suficiente para v1 |
| Edición de asuntos | No solicitado en v1; crear + listar + eliminar es suficiente |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 1 | Pending |
| UI-07 | Phase 1 | Pending |
| CASOS-01 | Phase 2 | Pending |
| CASOS-02 | Phase 2 | Pending |
| CASOS-03 | Phase 2 | Pending |
| CASOS-04 | Phase 2 | Pending |
| CASOS-05 | Phase 2 | Pending |
| CASOS-06 | Phase 2 | Pending |
| CASOS-07 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 2 | Pending |
| CASOS-08 | Phase 3 | Pending |
| CASOS-09 | Phase 3 | Pending |
| CONTR-01 | Phase 4 | Pending |
| CONTR-02 | Phase 4 | Pending |
| CONTR-03 | Phase 4 | Pending |
| CONTR-04 | Phase 4 | Pending |
| CONTR-05 | Phase 4 | Pending |
| CONTR-06 | Phase 4 | Pending |
| CONTR-07 | Phase 4 | Pending |
| CONTR-08 | Phase 4 | Pending |
| CONTR-09 | Phase 4 | Pending |
| CONTR-10 | Phase 4 | Pending |
| CONTR-11 | Phase 5 | Pending |
| CONTR-12 | Phase 5 | Pending |
| CONTR-13 | Phase 4 | Pending |
| CONTR-14 | Phase 4 | Pending |
| CONTR-15 | Phase 4 | Pending |
| UI-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-10*
*Last updated: 2026-06-10 after initial definition*
