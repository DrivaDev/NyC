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
  label: string     // semantic label WITHOUT colon (e.g. "Domicilio")
  context: string   // full paragraph text WITH colon (e.g. "Domicilio:") — sent to Gemini
  // Internal — used by fillLabelPlaceholders for position-based insertion
  _insertPos: number  // offset where new value run is inserted (just before </w:p>)
  _rprXml: string     // inner <w:rPr> from first run in paragraph (formats the value run)
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
  // 4000-char window on the BEFORE side so table-cell label text (Mercurio rows, etc.)
  // is captured even when the label lives in a separate cell column with verbose XML overhead.
  const beforeXml = xml.slice(Math.max(0, groupStart - 4000), groupStart)
  const afterXml = xml.slice(groupEnd, Math.min(xml.length, groupEnd + 1500))
  const before = beforeXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(-120)
  const after = afterXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 120)
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
 *
 * In AC templates the LABELS themselves are yellow-highlighted and underlined.
 * Each form field is a paragraph whose entire text is highlighted and ends with ":".
 * The value is appended AFTER the label text within the same paragraph.
 *
 * This replaces the old KNOWN_LABELS allowlist approach which only caught ~3 fields
 * and was designed for a different template structure.
 */
export function extractLabelPlaceholders(xml: string): LabelPlaceholder[] {
  const paragraphPattern = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g
  const results: LabelPlaceholder[] = []
  let m: RegExpExecArray | null
  let idx = 0

  while ((m = paragraphPattern.exec(xml)) !== null) {
    const paraXml = m[0]

    // Only process paragraphs that have yellow-highlighted runs
    if (!paraXml.includes('w:val="yellow"') && !paraXml.includes("w:val='yellow'")) continue

    // Extract plain text from all <w:t> elements in this paragraph
    const text = paraXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()

    // Must end with ":" — that's what makes it a form field label
    if (!text.endsWith(":")) continue

    const label = text.replace(/:+\s*$/, "").trim()
    if (!label) continue

    // _insertPos: just before </w:p> — this is where the value run goes
    const pEnd = m.index + m[0].length
    const insertPos = pEnd - "</w:p>".length

    // rPr from first run in paragraph — preserves yellow + underline formatting on value
    const rprMatch = paraXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)

    results.push({
      id: `lph_${idx++}`,
      label,
      context: text,   // "Domicilio:" or full verbose label
      _insertPos: insertPos,
      _rprXml: rprMatch ? rprMatch[1] : "",
    })
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

    // Skip decorative signature/separator underscores: find containing paragraph and
    // check if it has ANY readable text besides underscores. Pure-underscore paragraphs
    // (signature lines, decorative rules) should not be sent to Gemini as fillable fields.
    const paraStartIdx = xml.lastIndexOf("<w:p ", runStart)
    const paraEndIdx = xml.indexOf("</w:p>", runStart) + "</w:p>".length
    if (paraStartIdx !== -1 && paraEndIdx > paraStartIdx) {
      const paraText = xml
        .slice(paraStartIdx, paraEndIdx)
        .replace(/<[^>]+>/g, "")
        .replace(/_+/g, "")
        .replace(/\s+/g, "")
        .trim()
      if (!paraText) continue // purely decorative — skip
    }

    const beforeXml = xml.slice(Math.max(0, runStart - 4000), runStart)
    const afterXml = xml.slice(runEnd, Math.min(xml.length, runEnd + 1500))
    const before = beforeXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(-120)
    const after = afterXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 120)

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
