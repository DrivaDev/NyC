import PizZip from "pizzip"
import type { Placeholder, LabelPlaceholder, UnderscoredPlaceholder } from "./extractPlaceholders"
export { extractHighlightPlaceholders } from "./extractPlaceholders"

/**
 * A single XML edit: replace the region [start, end) with `replacement`.
 * For pure insertions, start === end (zero-width).
 */
export interface Splice {
  start: number
  end: number
  replacement: string
}

/**
 * Apply a batch of splices to an XML string in ONE pass.
 *
 * CRITICAL: all splice offsets are computed against the SAME original string.
 * Applying them descending by start position keeps every not-yet-applied offset
 * valid (we only ever mutate regions AFTER the ones still pending). This is the
 * ONLY correct way to combine highlight + underscored + label fills — chaining
 * separate passes corrupts the document because each pass shifts byte offsets the
 * next pass still assumes are original (root cause of the "<w:sz w:" truncation).
 */
export function applySplices(xml: string, splices: Splice[]): string {
  const sorted = [...splices].sort((a, b) => b.start - a.start)
  let result = xml
  for (const s of sorted) {
    result = result.slice(0, s.start) + s.replacement + result.slice(s.end)
  }
  return result
}

/**
 * Fill highlighted run placeholders in OOXML XML string (Adenda strategy).
 *
 * Uses position-based replacement: each Placeholder stores _startPos/_endPos
 * covering the ENTIRE group of consecutive highlighted runs (which Word splits
 * for formatting reasons). The whole group is collapsed into one run with the
 * Gemini value and the original <w:rPr> (including w:highlight).
 *
 * If Gemini returns "" for a field, the original placeholder label is kept (still
 * highlighted yellow) so unfilled fields remain visually obvious.
 *
 * @param xml          The original document.xml string
 * @param values       Map of placeholder_id → string value from Gemini
 * @param placeholders Array from extractHighlightPlaceholders (carries position data)
 * @returns            Modified XML string with replacements applied
 */
export function buildHighlightSplices(
  values: Record<string, string>,
  placeholders: Placeholder[]
): Splice[] {
  return placeholders.map(ph => {
    const value = values[ph.id]
    // If Gemini filled it use the value; otherwise keep original label (highlighted yellow)
    const fillText =
      value !== undefined && value.trim() !== "" ? value : ph.label
    // Collapse entire run group into one run with original formatting + new text
    const newRun = `<w:r><w:rPr>${stripUnderline(ph._rprXml)}</w:rPr><w:t xml:space="preserve">${escapeXml(fillText)}</w:t></w:r>`
    return { start: ph._startPos, end: ph._endPos, replacement: newRun }
  })
}

export function fillHighlightPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: Placeholder[]
): string {
  return applySplices(xml, buildHighlightSplices(values, placeholders))
}

/**
 * Fill plain underscore placeholders (city/day/month date header and similar fields).
 * Keeps original underscores if Gemini returns "" (field stays visually blank).
 */
export function buildUnderscoredSplices(
  values: Record<string, string>,
  placeholders: UnderscoredPlaceholder[]
): Splice[] {
  const splices: Splice[] = []
  for (const ph of placeholders) {
    const value = values[ph.id]
    if (!value || !value.trim()) continue
    const newRun = `<w:r><w:rPr>${stripUnderline(ph._rprXml)}</w:rPr><w:t xml:space="preserve"> ${escapeXml(value.trim())} </w:t></w:r>`
    splices.push({ start: ph._runStart, end: ph._runEnd, replacement: newRun })
  }
  return splices
}

export function fillUnderscoredPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: UnderscoredPlaceholder[]
): string {
  return applySplices(xml, buildUnderscoredSplices(values, placeholders))
}

/**
 * Fill label-based placeholders for AC PF/PJ templates.
 *
 * In AC templates each form field is a yellow-highlighted paragraph ending with ":".
 * Filling inserts a new <w:r> run with the value just before </w:p>, appending the
 * value text to the label on the same line. Underline is stripped from the rPr so
 * the filled value has no underline (only the label remains underlined).
 *
 * Uses position-based replacement (reverse order) to preserve indices.
 */
