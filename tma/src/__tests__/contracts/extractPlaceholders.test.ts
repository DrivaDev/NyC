import { describe, it, expect } from "vitest"
import { ADENDA_XML, AC_PF_XML, AC_PF_TABLE_XML, createAdendaFixture } from "../fixtures/createFixtures"

describe("extractHighlightPlaceholders (CONTR-07)", () => {
  it("returns array with one entry per yellow-highlighted run", async () => {
    // Import will fail until Wave 1 creates the file — that's expected (RED)
    const { extractHighlightPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extractHighlightPlaceholders(ADENDA_XML)
    expect(placeholders).toHaveLength(2)
    expect(placeholders[0].id).toBe("ph_0")
    expect(placeholders[1].id).toBe("ph_1")
  })

  it("each placeholder includes surrounding paragraph text as context", async () => {
    const { extractHighlightPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extractHighlightPlaceholders(ADENDA_XML)
    // context should be non-empty string (stripped XML)
    expect(placeholders[0].context.length).toBeGreaterThan(0)
  })

  it("runs without yellow highlight are not included", async () => {
    const { extractHighlightPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extractHighlightPlaceholders(ADENDA_XML)
    // ADENDA_XML has 3 paragraphs; only 2 are highlighted
    expect(placeholders).toHaveLength(2)
  })
})

describe("loadTemplateXml (CONTR-06)", () => {
  it("loads a docx buffer and returns xml string containing w:document", async () => {
    const { loadTemplateXml } = await import("@/lib/contracts/extractPlaceholders")
    // We pass the buffer directly to avoid filesystem dependency in unit tests
    // The real loadTemplateXml reads from disk; test the XML parsing logic separately
    const { extractXmlFromBuffer } = await import("@/lib/contracts/extractPlaceholders")
    const buffer = createAdendaFixture()
    const xml = extractXmlFromBuffer(buffer)
    expect(xml).toContain("w:document")
    expect(xml).toContain("w:highlight")
  })
})

describe("extractLabelPlaceholders — AC PF/PJ (D-09)", () => {
  it("identifies label-based fields by known label patterns", async () => {
    const { extractLabelPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extractLabelPlaceholders(AC_PF_XML)
    expect(placeholders.length).toBeGreaterThanOrEqual(2)
    const ids = placeholders.map(p => p.label)
    expect(ids).toContain("Nombre")
    expect(ids).toContain("CUIT")
  })
})

describe("extractLabelPlaceholders on multi-locador cloned XML (CONTR-11)", () => {
  it("assigns sequential lph_ ids across cloned rows so row 1 fields do not collide with row 0", async () => {
    const { cloneLocadorRow } = await import("@/lib/contracts/fillPlaceholders")
    const { extractLabelPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const cloned = cloneLocadorRow(AC_PF_TABLE_XML, 2)
    const placeholders = extractLabelPlaceholders(cloned)
    const ids = placeholders.map(p => p.id)
    // Row 0 has lph_0..lph_7, row 1 has lph_8..lph_15
    expect(ids).toContain("lph_0")
    expect(ids).toContain("lph_8")
    // All IDs must be unique
    expect(new Set(ids).size).toBe(ids.length)
  })
})
