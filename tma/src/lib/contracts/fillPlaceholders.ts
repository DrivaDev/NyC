import PizZip from "pizzip"
import type { Placeholder, LabelPlaceholder, UnderscoredPlaceholder } from "./extractPlaceholders"
export { extractHighlightPlaceholders } from "./extractPlaceholders"

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
export function fillHighlightPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: Placeholder[]
): string {
  let result = xml
  // Reverse order to preserve string indices of earlier placeholders
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const ph = placeholders[i]
    const value = values[ph.id]
    // If Gemini filled it use the value; otherwise keep original label (highlighted yellow)
    const fillText =
      value !== undefined && value.trim() !== "" ? value : ph.label

    // Collapse entire run group into one run with original formatting + new text
    const newRun = `<w:r><w:rPr>${stripUnderline(ph._rprXml)}</w:rPr><w:t xml:space="preserve">${escapeXml(fillText)}</w:t></w:r>`
    result = result.slice(0, ph._startPos) + newRun + result.slice(ph._endPos)
  }
  return result
}

/**
 * Fill plain underscore placeholders (city/day/month date header and similar fields).
 * Keeps original underscores if Gemini returns "" (field stays visually blank).
 */
export function fillUnderscoredPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: UnderscoredPlaceholder[]
): string {
  let result = xml
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const ph = placeholders[i]
    const value = values[ph.id]
    if (!value || !value.trim()) continue
    const newRun = `<w:r><w:rPr>${stripUnderline(ph._rprXml)}</w:rPr><w:t xml:space="preserve"> ${escapeXml(value.trim())} </w:t></w:r>`
    result = result.slice(0, ph._runStart) + newRun + result.slice(ph._runEnd)
  }
  return result
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
export function fillLabelPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: LabelPlaceholder[]
): string {
  let result = xml
  // Process in reverse order so earlier _insertPos values stay valid
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const ph = placeholders[i]
    const value = values[ph.id]
    if (!value || !value.trim()) continue

    const newRun = `<w:r><w:rPr>${stripUnderline(ph._rprXml)}</w:rPr><w:t xml:space="preserve"> ${escapeXml(value.trim())}</w:t></w:r>`
    result = result.slice(0, ph._insertPos) + newRun + result.slice(ph._insertPos)
  }
  return result
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
export function escapeXml(str: string): string {
  // Strip XML 1.0 invalid chars via char codes to avoid regex encoding pitfalls
  let sanitized = ""
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    if (c <= 0x0008 || c === 0x000B || c === 0x000C || (c >= 0x000E && c <= 0x001F) || c === 0xFFFE || c === 0xFFFF) continue
    sanitized += str[i]
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