export function buildLabelSplices(
  values: Record<string, string>,
  placeholders: LabelPlaceholder[]
): Splice[] {
  const splices: Splice[] = []
  for (const ph of placeholders) {
    const value = values[ph.id]
    if (!value || !value.trim()) continue
    const newRun = `<w:r><w:rPr>${stripUnderline(ph._rprXml)}</w:rPr><w:t xml:space="preserve"> ${escapeXml(value.trim())}</w:t></w:r>`
    // Zero-width insertion just before </w:p>
    splices.push({ start: ph._insertPos, end: ph._insertPos, replacement: newRun })
  }
  return splices
}

export function fillLabelPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: LabelPlaceholder[]
): string {
  return applySplices(xml, buildLabelSplices(values, placeholders))
}

/**
 * Write modifiedXml back into the zip and generate a Node.js Buffer.
 * CRITICAL: pizzip is synchronous — generate({ type: "nodebuffer" }) is sync.
 */
export function generateDocxBuffer(zip: PizZip, modifiedXml: string): Buffer {
  zip.file("word/document.xml", modifiedXml)
  return zip.generate({ type: "nodebuffer" }) as Buffer
}

/** Strip underline from rPr so inserted values don't inherit label underline styling. */
function stripUnderline(rprXml: string): string {
  return rprXml.replace(/<w:u\b[^>]*\/?>/g, "")
}

/**
 * Escape XML reserved characters for safe insertion into <w:t> content.
 * Also strips characters that are invalid in XML 1.0 (e.g. control chars
 * that LLMs occasionally embed in output). Order matters: & first.
 *
 * Valid XML 1.0 chars: U+0009, U+000A, U+000D, U+0020–U+D7FF, U+E000–U+FFFD.
 */
// Windows-1252 → Unicode map for the C1 range (0x80-0x9F). Gemini emits these raw
// when it mis-decodes CP1252 smart-punctuation in source PDFs/docx. Map the common
// ones to their proper Unicode so contract text stays readable; the rest get dropped.
const CP1252_C1: Record<number, string> = {
  0x80: "€", 0x82: "‚", 0x83: "ƒ", 0x84: "„", 0x85: "…", 0x86: "†", 0x87: "‡",
  0x88: "ˆ", 0x89: "‰", 0x8a: "Š", 0x8b: "‹", 0x8c: "Œ", 0x8e: "Ž", 0x91: "‘",
  0x92: "’", 0x93: "“", 0x94: "”", 0x95: "•", 0x96: "–", 0x97: "—", 0x98: "˜",
  0x99: "™", 0x9a: "š", 0x9b: "›", 0x9c: "œ", 0x9e: "ž", 0x9f: "Ÿ",
}

export function escapeXml(str: string): string {
  // Whitelist XML 1.0 valid chars: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
  // Handles surrogate pairs for supplementary chars; strips lone surrogates and all other invalid code points.
  let sanitized = ""
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    // Repair Windows-1252 C1 mojibake before whitelist (else these would be dropped)
    if (c >= 0x80 && c <= 0x9f) {
      const mapped = CP1252_C1[c]
      if (mapped) sanitized += mapped
      continue
    }
    if (c >= 0xD800 && c <= 0xDBFF) {
      const next = str.charCodeAt(i + 1)
      if (next >= 0xDC00 && next <= 0xDFFF) { sanitized += str[i] + str[i + 1]; i++ }
      // else: lone high surrogate — drop
      continue
    }
    if (c >= 0xDC00 && c <= 0xDFFF) continue // lone low surrogate — drop
    // Drop DEL (0x7F) and C1 control chars (0x80-0x9F): XML 1.0 technically permits
    // them but Word's parser rejects them. They appear as Windows-1252 mojibake when
    // Gemini reads PDFs/docx with mis-decoded smart quotes, dashes, ellipsis, etc.
    if (
      c === 0x09 ||
      c === 0x0A ||
      c === 0x0D ||
      (c >= 0x20 && c <= 0x7e) ||
      (c >= 0xa0 && c <= 0xd7ff) ||
      (c >= 0xe000 && c <= 0xfffd)
    ) {
      sanitized += str[i]
    }
    // else: drop (C0/C1 control chars, DEL, U+FFFE, U+FFFF)
  }
  return sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Clone the locador identification row in the first <w:tbl> N-1 times (CONTR-11).
 *
 * The AC PF / AC PJ templates have the locador identification data in the FIRST
 * <w:tbl>, which contains exactly one <w:tr>. For N locadores we append N-1 copies
 * of that row just before </w:tbl>. Each clone gets fresh w14:paraId and w14:textId
 * values so Word does not silently "repair" the document (duplicate paraIds are
 * invalid per the OOXML schema).
 *
 * Placeholder IDs are NOT in the template — they are assigned later by
 * extractLabelPlaceholders running on the resulting multi-row XML, which yields
 * sequential lph_0..lph_(fieldCount*N-1). The caller maps each locador's range.
 *
 * @param xml          The template document.xml string
 * @param locadorCount Total number of locadores (N). N<=1 returns xml unchanged.
 * @returns            XML with the locador row repeated N times
 */
