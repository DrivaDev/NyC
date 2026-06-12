import PizZip from "pizzip"

export interface UnderscoredPlaceholder {
  id: string      // "us_0", "us_1", ... sequential, document order
  context: string // "...BEFORE[CAMPO]AFTER..." local plain-text context
  _runStart: number // offset of <w:r> in full XML
  _runEnd: number   // offset after </w:r>
  _rprXml: string   // inner content of <w:rPr> from original run
}

export interface Placeholder {
  id: string        // "ph_0", "ph_1", ... sequential, document order
  context: string   // paragraph plain-text for Gemini context
  label: string     // original text of the highlighted group (e.g. "COD. SITIO – 00000")
  // Internal — used by fillHighlightPlaceholders for position-based replacement
  _startPos: number // offset of first run's <w:r> in full XML
  _endPos: number   // offset after last run's </w:r> in full XML
  _rprXml: string   // inner content of <w:rPr> from first run (already has w:highlight)
}

export interface LabelPlaceholder {
  id: string
  label: string
  context: string
}

export function loadTemplateXml(filename: string): { zip: PizZip; xml: string } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path")
  const templatePath = path.join(process.cwd(), "templates", filename)
  const content = fs.readFileSync(templatePath) as Buffer
  return extractZipAndXml(content)
}

export function extractXmlFromBuffer(buffer: Buffer): string {
  const zip = new PizZip(buffer)
  return zip.file("word/document.xml")!.asText()
}

function extractZipAndXml(buffer: Buffer): { zip: PizZip; xml: string } {
  const zip = new PizZip(buffer)
  const xml = zip.file("word/document.xml")!.asText()
  return { zip, xml }
}

interface RunInfo {
  full: string
  start: number
  end: number
  isHighlighted: boolean
}

function findAllRuns(xml: string): RunInfo[] {
  const pattern = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g
  const runs: RunInfo[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(xml)) !== null) {
    const full = m[0]
    runs.push({
      full,
      start: m.index,
      end: m.index + full.length,
      isHighlighted:
        full.includes('w:val="yellow"') || full.includes("w:val='yellow'"),
    })
  }
  return runs
}

function extractRprContent(runXml: string): string {
  const m = runXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)
  return m ? m[1] : '<w:highlight w:val="yellow"/>'
}

function groupText(runs: RunInfo[]): string {
  return runs
    .map(r => r.full.replace(/<[^>]+>/g, ""))
    .join("")
    .trim()
}

/**
 * Returns the immediate linguistic position of a placeholder group as
 * "...BEFORE[CAMPO]AFTER..." (plain text, ~80 chars each side).
 * This is far more useful for Gemini than the full paragraph, because
 * multiple placeholders often share the same paragraph (e.g. street,
 * city, province are all in one sentence). With local context, Gemini
 * knows exactly what each blank represents.
 */
function extractLocalContext(xml: string, groupStart: number, groupEnd: number): string {
  const beforeXml = xml.slice(Math.max(0, groupStart - 1500), groupStart)
  const afterXml = xml.slice(groupEnd, Math.min(xml.length, groupEnd + 1500))
  const before = beforeXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(-80)
  const after = afterXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 80)
  return `...${before}[CAMPO]${after}...`
}

/**
 * Extract highlighted run placeholders from OOXML XML string (Adenda strategy).
 *
 * CRITICAL DIFFERENCE from naive approach: consecutive highlighted <w:r> elements
 * are grouped into a single logical placeholder. Real Word documents split a single
 * field like "COD. SITIO – DOMICILIO" across multiple runs for formatting reasons.
 * Treating each run as a separate placeholder produces 75+ meaningless fragments
 * (spaces, dashes, etc.) that Gemini cannot fill.
 */
export function extractHighlightPlaceholders(xml: string): Placeholder[] {
  const runs = findAllRuns(xml)
  const placeholders: Placeholder[] = []
  let phIndex = 0
  let i = 0

  while (i < runs.length) {
    if (!runs[i].isHighlighted) {
      i++
      continue
    }
    // Accumulate consecutive highlighted runs into one group.
    // Break when a paragraph boundary (</w:p>) appears between runs — those
    // belong to different logical fields even if both are highlighted.
    const group: RunInfo[] = [runs[i]]
    let j = i + 1
    while (j < runs.length && runs[j].isHighlighted) {
      const between = xml.slice(runs[j - 1].end, runs[j].start)
      if (between.includes("</w:p>")) break
      group.push(runs[j])
      j++
    }
    i = j

    const label = groupText(group)
    if (!label) continue // skip purely whitespace groups

    const firstRun = group[0]
    const lastRun = group[group.length - 1]
    placeholders.push({
      id: `ph_${phIndex++}`,
      context: extractLocalContext(xml, firstRun.start, lastRun.end),
      label,
      _startPos: firstRun.start,
      _endPos: lastRun.end,
      _rprXml: extractRprContent(firstRun.full),
    })
  }

  return placeholders
}

/**
 * Extract label-based fields from OOXML XML string (AC PF/PJ strategy).
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
        break
      }
    }
  }

  return results
}

/**
 * Extract plain underscore placeholders (6+ consecutive underscores in a non-highlighted run).
 * Used for the letter date header (city, day, month) and other fields that don't use
 * yellow highlight — these are literal underscore characters in the document text.
 */
export function extractUnderscoredPlaceholders(xml: string): UnderscoredPlaceholder[] {
  const pattern = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g
  const results: UnderscoredPlaceholder[] = []
  let m: RegExpExecArray | null
  let idx = 0

  while ((m = pattern.exec(xml)) !== null) {
    const runXml = m[0]
    // Highlighted runs are handled by extractHighlightPlaceholders — skip
    if (runXml.includes('w:val="yellow"') || runXml.includes("w:val='yellow'")) continue

    const text = runXml.replace(/<[^>]+>/g, "")
    // Only process runs that are primarily underscores (6+ consecutive)
    if (!/_{6,}/.test(text)) continue

    const runStart = m.index
    const runEnd = m.index + runXml.length

    const beforeXml = xml.slice(Math.max(0, runStart - 1500), runStart)
    const afterXml = xml.slice(runEnd, Math.min(xml.length, runEnd + 1500))
    const before = beforeXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(-80)
    const after = afterXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 80)

    const rprMatch = runXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)

    results.push({
      id: `us_${idx++}`,
      context: `...${before}[CAMPO]${after}...`,
      _runStart: runStart,
      _runEnd: runEnd,
      _rprXml: rprMatch ? rprMatch[1] : "",
    })
  }

  return results
}
