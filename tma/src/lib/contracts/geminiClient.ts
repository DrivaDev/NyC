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

/**
 * Build the Gemini prompt text.
 * Exported separately so tests can verify prompt structure without calling the API.
 */
export function buildPrompt(
  placeholders: GeminiPlaceholder[],
  extractedTexts: string[],
  notes: string
): string {
  const fieldsList = placeholders
    .map(p => {
      const labelPart = p.label ? ` | Etiqueta: "${p.label}"` : ""
      return `- ID: "${p.id}"${labelPart} | Contexto del párrafo: "${p.context}"`
    })
    .join("\n")

  const docsText =
    extractedTexts.length > 0
      ? extractedTexts.map((t, i) => `--- Documento ${i + 1} ---\n${t}`).join("\n\n")
      : "(Sin documentos de texto adjuntos)"

  const notesSection = notes.trim()
    ? `\n\nNotas adicionales del usuario:\n${notes.trim()}`
    : ""

  return `Sos un asistente especializado en derecho argentino. Tu tarea es completar los campos de un contrato de locación usando la información de los documentos adjuntos.

INSTRUCCIONES:
- Devolvé ÚNICAMENTE JSON válido con exactamente las IDs de campo listadas abajo.
- Para cada campo, extraé el valor correcto de los documentos. Podés inferir valores razonables del contexto (por ejemplo, si el documento menciona "el inmueble ubicado en Av. Corrientes 1234", el campo "DOMICILIO DEL INMUEBLE" debe ser "Av. Corrientes 1234").
- NO inventes datos que no tengan ningún respaldo en los documentos. Si genuinamente no hay información, devolvé "".
- Los valores deben estar en el formato apropiado para un contrato legal argentino.
- Los campos de fecha van en formato "DD de mes de AAAA" (ej: "15 de junio de 2026").
- Los montos van con signo de moneda (ej: "$ 150.000" o "USD 2.500").

CAMPOS A COMPLETAR:
${fieldsList}

DOCUMENTACIÓN DEL ASUNTO:
${docsText}${notesSection}

Respondé SÓLO con el JSON. Ejemplo:
{
  "ph_0": "Juan Carlos Pérez",
  "ph_1": "25 de junio de 2026",
  "ph_2": ""
}`
}

/**
 * Call Gemini API to fill placeholders from document context.
 * Uses gemini-2.0-flash with JSON mode (responseMimeType: "application/json").
 * Implements 1 automatic retry on 429 (rate limit) errors with 2000ms delay.
 *
 * @param placeholders  List of placeholders with context (from extractPlaceholders)
 * @param extractedTexts Array of plain-text strings from docx/pdf files
 * @param imageParts    Array of base64-encoded image parts for Gemini Vision
 * @param notes         Free-text notes from the user (Step 2 form)
 * @returns             Record<placeholder_id, value> — empty string means no data found
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
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  })

  const prompt = buildPrompt(placeholders, extractedTexts, notes)
  const contentParts: Array<{ text: string } | InlinePart> = [
    { text: prompt },
    ...imageParts,
  ]

  const callWithRetry = async (retryCount = 0): Promise<Record<string, string>> => {
    try {
      const result = await model.generateContent(contentParts)
      const raw = result.response.text()
      return JSON.parse(raw) as Record<string, string>
    } catch (err: unknown) {
      // Retry once on 429 (rate limit) after 2 seconds
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
