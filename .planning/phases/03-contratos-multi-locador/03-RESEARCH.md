# Phase 3: Contratos — Multi-locador - Research

**Researched:** 2026-06-14
**Domain:** OOXML table row cloning + multi-locador wizard UI extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** En el paso 2 (Documentación), mostrar una sección "Locadores" con botón "+ Agregar locador" y botón "−" para eliminar. El wizard empieza con 1 locador. Sin tope.

**D-02:** La opción multi-locador aparece para **todos los modelos** (AC y Adenda). Comportamiento interno difiere (clonado en AC, texto plural en Adenda), pero la UI es uniforme.

**D-03:** Cada locador tiene su propia **sección colapsable** con campo de archivos "Personas relacionadas" propio. El locador adicional se puede eliminar con el botón "−".

**D-04:** Para AC PF/PJ con N locadores: **N llamadas separadas a Gemini**, una por locador. La fila de identificación se clona N-1 veces y cada copia se completa con los valores de la llamada correspondiente.

**D-05:** La fila a clonar se identifica inspeccionando el XML real de `AC PF.docx`. (COMPLETADO en esta investigación — ver sección "AC PF.docx Structure" abajo.)

**D-06:** Cada fila clonada recibe IDs únicos (ej. `lph_locador2_0`, `lph_locador2_1`, etc.) para que el fill no colisione entre locadores.

**D-07:** Reemplazar solo las formas nominativas: `"el LOCADOR"` → `"los LOCADORES"` y `"El LOCADOR"` → `"Los LOCADORES"`. No tocar variantes preposicionales (`"del LOCADOR"`, `"al LOCADOR"`).

**D-08:** El reemplazo se aplica **antes de extraer placeholders y antes de llamar a Gemini**.

**D-09:** Para Adenda con 2+ locadores: **una sola llamada a Gemini** con todos los archivos concatenados.

### Claude's Discretion

- Mecanismo exacto de ID único para filas clonadas (sufijo de índice, UUID corto, etc.).
- Si la sección "Locadores" del paso 2 usa accordion/expand o permanece siempre visible.
- Nombre exacto de la función de clonado en `fillPlaceholders.ts` (ej. `cloneLocadorRow`).
- Orden de procesamiento cuando hay N locadores en AC: paralelo (Promise.all) o secuencial.

### Deferred Ideas (OUT OF SCOPE)

- Historial de contratos generados — v2 (CONTR-V2-01).
- Edición de filas de locador después de la generación (preview interactivo) — no solicitado en v1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONTR-11 | Multi-locador en Anexo AC: clonar `<w:tr>` de identificación N-1 veces, generar IDs únicos por copia, completar cada fila con datos del locador correspondiente | Estructura de fila verificada por inspección directa del XML de `AC PF.docx` y `AC PJ.docx` — ver sección "AC PF.docx Structure" |
| CONTR-12 | Multi-locador en modelos no-Anexo AC (Adenda): adaptar referencias singulares a plurales sin alterar cláusulas, numeración ni estructura | Estrategia de regex `xml.replace(/el LOCADOR/g, ...)` verificada; solo afecta formas nominativas según D-07 |
</phase_requirements>

---

## Summary

Phase 3 extends the Phase 2 contract generation pipeline to support N locadores (lessors). There are two distinct behaviors: (1) for Anexo AC templates (AC PF, AC PJ), clone the locador identification table row N-1 times in the OOXML XML, fill each copy via a separate Gemini call; (2) for all 8 Adenda templates, replace nominative singular forms of "LOCADOR" with plural forms in the XML before placeholder extraction, then use a single Gemini call with all locadores' files concatenated.

The OOXML structure of both AC templates has been verified by direct inspection. The locador identification data is in the **first `<w:tbl>`** in each template, which contains exactly **one `<w:tr>`** (the row to be cloned). AC PF's row has 9 paragraphs covering 8 label fields (Nombre y Apellido, Domicilio, Ciudad, País, Código Postal, Número de teléfono, Dirección de correo electrónico, DNI/CUIT). AC PJ's first table row has 12 paragraphs covering 11 label fields (company name, Domicilio, Ciudad, País, Código Postal, Número de teléfono, Dirección de correo electrónico, Página web, País de constitución, DNI/CUIT, Fecha de Constitución).

The UI change is scoped to `ContratoWizard.tsx` step 2: replace the single `personFiles` field with a dynamic list of "Locadores" sections, each with its own file upload zone and remove button. The route API must be extended to accept `personFiles_0[]`, `personFiles_1[]`, ... per locador index and orchestrate N Gemini calls for AC models.

