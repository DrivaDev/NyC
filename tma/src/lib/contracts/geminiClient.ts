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

— IDENTIFICACIÓN DE PARTES —
- NOMBRE DEL LOCADOR / NOMBRE / RAZÓN SOCIAL: nombre completo (persona física) o razón social (PJ) del propietario/locador
- CUIT DEL LOCADOR / CUIT: número de CUIT del locador (11 dígitos sin guiones, ej: 27252640555)
- DOMICILIO DEL LOCADOR / DOMICILIO: domicilio legal completo del locador
- DNI / D.N.I.: número de documento nacional de identidad del locador

— SITIO / INMUEBLE —
- COD. SITIO / CÓDIGO DE SITIO: código alfanumérico del sitio/antena (ej: BS316). En el sistema aparece como "Código de Sitio".
- CÓDIGO DE EMPLAZAMIENTO / COD. EMPLAZ.: código de emplazamiento ARBA (ej: ARBA11514). En el sistema aparece como "Código de Emplazamiento".
- N° ASUNTO / NÚMERO DE ASUNTO: número del expediente en el sistema de gestión SIN puntos ni comas (ej: si el sistema muestra "1.803.619" → usar "1803619"). En el sistema aparece como "Número".
- NOMBRE FANTASÍA DEL SITIO: nombre comercial del sitio (ej: FLORENCIO VARELA). En el sistema aparece como "Nombre fantasía del Sitio".
- REF. / CÓDIGO OFERTA (campo compuesto): construído combinando CÓD.SITIO + CÓD.EMPLAZ. + N°ASUNTO, formato exacto: "{COD_SITIO} – {COD_EMPLAZ} – {N_ASUNTO_SIN_PUNTOS}" (ej: "BS316 – ARBA11514 – 1803619")
- ENCABEZADO ADENDA / TÍTULO PROPUESTA (campo compuesto): combina CÓD.SITIO + NOMBRE_FANTASÍA + CÓD.EMPLAZ. + N°ASUNTO, formato: "{COD_SITIO} – {NOMBRE_FANTASÍA} – {COD_EMPLAZ} – {N_ASUNTO}" (ej: "BS316 – FLORENCIO VARELA – ARBA11514 – 1803619")
- DIRECCIÓN COMPLETA DEL INMUEBLE (campo único en la carta introductoria, contexto "sito en[CAMPO]tengo el agrado"): incluir en UN SOLO campo: calle y número, Localidad de X, Provincia de Y, y entre paréntesis la Nomenclatura Catastral. Ej: "Avenida Eva Perón N°6044, Localidad de Florencio Varela, Provincia de Buenos Aires (Nomenclatura Catastral: Circunscripción II, Parcela 584)"
- CALLE / DIRECCIÓN DEL INMUEBLE (en la Propuesta, campos separados): solo la calle y número del inmueble/sitio
- LOCALIDAD / CIUDAD DEL INMUEBLE: ciudad o localidad donde se ubica el inmueble
- PROVINCIA DEL INMUEBLE: provincia donde se ubica el inmueble
- NOMENCLATURA CATASTRAL / PARCELA: datos catastrales del inmueble (Circunscripción, Parcela, Sección, Manzana según disponibilidad). En el sistema aparecen como "Datos catastrales".

— FECHAS Y PLAZOS —
- FECHA DE INICIO / FECHA DE COMIENZO: fecha en que comienza el NUEVO período (ej: "1 de mayo de 2026"). En el sistema: "Fecha de inicio".
- FECHA DE VENCIMIENTO / FECHA DE FIN: fecha en que vence el período (ej: "31 de julio de 2026"). En el sistema: "Fecha de finalización".
- PLAZO / PERÍODO / MESES: duración en meses del período (solo el número, ej: "3"). En el sistema: "Vigencia total en meses".
- FECHA PROPUESTA ANTERIOR: fecha en que el locador envió la propuesta original que ahora se renueva. Es la "Fecha de Inicio Vigencia Contrato Anterior" EN EL SISTEMA menos 1 día (ej: si el contrato anterior inició el 1/5/2025 → la propuesta fue enviada el "30 de abril de 2025").

— MONTOS Y PAGOS —
- CANON / MONTO DEL ALQUILER: importe total pactado para este período. En el sistema: "Monto Total Canon" o "Monto anual" (para extensiones cortas puede ser el monto proporcional). Si hay observación "ES UN PAGO TOTAL POR LOS X MESES", ese es el canon a pagar.
- CANON EN PALABRAS: el monto anterior expresado en letras en MINÚSCULAS (ej: 2.250.000 → "dos millones doscientos cincuenta mil")
- CANON ANUAL BASE / PRECIO ANUAL: importe anual base del alquiler (para calcular proporcionales). En el sistema puede estar en las observaciones como "BASE ANUAL DE $ X".
- CANON ANUAL EN PALABRAS: el canon anual base expresado en letras en MAYÚSCULAS
- CANON TOTAL DEL PLAZO: suma total a pagar por todo el período (= canon mensual × meses)
- CANON TOTAL EN PALABRAS: el canon total expresado en letras en MAYÚSCULAS
- DATOS BANCARIOS COMPLETOS (campo compuesto, contexto "cuenta que designa la Locadora:[CAMPO]"): incluir en UN SOLO campo toda la información bancaria en formato: "Banco {BANCO}, Sucursal {N°_SUC} – {NOMBRE_SUC}, Cuenta Corriente/Caja de Ahorro N°{NRO_CUENTA}, a nombre de {TITULAR}, CBU {CBU}, y CUIT N°{CUIT_CUENTA}". En el sistema: "Banco", "Sucursal", "Tipo de cuenta", "Cuenta", "CBU", "CUIL/CUIT", "Cesión de Contrato a" (el titular de la cuenta).

