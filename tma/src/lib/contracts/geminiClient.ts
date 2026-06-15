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

// Maps common field types to plain descriptions so Gemini can map semantics to position.
const FIELD_GLOSSARY = `
GLOSARIO DE CAMPOS (usalo para interpretar la "Posición en el documento" de cada campo):
- NOMBRE DEL LOCADOR / NOMBRE / RAZÓN SOCIAL: nombre completo (persona física) o razón social (PJ) del propietario/locador
- CUIT DEL LOCADOR / CUIT: número de CUIT del locador (formato XX-XXXXXXXX-X)
- DOMICILIO DEL LOCADOR / DOMICILIO: domicilio legal completo del locador
- ESTADO CIVIL / EST. CIVIL: estado civil (soltero/a, casado/a, etc.)
- NACIONALIDAD: nacionalidad del locador
- DNI / D.N.I.: número de documento nacional de identidad
- COD. SITIO / CÓDIGO DE SITIO: código numérico que identifica el sitio/antena (ej: 12345)
- DIRECCIÓN / DOMICILIO DEL INMUEBLE / CALLE: dirección completa del inmueble o sitio
- LOCALIDAD / CIUDAD DEL INMUEBLE: ciudad o localidad donde se ubica el inmueble
- PROVINCIA DEL INMUEBLE: provincia donde se ubica el inmueble
- FECHA DE INICIO / FECHA DE COMIENZO: fecha en que comienza el contrato o período ("DD de mes de AAAA")
- FECHA DE VENCIMIENTO / FECHA DE FIN: fecha en que vence el contrato
- PLAZO / PERÍODO / MESES: duración del contrato (solo el número, ej: "36")
- CANON MENSUAL / MONTO MENSUAL: importe mensual del alquiler en pesos o dólares
- CANON ANUAL / PRECIO ANUAL: importe anual del alquiler (canon mensual × 12)
- CANON ANUAL EN PALABRAS: el canon anual expresado en letras en MAYÚSCULAS (ej: 14.200 → "CATORCE MIL DOSCIENTOS")
- CANON TOTAL DEL PLAZO: suma total por todo el plazo (canon anual × años de plazo)
- CANON TOTAL EN PALABRAS: el canon total expresado en letras en MAYÚSCULAS (ej: 42.600 → "CUARENTA Y DOS MIL SEISCIENTOS")
- REPRESENTANTE / APODERADO: nombre completo del representante legal o apoderado de la locadora
- CARGO / CARÁCTER DEL REPRESENTANTE: rol o cargo del representante en la empresa (ej: Apoderado, Gerente, Director, Presidente)
- CIUDAD DE LA CARTA / LUGAR: ciudad donde se emite la carta (generalmente la misma del inmueble)
- DÍA DE LA CARTA: número del día en que se emite la carta
- MES DE LA CARTA: nombre del mes en que se emite la carta (en español, ej: "agosto")
- FECHA ACTA DIRECTORIO: fecha del acta de directorio que autoriza al representante
- FECHA PROPUESTA ANTERIOR: fecha en que se firmó o envió el contrato original
- ALTA MERCURIO - NOMBRE: primer nombre del representante que se dará de alta en Mercurio-Proveedores
- ALTA MERCURIO - APELLIDO: apellido del representante para Mercurio
- ALTA MERCURIO - MÓVIL: número de teléfono celular del representante
- ALTA MERCURIO - DNI: DNI del representante (persona física) para Mercurio
- ALTA MERCURIO - CUIL: CUIL del representante (formato XX-XXXXXXXX-X, diferente al CUIT de la empresa)
- ALTA MERCURIO - MAIL: correo electrónico del representante para Mercurio
- ALTA MERCURIO - CUIT EMPRESA: CUIT de la empresa locadora que emitirá las facturas
- ALTA MERCURIO - RAZÓN SOCIAL EMPRESA: nombre de la empresa locadora que factura`

/**
 * Build the Gemini prompt using chain-of-thought: analyze documents first,
 * then map findings to specific placeholder fields. This two-phase approach
 * significantly improves extraction accuracy vs. one-shot structured output.
 *
 * @param locadorCount When > 1 (multi-locador Adenda), adds special formatting
 *   instructions so Gemini combines all locadores into the identification field.
 */