**Primary recommendation:** Implement `cloneLocadorRow(xml, n)` in `fillPlaceholders.ts` that: (1) locates the first `<w:tbl>` and its single `<w:tr>`, (2) strips `w14:paraId` / `w:rsidR` attributes from copies and replaces with sequential hex values to maintain OOXML validity, (3) re-prefixes all `lph_` IDs in the clone with `lph_locN_` where N is the locador index, (4) appends N-1 copies just before `</w:tbl>`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Multi-locador UI (add/remove sections) | Browser / Client | — | ContratoWizard.tsx is a `"use client"` component; all state is client-side |
| FormData field naming for N locadores | Browser / Client | API / Backend | Client builds the FormData schema; server parses it |
| Row cloning in OOXML XML | API / Backend | — | pizzip + XML manipulation runs in the Next.js Route Handler (Node.js) |
| Singular→plural substitution in XML | API / Backend | — | Applied to template XML before placeholder extraction in route.ts |
| N × Gemini calls for AC multi-locador | API / Backend | — | Orchestrated in route.ts; each call is sequential or parallel |
| Placeholder ID uniqueness across cloned rows | API / Backend | — | Enforced by `cloneLocadorRow` at fill time |

---

## AC PF.docx Structure (VERIFIED)

**Source:** Direct inspection of `tma/templates/AC PF.docx` via PizZip + XML extraction.
[VERIFIED: file inspection — 2026-06-14]

### Table layout in AC PF.docx

| Table index | Content | Rows |
|-------------|---------|------|
| 0 (first) | **Locador identification — PARTE 1 INFORMACIÓN DE L LOCADOR** | **1** |
| 1 (second) | PEP questionnaire (Nombre del afectado, Puesto/cargo, etc.) | 5 |

The template has **no header row** in Table 0 — the single `<w:tr>` IS the data row.

### Table 0 row structure (the row to clone)

The single `<w:tr>` contains one `<w:tc>` (spanning the full table width of 8496 dxa), which holds **9 `<w:p>` elements**:

| Para index | Label text (from `<w:t>` inside highlighted runs) | extractLabelPlaceholders result |
|------------|---------------------------------------------------|---------------------------------|
| 0 | `Nombre y Apellido:` | `lph_0: "Nombre y Apellido"` |
| 1 | `Domicilio:` | `lph_1: "Domicilio"` |
| 2 | `Ciudad:` | `lph_2: "Ciudad"` |
| 3 | `País:` | `lph_3: "País"` |
| 4 | `Código Postal:` | `lph_4: "Código Postal"` |
| 5 | `Número de teléfono:` | `lph_5: "Número de teléfono"` |
| 6 | `Dirección de correo electrónico:` | `lph_6: "Dirección de correo electrónico"` |
| 7 | `DNI/CUIT:` | `lph_7: "DNI/CUIT"` |
| 8 | (empty — trailing paragraph) | skipped (no text ending with `:`) |

**Total label placeholders in AC PF Table 0 row: 8**

Row XML properties:
- Opening tag: `<w:tr w:rsidR="007E5BE5" w:rsidRPr="007F18C2" w14:paraId="42028EB9" w14:textId="77777777" w:rsidTr="59831445">`
- Has `<w:trPr><w:trHeight w:val="6989"/></w:trPr>` — fixed row height
- Raw XML length: ~9,888 characters
- Contains `w14:paraId` on each `<w:p>` element — these must be unique per paragraph in the document, so clones need new values

### Table 0 in AC PJ.docx (VERIFIED)

[VERIFIED: file inspection — 2026-06-14]

AC PJ also has its first `<w:tbl>` preceded by "PARTE 1 INFORMACIÓN DE L LOCADOR". It has **3 tables total**:

| Table index | Content | Rows |
|-------------|---------|------|
| 0 (first) | **Locador company identification** | **1** |
| 1 (second) | Representative/signatory contact info | 1 |
| 2 (third) | PEP questionnaire | 5 |

AC PJ Table 0 row has **12 paragraphs** (11 label fields + 1 empty trailing):

| Para index | Label | extractLabelPlaceholders result |
|------------|-------|---------------------------------|
| 0 | `Nombre o denominación social completa indicando el tipo de sociedad (por ejemplo S.A., S.R.L., etc.):` | `lph_0` |
| 1 | `Domicilio:` | `lph_1` |
| 2 | `Ciudad:` | `lph_2` |
| 3 | `País:` | `lph_3` |
| 4 | `Código Postal:` | `lph_4` |
| 5 | `Número de teléfono:` | `lph_5` |
| 6 | `Dirección de correo electrónico:` | `lph_6` |
| 7 | `Página web:` | `lph_7` |
| 8 | `País donde el Proveedor está legalmente establecida:` | `lph_8` |
| 9 | `DNI/CUIT:` | `lph_9` |
| 10 | `Fecha de Constitución de la Compañía:` | `lph_10` |
| 11 | (empty) | skipped |

**Total label placeholders in AC PJ Table 0 row: 11**

AC PJ Table 1 (representative data) **is NOT cloned** for multi-locador — it contains contact info for the signatory, not the locador identification. Only Table 0 row is cloned.

---

## Standard Stack

