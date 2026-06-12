import PizZip from "pizzip"

export interface Placeholder {
  id: string      // "ph_0", "ph_1", ... assigned in document order
  context: string // plain-text content of surrounding <w:p> paragraph (XML tags stripped)
}

export interface LabelPlaceholder {
  id: string    // "lph_0", "lph_1", ...
  label: string // "Nombre", "CUIT", "Domicilio", etc. (without the colon)
  context: string
}

/**
 * Load a .docx from disk by filename and return { zip, xml } synchronously.
 * CRITICAL: pizzip is synchronous — never use .async().
 * Reads from process.cwd()/public/templates/{filename}
 */
export function loadTemplateXml(filename: string): { zip: PizZip; xml: string } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path")
  const templatePath = path.join(process.cwd(), "public", "templates", filename)
  const content = fs.readFileSync(templatePath) as Buffer
  return extractZipAndXml(content)
}

/**
 * Extract document.xml string from a raw docx Buffer.
 * Used in unit tests to avoid filesystem dependency.
 */
export function extractXmlFromBuffer(buffer: Buffer): string {
  const zip = new PizZip(buffer)
  return zip.file("word/document.xml")!.asText()
}

/**
 * Same as extractXmlFromBuffer but also returns the zip for later modification.
 */
function extractZipAndXml(buffer: Buffer): { zip: PizZip; xml: string } {
  const zip = new PizZip(buffer)
  const xml = zip.file("word/document.xml")!.asText()
  return { zip, xml }
}

/**
 * Extract highlighted run placeholders from OOXML XML string (Adenda strategy — D-10, CONTR-07).
 * Finds all <w:r> elements where <w:rPr> contains <w:highlight w:val="yellow"/>.
 * Assigns sequential IDs: ph_0, ph_1, ...
 *
 * Each highlighted run becomes one Placeholder with:
 *   - id: "ph_N" (sequential, document order)
 *   - context: plain text of the surrounding <w:p> paragraph (XML tags stripped)
 */
export function extractHighlightPlaceholders(xml: string): Placeholder[] {
  const runPattern = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g
  const placeholders: Placeholder[] = []
  let match: RegExpExecArray | null
  let index = 0

  while ((match = runPattern.exec(xml)) !== null) {
    const runContent = match[1]
    if (
      runContent.includes('w:val="yellow"') ||
      runContent.includes("w:val='yellow'")
    ) {
      placeholders.push({
        id: `ph_${index++}`,
        context: extractSurroundingParagraphText(xml, match.index),
      })
    }
  }
  return placeholders
}

/**
 * Extract label-based fields from OOXML XML string (AC PF/PJ strategy — D-09).
 * Identifies <w:t> elements whose content matches known Argentine legal form labels.
 * Known labels: Nombre, CUIT, Domicilio, Nacionalidad, Estado civil, Cargo, Empresa,
 *               Denominación, Representante
 *
 * Returns each match as a LabelPlaceholder with { id, label, context }.
 */
export function extractLabelPlaceholders(xml: string): LabelPlaceholder[] {
  const KNOWN_LABELS = [
    "Nombre",
    "CUIT",
    "Domicilio",
    "Nacionalidad",
    "Estado civil",
    "Cargo",
    "Empresa",
    "Denominación",
    "Representante",
  ]

  const paragraphPattern = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g
  const results: LabelPlaceholder[] = []
  let pMatch: RegExpExecArray | null
  let index = 0

  while ((pMatch = paragraphPattern.exec(xml)) !== null) {
    const paraContent = pMatch[1]
    const tPattern = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g
    let tMatch: RegExpExecArray | null

    while ((tMatch = tPattern.exec(paraContent)) !== null) {
      const raw = tMatch[1].trim()
      // Strip trailing colon for label matching
      const labelText = raw.replace(/:$/, "").trim()

      const matched = KNOWN_LABELS.find(
        l => l.toLowerCase() === labelText.toLowerCase()
      )

      if (matched) {
        results.push({
          id: `lph_${index++}`,
          label: matched,
          context: paraContent.replace(/<[^>]+>/g, "").trim(),
        })
        break // Only one label per paragraph
      }
    }
  }

  return results
}

/**
 * Strip XML tags from the paragraph containing the run at runPosition.
 * Returns plain text for Gemini context.
 */
function extractSurroundingParagraphText(xml: string, runPosition: number): string {
  const before = xml.lastIndexOf("<w:p", runPosition)
  const after = xml.indexOf("</w:p>", runPosition)
  if (before === -1 || after === -1) return ""
  const paragraph = xml.slice(before, after + 6)
  return paragraph.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}
