# Phase 2: Contratos — Pipeline de generación - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Flujo completo de generación de contratos: selección de uno de los 10 modelos → carga de documentación del asunto → procesamiento vía Gemini → descarga del .docx completado. Todo en memoria, sin persistencia de archivos. Entregables: ruta `/tma/contratos` con wizard de 4 pasos, route API de generación, integración con Gemini Flash, pizzip + XML parsing para placeholders.

</domain>

<decisions>
## Implementation Decisions

### Selección de modelos (paso 1)
- **D-01:** Grid de cards agrupadas por tipo en 3 grupos: **"Anexo AC"** (AC PF, AC PJ) | **"Adenda Carta Oferta"** (PF PESOS, PF USD, PJ PESOS, PJ USD) | **"Adenda Contrato Tradicional"** (PF PESOS, PF USD, PJ PESOS, PJ USD). Total: 10 modelos.
- **D-02:** Nombres de archivo de los 10 templates (se colocan en `/public/templates/` o `/templates/` manualmente después del desarrollo):
  - `AC PF.docx` — Anexo AC Persona Física
  - `AC PJ.docx` — Anexo AC Persona Jurídica
  - `Adenda de Extensión de Plazo – Carta Oferta - PF en PESOS.docx`
  - `Adenda de Extensión de Plazo – Carta Oferta - PF en USD.docx`
  - `Adenda de Extensión de Plazo – Carta Oferta - PJ en PESOS.docx`
  - `Adenda de Extensión de Plazo – Carta Oferta - PJ en USD.docx`
  - `Adenda de Extensión de Plazo - Contrato Tradicional -PF en PESOS.docx`
  - `Adenda de Extensión de Plazo - Contrato Tradicional - PF en USD.docx`
  - `Adenda de Extensión de Plazo - Contrato Tradicional - PJ en PESOS.docx`
  - `Adenda de Extensión de Plazo - Contrato Tradicional - PJ en USD.docx`

### Formulario de documentación (paso 2)
- **D-03:** Dos tipos de formulario según modelo:
  - **Anexo AC (AC PF, AC PJ):** solo "Personas relacionadas" (archivos, obligatorio) + "Notas" (texto libre, opcional).
  - **Adenda (8 modelos restantes):** "Información del sitio" (fotos jpg/png + contrato anterior pdf/docx — campo multiformato, obligatorio) + "Personas relacionadas" (archivos, obligatorio) + "Notas" (texto libre, opcional).
- **D-04:** "Información del sitio" acepta tipos mixtos en un solo campo: jpg/jpeg/png + pdf/docx. No hay campo separado para "contrato anterior" — todo va junto.

### Procesamiento Gemini (paso 3)
- **D-05:** Durante el procesamiento: secuencia de mensajes animados (con `motion/react`):
  - "Analizando documentación..."
  - "Identificando campos del contrato..."
  - "Completando contrato con Gemini..."
  Los mensajes avanzan mientras se espera la respuesta. No hay barra de progreso real.
- **D-06:** Al terminar: mostrar resumen antes del botón de descarga: "Se completaron X/N campos. Y quedaron vacíos por falta de datos." Luego botón "Descargar .docx".

### Manejo de errores (paso 3 → error)
- **D-07:** Si Gemini falla (timeout, error de API, JSON inválido): mostrar mensaje "Hubo un error al procesar el contrato. Intentá de nuevo." con botón "Reintentar".
- **D-08:** Los archivos subidos se mantienen en estado cliente (React state) durante la sesión. Reintentar no requiere resubir archivos — los datos del formulario se conservan.

### Estrategia de placeholders para AC PF / AC PJ
- **D-09:** AC PF y AC PJ NO usan `<w:highlight w:val="yellow"/>` — son formularios de certificado anticorrupción con etiquetas tipo "Nombre:", "CUIT:", "Domicilio:". El sistema extrae el texto del documento, identifica los campos por sus etiquetas en el XML, y pide a Gemini que complete por contexto. Mismo pipeline general, estrategia de identificación diferente.
- **D-10:** Para los 8 Adenda: usar el pipeline estándar de `<w:highlight w:val="yellow"/>` según CONTR-06/07/08/09/10.