No new libraries needed. Phase 3 uses only existing dependencies: [VERIFIED: package.json inspection]

| Library | Version | Purpose | Used in Phase 3 |
|---------|---------|---------|-----------------|
| pizzip | already installed | OOXML ZIP manipulation | cloneLocadorRow — same pattern as Phase 2 |
| motion/react | already installed | UI animations | Add/remove locador section animations |
| TypeScript | already installed | Types | New types for multi-locador state |

**Installation:** No new packages required.

---

## Architecture Patterns

### System Architecture Diagram

```
[ContratoWizard Step 2]
  locadores: LocadorEntry[]  (index 0..N-1, each has files: File[])
       |
       | FormData: personFiles_0[], personFiles_1[], ..., locadorCount="N"
       v
[POST /api/contracts/generate]
       |
       +--[model.type === "ac"]--+
       |                         |
       |   loadTemplateXml()     |
       |   xml = raw template    |
       |                         |
       |   for each locador i:   |
       |     processFiles(i)     |
       |     extractLabelPlaceholders(xml)  <-- re-extract each time OR extract once + re-ID
       |     callGemini(placeholders_i, filesText_i, fileImages_i, notes)
       |     values_i = { lph_loc0_0: "...", lph_loc0_1: "...", ... }
       |                         |
       |   cloneLocadorRow(xml, N)  --> xml with N rows in Table 0
       |   fillAllLocadorRows(xml, [values_0, values_1, ...])
       |   fillUnderscoredPlaceholders(xml, values_0, underscoredPh)
       |                         |
       +--[model.type === "adenda"]--+
       |                              |
       |   xml = xml.replace("el LOCADOR", "los LOCADORES")
       |              .replace("El LOCADOR", "Los LOCADORES")
       |   extractHighlightPlaceholders(xml)
       |   allFiles = concat(locador_0_files, locador_1_files, ...)
       |   callGemini(placeholders, allFilesText, allImages, notes)
       |   fillHighlightPlaceholders(xml, values)
       |   fillUnderscoredPlaceholders(xml, values)
       |
       v
   generateDocxBuffer(zip, modifiedXml)  --> binary response
```

### Recommended Project Structure

No new directories needed. New functions go in existing modules:

```
tma/src/
├── lib/contracts/
│   ├── extractPlaceholders.ts   -- add extractLocadorRowXml(xml): string
│   └── fillPlaceholders.ts      -- add cloneLocadorRow(xml, n, locadorValues[])
│                                   add fillLocadorRows(xml, allValues)
├── app/
│   ├── api/contracts/generate/
│   │   └── route.ts             -- extend POST handler for multi-locador
│   └── tma/contratos/
│       └── ContratoWizard.tsx   -- extend WizardState + renderStep2()
└── __tests__/contracts/
    ├── extractPlaceholders.test.ts  -- add row-cloning XML tests
    ├── fillPlaceholders.test.ts     -- add multi-locador fill tests
    ├── generateRoute.test.ts        -- add multi-locador route tests
    └── ContratoWizard.test.tsx      -- add add/remove locador UI tests
```

### Pattern 1: Row Cloning in OOXML (CONTR-11)

**What:** Clone the first `<w:tr>` in the first `<w:tbl>` of the AC template N-1 times. Each clone has unique IDs substituted for all `w14:paraId` and `w14:textId` attributes, and all `lph_` placeholder IDs in the clone are re-prefixed to `lph_locN_` (where N is the locador index, 1-based for clone index).

**When to use:** When `model.type === "ac"` and `locadores.length > 1`.

**Row identification strategy:** [VERIFIED: direct XML inspection]
- Use the **first `<w:tbl>`** in the document XML — this is the locador identification table in both AC PF and AC PJ.
- There is exactly **one `<w:tr>`** in that table — no ambiguity, no header row to skip.
- Locate `</w:tbl>` and insert N-1 clones just before the closing tag.

**Example — extractLocadorRowXml:**
```typescript
// Source: verified from AC PF.docx/AC PJ.docx XML inspection
export function extractLocadorRowXml(xml: string): { rowXml: string; tableStart: number; tableEnd: number } {
  const tableStart = xml.indexOf('<w:tbl>')
  if (tableStart === -1) throw new Error('No <w:tbl> found in template XML')
  const tableEnd = xml.indexOf('</w:tbl>', tableStart) + '</w:tbl>'.length
  const tableXml = xml.slice(tableStart, tableEnd)
  const trMatch = tableXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/)
  if (!trMatch) throw new Error('No <w:tr> found in first table')
  return { rowXml: trMatch[0], tableStart, tableEnd }
}
```

