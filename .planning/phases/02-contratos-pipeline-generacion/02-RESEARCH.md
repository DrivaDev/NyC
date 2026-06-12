# Phase 2: Contratos — Pipeline de generación - Research

**Researched:** 2026-06-12
**Domain:** Gemini API + pizzip XML + Next.js App Router file handling + 4-step wizard
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Grid de cards agrupadas por tipo en 3 grupos: "Anexo AC" (AC PF, AC PJ) | "Adenda Carta Oferta" (PF PESOS, PF USD, PJ PESOS, PJ USD) | "Adenda Contrato Tradicional" (PF PESOS, PF USD, PJ PESOS, PJ USD). Total: 10 modelos.
- **D-02:** Nombres de archivo de los 10 templates — colocados en `/public/templates/` o `/templates/` manualmente. Nombres exactos documentados en CONTEXT.md D-02.
- **D-03:** Dos tipos de formulario: Anexo AC (solo personas + notas) | Adenda (sitio + personas + notas).
- **D-04:** "Información del sitio" acepta tipos mixtos en un solo campo: jpg/jpeg/png + pdf/docx.
- **D-05:** Durante procesamiento: secuencia de 3 mensajes animados con `motion/react` (sin barra de progreso real).
- **D-06:** Al terminar: resumen "Se completaron X/N campos. Y quedaron vacíos por falta de datos." + botón Descargar .docx.
- **D-07:** Si Gemini falla: mensaje de error + botón "Reintentar".
- **D-08:** Reintentar conserva archivos del formulario en estado React (no resubir).
- **D-09:** AC PF y AC PJ NO usan highlight amarillo — identifican campos por etiquetas en XML (estrategia diferente).
- **D-10:** Los 8 Adenda usan pipeline estándar de `<w:highlight w:val="yellow"/>`.

### Claude's Discretion
- Slugs/IDs internos para cada modelo de contrato (para mapear nombre → archivo template).
- Estructura exacta del prompt enviado a Gemini (mientras respete CONTR-08/09).
- Layout interno del wizard (si usar Server Components para el shell + Client para cada paso, o full client).

### Deferred Ideas (OUT OF SCOPE)
- Multi-locador (CONTR-11, CONTR-12) — Phase 3.
- Historial de contratos generados — v2 (CONTR-V2-01).
- Dark mode — descartado para esta app.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONTR-01 | Usuario puede seleccionar uno de los 10 modelos de contrato predefinidos | D-01 grid pattern, Section: Architecture Patterns (wizard Step 1) |
| CONTR-02 | Para modelos no-Anexo AC: formulario con sitio + personas + notas | D-03 form type selection, Section: Architecture Patterns (wizard Step 2) |
| CONTR-03 | Para Anexo AC (AC PF / AC PJ): formulario solo con personas + notas | D-03/D-09, Section: Architecture Patterns (wizard Step 2) |
| CONTR-04 | Sistema acepta archivos jpg/jpeg/png, docx y pdf en campos de documentación | D-04, Section: File Handling |
| CONTR-05 | Sistema extrae texto de docx vía mammoth, pdf vía pdf-parse, envía imágenes como inline base64 a Gemini Vision | Section: mammoth + pdf-parse, Section: Gemini API Integration |
| CONTR-06 | Sistema carga el .docx modelo desde /templates, descomprime con pizzip, parsea word/document.xml | Section: pizzip + XML Parsing |
| CONTR-07 | Sistema identifica todos los runs `<w:r>` con `<w:highlight w:val="yellow"/>` en su `<w:rPr>`, asigna IDs únicos, extrae contexto del párrafo | Section: pizzip + XML Parsing, Pattern 2 |
| CONTR-08 | Sistema envía a Gemini: placeholders + contexto + docs + notas; recibe JSON estricto `{ "placeholder_id": "texto" \| "" }` | Section: Gemini API Integration, Pattern: JSON mode |
| CONTR-09 | Gemini devuelve string vacío para campos sin información suficiente (nunca inventa) | Section: Gemini API Integration, prompt design |
| CONTR-10 | Sistema reemplaza `<w:t>` de cada run identificado con valor de Gemini, conservando el resaltado amarillo | Section: pizzip + XML Parsing, Pattern 3 |
| CONTR-13 | Usuario puede descargar el .docx generado con un botón | Section: Route Handler, binary response pattern |
| CONTR-14 | Route de generación tiene maxDuration: 60 en vercel.json | Already in vercel.json at `src/app/api/contracts/generate/route.ts` |
| CONTR-15 | Ningún archivo subido se persiste; todo se procesa en memoria y se descarta | Section: File Handling, memory-only pattern |
| UI-06 | /tma/contratos tiene flujo de 4 pasos (Selección → Documentación → Procesamiento → Descarga) | Section: 4-Step Wizard Pattern |
</phase_requirements>

---

## Summary

Phase 2 builds the complete contract generation pipeline: a 4-step wizard in the client that collects the template selection and uploaded documentation, posts everything to a single Route Handler, and returns a .docx binary for direct download. The Route Handler orchestrates three operations in sequence: (1) extract text from docx/pdf attachments via mammoth and pdf-parse, encode images as base64; (2) call Gemini with a structured JSON output schema to fill placeholder fields; (3) load the template .docx via pizzip, modify word/document.xml in memory, and stream back the nodebuffer.

