import PizZip from "pizzip"
import type { Placeholder, LabelPlaceholder, UnderscoredPlaceholder } from "./extractPlaceholders"

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
 * Order matters: & must be escaped FIRST to avoid double-escaping.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