**Example — cloneLocadorRow (conceptual):**
```typescript
// Each clone gets:
// 1. All w14:paraId="XXXXXXXX" replaced with unique hex values
// 2. All w14:textId="XXXXXXXX" replaced with unique hex values  
// 3. All lph_N IDs in <w:t> or tracking attributes left alone
//    (IDs are inserted by fillLabelPlaceholders, not in original template)
// 4. rsid attributes can stay as-is — Word tolerates duplicate rsids

export function buildClonedRow(rowXml: string, locadorIndex: number, seed: number): string {
  let clone = rowXml
  // Replace paraId and textId with unique deterministic values
  let paraCounter = seed
  clone = clone.replace(/w14:paraId="[^"]+"/g, () => `w14:paraId="${(paraCounter++).toString(16).toUpperCase().padStart(8, '0')}"`)
  clone = clone.replace(/w14:textId="[^"]+"/g, () => `w14:textId="${(paraCounter++).toString(16).toUpperCase().padStart(8, '0')}"`)
  return clone
}
```

**ID prefix scheme for multi-locador (D-06):**

The original row's `extractLabelPlaceholders` call produces `lph_0`, `lph_1`, ..., `lph_7` (AC PF) or `lph_0`..`lph_10` (AC PJ). For cloned rows, we run `extractLabelPlaceholders` again on the already-cloned XML and need each locador's IDs to be isolated. Recommended approach:

- Run `extractLabelPlaceholders` once per row position after cloning
- OR: run it once on the original XML, then for each locador i > 0 rebuild the ID set by adding a locador prefix

Simpler approach (no extra extraction): after `cloneLocadorRow` builds the new XML with N rows, run a **single** `extractLabelPlaceholders` on the resulting XML. Word labels are repeated ("Nombre y Apellido:") in each row, so the sequential `lph_N` counter will assign `lph_0..7` to row 0, `lph_8..15` to row 1 (AC PF), etc. The Gemini call for locador i gets only the IDs in its row's range. The fill step uses the combined values map.

**Better approach:** Pre-extract from original XML, note the count (8 for AC PF, 11 for AC PJ). For locador i, map `lph_K` → `lph_(i * fieldCount + K)` when sending to Gemini and assembling the combined values map.

### Pattern 2: Singular→Plural Substitution (CONTR-12 / D-07)

**What:** Before extracting placeholders from an Adenda template, replace nominative "el LOCADOR" and "El LOCADOR" with plural forms.

**When to use:** When `model.type === "adenda"` and `locadores.length > 1`.

**Example:**
```typescript
// Source: verified from D-07 (CONTEXT.md) and XML pattern analysis
function pluralizeLocadorRefs(xml: string): string {
  return xml
    .replace(/El LOCADOR/g, "Los LOCADORES")
    .replace(/el LOCADOR/g, "los LOCADORES")
}
// Applied in route.ts BEFORE extractHighlightPlaceholders(xml)
// Regex is safe: "del LOCADOR" does NOT start with "el " (preceded by 'd')
// "al LOCADOR" does NOT start with "el " — both are left unchanged per D-07
```

Note: The regex `replace(/el LOCADOR/g, ...)` will NOT match `del LOCADOR` or `al LOCADOR` because those strings contain "el LOCADOR" as a substring but ARE preceded by "d" or "a". JavaScript `String.replace` with a simple pattern replaces the literal string match — it replaces `"el LOCADOR"` wherever it appears as those exact characters. Since `"del LOCADOR"` contains `"el LOCADOR"` as a substring at position 1, the regex WOULD match the inner `"el LOCADOR"` part. [ASSUMED]

**Safer pattern to avoid false matches:**
```typescript
xml.replace(/\bel LOCADOR\b/g, "los LOCADORES")
   .replace(/\bEl LOCADOR\b/g, "Los LOCADORES")
// \b word boundary prevents matching "del LOCADOR"
```

### Pattern 3: Multi-Locador FormData Schema

**What:** The wizard sends N sets of files as separate FormData keys indexed by locador position.

**Proposed schema:**
```
FormData fields:
  modelId           = "ac-pf"
  notes             = "..."
  locadorCount      = "2"          (number of locadores as string)
  siteFiles         = [File, ...]  (Adenda only, unchanged)
  personFiles_0     = [File, ...]  (locador 0 — always present)
  personFiles_1     = [File, ...]  (locador 1 — if 2+ locadores)
  personFiles_N     = [File, ...]  (locador N)
```

**Wizard sends:**
```typescript
fd.append("locadorCount", String(state.locadores.length))
state.locadores.forEach((loc, i) => {
  loc.files.forEach(f => fd.append(`personFiles_${i}`, f))
})
```

**Route parses:**
```typescript
const locadorCount = parseInt(formData.get("locadorCount") as string ?? "1", 10)
const locadorFiles: File[][] = []
for (let i = 0; i < locadorCount; i++) {
  locadorFiles.push(formData.getAll(`personFiles_${i}`) as File[])
}
```

**DoS protection:** The existing 20-file cap should be applied to TOTAL files across all locadores (sum of all `personFiles_N` arrays + siteFiles).

### Pattern 4: WizardState Extension

**What:** Replace the single `personFiles: File[]` with `locadores: LocadorEntry[]`.