The two main technical complexities are the XML manipulation strategy (two separate strategies: highlight-based for Adenda, label-based for AC PF/PJ) and keeping all uploaded file binary data alive in React state across wizard steps so retries do not require re-upload. Both complexities have well-established patterns — pizzip's synchronous API is the correct tool, and React's `useReducer` with a `Map<string, File>` covering the file objects is the right state shape.

**Primary recommendation:** Full-client wizard (single `"use client"` parent component with `useReducer`) calling a POST Route Handler at `src/app/api/contracts/generate/route.ts`. The Route Handler uses `request.formData()` for multi-file upload, processes everything in memory, and returns a binary `Response` with `Content-Disposition: attachment`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Model selection UI (Step 1) | Browser/Client | — | Pure UI state; no server data needed |
| File upload form (Step 2) | Browser/Client | — | File objects live only in browser memory; React state holds them |
| Animated processing messages (Step 3) | Browser/Client | — | motion/react animations driven by fetch() Promise state |
| Template loading (.docx from /public) | API/Backend (Route Handler) | — | Binary read + pizzip on server; /public accessible via fs in Node.js runtime |
| mammoth / pdf-parse extraction | API/Backend (Route Handler) | — | Node.js native Buffers; cannot run in browser |
| Gemini API call | API/Backend (Route Handler) | — | API key must not be exposed to client |
| pizzip XML modification | API/Backend (Route Handler) | — | Node.js Buffer + synchronous CPU work |
| .docx binary response | API/Backend (Route Handler) | — | `Content-Disposition: attachment` header returned from Route Handler |
| Auth session check (/tma/contratos page) | Frontend Server (SSR) | — | Same `auth()` + `redirect()` pattern as /tma page |

---

## Standard Stack

### Core (not yet installed in tma project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @google/generative-ai | 0.24.1 | Gemini API calls — generateContent with JSON mode and inlineData | Current stable SDK; @google/genai (newer) not yet widely adopted |
| pizzip | 3.2.0 | Synchronous ZIP/docx reading and generation | Fork of JSZip v2 with sync API; required by the docx-in-memory workflow |
| mammoth | 1.12.0 | Extract raw text from .docx files as Buffer | Simple Buffer API, no filesystem required |
| pdf-parse | 2.4.5 | Extract raw text from .pdf Buffers | Accepts Buffer directly, returns `text` string |

### Already Installed
| Library | Version | Purpose |
|---------|---------|---------|
| motion | ^12.40.0 | Animated processing messages (D-05) |
| react-hook-form | ^7.78.0 | Form fields in Step 2 |
| zod | ^4.4.3 | Client + server validation of form inputs |
| next | 16.2.9 | App Router, Route Handlers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @google/generative-ai | @google/genai (new SDK) | Newer SDK has different API shape; training data for 0.24.1 more complete; CLAUDE.md specifies gemini-2.0-flash which both support |
| pdf-parse | pdfjs-dist | pdfjs-dist is heavier and async-first; pdf-parse simpler for text extraction only |
| useReducer in client | Zustand store | useReducer is sufficient for single-page wizard; no cross-route state needed |

**Installation (packages to add):**
```bash
cd tma && npm install @google/generative-ai pizzip mammoth pdf-parse
npm install --save-dev @types/mammoth @types/pdf-parse
```

**Version verification:** [VERIFIED: npm registry — 2026-06-12]
- pizzip: 3.2.0
- @google/generative-ai: 0.24.1
- mammoth: 1.12.0
- pdf-parse: 2.4.5

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Client Component: ContratoWizard)
│
├── Step 1: Model selection
│     └── user picks 1 of 10 → sets wizardState.model
│
├── Step 2: File upload form
│     └── user attaches files → File objects stored in wizardState.files (React state)
│
├── Step 3: Processing (triggers fetch to Route Handler)
│     ├── Builds FormData from File objects
│     ├── POST /api/contracts/generate
│     └── Motion animated messages while awaiting response
│
└── Step 4: Download / Error
      ├── Success: receives { docxBlob, completedCount, totalCount }
      │     └── client creates object URL → <a download> click
      └── Error: shows D-07 message + Reintentar button
            └── Reintentar re-fires fetch (files still in React state)

Route Handler: POST /api/contracts/generate
│
├── 1. Parse formData() — extract modelId + files
├── 2. Load template: fs.readFileSync(`public/templates/${filename}`)
├── 3. Parse template XML: pizzip → document.xml string
├── 4. Extract placeholders (strategy depends on model type):
│     ├── Adenda (8 models): find <w:highlight w:val="yellow"/> runs → assign IDs
│     └── AC PF/PJ (2 models): find label elements (e.g. "Nombre:", "CUIT:") in XML
├── 5. Process uploaded docs:
│     ├── .docx files → mammoth.extractRawText({ buffer })
│     ├── .pdf files → pdf(buffer) [pdf-parse]
│     └── images → Buffer.from(bytes).toString('base64') + mimeType
├── 6. Call Gemini:
│     ├── model.generateContent([textPrompt, ...imageParts])
│     ├── generationConfig: { responseMimeType: "application/json" }
│     └── Parse JSON response → Map<placeholder_id, value>
├── 7. Fill XML:
│     ├── Adenda: replace <w:t> content in highlighted runs
│     └── AC PF/PJ: replace text nodes after label markers
├── 8. Generate output:
│     └── zip.generate({ type: "nodebuffer" })
└── 9. Return Response:
      ├── body: nodebuffer
      ├── Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
      ├── Content-Disposition: attachment; filename="contrato.docx"
      └── X-Fields-Completed: "8/12" (custom header for Step 4 summary)