— MERCURIO / PROVEEDOR —
- ALTA MERCURIO - NOMBRE: primer nombre de la persona que usará Mercurio-Proveedores (el sistema indica "Nombre de la persona que será usuaria en Mercurio"). En el sistema: campo "Nombre" de la sección "Fact. Mercurio".
- ALTA MERCURIO - APELLIDO: apellido de esa persona. En el sistema: campo "Apellido" de "Fact. Mercurio".
- ALTA MERCURIO - MÓVIL: teléfono celular de esa persona. En el sistema: campo "Móvil" de "Fact. Mercurio".
- ALTA MERCURIO - DNI: DNI de esa persona. En el sistema: campo "DNI" de "Fact. Mercurio".
- ALTA MERCURIO - CUIL: CUIL de esa persona (11 dígitos sin guiones). En el sistema: campo "CUIL" de "Fact. Mercurio".
- ALTA MERCURIO - MAIL: correo electrónico donde Mercurio enviará las comunicaciones. En el sistema: campo "Mail donde serán recibidas las comunicaciones de M..." de "Fact. Mercurio".
- ALTA MERCURIO - CUIT EMPRESA: CUIT de la empresa que emitirá las facturas (11 dígitos sin guiones). En el sistema: campo "CUIT de la empresa que factura" de "Fact. Mercurio".
- ALTA MERCURIO - RAZÓN SOCIAL EMPRESA: nombre de la empresa/persona que factura. En el sistema: campo "Razón Social que factura" de "Fact. Mercurio".

— FIRMA DE LA CARTA —
- NOMBRE DEL PROPIETARIO (campo de firma en la carta introductoria, contexto "__________[CAMPO]"): nombre completo del propietario que firma, seguido de " – Propietario" o " – Propietaria". Para multi-locador, el primer locador mencionado. Ej: "Roberto Fabián Zanet – Propietario".`

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
• Inmueble/sitio: nombre fantasía, dirección (calle y N°), localidad, provincia, nomenclatura catastral (Parcela, Circunscripción, Sección, Manzana) — copiá los números exactamente
• Códigos: Código de Sitio, Código de Emplazamiento, Número de Asunto (sin puntos)
• Fechas: inicio del NUEVO período, fin del nuevo período, fecha de la Propuesta Anterior (= día antes del inicio del contrato anterior)
• Montos: "Monto Total Canon" o "Monto anual" del período actual; observá si hay base anual indicada en observaciones
• Datos bancarios: banco, sucursal (número y nombre), tipo de cuenta, N° de cuenta, CBU, CUIT de la cuenta, titular (cesionario del contrato)
• Mercurio: nombre, apellido, DNI, móvil, CUIL, mail, CUIT empresa, razón social — de la sección "Fact. Mercurio" o equivalente
${locadorCount && locadorCount > 1 ? `• Locadores: listá CADA propietario con su nombre completo, porcentaje de titularidad, CUIT, DNI, teléfono, domicilio, email` : ""}

PASO 2 — MAPEO: Usá lo identificado en el Paso 1 para completar exactamente estos campos.
Reglas:
- Si encontrás el dato, usalo aunque esté en otro orden o formato
- NUNCA transponer dígitos — copiá números exactamente como aparecen (Parcela 584 no es 548)
- Fechas completas: formato "DD de mes de AAAA" (ej: "15 de junio de 2026")
- Montos con puntos de miles: "2.250.000" (no "2250000")
- Montos en palabras: en minúsculas (ej: 2.250.000 → "dos millones doscientos cincuenta mil")
- Campo REF./CÓDIGO OFERTA (contexto "Código Oferta:[CAMPO]" o similares): formato "{CÓD_SITIO} – {CÓD_EMPLAZ} – {N°ASUNTO}" donde el N° ASUNTO NO lleva puntos (ej: "BS316 – ARBA11514 – 1803619")
- Campo ENCABEZADO ADENDA (contexto "ADENDA POR EXTENSION DEL PLAZO[CAMPO]"): formato "{CÓD_SITIO} – {NOMBRE_FANTASÍA} – {CÓD_EMPLAZ} – {N°ASUNTO}" (ej: "BS316 – FLORENCIO VARELA – ARBA11514 – 1803619")
- Campo dirección del inmueble en la CARTA (contexto "sito en la calle[CAMPO]tengo el agrado"): un único valor que incluye calle, localidad, provincia Y nomenclatura catastral, ej: "Avenida Eva Perón N°6044, Localidad de Florencio Varela, Provincia de Buenos Aires (Nomenclatura Catastral: Circunscripción II, Parcela 584)"
- Campo datos bancarios (contexto "cuenta que designa la Locadora:[CAMPO]"): un único valor con banco + sucursal + tipo + N°cuenta + titular + CBU + CUIT, ej: "Banco Macro, Sucursal 468 – Martinez Alto, Cuenta Corriente N°346800766793100, a nombre de Vanina Andrea Zanet, CBU 2850468530007667931006, y CUIT N°27252640555"
- Campo firma (contexto "_______[CAMPO]" al final de la carta): nombre del signatario + " – Propietario/a" (ej: "Roberto Fabián Zanet – Propietario")
- Tabla Alta Mercurio (campos con contexto "Mercurio" o "CUIL", "Razón Social que factura", etc.): completá con los datos exactos de la sección "Fact. Mercurio" del sistema
- Canon total del período: si las observaciones dicen "ES UN PAGO TOTAL POR LOS X MESES", ese es el precio a usar para la suma total. El campo "El precio del alquiler se pacta en la suma de $[CAMPO]" debe tener ese total (ej: 2.250.000)
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