export function cloneLocadorRow(xml: string, locadorCount: number): string {
  if (locadorCount <= 1) return xml

  const tblStart = xml.indexOf("<w:tbl>")
  if (tblStart === -1) throw new Error("Plantilla sin <w:tbl> — no es un modelo AC válido")
  const tblEndIdx = xml.indexOf("</w:tbl>", tblStart)
  if (tblEndIdx === -1) throw new Error("Plantilla con <w:tbl> sin cierre </w:tbl>")

  const tblXml = xml.slice(tblStart, tblEndIdx)
  const trMatch = tblXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/)
  if (!trMatch) throw new Error("No se encontró <w:tr> en la tabla de identificación de locadores")
  const originalRow = trMatch[0]

  let idSeed = 0xa0000000 // start above typical document-generated paraIds
  const nextId = () => `${(idSeed++).toString(16).toUpperCase().padStart(8, "0")}`

  // Find max bookmark ID in full document so clones get unique IDs (OOXML forbids duplicate w:id)
  let maxBmId = 0
  for (const m of xml.matchAll(/<w:bookmark(?:Start|End)\b[^>]*\bw:id="(\d+)"/g)) {
    const id = parseInt(m[1], 10)
    if (id > maxBmId) maxBmId = id
  }

  let clones = ""
  for (let i = 1; i < locadorCount; i++) {
    let clone = originalRow
    clone = clone.replace(/w14:paraId="[^"]+"/g, () => `w14:paraId="${nextId()}"`)
    clone = clone.replace(/w14:textId="[^"]+"/g, () => `w14:textId="${nextId()}"`)
    // Remap bookmark IDs: collect unique IDs in this clone, assign fresh ones
    const bmIds = new Set([...clone.matchAll(/<w:bookmarkStart\b[^>]*\bw:id="(\d+)"/g)].map(m => m[1]))
    const bmIdMap = new Map<string, string>()
    for (const id of bmIds) {
      bmIdMap.set(id, String(++maxBmId))
    }
    if (bmIdMap.size > 0) {
      clone = clone.replace(/(<w:bookmark(?:Start|End)\b[^>]*\bw:id=")(\d+)"/g, (_, prefix, id) =>
        `${prefix}${bmIdMap.get(id) ?? id}"`
      )
    }
    clones += clone
  }

  // Insert clones immediately before </w:tbl> so they become additional rows
  return xml.slice(0, tblEndIdx) + clones + xml.slice(tblEndIdx)
}

/**
 * Adapt nominative singular references to plural for multi-locador Adenda models (CONTR-12, D-07).
 *
 * Only the nominative forms are touched: "el LOCADOR" → "los LOCADORES" and
 * "El LOCADOR" → "Los LOCADORES". Prepositional contractions ("del LOCADOR",
 * "al LOCADOR") are intentionally left untouched per D-07 to avoid altering
 * clauses, numbering, or structure. The leading \b word boundary prevents the
 * regex from matching the "el LOCADOR" substring inside "del LOCADOR".
 *
 * Applied to the raw template XML BEFORE placeholder extraction and Gemini (D-08),
 * so Gemini receives already-plural prose and cannot reintroduce the singular form.
 *
 * @param xml The template document.xml string
 * @returns   XML with nominative LOCADOR references pluralized
 */
export function pluralizeLocadorRefs(xml: string): string {
  return xml
    .replace(/\bEl LOCADOR\b/g, "Los LOCADORES")
    .replace(/\bel LOCADOR\b/g, "los LOCADORES")
}

