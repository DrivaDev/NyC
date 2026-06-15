import { NextRequest, NextResponse } from "next/server"
import PizZip from "pizzip"
import { auth } from "@/auth"
import { getModelById } from "@/lib/contracts/models"
import {
  loadTemplateXml,
  extractHighlightPlaceholders,
  extractLabelPlaceholders,
  extractUnderscoredPlaceholders,
  type Placeholder,
  type LabelPlaceholder,
  type UnderscoredPlaceholder,
} from "@/lib/contracts/extractPlaceholders"
// extractUnderscoredPlaceholders kept for AC flow; Adenda uses highlight-only strategy
import { callGemini, type GeminiPlaceholder } from "@/lib/contracts/geminiClient"
import {
  applySplices,
  buildHighlightSplices,
  buildLabelSplices,
  buildUnderscoredSplices,
  generateDocxBuffer,
  cloneLocadorRow,
  pluralizeLocadorRefs,
  cloneSignatureBlocks,
} from "@/lib/contracts/fillPlaceholders"
import { processUploadedFile } from "@/lib/contracts/extractDocText"

// Required so vercel.json maxDuration takes effect; also explicit in code for clarity
export const maxDuration = 60

// Prevent Next.js from statically optimizing this POST route
export const dynamic = "force-dynamic"

async function processFiles(files: File[]): Promise<{ texts: string[]; images: Array<{ inlineData: { mimeType: string; data: string } }> }> {
  const texts: string[] = []
  const images: Array<{ inlineData: { mimeType: string; data: string } }> = []
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) continue // per-file 10MB cap (CONTR-15 / T-02-04)
    const result = await processUploadedFile(file)
    if (!result) continue
    if (result.type === "text") texts.push(result.text)
    else images.push(result.part)
  }
  return { texts, images }
}

