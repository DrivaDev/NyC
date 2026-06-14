# Phase 3: Contratos — Multi-locador - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Extender el pipeline de generación de contratos (Phase 2) para soportar 2+ locadores. Dos comportamientos según tipo de modelo:
- **Anexo AC (AC PF / AC PJ):** clonar la fila de identificación de locador en la tabla OOXML N-1 veces y completar cada fila con datos específicos del locador correspondiente (CONTR-11).
- **Adenda (8 modelos):** adaptar referencias singulares a plurales en el XML del template antes de extraer placeholders, luego llamada única a Gemini con todos los docs (CONTR-12).

Entregables: extensión del wizard (paso 2) con sección "+/− locadores", lógica de clonar filas AC, lógica de sustitución singular→plural en Adenda, y orquestación de llamadas múltiples a Gemini para AC.

</domain>

<decisions>
## Implementation Decisions

### UI del wizard — entrada de múltiples locadores
- **D-01:** En el paso 2 (Documentación), mostrar una sección "Locadores" con botón **"+ Agregar locador"** y botón **"−"** para eliminar. El wizard empieza con 1 locador. Sin tope: el usuario puede agregar tantos como necesite.
- **D-02:** La opción multi-locador aparece para **todos los modelos** (AC y Adenda). El comportamiento interno difiere (clonado en AC, texto plural en Adenda), pero la UI es uniforme.
- **D-03:** Cada locador tiene su propia **sección colapsable** con campo de archivos "Personas relacionadas" propio. El locador adicional se puede eliminar con el botón "−".

### Estrategia de datos — Anexo AC (CONTR-11)
- **D-04:** Para AC PF/PJ con N locadores: **N llamadas separadas a Gemini**, una por locador, cada una con los archivos de ese locador. La fila de identificación del template se clona N-1 veces y cada copia se completa con los valores devueltos por la llamada correspondiente.
- **D-05:** La fila de locador a clonar se identifica inspeccionando el XML del template `AC PF.docx` real (en `/templates/`). El agente de planeación DEBE leer el XML del template para encontrar el `<w:tr>` correcto (no hay etiqueta de referencia conocida de antemano).
- **D-06:** Cada fila clonada recibe IDs únicos para sus placeholders (ej. `lph_locador2_0`, `lph_locador2_1`, etc.) para que el fill no colisione entre locadores.

### Estrategia de texto plural — Adenda (CONTR-12)
- **D-07:** Reemplazar **solo** las formas nominativas: `"el LOCADOR"` → `"los LOCADORES"` y `"El LOCADOR"` → `"Los LOCADORES"`. No se tocan variantes preposicionales (`"del LOCADOR"`, `"al LOCADOR"`) para minimizar riesgo de alterar cláusulas.
- **D-08:** El reemplazo se aplica **antes de extraer placeholders y antes de llamar a Gemini**. Así Gemini recibe el texto ya en plural y no puede reintroducir la forma singular en campos que complete.
- **D-09:** Para Adenda con 2+ locadores: **una sola llamada a Gemini** con todos los archivos de todos los locadores concatenados. La Adenda no tiene filas por locador — habla de "los LOCADORES" en general, entonces una llamada es suficiente.

### Claude's Discretion
- Mecanismo exacto de ID único para filas clonadas (sufijo de índice, UUID corto, etc.).
- Si la sección "Locadores" del paso 2 usa accordion/expand o permanece siempre visible.
- Nombre exacto de la función de clonado en `fillPlaceholders.ts` (ej. `cloneLocadorRow`).
- Orden de procesamiento cuando hay N locadores en AC: si se llama a Gemini en paralelo (Promise.all) o secuencial.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos de contratos multi-locador
- `.planning/REQUIREMENTS.md` §Contratos — CONTR-11, CONTR-12 (definición exacta del comportamiento requerido)