```

### Recommended Project Structure
```
tma/src/
├── app/
│   ├── api/
│   │   └── contracts/
│   │       └── generate/
│   │           └── route.ts          # POST Route Handler (already planned in vercel.json)
│   └── tma/
│       └── contratos/
│           ├── page.tsx              # Server Component: auth() check + render wizard shell
│           └── ContratoWizard.tsx    # "use client" — full wizard with useReducer
├── lib/
│   ├── contracts/
│   │   ├── models.ts                 # 10 model definitions (id, filename, type, label)
│   │   ├── extractPlaceholders.ts    # pizzip XML → placeholder list
│   │   ├── fillPlaceholders.ts       # placeholder map → modified XML
│   │   ├── geminiClient.ts           # Gemini call wrapper
│   │   └── extractDocText.ts         # mammoth + pdf-parse helpers
│   └── utils.ts                      # existing
└── __tests__/
    └── contracts/
        ├── extractPlaceholders.test.ts
        ├── fillPlaceholders.test.ts
        └── geminiClient.test.ts
```

### Pattern 1: Gemini API Call with JSON Mode and Inline Images

```typescript
// Source: https://github.com/google-gemini/deprecated-generative-ai-js (verified via Context7 + npm 0.24.1)
// lib/contracts/geminiClient.ts
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function callGemini(
  placeholders: Array<{ id: string; context: string }>,
  extractedTexts: string[],
  imageParts: Array<{ inlineData: { mimeType: string; data: string } }>,
  notes: string
): Promise<Record<string, string>> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  })

  const prompt = buildPrompt(placeholders, extractedTexts, notes)

  const result = await model.generateContent([
    { text: prompt },
    ...imageParts,  // inline base64 images
  ])

  const raw = result.response.text()
  return JSON.parse(raw) as Record<string, string>
}
```

**Key details:**
- `responseMimeType: "application/json"` enables JSON mode — Gemini will always return valid JSON [VERIFIED: Context7 /google-gemini/deprecated-generative-ai-js]
- `responseSchema` is optional; for this use case a well-structured prompt is sufficient
- `inlineData.data` is a base64 string (no "data:image/..." prefix); `inlineData.mimeType` is `"image/jpeg"` or `"image/png"` [VERIFIED: Context7]

### Pattern 2: pizzip — Load Template, Extract Highlighted Runs (Adenda pipeline)

```typescript
// Source: https://github.com/open-xml-templating/pizzip (verified via npm 3.2.0 + WebFetch docs)
// lib/contracts/extractPlaceholders.ts
import PizZip from "pizzip"
import path from "path"
import fs from "fs"

export function loadTemplateXml(filename: string): { zip: PizZip; xml: string } {
  const templatePath = path.join(process.cwd(), "public", "templates", filename)
  const content = fs.readFileSync(templatePath)  // returns Buffer
  const zip = new PizZip(content)
  const xml = zip.file("word/document.xml")!.asText()
  return { zip, xml }
}

export interface Placeholder {
  id: string          // e.g. "ph_0", "ph_1"
  context: string     // surrounding paragraph text for Gemini context
}

// For Adenda: find <w:r> elements with <w:highlight w:val="yellow"/> in <w:rPr>
// XML structure (OOXML spec):
//   <w:r>
//     <w:rPr><w:highlight w:val="yellow"/></w:rPr>
//     <w:t>PLACEHOLDER TEXT</w:t>
//   </w:r>
export function extractHighlightPlaceholders(xml: string): Placeholder[] {
  // Use regex on XML string — safe here because we ONLY target the specific
  // structure of <w:rPr>...<w:highlight w:val="yellow"/>...</w:rPr>
  // followed by <w:t>
  const runPattern = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g
  const placeholders: Placeholder[] = []
  let match: RegExpExecArray | null
  let index = 0

  while ((match = runPattern.exec(xml)) !== null) {
    const runContent = match[1]
    if (runContent.includes('w:val="yellow"') || runContent.includes("w:val='yellow'")) {
      placeholders.push({
        id: `ph_${index++}`,
        context: extractSurroundingParagraph(xml, match.index),
      })
    }
  }
  return placeholders
}