### Claude's Discretion
- Slugs/IDs internos para cada modelo de contrato (para mapear nombre → archivo template).
- Estructura exacta del prompt enviado a Gemini (mientras respete CONTR-08/09).
- Layout interno del wizard (si usar Server Components para el shell + Client para cada paso, o full client).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos de contratos
- `.planning/REQUIREMENTS.md` §Contratos — CONTR-01 a CONTR-15 (pipeline completo: selección, formulario, procesamiento, descarga, multi-locador)
- `.planning/REQUIREMENTS.md` §UI & Branding — UI-06 (flujo de 4 pasos: Selección → Documentación → Procesamiento → Descarga)

### Restricciones críticas de stack
- `CLAUDE.md` — reglas críticas: NO docxtemplater, pizzip + XML directo, resaltado amarillo como mecanismo de placeholders (excepto AC PF/PJ — ver D-09), maxDuration: 60, procesamiento en memoria
- `.planning/PROJECT.md` §Constraints — stack completo, restricciones de tier gratuito
- `.planning/PROJECT.md` §Key Decisions — decisiones ya bloqueadas (pizzip, Gemini Flash, no S3)

### Identidad visual (carryover Phase 1)
- `CLAUDE.md` — paleta Driva Dev con colores exactos, Poppins, footer
- `.planning/phases/01-foundation/01-CONTEXT.md` — decisiones de Phase 1 aplicables (D-12 paleta, D-13 tipografía, D-14 footer, D-07 placeholder /tma)

### Templates de contratos
- Los 10 archivos .docx se colocan manualmente en el servidor (directorio `/templates/` o `public/templates/`). Durante desarrollo, el sistema trabaja con estructura esperada (CONTR-06).
- Nombres exactos documentados en D-02 arriba.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tma/src/components/TmaPageContent.tsx` — patrón de card con gradient blanco→crema, border `#FECBA1`, motion/react. Reutilizar para las cards de selección de modelos en paso 1.
- `tma/src/components/ui/texture-card.tsx`, `texture-button.tsx` — componentes cult-ui ya instalados.
- `tma/src/app/tma/page.tsx` — patrón de Server Component con `auth()` check + redirect. Mismo patrón para `/tma/contratos/page.tsx`.
- `motion/react` — ya instalado, usar para mensajes animados del paso de procesamiento.

### Established Patterns
- Tailwind v4: colores en `@theme {}` de globals.css, no en tailwind.config.ts.
- `motion/react` (no `framer-motion`) para todas las animaciones.
- Modo claro únicamente — fondo `#FFF7ED`, sin dark mode.

### Integration Points
- `tma/src/components/TmaPageContent.tsx`: el card "Contratos TMA" está deshabilitado (`cursor-not-allowed`, `aria-disabled`). En Phase 2 se activa con `href="/tma/contratos"`.
- `tma/vercel.json`: ya tiene `maxDuration: 60` según CLAUDE.md — verificar que esté en la route de generación.
- No se usa MongoDB en Phase 2 (sin persistencia).

</code_context>

<specifics>
## Specific Ideas

- Los mensajes animados del paso 3 deben avanzar secuencialmente con `motion/react`, dando sensación de progreso aunque sean aproximados.
- El resumen de campos completados ("X/N campos") debe venir de los datos devueltos por la route API — el frontend necesita recibir el conteo, no solo el binario del .docx.
- La estructura de cards de selección (paso 1) debe seguir el mismo estilo de gradiente/borde que `TmaPageContent.tsx` para consistencia visual.

</specifics>

<deferred>
## Deferred Ideas

- Multi-locador (clonado de filas en Anexo AC, adaptación singular/plural en Adenda) — Phase 3 (CONTR-11, CONTR-12).
- Historial de contratos generados — v2 (CONTR-V2-01).
- Dark mode — descartado para esta app.

</deferred>

---

*Phase: 02-Contratos-Pipeline-Generacion*
*Context gathered: 2026-06-12*