### Pipeline base (Phase 2)
- `.planning/phases/02-contratos-pipeline-generacion/02-CONTEXT.md` — decisiones de Phase 2 que esta fase extiende (D-03 formulario AC, D-09 estrategia label-based, D-10 estrategia highlight)
- `tma/src/lib/contracts/extractPlaceholders.ts` — funciones `extractHighlightPlaceholders`, `extractLabelPlaceholders`, `extractUnderscoredPlaceholders` — esta fase puede necesitar nuevas funciones similares para clonado
- `tma/src/lib/contracts/fillPlaceholders.ts` — funciones de fill existentes — la lógica de clonar filas se agrega aquí o en módulo nuevo
- `tma/src/app/api/contracts/generate/route.ts` — pipeline principal que esta fase extiende para manejar locadoresData[]
- `tma/src/lib/contracts/models.ts` — tipos ContractType ("ac" | "adenda") usados para bifurcar lógica

### Templates reales (crítico para CONTR-11)
- `tma/templates/AC PF.docx` — el agente de planeación DEBE descomprimir y leer `word/document.xml` para identificar el `<w:tr>` de locador a clonar
- `tma/templates/AC PJ.docx` — verificar si la estructura de tabla es idéntica a AC PF o difiere

### Restricciones críticas de stack
- `CLAUDE.md` — reglas: pizzip + XML directo (NO docxtemplater), procesamiento en memoria, maxDuration: 60
- `.planning/PROJECT.md` §Constraints — tier gratuito, sin persistencia de archivos

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tma/src/lib/contracts/extractPlaceholders.ts` — `extractLabelPlaceholders` trabaja por párrafo con `_insertPos`; el clonado de filas AC necesitará algo análogo pero a nivel de `<w:tr>`.
- `tma/src/lib/contracts/fillPlaceholders.ts` — `fillLabelPlaceholders` usa inserción posicional en reversa; misma estrategia para fill de filas clonadas.
- `tma/src/app/api/contracts/generate/route.ts` — ya bifurca en `model.type === "ac"` vs `"adenda"`. La lógica multi-locador se agrega en esas ramas.
- `tma/src/lib/contracts/geminiClient.ts` — `callGemini(placeholders, texts, images, notes)` — se llamará N veces para AC multi-locador.

### Established Patterns
- Tailwind v4 con colores en `@theme {}`. `motion/react` para animaciones.
- Modo claro únicamente (`#FFF7ED` fondo).
- Operaciones de XML con pizzip: `zip.file("word/document.xml")!.asText()` + string manipulation + `zip.generate({ type: "nodebuffer" })`.
- Ids de placeholders: `ph_N` (highlight), `lph_N` (label), `us_N` (underscored). La fase 3 necesita esquema de ID que no colisione al clonar filas (ej. prefijo por índice de locador).

### Integration Points
- **Wizard paso 2** (Phase 2): `ContratoWizard.tsx` — hay que agregar la sección "+/− locadores". La fase 3 modifica este componente.
- **Route API** `POST /api/contracts/generate`: recibe FormData. Hay que extender para recibir archivos de múltiples locadores (ej. `personFiles_locador_0[]`, `personFiles_locador_1[]`, etc.) o un índice en el nombre del campo.
- **fillPlaceholders.ts / extractPlaceholders.ts**: se agregan funciones de clonar filas y sustitución de texto sin tocar las funciones existentes (non-breaking extension).

</code_context>

<specifics>
## Specific Ideas

- Para el reemplazo singular→plural en Adenda, la sustitución es limpia: `xml.replace(/el LOCADOR/g, "los LOCADORES").replace(/El LOCADOR/g, "Los LOCADORES")` sobre el XML crudo antes de extraer placeholders.
- El botón "+ Agregar locador" usa el mismo estilo visual que el resto del wizard (paleta Driva Dev, motion/react para la transición de aparición de la sección).
- En AC multi-locador, los mensajes animados del paso 3 (Phase 2 D-05) deben reflejar el progreso: "Completando datos del Locador 1...", "Completando datos del Locador 2...", etc.

</specifics>

<deferred>
## Deferred Ideas

- Historial de contratos generados — v2 (CONTR-V2-01).
- Edición de filas de locador después de la generación (preview interactivo) — no solicitado en v1.

</deferred>

---

*Phase: 3-Contratos-Multi-locador*
*Context gathered: 2026-06-14*