```typescript
// New type
interface LocadorEntry {
  id: string    // local unique key for React list rendering (e.g. crypto.randomUUID())
  files: File[]
}

// Updated WizardState
interface WizardState {
  step: WizardStep
  model: ContractModel | null
  siteFiles: File[]          // unchanged — Adenda only
  locadores: LocadorEntry[]  // replaces personFiles: File[]
  notes: string
  result: GenerationResult | null
  error: string | null
}

// initialState: locadores starts with one empty entry
const initialState: WizardState = {
  ...
  locadores: [{ id: crypto.randomUUID(), files: [] }],
  ...
}
```

**New actions:**
```typescript
type WizardAction =
  | ...existing...
  | { type: "ADD_LOCADOR" }
  | { type: "REMOVE_LOCADOR"; id: string }
  | { type: "SET_LOCADOR_FILES"; id: string; files: File[] }
```

**Validation:** Step 2 "Generar contrato" is enabled when every locador has at least 1 file:
```typescript
const allLocadoresFilled = state.locadores.every(l => l.files.length > 0)
const step2RequiredFulfilled = isAdenda
  ? state.siteFiles.length > 0 && allLocadoresFilled
  : allLocadoresFilled
```

### Pattern 5: Processing Messages for AC Multi-Locador

Per D-04 (Context.md Specifics), the step 3 messages should reflect multi-locador progress:

```
"Analizando documentación del Locador 1..."
"Completando datos del Locador 1..."
"Analizando documentación del Locador 2..."
"Completando datos del Locador 2..."
```

This requires the `PROCESSING_MESSAGES` array to be dynamically generated from `state.locadores.length` when `model.type === "ac"` and `locadores.length > 1`. For single locador and Adenda, the existing messages remain unchanged.

### Anti-Patterns to Avoid

- **Cloning rows without updating paraId:** Word's XML schema requires `w14:paraId` to be unique per paragraph in the document. Duplicate paraIds cause Word to silently repair the document on open. Always replace them with new values. [ASSUMED — based on OOXML spec knowledge]
- **String-replacing `"el LOCADOR"` without word boundaries:** Could falsely match `"del LOCADOR"`. Use `\b` word boundaries or an anchored pattern.
- **Running `extractLabelPlaceholders` on the cloned XML without accounting for repeated labels:** All 8 fields in AC PF repeat in each cloned row with identical label text ("Nombre y Apellido:", etc.). The sequential ID counter in `extractLabelPlaceholders` handles this correctly — row 0 gets `lph_0..7`, row 1 gets `lph_8..15`. Just track the offset.
- **Sending all locadores' files to a single Gemini call for AC:** Gemini cannot reliably attribute fields to specific locadores when docs are mixed. Per D-04, AC uses N separate calls.
- **Mutating the `zip` object between Gemini calls:** `zip.file(...)` modifies in place. Don't write the modified XML to zip until all Gemini calls are done.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unique IDs for cloned paragraphs | Custom UUID generator | `crypto.randomUUID()` (Node.js built-in) or simple hex counter | Node.js 19+ has `crypto.randomUUID()` globally; or use a hex counter seeded from paragraph position |
| OOXML ZIP manipulation | Custom ZIP reader | `pizzip` (already installed) | Same pattern as Phase 2; no new library needed |
| Collapsible locador sections | Custom accordion | `motion/react AnimatePresence` + local `open` state | Already available; matches existing wizard animation pattern |

**Key insight:** Phase 3 adds no new external dependencies — all needed tools exist in the codebase.

---

## Route.ts Changes (POST Handler)

### What changes:

1. **File collection** — Replace `formData.getAll("personFiles")` with a loop over `personFiles_0`, `personFiles_1`, etc. using `locadorCount` from FormData.

2. **DoS cap** — Apply the 20-file cap to total file count across all locadores + site files.