export function buildPrompt(
  placeholders: GeminiPlaceholder[],
  extractedTexts: string[],
  notes: string,
  locadorCount?: number
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

  // Extra instructions injected when there are multiple locadores in an Adenda.
  // Without these, Gemini picks only the first person it finds and fills all fields
  // with their data, ignoring the remaining co-owners.
  const multiLocadorSection = locadorCount && locadorCount > 1 ? `

INSTRUCCIÓN ESPECIAL — HAY ${locadorCount} LOCADORES EN ESTE CONTRATO:

Los documentos contienen información de ${locadorCount} propietarios/co-titulares. Seguí estas reglas adicionales:

A) CAMPO DE IDENTIFICACIÓN COMBINADA DE LOCADORES
   El campo con contexto "...por una parte y; por otra parte,[CAMPO], DNI..." identifica a LA PARTE LOCADORA.
   Para ${locadorCount} locadores, debés listar a TODOS en un único valor con este formato exacto:

   "NOMBRE1 (XX%), CUIT YY-XXXXXXXX-X, teléfono: XXXX, con domicilio real en CALLE N°, Localidad de LOCALIDAD, Provincia de PROVINCIA; NOMBRE2 (YY%), CUIT ..., teléfono: ..., con domicilio real en ...; y NOMBRE3 (ZZ%), CUIT ..., teléfono: ..., con domicilio real en ...; todos con correo electrónico: EMAIL"

   • Nombres en MAYÚSCULAS
   • Los porcentajes de titularidad (%) aparecen en los documentos; si no están, usá partes iguales (${Math.round(100 / locadorCount)}% cada uno)
   • Si todos comparten el mismo email, incluilo una sola vez al final ("todos con correo electrónico: X")

B) CAMPOS INDIVIDUALES QUE DEBEN QUEDAR EN BLANCO
   Una vez que el campo combinado contiene todos los datos, los campos individuales de DNI, CUIT,
   calle, localidad y provincia de los locadores quedan VACÍOS ("") porque ya están incluidos arriba.
   Identificalos por su contexto:
   - Campo DNI individual: contexto contiene "DNI[CAMPO]CUIT" → devolvé ""
   - Campo CUIT individual: contexto contiene "CUIT[CAMPO], con domicilio" → devolvé ""
   - Campo calle locador: contexto contiene "en la calle[CAMPO], Localidad de" → devolvé ""
   - Campo localidad locador: contexto contiene "Localidad de[CAMPO], Provincia de" y en el mismo párrafo que la Locadora → devolvé ""
   - Campo provincia locador: contexto contiene "Provincia de[CAMPO](en lo sucesivo, la \"Locadora\"" → devolvé ""

C) CLÁUSULA OPCIONAL DE ENERGÍA
   El campo con etiqueta "Energía" y el campo con etiqueta "Las Partes pactan que la Locataria reintegrará..."
   representan una CLÁUSULA OPCIONAL. Devolvé "" para AMBOS si los documentos NO mencionan
   expresamente un reembolso de energía eléctrica a los locadores. Devolver "" elimina la cláusula del documento.

D) SECCIÓN ALTA MERCURIO
   Completá la sección de Alta Mercurio con los datos de UNO de los locadores — el que aparezca
   como contacto administrativo principal, o el primero mencionado en los documentos del sitio.
   Si los documentos indican explícitamente qué persona gestiona el alta, usá esa persona.

E) FIRMA DEL LOCADOR
   El campo con etiqueta "(nombre del propietario)" o el contexto "___________[CAMPO]" en la sección
   de firmas: si el documento original lista un firmante por locador, completá el campo con el nombre
   del locador principal (el primero alfabéticamente o el indicado como contacto). Para firmas
   adicionales, los slots extra del template ya contienen los otros nombres.` : ""

  return `Sos un asistente especializado en derecho argentino. Tu tarea es completar los campos de un contrato de locación.
${FIELD_GLOSSARY}

DOCUMENTACIÓN DEL ASUNTO:
${docsText}${notesSection}

INSTRUCCIONES — Seguí estos dos pasos:

PASO 1 — ANÁLISIS: Leé los documentos e identificá toda la información disponible:
• Partes: nombre completo, CUIT, DNI, domicilio, estado civil, nacionalidad, rol (locador/locatario)
• Inmueble/sitio: dirección, código de sitio, localidad, provincia, nomenclatura catastral (Parcela, Circunscripción, Sección)
• Fechas: inicio, vencimiento, firma de la propuesta anterior, plazos
• Montos: canon mensual, anual, total del plazo, moneda
${locadorCount && locadorCount > 1 ? `• Locadores: listá CADA propietario con su nombre completo, porcentaje de titularidad, CUIT, DNI, teléfono, domicilio, email` : ""}

PASO 2 — MAPEO: Usá lo identificado en el Paso 1 para completar exactamente estos campos.
Reglas:
- Si encontrás el dato, usalo aunque esté en otro orden o formato
- Copiá los números exactamente tal como aparecen en los documentos — no transponer dígitos (ej: Parcela 548 ≠ 584)
- Fechas completas: formato "DD de mes de AAAA" (ej: "15 de junio de 2026")
- Montos numéricos: solo el número si el contexto ya tiene "U$S" o "$" antes del campo (ej: "14.200", no "USD 14.200")
- Montos en palabras: si el campo pide el equivalente en letras de un monto, calculalo en MAYÚSCULAS (ej: 14.200 = "CATORCE MIL DOSCIENTOS"; 42.600 = "CUARENTA Y DOS MIL SEISCIENTOS")
- Canon anual = canon mensual × 12; canon total = canon anual × años del plazo
- Ciudad de la carta: usá la misma ciudad del inmueble
- Día y mes de la carta: usá el día y mes de inicio del contrato
- Tabla Alta Mercurio: completá con los datos del representante de la locadora (nombre, apellido, DNI, mail, etc.)
- Si no encontrás información para un campo: ""
- No inventes datos sin respaldo en los documentos
${multiLocadorSection}

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
  notes: string,
  locadorCount?: number
): Promise<Record<string, string>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set")
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  // No responseMimeType — text mode lets Gemini reason before producing JSON
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const prompt = buildPrompt(placeholders, extractedTexts, notes, locadorCount)
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
