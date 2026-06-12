import { GoogleGenerativeAI } from "@google/generative-ai"

export interface GeminiPlaceholder {
  id: string
  context: string
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
    .map(p => `- ID: "${p.id}" | Contexto del campo: "${p.context}"`)
    .join("\n")

  const docsText =
    extractedTexts.length > 0
      ? extractedTexts.map((t, i) => `--- Documento ${i + 1} ---\n${t}`).join("\n\n")
      : "(Sin documentos de texto adjuntos)"

  const notesSection = notes.trim()
    ? `\n\nNotas adicionales del usuario:\n${notes.trim()}`
    : ""

  return `Sos un asistente especializado en derecho argentino. Tu tarea es completar los campos de un contrato legal usando ÚNICAMENTE la información de los documentos adjuntos.

INSTRUCCIONES ESTRICTAS:
- Devolvé ÚNICAMENTE JSON válido con exactamente las IDs de campo listadas abajo.
- Para cada campo, devolvé el valor encontrado en los documentos, o "" (string vacío) si no hay información suficiente.
- NUNCA inventes, inferras ni completes datos que no estén explícitamente en los documentos.
- Los valores deben estar en el formato apropiado para un contrato legal argentino.

CAMPOS A COMPLETAR:
${fieldsList}

DOCUMENTACIÓN DEL ASUNTO:
${docsText}${notesSection}

Respondé SÓLO con el JSON. Ejemplo de formato esperado:
{
  "ph_0": "Juan Carlos Pérez",
  "ph_1": "",
  "ph_2": "25 de junio de 2026"
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