3. **AC multi-locador branch** — After loading template XML:
   a. For each locador i: process its files → `extractedTexts_i`, `imageParts_i`
   b. Extract label placeholders from original XML once → note `fieldCount` (8 for PF, 11 for PJ)
   c. Clone the locador row: `xml = cloneLocadorRow(xml, N)` (inserts N-1 copies)
   d. For each locador i: call Gemini with `lph_(i*fieldCount)..lph_(i*fieldCount + fieldCount-1)` as the placeholder list, remapped to `lph_0..lph_{fieldCount-1}` for Gemini (Gemini doesn't need the absolute IDs)
   e. Assemble `geminiValues`: `{ lph_(i*fieldCount+k): value_k }` for each locador i
   f. Fill using the extended label placeholder list from the cloned XML
   g. Fill underscored placeholders using locador 0's data (or all concatenated)

4. **Adenda multi-locador branch** — Before `extractHighlightPlaceholders`:
   a. `if (locadores.length > 1) xml = pluralizeLocadorRefs(xml)`
   b. Concatenate all locadores' files into one combined list
   c. Single Gemini call — unchanged from Phase 2 except for combined file list

5. **`X-Fields-Completed` header** — Count across all locadores' values.

### Simplified AC multi-locador orchestration (Claude's Discretion: Promise.all vs sequential):

Recommendation: **Promise.all** (parallel) to minimize latency within the 60s timeout. Each Gemini call is ~5-15s; sequential for 3 locadores could hit the 45s mark. Parallel calls complete in the time of the slowest single call. [ASSUMED — based on Gemini API behavior]

---

## ContratoWizard.tsx Changes

### Summary of changes to `renderStep2`:

1. Replace `state.personFiles` / `SET_PERSON_FILES` with `state.locadores` / `ADD_LOCADOR` / `REMOVE_LOCADOR` / `SET_LOCADOR_FILES`.

2. Add "Locadores" section header with "+ Agregar locador" button (Driva Dev CTA style: `#EA580C`).

3. Render each `locador` in `state.locadores` as a collapsible section:
   - Header: "Locador 1", "Locador 2", etc.
   - Body: `<FileUploadZone>` for that locador's files
   - "−" remove button (hidden on the first locador)
   - `motion/react` `AnimatePresence` for mount/unmount animation

4. `handleGenerate` builds FormData with `personFiles_0`, `personFiles_1`, etc. and `locadorCount`.

5. Update `step2RequiredFulfilled` to check all locadores.

6. Update `PROCESSING_MESSAGES` to be dynamic when AC + N > 1 locadores.

### Collapsible section recommendation (Claude's Discretion):

Use a **simple `open` boolean per locador** (stored in a parallel array or in the `LocadorEntry` type). Use `motion/react AnimatePresence` + `motion.div` with `initial={{ height: 0, opacity: 0 }}` and `animate={{ height: "auto", opacity: 1 }}` for the collapse animation. This matches the existing motion patterns in the wizard.

---

## Common Pitfalls

### Pitfall 1: Duplicate `w14:paraId` in Cloned Rows
**What goes wrong:** Word opens the document and silently "repairs" it, stripping content or reordering paragraphs.
**Why it happens:** OOXML requires paraId to be unique per document. Cloning a row copies all attributes verbatim including paraId.
**How to avoid:** Replace every `w14:paraId` and `w14:textId` in cloned rows with new unique hex values (sequential counter or random). Original row is untouched.
**Warning signs:** Word shows "repaired" dialog on open; fields from cloned row appear in wrong position.

### Pitfall 2: `extractLabelPlaceholders` ID Collision Between Cloned Rows
**What goes wrong:** Locador 1 gets `lph_0..7`, locador 2 also gets `lph_0..7` (same XML labels repeat). Fill step overwrites locador 1 values with locador 2 values.
**Why it happens:** `extractLabelPlaceholders` uses a sequential counter reset per call. If called once on the full cloned XML, the IDs are sequential and unique. But the Gemini prompts need to map correctly to each locador's row.
**How to avoid:** Extract once on original XML → get `fieldCount`. For cloned XML (N rows), extract gives `lph_0..lph_(N*fieldCount-1)`. For locador i, the Gemini call covers `lph_(i*fieldCount)..lph_(i*fieldCount+fieldCount-1)`.
**Warning signs:** Locador 2's data appears in Locador 1's row in the output document.

### Pitfall 3: Word Boundary in Singular→Plural Substitution
**What goes wrong:** `"del LOCADOR"` becomes `"dlos LOCADORES"` because `replace(/el LOCADOR/g, ...)` matches the `"el "` inside `"del "`.
**Why it happens:** JavaScript `.replace()` with a plain string or non-anchored regex matches substrings.
**How to avoid:** Use word-boundary regex: `replace(/\bel LOCADOR\b/g, "los LOCADORES")`.
**Warning signs:** Test for "del LOCADOR" and "al LOCADOR" not being modified in the output XML.

### Pitfall 4: 60s Timeout with Many Parallel Gemini Calls
**What goes wrong:** With 3+ locadores and parallel Gemini calls, total latency exceeds the 60s maxDuration.
**Why it happens:** Promise.all fires all calls simultaneously; Gemini API rate limits may throttle or error. [ASSUMED]
**How to avoid:** Implement sequential fallback: if `locadores.length > 2` or an environment flag indicates slow Gemini, use sequential calls. Alternatively, keep Promise.all but add per-call timeout of 45s to fail fast.
**Warning signs:** Vercel returns 504 (timeout) for 3+ locador contracts.

### Pitfall 5: `zip` Object Mutation Before All Gemini Calls Complete
**What goes wrong:** The `zip` object is modified by `zip.file("word/document.xml", modifiedXml)` before all Gemini calls finish, causing race conditions if calls are parallel.
**Why it happens:** `generateDocxBuffer` calls `zip.file(...)` which mutates the PizZip instance.
**How to avoid:** Do all XML string manipulation first (cloning + filling), THEN call `generateDocxBuffer` once at the end. Never write to `zip` mid-processing.
**Warning signs:** Intermittent output corruption with parallel calls.

---

## Code Examples

### extractLocadorRowXml
```typescript
// Source: verified from AC PF.docx XML inspection (2026-06-14)
// The locador identification row is always in the first <w:tbl>
export function extractLocadorRowXml(xml: string): string {
  const tblStart = xml.indexOf('<w:tbl>')
  if (tblStart === -1) throw new Error('Template has no table (not an AC template?)')
  const tblEnd = xml.indexOf('</w:tbl>', tblStart)
  const tblXml = xml.slice(tblStart, tblEnd)
  const trMatch = tblXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/)
  if (!trMatch) throw new Error('No <w:tr> found in locador identification table')
  return trMatch[0]
}
```

### cloneLocadorRow (adds N-1 copies after the original row)
```typescript
// Source: architectural pattern for OOXML row insertion
export function cloneLocadorRow(xml: string, locadorCount: number): string {
  if (locadorCount <= 1) return xml

  const tblStart = xml.indexOf('<w:tbl>')
  const tblEnd = xml.indexOf('</w:tbl>', tblStart)

  const tblXml = xml.slice(tblStart, tblEnd)
  const originalRow = tblXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/)![0]

  // Build N-1 clones with unique paraId/textId
  let clones = ''
  let paraIdSeed = 0xA0000000  // Start above typical document IDs
  for (let i = 1; i < locadorCount; i++) {
    let clone = originalRow
    clone = clone.replace(/w14:paraId="[^"]+"/g, () =>
      `w14:paraId="${(paraIdSeed++).toString(16).toUpperCase().padStart(8, '0')}"`)
    clone = clone.replace(/w14:textId="[^"]+"/g, () =>
      `w14:textId="${(paraIdSeed++).toString(16).toUpperCase().padStart(8, '0')}"`)
    clones += clone
  }

  // Insert clones just before </w:tbl>
  return xml.slice(0, tblEnd) + clones + xml.slice(tblEnd)
}
```

### pluralizeLocadorRefs
```typescript
// Source: D-07 from CONTEXT.md, word-boundary safety added
export function pluralizeLocadorRefs(xml: string): string {
  return xml
    .replace(/\bEl LOCADOR\b/g, 'Los LOCADORES')
    .replace(/\bel LOCADOR\b/g, 'los LOCADORES')
}
```

### route.ts multi-locador file collection
```typescript
// Source: architectural pattern for FormData multi-field collection
const rawLocadorCount = formData.get("locadorCount") as string | null
const locadorCount = Math.max(1, parseInt(rawLocadorCount ?? "1", 10))

// Collect files per locador
const locadorFileSets: File[][] = []
for (let i = 0; i < locadorCount; i++) {
  locadorFileSets.push(formData.getAll(`personFiles_${i}`) as File[])
}

// Total file DoS cap (existing: 20 total)
const totalFiles = siteFiles.length + locadorFileSets.reduce((sum, f) => sum + f.length, 0)
if (totalFiles > 20) {
  return NextResponse.json({ error: "Demasiados archivos adjuntos" }, { status: 400 })
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Single `personFiles: File[]` in wizard | `locadores: LocadorEntry[]` array | Phase 3 change |
| Single Gemini call for all docs (Phase 2) | N calls for AC, 1 call for Adenda (Phase 3) | Per CONTR-11/12 |
| Template XML unchanged (Phase 2) | Row cloning for AC, regex substitution for Adenda | Phase 3 additions |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Word tolerates duplicate `w:rsidR` and `w:rsidTr` in cloned rows (only `w14:paraId` is strictly required to be unique) | Pitfall 1, cloneLocadorRow example | Low — rsid collisions cause cosmetic track-changes artifacts, not data loss |
| A2 | `\bel LOCADOR\b` word-boundary regex correctly prevents matching inside "del LOCADOR" | Pitfall 3, pluralizeLocadorRefs | Medium — verify with a test case containing "del LOCADOR" in fixture XML |
| A3 | Promise.all for N Gemini calls is safe within 60s for 2-3 locadores | Route.ts changes, Pitfall 4 | Medium — if Gemini latency spikes, 3 parallel calls could timeout; consider sequential fallback |
| A4 | `w14:paraId` uniqueness is enforced at OOXML schema level and Word auto-repairs duplicates | Pitfall 1 | Low — verified behavior of Word XML parser; repairs are silent not fatal |

---

## Open Questions

1. **Adenda: does "el LOCADOR" actually appear in the 8 Adenda template XMLs?**
   - What we know: The Phase 2 pipeline uses yellow-highlighted placeholders for Adenda; the literal string "el LOCADOR" has not been verified in the actual Adenda template XMLs.
   - What's unclear: If the templates use `<w:t>el LOCADOR</w:t>` vs a highlighted field, the substitution must happen on the right element.
   - Recommendation: During Wave 0 (or immediately before implementation), run the same XML inspection on one Adenda template. If "LOCADOR" only appears inside highlighted runs (which Gemini fills), the substitution is still needed for the non-highlighted surrounding prose. If it doesn't appear at all in the prose, CONTR-12 is a no-op for those templates.

2. **AC PJ: should Table 1 (representative data) also be cloned for multi-locador?**
   - What we know: Table 1 in AC PJ ("Información de Contacto del Representante/Firmante del Locador") has 1 row with 5 fields. Each company locador could have a different representative.
   - What's unclear: Whether CONTR-11 requires cloning the representative row too, or only the company identification row (Table 0).
   - Recommendation: CONTR-11 says "fila de identificación de locadores" — this most naturally maps to Table 0 only. Confirm with the user before implementing Table 1 cloning. The current research assumes **only Table 0 is cloned**.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 3 adds no external dependencies. All required tools (Node.js, PizZip, motion/react, Vitest) are already verified from Phase 2 execution.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `tma/vitest.config.ts` |
| Quick run command | `npm test -- --run` (from `tma/`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CONTR-11 | `cloneLocadorRow` inserts N-1 `<w:tr>` after original | unit | `npm test -- --run contracts/fillPlaceholders` | ✅ (extend existing) |
| CONTR-11 | Cloned rows have unique paraIds | unit | same | ✅ |
| CONTR-11 | `extractLabelPlaceholders` on cloned XML returns `fieldCount * N` entries | unit | `npm test -- --run contracts/extractPlaceholders` | ✅ (extend existing) |
| CONTR-11 | Route handles `locadorCount=2` and makes 2 Gemini calls | unit | `npm test -- --run contracts/generateRoute` | ✅ (extend existing) |
| CONTR-12 | `pluralizeLocadorRefs` replaces "el LOCADOR" but NOT "del LOCADOR" | unit | `npm test -- --run contracts/fillPlaceholders` | ✅ (extend existing) |
| CONTR-12 | Route applies substitution before extraction when adenda + multi-locador | unit | `npm test -- --run contracts/generateRoute` | ✅ (extend existing) |
| UI | Step 2 shows "+ Agregar locador" button | component | `npm test -- --run contracts/ContratoWizard` | ✅ (extend existing) |
| UI | Add/remove locador sections in step 2 | component | same | ✅ (extend existing) |
| UI | Generar button disabled until all locadores have files | component | same | ✅ (extend existing) |

### Wave 0 Gaps

No new test files needed. All tests extend existing files. New fixture needed:

- [ ] `AC_PF_TABLE_XML` — minimal OOXML with one `<w:tbl>` containing one `<w:tr>` with 8 label paragraphs, for `cloneLocadorRow` and `fillLocadorRows` unit tests. Add to `src/__tests__/fixtures/createFixtures.ts`.

---

## Security Domain

No new attack surface from Phase 3. The existing route security controls apply unchanged:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | `auth()` check at route start — unchanged |
| V5 Input Validation | yes | `locadorCount` parsed with `parseInt` + `Math.max(1, ...)` cap; `formData.getAll()` returns empty array for missing keys (safe) |
| V6 Cryptography | no | No new crypto operations |

**New input validation needed:**
- Cap `locadorCount` at a reasonable max (e.g., 10) to prevent DoS via very large N (too many Gemini calls).
- The existing 20-file total cap already limits payload size regardless of locador count.

---

## Sources

### Primary (HIGH confidence)
- Direct XML inspection of `tma/templates/AC PF.docx` (via PizZip in Node.js) — table structure, row fields, paraId attributes
- Direct XML inspection of `tma/templates/AC PJ.docx` — table count, row structure differences from PF
- `tma/src/lib/contracts/extractPlaceholders.ts` — existing extraction logic, ID scheme (`lph_N`)
- `tma/src/lib/contracts/fillPlaceholders.ts` — existing fill patterns, `_insertPos` strategy
- `tma/src/app/api/contracts/generate/route.ts` — current POST handler structure, bifurcation point
- `tma/src/app/tma/contratos/ContratoWizard.tsx` — current wizard state, step 2 render
- `.planning/phases/03-contratos-multi-locador/03-CONTEXT.md` — locked decisions D-01 through D-09

### Secondary (MEDIUM confidence)
- OOXML spec behavior for `w14:paraId` uniqueness — based on established Word XML tooling knowledge; not re-verified against the spec document in this session

---

## Metadata

**Confidence breakdown:**
- AC PF/PJ template structure: HIGH — verified by direct file inspection
- Row cloning strategy: HIGH — derived directly from verified XML structure
- FormData schema: HIGH — derived from existing route.ts patterns
- pluralizeLocadorRefs word-boundary safety: MEDIUM — verify with test fixture
- Gemini parallelism timing: MEDIUM — assumed, should be validated in execution

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (30 days — templates don't change without manual update)
