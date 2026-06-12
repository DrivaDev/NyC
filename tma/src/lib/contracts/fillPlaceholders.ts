import PizZip from "pizzip"
import type { Placeholder, LabelPlaceholder } from "./extractPlaceholders"

/**
 * Fill highlighted run placeholders in OOXML XML string (Adenda strategy).
 * Replaces <w:t> content inside each highlighted <w:r>, preserving <w:highlight>.
 * Uses REVERSE ORDER replacement to preserve string indices (RESEARCH.md Pitfall 4).
 * Always escapes XML special characters in values.
 *
 * @param xml          The original document.xml string
 * @param values       Map of placeholder_id → string value (empty string = leave blank)
 * @param placeholders Array from extractHighlightPlaceholders (same order as extraction)
 * @returns            Modified XML string with replacements applied
 */
export function fillHighlightPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: Placeholder[]
): string {
  // Re-scan the XML to find all highlighted run positions (mirrors extraction logic)
  const runPattern = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g
  const positions: Array<{ start: number; end: number; phId: string }> = []
  let match: RegExpExecArray | null
  let phIndex = 0

  while ((match = runPattern.exec(xml)) !== null) {
    const runContent = match[1]
    if (
      runContent.includes('w:val="yellow"') ||
      runContent.includes("w:val='yellow'")
    ) {
      if (phIndex < placeholders.length) {
        positions.push({
          start: match.index,
          end: match.index + match[0].length,
          phId: `ph_${phIndex++}`,
        })
      }
    }
  }

  // Replace from end to start to preserve earlier string indices
  let result = xml
  for (let i = positions.length - 1; i >= 0; i--) {
    const { start, end, phId } = positions[i]
    const value = values[phId] ?? ""
    const originalRun = result.slice(start, end)
    // Replace ONLY <w:t>...</w:t> content; keep <w:rPr> with highlight intact
    const filled = originalRun.replace(
      /<w:t[^>]*>[\s\S]*?<\/w:t>/,
      `<w:t>${escapeXml(value)}</w:t>`
    )
    result = result.slice(0, start) + filled + result.slice(end)
  }
  return result
}

/**
 * Fill label-based placeholders for AC PF/PJ templates (D-09).
 * For each label match, replaces the <w:t> content of the run immediately
 * following the label run in the same paragraph.
 */
export function fillLabelPlaceholders(
  xml: string,
  values: Record<string, string>,
  placeholders: LabelPlaceholder[]
): string {
  let result = xml
  // Process in reverse order to preserve string indices
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const ph = placeholders[i]
    const value = values[ph.id] ?? ""
    // Find the label run followed by a value run in the same paragraph context
    const labelRegex = new RegExp(
      `(<w:t[^>]*>${escapeRegex(ph.label)}:?\\s*<\\/w:t>\\s*)(<w:r\\b[^>]*>[\\s\\S]*?<w:t[^>]*>)[\\s\\S]*?(<\\/w:t>[\\s\\S]*?<\\/w:r>)`
    )
    result = result.replace(labelRegex, `$1$2${escapeXml(value)}$3`)
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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