export async function POST(request: NextRequest) {
  // ── Security: auth check FIRST (T-02-01) ───────────────────────────────────
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // ── Parse FormData ──────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 })
  }

  const modelId = (formData.get("modelId") as string | null) ?? ""
  const notes = (formData.get("notes") as string | null) ?? ""
  const facturacionFiles = formData.getAll("facturacionFiles") as File[]

  // ── Security: validate modelId against MODELS map — never use raw input in path (T-02-02) ─
  const model = getModelById(modelId)
  if (!model) {
    return NextResponse.json({ error: "Modelo de contrato no válido" }, { status: 400 })
  }

  // ── Parse locador count (D-04 / Security: bound to prevent N-call DoS) ───────
  const rawLocadorCount = formData.get("locadorCount") as string | null
  let locadorCount = parseInt(rawLocadorCount ?? "1", 10)
  if (!Number.isFinite(locadorCount) || locadorCount < 1) locadorCount = 1
  if (locadorCount > 10) locadorCount = 10 // hard cap — too many Gemini calls

  // ── Collect files: siteFiles (Adenda) + per-locador personFiles_i ────────────
  const siteFiles = formData.getAll("siteFiles") as File[]
  const locadorFileSets: File[][] = []
  for (let i = 0; i < locadorCount; i++) {
    locadorFileSets.push(formData.getAll(`personFiles_${i}`) as File[])
  }

  // ── DoS protection: cap TOTAL files across siteFiles + all locadores ─────────
  const totalFiles = siteFiles.length + facturacionFiles.length + locadorFileSets.reduce((s, f) => s + f.length, 0)
  if (totalFiles > 20) {
    return NextResponse.json({ error: "Demasiados archivos adjuntos" }, { status: 400 })
  }

  // ── Load template from server filesystem (validated filename only) ───────────
  let zip: PizZip
  let xml: string
  try {
    const loaded = loadTemplateXml(model.filename)
    zip = loaded.zip
    xml = loaded.xml
  } catch {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 500 })
  }

  // ── Parse fieldValuesJson once (review-step shortcut) ────────────────────────
  const fieldValuesJson = formData.get("fieldValuesJson") as string | null
  let parsedFieldValues: Record<string, string> | null = null
  if (fieldValuesJson) {
    try {
      parsedFieldValues = JSON.parse(fieldValuesJson) as Record<string, string>
    } catch {
      return NextResponse.json({ error: "fieldValuesJson inválido" }, { status: 400 })
    }
  }

  // ── Extract placeholders + fill + Gemini — strategy per model.type ───────────
  let highlightPlaceholders: Placeholder[] | null = null
  let labelPlaceholders: LabelPlaceholder[] | null = null
  let underscoredPlaceholders: UnderscoredPlaceholder[]
  let geminiPlaceholders: GeminiPlaceholder[]
  let geminiValues: Record<string, string>
  let modifiedXml: string

  if (model.type === "adenda") {
    // CONTR-12 / D-08: pluralize BEFORE extraction when multi-locador
    if (locadorCount > 1) {
      xml = pluralizeLocadorRefs(xml)
      xml = cloneSignatureBlocks(xml, locadorCount)
    }
    // Adenda strategy: highlight-only. Underscore fields (date header) are NOT filled —
    // they are not yellow-highlighted and should remain blank for manual completion.
    highlightPlaceholders = extractHighlightPlaceholders(xml)
    geminiPlaceholders = highlightPlaceholders
    // D-09: single Gemini call with ALL locadores' files concatenated
    const allFiles = locadorFileSets.flat()
    const { texts, images: baseImages } = await processFiles([...siteFiles, ...allFiles])
    const { texts: factTexts, images: factImages } = await processFiles(facturacionFiles)
    const images = [...factImages, ...baseImages]
    if (factTexts.length > 0) texts.unshift(`=== DATOS DE FACTURACIÓN / ALTA USUARIO MERCURIO – PROVEEDORES ===\n${factTexts.join("\n")}`)
    geminiValues = parsedFieldValues
      ? parsedFieldValues
      : await callGemini(geminiPlaceholders, texts, images, notes, locadorCount)
    modifiedXml = applySplices(xml, buildHighlightSplices(geminiValues, highlightPlaceholders))
  } else {
    // model.type === "ac" — label-based strategy (CONTR-11)
    // CONTR-11: extract original row once to learn fieldCount, then clone N-1 times
    const originalLabels = extractLabelPlaceholders(xml)        // lph_0..lph_(fieldCount-1)
    const fieldCount = originalLabels.length
    xml = cloneLocadorRow(xml, locadorCount)                    // now N rows
    labelPlaceholders = extractLabelPlaceholders(xml)           // lph_0..lph_(fieldCount*N-1)
    underscoredPlaceholders = extractUnderscoredPlaceholders(xml)

    geminiValues = {}
    if (parsedFieldValues) {
      Object.assign(geminiValues, parsedFieldValues)
    } else {
      // Process facturacion files once, shared across all locador calls
      const { texts: factTexts, images: factImages } = await processFiles(facturacionFiles)
      const factTextBlock = factTexts.length > 0
        ? `=== DATOS DE FACTURACIÓN / ALTA USUARIO MERCURIO – PROVEEDORES ===\n${factTexts.join("\n")}`
        : ""

      // D-04: one Gemini call per locador; parallel (Pitfall 4 — within 60s for <=10)
      const perLocador = await Promise.all(
        locadorFileSets.map(async (files, i) => {
          const { texts: rawTexts, images: rawImages } = await processFiles(files)
          const texts = factTextBlock ? [factTextBlock, ...rawTexts] : rawTexts
          const images = [...factImages, ...rawImages]
          // Send this locador's fields, but remap absolute ids to lph_0..fieldCount-1
          // so each call is independent of row position.
          const slice = labelPlaceholders!.slice(i * fieldCount, (i + 1) * fieldCount)
          const localPh = slice.map((lp, k) => ({ id: `lph_${k}`, context: lp.context, label: lp.label }))
          const localVals = await callGemini(localPh, texts, images, notes)
          // Map local ids back to absolute ids for this row
          const absVals: Record<string, string> = {}
          slice.forEach((lp, k) => { absVals[lp.id] = localVals[`lph_${k}`] ?? "" })
          return absVals
        })
      )
      perLocador.forEach(v => Object.assign(geminiValues, v))
      // Underscore fields (e.g. letter date header) — run a lightweight extra mapping
      // only if underscoredPlaceholders is non-empty:
      if (underscoredPlaceholders.length > 0) {
        const { texts: rawUsTexts, images: rawUsImages } = await processFiles(locadorFileSets[0] ?? [])
        const usTexts = factTextBlock ? [factTextBlock, ...rawUsTexts] : rawUsTexts
        const usImages = [...factImages, ...rawUsImages]
        const usVals = await callGemini(
          underscoredPlaceholders.map(u => ({ id: u.id, context: u.context })),
          usTexts, usImages, notes
        )
        Object.assign(geminiValues, usVals)
      }
    }

    // Single combined pass — chaining separate fills corrupts byte offsets (see applySplices)
    modifiedXml = applySplices(xml, [
      ...buildLabelSplices(geminiValues, labelPlaceholders),
      ...buildUnderscoredSplices(geminiValues, underscoredPlaceholders),
    ])

    // totals for header
    geminiPlaceholders = [
      ...labelPlaceholders.map(lp => ({ id: lp.id, context: lp.context })),
      ...underscoredPlaceholders.map(u => ({ id: u.id, context: u.context })),
    ]
  }

  const totalCount = geminiPlaceholders.length

  // ── Count completed fields for X-Fields-Completed header ────────────────────
  const completedCount = geminiPlaceholders.filter(
    p => geminiValues[p.id] !== undefined && geminiValues[p.id].trim() !== ""
  ).length

  // ── Generate .docx buffer (in-memory only — no fs.writeFile) ────────────────
  let docxBuffer: Buffer
  try {
    docxBuffer = generateDocxBuffer(zip, modifiedXml)
  } catch {
    return NextResponse.json({ error: "Error al generar el documento" }, { status: 500 })
  }

  // ── Return binary response (CONTR-13) ────────────────────────────────────────
  return new Response(new Uint8Array(docxBuffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${model.id}.docx"`,
      "X-Fields-Completed": `${completedCount}/${totalCount}`,
    },
  })
}