function extractSurroundingParagraph(xml: string, runPosition: number): string {
  // Find the <w:p> containing this position
  const before = xml.lastIndexOf("<w:p>", runPosition)
  const after = xml.indexOf("</w:p>", runPosition)
  if (before === -1 || after === -1) return ""
  const paragraph = xml.slice(before, after + 6)
  // Strip XML tags to get plain text context
  return paragraph.replace(/<[^>]+>/g, "").trim()
}
```

### Pattern 3: pizzip — Fill Placeholders and Generate Buffer

```typescript
// lib/contracts/fillPlaceholders.ts
export function fillHighlightPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: Placeholder[]
): string {
  let result = xml
  // Replace <w:t> content in each highlighted run IN REVERSE ORDER
  // (to keep string indices valid when working forward from a copy)
  // Strategy: rebuild by tracking all highlighted run positions
  // then do string replacements from last to first (avoids index drift)

  const runPattern = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g
  const positions: Array<{ start: number; end: number; phId: string }> = []
  let match: RegExpExecArray | null
  let phIndex = 0

  while ((match = runPattern.exec(xml)) !== null) {
    const runContent = match[1]
    if (runContent.includes('w:val="yellow"') || runContent.includes("w:val='yellow'")) {
      const phId = `ph_${phIndex++}`
      positions.push({ start: match.index, end: match.index + match[0].length, phId })
    }
  }

  // Replace from end to start to preserve indices
  for (let i = positions.length - 1; i >= 0; i--) {
    const { start, end, phId } = positions[i]
    const value = values[phId] ?? ""
    const originalRun = xml.slice(start, end)
    // Replace <w:t>...</w:t> content, keep everything else (preserves highlight)
    const filled = originalRun.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/, `<w:t>${escapeXml(value)}</w:t>`)
    result = result.slice(0, start) + filled + result.slice(end)
  }
  return result
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function generateDocxBuffer(zip: PizZip, modifiedXml: string): Buffer {
  zip.file("word/document.xml", modifiedXml)
  return zip.generate({ type: "nodebuffer" }) as Buffer
}
```

### Pattern 4: Route Handler — multipart/form-data + binary response

```typescript
// Source: https://nextjs.org/docs/app/getting-started/route-handlers (Next.js 16.2.9)
// src/app/api/contracts/generate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export const maxDuration = 60  // already in vercel.json; also set here for clarity

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const modelId = formData.get("modelId") as string
  const notes = (formData.get("notes") as string) ?? ""

  // Collect all uploaded files
  const siteFiles = formData.getAll("siteFiles") as File[]
  const personFiles = formData.getAll("personFiles") as File[]
  const allFiles = [...siteFiles, ...personFiles]

  // Process files in memory
  const extractedTexts: string[] = []
  const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = []

  for (const file of allFiles) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    if (file.type === "application/pdf") {
      const { text } = await pdfParse(buffer)
      extractedTexts.push(text)
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const { value } = await mammoth.extractRawText({ buffer })
      extractedTexts.push(value)
    } else if (file.type.startsWith("image/")) {
      imageParts.push({ inlineData: { mimeType: file.type, data: buffer.toString("base64") } })
    }
  }

  // Load template, extract placeholders, call Gemini, fill, generate
  // ... (see other patterns)

  const docxBuffer = generateDocxBuffer(zip, modifiedXml)

  return new Response(docxBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="contrato.docx"`,
      "X-Fields-Completed": `${completedCount}/${totalCount}`,
    },
  })
}
```

### Pattern 5: 4-Step Wizard — useReducer + file persistence

```typescript
// src/app/tma/contratos/ContratoWizard.tsx
"use client"
import { useReducer } from "react"
import { motion, AnimatePresence } from "motion/react"

type WizardStep = 1 | 2 | 3 | 4

interface WizardState {
  step: WizardStep
  model: ContractModel | null
  siteFiles: File[]           // File objects survive re-renders
  personFiles: File[]         // preserved on Reintentar (D-08)
  notes: string
  result: GenerationResult | null
  error: string | null
}

type WizardAction =
  | { type: "SELECT_MODEL"; model: ContractModel }
  | { type: "SET_FILES"; siteFiles: File[]; personFiles: File[]; notes: string }
  | { type: "START_PROCESSING" }
  | { type: "SET_RESULT"; result: GenerationResult }
  | { type: "SET_ERROR"; error: string }
  | { type: "RETRY" }   // goes back to step 3, keeps files (D-08)
  | { type: "RESET" }

// File objects are stored directly in React state — they are plain JS objects
// and survive re-renders as long as the component stays mounted.
// This satisfies D-08: reintentar does not require re-upload.
```

### Pattern 6: Client-side .docx download from binary Response

```typescript
// In the wizard, after fetch() returns binary:
async function handleGenerate() {
  dispatch({ type: "START_PROCESSING" })
  try {
    const fd = new FormData()
    fd.append("modelId", state.model!.id)
    fd.append("notes", state.notes)
    state.siteFiles.forEach(f => fd.append("siteFiles", f))
    state.personFiles.forEach(f => fd.append("personFiles", f))

    const res = await fetch("/api/contracts/generate", { method: "POST", body: fd })
    if (!res.ok) throw new Error(await res.text())

    const blob = await res.blob()
    const completed = res.headers.get("X-Fields-Completed") ?? "?/?";
    const [comp, total] = completed.split("/").map(Number)

    dispatch({ type: "SET_RESULT", result: { blob, completedCount: comp, totalCount: total } })
  } catch (err) {
    dispatch({ type: "SET_ERROR", error: "Hubo un error al procesar el contrato. Intentá de nuevo." })
  }
}

// Download trigger (Step 4):
function downloadDocx(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "contrato.docx"
  a.click()
  URL.revokeObjectURL(url)
}
```

### Pattern 7: AC PF / AC PJ Label-Based Field Strategy (D-09)

AC PF and AC PJ do not use yellow highlights. They use form-like label-value structures in the XML:
- Text runs containing labels like `"Nombre:"`, `"CUIT:"`, `"Domicilio:"` appear in separate `<w:r>` elements
- The value field immediately follows the label — often in the same `<w:p>` or the next

**Strategy:**
1. Extract all `<w:p>` paragraphs as plain text from the XML
2. Identify paragraphs that match known label patterns (regex: `/^(Nombre|CUIT|Domicilio|Nacionalidad|Estado civil):/i`)
3. Build a list of "label-based fields" with IDs, send to Gemini with the same JSON response format
4. Fill by finding the `<w:r>` element that comes immediately after the label run in the paragraph and replacing its `<w:t>` content

**Key difference from Adenda:** no highlight in rPr — identification relies on text content, not formatting. The replacement still targets `<w:t>` content in the following run.

### Anti-Patterns to Avoid

- **Using docxtemplater:** CLAUDE.md explicitly forbids this. The templates use highlights, not `{{placeholder}}` syntax.
- **Storing uploaded files to disk or Vercel Blob:** CONTR-15 requires in-memory only. Never call `fs.writeFile` with user data.
- **Calling Gemini from a Client Component:** The API key would be exposed in the bundle. Always proxy through the Route Handler.
- **Treating pizzip as async:** pizzip's API is synchronous (fork of JSZip v2). Use `.asText()` not `.async('string')`.
- **Direct string regex replacement without escaping:** Replacing XML content without `escapeXml()` will corrupt the document if values contain `<`, `>`, `&`.
- **Running pdf-parse in Edge Runtime:** pdf-parse uses Node.js APIs. The Route Handler must NOT have `export const runtime = "edge"`.
- **Not setting `export const dynamic = "force-dynamic"`:** Route Handlers that read form data are dynamic; Next.js may try to statically optimize POST routes in some configurations.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP parsing for .docx | Custom binary parser | pizzip | DOCX = ZIP; pizzip handles the binary format, CRC, compression |
| PDF text extraction | PDF binary parser | pdf-parse | PDF parsing is extremely complex; pdf-parse handles encoding, streams, fonts |
| DOCX text extraction | XML parser for .docx | mammoth.extractRawText | Handles complex docx structure: hyperlinks, tables, footnotes |
| Gemini JSON enforcement | Post-processing regex | `responseMimeType: "application/json"` | Gemini guarantees valid JSON; regex will break on edge cases |
| XML escaping | Manual string replace | `escapeXml()` utility | OWASP/XML spec edge cases; must handle all 5 XML reserved chars |
| Client-side blob download | Fetch API + iframe | `URL.createObjectURL` + `<a download>` | Cross-browser; works with binary blobs directly |

**Key insight:** The XML manipulation is genuinely low-level and must be hand-written (because we need highlight-aware replacement), but everything surrounding it (ZIP handling, PDF/DOCX text extraction, JSON enforcement) has proven libraries.

---

## Common Pitfalls

### Pitfall 1: XML Text Spanning Multiple `<w:r>` Runs
**What goes wrong:** A single highlighted placeholder may be split across multiple `<w:r>` elements by Word (e.g., spell-check, undo history, tracked changes). The regex finds only the first run, missing subsequent parts.
**Why it happens:** Word splits runs for internal reasons unrelated to formatting.
**How to avoid:** When extracting highlighted runs, check for consecutive highlighted runs within the same paragraph and merge them into a single placeholder. Replace the first run's `<w:t>` and delete subsequent runs in the group.
**Warning signs:** Placeholder count is lower than expected; some fields appear partially filled.

### Pitfall 2: pdf-parse Failing in Serverless / Edge Runtime
**What goes wrong:** `pdf-parse` imports `fs` and Node.js-specific modules; it crashes in Edge Runtime.
**Why it happens:** Vercel Edge Runtime does not support Node.js built-ins.
**How to avoid:** Do NOT add `export const runtime = "edge"` to the generate route. The route runs in Node.js runtime (default for Route Handlers). The `maxDuration: 60` in vercel.json works correctly in Node.js runtime.
**Warning signs:** `Module not found: Can't resolve 'fs'` build error.

### Pitfall 3: Gemini Rate Limits on Free Tier (429 errors)
**What goes wrong:** Free tier for gemini-2.0-flash enforces 15 RPM and 1,500 RPD. During testing, rapid retries will hit 429.
**Why it happens:** Google reduced free tier limits in late 2025. [VERIFIED: multiple sources, Dec 2025]
**How to avoid:** Implement exponential backoff on the server side before surfacing the error to the user. A single retry after 2 seconds handles most cases. Surface D-07 error only after the retry also fails.
**Warning signs:** HTTP 429 with `{ "error": { "code": 429, "status": "RESOURCE_EXHAUSTED" } }`.

### Pitfall 4: XML Corruption from Unescaped Values
**What goes wrong:** Gemini returns a value like `"Constructora <Norte> S.A."` — inserting this directly into `<w:t>` content produces malformed XML. pizzip generates the buffer, but Word cannot open it.
**Why it happens:** XML requires `<` and `&` to be escaped as `&lt;` and `&amp;` in text content.
**How to avoid:** Always pass Gemini values through `escapeXml()` before inserting into XML.
**Warning signs:** Word shows "We found a problem with the content..." dialog on open.

### Pitfall 5: File Objects Not Surviving Across Wizard Steps
**What goes wrong:** If the wizard uses route-based navigation (e.g., `/tma/contratos/step-1`, `/tma/contratos/step-2`), File objects from `<input type="file">` cannot be serialized to URL or localStorage — they are lost on navigation.
**Why it happens:** File objects are not serializable; they are browser-native handles to the user's filesystem.
**How to avoid:** Implement the wizard as a single Client Component with `useState`/`useReducer` managing the step — NO client-side routing between steps. The component stays mounted throughout all 4 steps. This also satisfies D-08 (retry keeps files).
**Warning signs:** `File objects are not serializable` error in dev tools.

### Pitfall 6: Template Files Not Available at Runtime
**What goes wrong:** Templates placed in `/public/templates/` are served as static files but can also be read server-side via `fs.readFileSync(path.join(process.cwd(), 'public', 'templates', filename))`.
**Why it happens:** Next.js serves `public/` as static but the files are still accessible via Node.js `fs` in Route Handlers.
**How to avoid:** Use `process.cwd()` + `"public/templates/"` path — this works in both local dev and Vercel deployment. Do NOT use `__dirname` in Route Handlers (it resolves to the build output, not the project root in some configurations).
**Warning signs:** `ENOENT: no such file or directory` on Vercel but not local.

---

## Code Examples

### mammoth.extractRawText from Buffer
```typescript
// Source: Context7 /mwilliamson/mammoth.js — verified
import mammoth from "mammoth"

const buffer = Buffer.from(await file.arrayBuffer())
const { value: text } = await mammoth.extractRawText({ buffer })
// text is a plain string with paragraphs separated by \n\n
```

### pdf-parse from Buffer
```typescript
// Source: npm package documentation [CITED: npmjs.com/package/pdf-parse]
import pdfParse from "pdf-parse"

const buffer = Buffer.from(await file.arrayBuffer())
const { text } = await pdfParse(buffer)
// text is the full extracted text
```

### pizzip: Load → Read XML → Modify → Generate
```typescript
// Source: https://github.com/open-xml-templating/pizzip (WebFetch verified)
import PizZip from "pizzip"
import fs from "fs"
import path from "path"

const content = fs.readFileSync(
  path.join(process.cwd(), "public", "templates", "Adenda de Extensión de Plazo – Carta Oferta - PF en PESOS.docx")
)
const zip = new PizZip(content)             // synchronous
const xml = zip.file("word/document.xml")!.asText()   // synchronous

// ... modify xml string ...

zip.file("word/document.xml", modifiedXml) // synchronous write back
const buffer = zip.generate({ type: "nodebuffer" }) // synchronous
// buffer is a Node.js Buffer ready to be returned as Response body
```

### Gemini inline image part
```typescript
// Source: Context7 /google-gemini/deprecated-generative-ai-js — verified
const imageBytes = await imageFile.arrayBuffer()
const imagePart = {
  inlineData: {
    data: Buffer.from(imageBytes).toString("base64"),  // base64 string, no data: prefix
    mimeType: imageFile.type,  // "image/jpeg" or "image/png"
  },
}
// Pass imagePart in the array alongside text parts in generateContent()
```

### motion/react animated messages (D-05)
```typescript
// Source: motion library already installed — pattern from TmaPageContent.tsx
"use client"
import { motion, AnimatePresence } from "motion/react"

const PROCESSING_MESSAGES = [
  "Analizando documentación...",
  "Identificando campos del contrato...",
  "Completando contrato con Gemini...",
]

// Cycle through messages every ~4s while awaiting the fetch
const [msgIndex, setMsgIndex] = useState(0)
useEffect(() => {
  if (step !== 3) return
  const interval = setInterval(() => {
    setMsgIndex(i => Math.min(i + 1, PROCESSING_MESSAGES.length - 1))
  }, 4000)
  return () => clearInterval(interval)
}, [step])

// Render with AnimatePresence for smooth transitions
<AnimatePresence mode="wait">
  <motion.p
    key={msgIndex}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.3 }}
  >
    {PROCESSING_MESSAGES[msgIndex]}
  </motion.p>
</AnimatePresence>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` | `motion/react` (same library, renamed) | motion v11 (2024) | Import from `"motion/react"` not `"framer-motion"` — already correct in this project |
| `@google/generative-ai` | `@google/genai` (new unified SDK) | 2025 | New SDK available but 0.24.1 still current/supported; use existing stable SDK |
| JSZip (async) | pizzip (synchronous fork) | 2017+ | pizzip deliberately synchronous for server-side docx use cases |
| Pages Router API Routes | App Router Route Handlers | Next.js 13+ | Uses Web Request/Response API, not `req`/`res` Node.js objects |

**Deprecated/outdated:**
- `framer-motion` import: replaced by `motion/react` — project already uses correct import
- `next.config.js` `api.bodyParser: false` for file uploads: not needed in App Router Route Handlers — `request.formData()` handles multipart natively

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | pdf-parse, mammoth, pizzip, fs | ✓ | (via Next.js runtime) | — |
| GEMINI_API_KEY env var | Gemini API call | Must be set in .env.local | — | None — blocks execution |
| /public/templates/*.docx | CONTR-06 | ✗ (manual placement) | — | Dev: use fixture .docx files for testing |
| pizzip npm package | CONTR-06 | ✗ (not installed) | 3.2.0 | — |
| @google/generative-ai | CONTR-08 | ✗ (not installed) | 0.24.1 | — |
| mammoth npm package | CONTR-05 | ✗ (not installed) | 1.12.0 | — |
| pdf-parse npm package | CONTR-05 | ✗ (not installed) | 2.4.5 | — |

**Missing dependencies with no fallback:**
- `GEMINI_API_KEY` — must be obtained from Google AI Studio and added to `.env.local` and Vercel dashboard before the route can run
- Template `.docx` files — must be placed manually in `public/templates/` before end-to-end testing

**Missing dependencies with fallback:**
- npm packages (pizzip, @google/generative-ai, mammoth, pdf-parse): install with single `npm install` command — no blockers

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 2 |
|-----------|-------------------|
| NO usar docxtemplater | Use pizzip + regex XML manipulation only |
| NO almacenar archivos subidos | All file data in memory (Buffer); never `fs.writeFile` user content |
| `maxDuration: 60` en vercel.json | Already set in `tma/vercel.json` for `src/app/api/contracts/generate/route.ts` |
| Gemini API `gemini-2.0-flash` (free tier) | Model string: `"gemini-2.0-flash"` |
| mammoth (docx→texto), pdf-parse (pdf→texto) | These specific libraries mandated |
| pizzip + manipulación directa de `word/document.xml` | No alternative XML library |
| motion/react (not framer-motion) | Import from `"motion/react"` |
| Tailwind v4: colores en `@theme {}` de globals.css | No tailwind.config.ts color additions |
| Modo claro únicamente | No dark mode classes |
| Poppins + brand palette | `text-brand-title`, `text-brand-primary`, etc. |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `tma/vitest.config.ts` |
| Quick run command | `cd tma && npm run test:ci -- --reporter=verbose src/__tests__/contracts/` |
| Full suite command | `cd tma && npm run test:ci` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONTR-06 | pizzip loads docx, reads word/document.xml as string | unit | `npm run test:ci -- src/__tests__/contracts/extractPlaceholders.test.ts` | ❌ Wave 0 |
| CONTR-07 | extractHighlightPlaceholders finds all yellow-highlighted runs | unit | `npm run test:ci -- src/__tests__/contracts/extractPlaceholders.test.ts` | ❌ Wave 0 |
| CONTR-09 | Gemini prompt enforces empty string for unknown fields | unit (mock) | `npm run test:ci -- src/__tests__/contracts/geminiClient.test.ts` | ❌ Wave 0 |
| CONTR-10 | fillHighlightPlaceholders replaces w:t content, preserves highlight | unit | `npm run test:ci -- src/__tests__/contracts/fillPlaceholders.test.ts` | ❌ Wave 0 |
| CONTR-13 | Route Handler returns binary with correct Content-Type | integration (mock Gemini) | `npm run test:ci -- src/__tests__/contracts/generateRoute.test.ts` | ❌ Wave 0 |
| CONTR-15 | No temp files created during generation | unit | assert `fs.readdirSync(tmpdir())` unchanged | ❌ Wave 0 |
| UI-06 | Wizard advances through all 4 steps | component | `npm run test:ci -- src/__tests__/contracts/ContratoWizard.test.tsx` | ❌ Wave 0 |
| D-08 | Retry preserves File objects in state | component | simulate error then retry; assert files in state | ❌ Wave 0 (in wizard test) |

### Sampling Rate
- **Per task commit:** `cd tma && npm run test:ci -- src/__tests__/contracts/`
- **Per wave merge:** `cd tma && npm run test:ci`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tma/src/__tests__/contracts/extractPlaceholders.test.ts` — covers CONTR-06, CONTR-07
- [ ] `tma/src/__tests__/contracts/fillPlaceholders.test.ts` — covers CONTR-10, XML escaping
- [ ] `tma/src/__tests__/contracts/geminiClient.test.ts` — covers CONTR-08/09 with Gemini mock
- [ ] `tma/src/__tests__/contracts/generateRoute.test.ts` — covers CONTR-13, CONTR-15
- [ ] `tma/src/__tests__/contracts/ContratoWizard.test.tsx` — covers UI-06, D-08
- [ ] `tma/src/__tests__/fixtures/sample-adenda.docx` — minimal test docx with 2 yellow-highlighted runs
- [ ] `tma/src/__tests__/fixtures/sample-ac-pf.docx` — minimal test docx with label-based fields

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `auth()` from NextAuth v5 checked at page level + in Route Handler |
| V3 Session Management | no (handled by Phase 1) | — |
| V4 Access Control | yes | Route Handler must verify session before processing; no user-specific resources |
| V5 Input Validation | yes | Validate `modelId` against allowlist of 10 known IDs; validate file MIME types before processing |
| V6 Cryptography | no | No encryption needed; files discarded immediately after processing |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized generation (unauthenticated POST) | Elevation of Privilege | `auth()` check at top of Route Handler; return 401 if no session |
| Malformed modelId → path traversal | Tampering | Validate `modelId` against `MODELS` constant map; never interpolate raw input into file path |
| Malicious .docx upload → XML injection | Tampering | mammoth extracts raw text only; no exec of docx content; not inserted into template XML |
| Oversized file upload exhausting memory | DoS | Validate file count and total size in Route Handler before processing |
| Gemini API key exposure | Information Disclosure | Key only in `process.env.GEMINI_API_KEY`; never logged or returned to client |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Templates will be placed in `public/templates/` and readable via `fs.readFileSync(path.join(process.cwd(), 'public', 'templates', filename))` on Vercel | pizzip patterns | If Vercel doesn't include public/ in the serverless function bundle, templates won't load — alternative: embed templates in `src/` and import them |
| A2 | AC PF and AC PJ label patterns are consistent enough for regex detection (e.g., "Nombre:", "CUIT:") | D-09 strategy | If labels vary significantly between documents, the regex approach will miss fields — actual template inspection needed before implementing |
| A3 | gemini-2.0-flash free tier 15 RPM is sufficient for production use (5 internal users, not concurrent) | Pitfall 3 | If users generate contracts simultaneously, may hit 429 — mitigate with retry logic |
| A4 | pizzip `.asText()` is the correct synchronous read method (vs `.async('string')` in JSZip) | pizzip patterns | If pizzip removed .asText() in v3.x, use `.getData()` instead — verify after install |

---

## Open Questions

1. **AC PF / AC PJ actual field structure**
   - What we know: These templates use label-based fields, not yellow highlights (D-09)
   - What's unclear: Exact label text (Spanish/English), whether values follow labels in same run vs next paragraph, whether tables are used
   - Recommendation: Before implementing, developer should open the actual .docx files and inspect word/document.xml to confirm field structure. The plan should include a "template inspection" task in Wave 0.

2. **Template file location on Vercel**
   - What we know: `public/` directory is included in Vercel deployments and served as static assets
   - What's unclear: Whether `fs.readFileSync` from a Route Handler can read `public/` on Vercel Hobby
   - Recommendation: Test locally first. If Vercel excludes public/ from Node.js runtime filesystem, move templates to `src/templates/` and import as base64 strings (or use `/api/templates/[name]` to serve them).

3. **Gemini prompt structure for completeness count**
   - What we know: D-06 requires "X/N campos completados" — N comes from placeholder extraction, X from non-empty Gemini responses
   - What's unclear: Whether to count total placeholders (N) as all highlighted runs or only required fields
   - Recommendation: N = all extracted placeholders; X = placeholders where Gemini returned a non-empty string. Return both via `X-Fields-Completed` header.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/mwilliamson/mammoth.js` — `extractRawText` Buffer API, verified against npm 1.12.0
- Context7 `/google-gemini/deprecated-generative-ai-js` — `generateContent`, `inlineData`, `responseMimeType`, verified against npm 0.24.1
- Context7 `/websites/googleapis_github_io_js-genai_release_docs` — `responseSchema`, `GenerationConfig` options
- [Next.js Route Handlers docs](https://nextjs.org/docs/app/getting-started/route-handlers) — `request.formData()`, Response API, Next.js 16.2.9
- [OOXML Microsoft Learn](https://learn.microsoft.com/en-us/office/open-xml/general/how-to-search-and-replace-text-in-a-document-part) — XML structure for w:r, w:rPr, w:t elements
- npm registry — all package versions verified 2026-06-12

### Secondary (MEDIUM confidence)
- [pizzip GitHub docs](https://github.com/open-xml-templating/pizzip) — `.asText()`, `.generate()`, load from Buffer — verified via WebFetch
- [Gemini free tier rate limits](https://pecollective.com/tools/gemini-free-tier-guide/) — 15 RPM, 1,500 RPD for gemini-2.0-flash (multiple sources agree on post-Dec 2025 limits)

### Tertiary (LOW confidence — not needed, confirmed via primary sources)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-06-12
- Architecture: HIGH — based on verified Next.js docs + confirmed existing project patterns
- Gemini API: HIGH — verified via Context7 (official Google SDK docs)
- pizzip XML patterns: MEDIUM-HIGH — verified from official repo docs; actual template structure (A1, A2) is ASSUMED
- Pitfalls: HIGH — based on OOXML spec docs + known Gemini rate limit changes

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (Gemini rate limits may change; verify before production)
