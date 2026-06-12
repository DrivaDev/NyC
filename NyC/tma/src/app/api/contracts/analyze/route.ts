import { NextRequest, NextResponse } from "next/server"
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
import { processUploadedFile } from "@/lib/contracts/extractDocText"

export const maxDuration = 60
export const dynamic = "force-dynamic"

export interface AnalyzeField {
  id: string
  label: string
  value: string
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 })
  }

  const modelId = (formData.get("modelId") as string | null) ?? ""
  const notes = (formData.get("notes") as string | null) ?? ""

  const model = getModelById(modelId)
  if (!model) {
    return NextResponse.json({ error: "Modelo de contrato no válido" }, { status: 400 })
  }

  const siteFiles = formData.getAll("siteFiles") as File[]
  const personFiles = formData.getAll("personFiles") as File[]
  const allFiles = [...siteFiles, ...personFiles]

  if (allFiles.length > 20) {
    return NextResponse.json({ error: "Demasiados archivos adjuntos" }, { status: 400 })
  }

  const extractedTexts: string[] = []
  const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = []

  for (const file of allFiles) {
    if (file.size > 10 * 1024 * 1024) continue
    const result = await processUploadedFile(file)
    if (!result) continue
    if (result.type === "text") extractedTexts.push(result.text)
    else imageParts.push(result.part)
  }

  let xml: string
  try {
    const loaded = loadTemplateXml(model.filename)
    xml = loaded.xml
  } catch {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 500 })
  }

  let highlightPlaceholders: Placeholder[] | null = null
  let labelPlaceholders: LabelPlaceholder[] | null = null
  let geminiPlaceholders: GeminiPlaceholder[]

  if (model.type === "adenda") {
    highlightPlaceholders = extractHighlightPlaceholders(xml)
    geminiPlaceholders = highlightPlaceholders
  } else {
    labelPlaceholders = extractLabelPlaceholders(xml)
    geminiPlaceholders = labelPlaceholders.map(lp => ({
      id: lp.id,
      context: `${lp.label}: ${lp.context}`,
      label: lp.label,
    }))
  }

  let geminiValues: Record<string, string>
  try {
    geminiValues = await callGemini(geminiPlaceholders, extractedTexts, imageParts, notes)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json(
      { error: `Error al procesar con Gemini: ${message}` },
      { status: 500 }
    )
  }

  const fields: AnalyzeField[] = geminiPlaceholders.map(p => ({
    id: p.id,
    label: p.label ?? p.context.slice(0, 80),
    value: geminiValues[p.id] ?? "",
  }))

  return NextResponse.json({ fields })
}
