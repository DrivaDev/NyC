import { GoogleGenerativeAI } from "@google/generative-ai"

export interface GeminiPlaceholder {
  id: string
  context: string
  label?: string  // original highlighted text — the field's own name/label
}

type InlinePart = {
  inlineData: {
    mimeType: string
    data: string // raw base64, NO "data:..." prefix
  }
}

// Maps common ALL-CAPS legal placeholder labels to plain descriptions.
// Gemini performs much better when it knows semantically what each label means.
const FIELD_GLOSSARY = `
GLOSARIO DE CAMPOS (usalo para interpretar las etiquetas):
- NOMBRE DEL LOCADOR / NOMBRE: nombre completo (persona física o razón social) del propietario/locador
- CUIT DEL LOCADOR / CUIT: número de CUIT del locador (formato XX-XXXXXXXX-X)
- DOMICILIO DEL LOCADOR / DOMICILIO: domicilio legal completo del locador
- ESTADO CIVIL / EST. CIVIL: estado civil (soltero/a, casado/a, etc.)
- NACIONALIDAD: nacionalidad del locador
- DNI / D.N.I.: número de documento nacional de identidad
- NOMBRE DEL LOCATARIO: empresa locataria (generalmente Nicholson & Cano S.A. u otra empresa del grupo)
- CUIT DEL LOCATARIO: CUIT de la empresa locataria
- COD. SITIO / CÓDIGO DE SITIO: código numérico que identifica el sitio/antena (ej: 12345)
- DIRECCIÓN / DOMICILIO DEL INMUEBLE: dirección completa del inmueble o sitio
- LOCALIDAD / CIUDAD: ciudad o localidad donde se ubica el inmueble
- PROVINCIA: provincia donde se ubica el inmueble
- FECHA DE INICIO / FECHA DE COMIENZO: fecha en que comienza el contrato o período
- FECHA DE VENCIMIENTO / FECHA DE FIN: fecha en que vence el contrato o período
- PLAZO / PERÍODO: duración del contrato (ej: "24 meses", "2 años")
- CANON / MONTO / ALQUILER: importe mensual del alquiler en pesos o dólares
- AJUSTE / ACTUALIZACIÓN: periodicidad y mecanismo de ajuste del canon
- REPRESENTANTE / APODERADO: nombre del representante legal o apoderado`

/**
 * Build the Gemini prompt using chain-of-thought: analyze documents first,
 * then map findings to specific placeholder fields. This two-phase approach
 * significantly improves extraction accuracy vs. one-shot structured output.
 */
export function buildPrompt(
  placeholders: GeminiPlaceholder[],
  extractedTexts: string[],
  notes: string
): string {
  const fieldsList = placeholders
    .map(p => {
      const labelPart = p.label ? ` | Etiqueta: "${p.label}"` : ""
      const contextPart = p.context ? ` | Posición en el documento: "${p.context}"` : ""
      return `    "${p.id}"${labelPart}${contextPart}: ""`
    })
    .join(",\n")

  const docsText =
    extractedTexts.length > 0
      ? extractedTexts.map((t, i) => `--- Documento ${i + 1} ---\n${t}`).join("\n\n")
      : "(Sin documentos de texto adjuntos)"

  const notesSection = notes.trim()
    ? `\n\nDATOS ADICIONALES PROVISTOS:\n${notes.trim()}`
    : ""

  return `Sos un asistente especializado en derecho argentino. Tu tarea es completar los campos de un contrato de locación.
${FIELD_GLOSSARY}

DOCUMENTACIÓN DEL ASUNTO:
${docsText}${notesSection}

INSTRUCCIONES — Seguí estos dos pasos:

PASO 1 — ANÁLISIS: Leé los documentos e identificá toda la información disponible:
• Partes: nombre completo, CUIT, DNI, domicilio, estado civil, nacionalidad, rol (locador/locatario)
• Inmueble/sitio: dirección, código de sitio, localidad, provincia
• Fechas: inicio, vencimiento, firma, plazos
• Montos: canon, moneda, ajustes

PASO 2 — MAPEO: Usá lo identificado en el Paso 1 para completar exactamente estos campos.
Reglas:
- Si encontrás el dato, usalo aunque esté en otro orden o formato
- Fechas: formato "DD de mes de AAAA" (ej: "15 de junio de 2026")
- Montos: incluí signo de moneda (ej: "$ 150.000" o "USD 2.500")
- Si no encontrás información para un campo: ""
- No inventes datos sin respaldo en los documentos

Respondé SOLO con este JSON:
{
  "analisis": "resumen de lo identificado en los documentos",
  "campos": {
${fieldsList}
  }
}`
}

/**
 * Extract the fields record from a chain-of-thought JSON response.
 * Response format: { "analisis": "...", "campos": { "ph_0": "...", ... } }
 */
function parseResponse(raw: string): Record<string, string> {
  // Try parsing as { analisis, campos } first
  try {
    const parsed = JSON.parse(raw) as { analisis?: string; campos?: Record<string, string> }
    if (parsed.campos && typeof parsed.campos === "object") {
      return parsed.campos
    }
    // Fallback: if Gemini returned flat { ph_0: ..., ph_1: ... }
    return parsed as Record<string, string>
  } catch {
    // Gemini sometimes wraps JSON in markdown code blocks
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      return parseResponse(match[1].trim())
    }
    throw new Error("Gemini devolvió una respuesta que no se puede parsear como JSON")
  }
}

/**
 * Call Gemini API to fill placeholders from document context.
 * Uses chain-of-thought prompting (analyze → map) for better extraction accuracy.
 * Text mode (no JSON lock) allows Gemini to reason before outputting structured data.
 * Implements 1 automatic retry on 429 / RESOURCE_EXHAUSTED after 2000ms delay.
 */
export async function callGemini(
  placeholders: GeminiPlaceholder[],
  extractedTexts: string[],
  imageParts: InlinePart[],
  notes: string
): Promise<Record<string, string>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set")
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  // No responseMimeType — text mode lets Gemini reason before producing JSON
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const prompt = buildPrompt(placeholders, extractedTexts, notes)
  const contentParts: Array<{ text: string } | InlinePart> = [
    { text: prompt },
    ...imageParts,
  ]

  const callWithRetry = async (retryCount = 0): Promise<Record<string, string>> => {
    try {
      const result = await model.generateContent(contentParts)
      const raw = result.response.text()
      return parseResponse(raw)
    } catch (err: unknown) {
      if (
        retryCount === 0 &&
        err instanceof Error &&
        (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED"))
      ) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        return callWithRetry(1)
      }
      throw err
    }
  }

  return callWithRetry()
}
