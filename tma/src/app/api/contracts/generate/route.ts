import { NextRequest, NextResponse } from "next/server"
import PizZip from "pizzip"
import { auth } from "@/auth"
import { getModelById } from "@/lib/contracts/models"
import {
  loadTemplateXml,
  extractHighlightPlaceholders,
  extractLabelPlaceholders,
  type Placeholder,
  type LabelPlaceholder,
} from "@/lib/contracts/extractPlaceholders"
import { callGemini, type GeminiPlaceholder } from "@/lib/contracts/geminiClient"
import {
  fillHighlightPlaceholders,
  fillLabelPlaceholders,
  generateDocxBuffer,
} from "@/lib/contracts/fillPlaceholders"
import { processUploadedFile } from "@/lib/contracts/extractDocText"

// Required so vercel.json maxDuration takes effect; also explicit in code for clarity
export const maxDuration = 60

// Prevent Next.js from statically optimizing this POST route
export const dynamic = "force-dynamic"

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

  // ── Security: validate modelId against MODELS map — never use raw input in path (T-02-02) ─
  const model = getModelById(modelId)
  if (!model) {
    return NextResponse.json({ error: "Modelo de contrato no válido" }, { status: 400 })
  }

  // ── Collect uploaded files ──────────────────────────────────────────────────
  const siteFiles = formData.getAll("siteFiles") as File[]
  const personFiles = formData.getAll("personFiles") as File[]
  const allFiles = [...siteFiles, ...personFiles]

  // ── DoS protection: cap file count (T-02-04) ────────────────────────────────
  if (allFiles.length > 20) {
    return NextResponse.json({ error: "Demasiados archivos adjuntos" }, { status: 400 })
  }

  // ── Process files in memory — no writes to disk (CONTR-15, T-02-04) ─────────
  const extractedTexts: string[] = []
  const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = []

  for (const file of allFiles) {
    // Per-file size cap: 10 MB (T-02-04)
    if (file.size > 10 * 1024 * 1024) continue

    const result = await processUploadedFile(file)
    if (!result) continue
    if (result.type === "text") {
      extractedTexts.push(result.text)
    } else {
      imageParts.push(result.part)
    }
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

  // ── Extract placeholders (strategy determined by model.type) ─────────────────
  let highlightPlaceholders: Placeholder[] | null = null
  let labelPlaceholders: LabelPlaceholder[] | null = null
  let geminiPlaceholders: GeminiPlaceholder[]

  if (model.type === "adenda") {
    highlightPlaceholders = extractHighlightPlaceholders(xml)
    // Placeholder is a superset of GeminiPlaceholder — pass directly
    geminiPlaceholders = highlightPlaceholders
  } else {
    // model.type === "ac" — label-based strategy
    labelPlaceholders = extractLabelPlaceholders(xml)
    geminiPlaceholders = labelPlaceholders.map(lp => ({
      id: lp.id,
      context: `${lp.label}: ${lp.context}`,
    }))
  }

  const totalCount = geminiPlaceholders.length

  // ── Call Gemini API (T-02-05: sanitize errors, never log key) ───────────────
  let geminiValues: Record<string, string>
  try {
    geminiValues = await callGemini(geminiPlaceholders, extractedTexts, imageParts, notes)
  } catch (err: unknown) {
    // Sanitize error: do NOT return GEMINI_API_KEY or raw Gemini response (T-02-05)
    const message = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json(
      { error: `Error al procesar con Gemini: ${message}` },
      { status: 500 }
    )
  }

  // ── Fill placeholders — reuse already-extracted objects (no second parse) ────
  let modifiedXml: string
  if (model.type === "adenda") {
    modifiedXml = fillHighlightPlaceholders(xml, geminiValues, highlightPlaceholders!)
  } else {
    modifiedXml = fillLabelPlaceholders(xml, geminiValues, labelPlaceholders!)
  }

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
