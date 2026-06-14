import { describe, it, expect } from "vitest"
import { ADENDA_XML, createAdendaFixture, AC_PF_TABLE_XML, ADENDA_LOCADOR_XML } from "../fixtures/createFixtures"

describe("fillHighlightPlaceholders (CONTR-10)", () => {
  it("replaces w:t content in highlighted runs with Gemini values", async () => {
    const { fillHighlightPlaceholders, extractHighlightPlaceholders } = await import("@/lib/contracts/fillPlaceholders")
    const { extractHighlightPlaceholders: extract } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extract(ADENDA_XML)
    const values: Record<string, string> = { ph_0: "Juan Pérez", ph_1: "2026-12-31" }
    const result = fillHighlightPlaceholders(ADENDA_XML, values, placeholders)
    expect(result).toContain("Juan Pérez")
    expect(result).toContain("2026-12-31")
  })

  it("preserves w:highlight w:val=yellow after replacement", async () => {
    const { fillHighlightPlaceholders } = await import("@/lib/contracts/fillPlaceholders")
    const { extractHighlightPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extractHighlightPlaceholders(ADENDA_XML)
    const values: Record<string, string> = { ph_0: "Test", ph_1: "Value" }
    const result = fillHighlightPlaceholders(ADENDA_XML, values, placeholders)
    // Yellow highlight must remain in output XML
    expect(result).toContain('w:val="yellow"')
  })

  it("escapes XML special characters in Gemini values", async () => {
    const { fillHighlightPlaceholders } = await import("@/lib/contracts/fillPlaceholders")
    const { extractHighlightPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extractHighlightPlaceholders(ADENDA_XML)
    const values: Record<string, string> = { ph_0: "Empresa <Norte> & Cía.", ph_1: "" }
    const result = fillHighlightPlaceholders(ADENDA_XML, values, placeholders)
    // XML-escaped: < → &lt;  & → &amp;
    expect(result).toContain("&lt;Norte&gt;")
    expect(result).toContain("&amp;")
    expect(result).not.toContain("<Norte>")
  })

  it("preserves original label (highlighted yellow) when Gemini returns empty string", async () => {
    const { fillHighlightPlaceholders } = await import("@/lib/contracts/fillPlaceholders")
    const { extractHighlightPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extractHighlightPlaceholders(ADENDA_XML)
    const values: Record<string, string> = { ph_0: "", ph_1: "" }
    const result = fillHighlightPlaceholders(ADENDA_XML, values, placeholders)
    // When Gemini returns "", preserve original placeholder label so unfilled fields
    // remain visible in yellow for manual review
    expect(result).toContain("NOMBRE DEL LOCADOR")
    expect(result).toContain('w:val="yellow"')
  })
})

describe("generateDocxBuffer", () => {
  it("returns a Buffer from modified xml", async () => {
    const { generateDocxBuffer } = await import("@/lib/contracts/fillPlaceholders")
    const PizZip = (await import("pizzip")).default
    const buffer = createAdendaFixture()
    const zip = new PizZip(buffer)
    const xml = zip.file("word/document.xml")!.asText()
    const result = generateDocxBuffer(zip, xml)
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe("cloneLocadorRow (CONTR-11)", () => {
  it("returns xml unchanged when locadorCount <= 1", async () => {
    const { cloneLocadorRow } = await import("@/lib/contracts/fillPlaceholders")
    const result = cloneLocadorRow(AC_PF_TABLE_XML, 1)
    expect((result.match(/<w:tr\b/g) || []).length).toBe(1)
  })

  it("inserts N-1 cloned <w:tr> rows for N locadores", async () => {
    const { cloneLocadorRow } = await import("@/lib/contracts/fillPlaceholders")
    const result = cloneLocadorRow(AC_PF_TABLE_XML, 3)
    expect((result.match(/<w:tr\b/g) || []).length).toBe(3)
  })

  it("cloned rows have unique w14:paraId values (no duplicates)", async () => {
    const { cloneLocadorRow } = await import("@/lib/contracts/fillPlaceholders")
    const result = cloneLocadorRow(AC_PF_TABLE_XML, 2)
    const ids = result.match(/w14:paraId="[^"]+"/g) || []
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("extractLabelPlaceholders on cloned XML returns fieldCount * N entries", async () => {
    const { cloneLocadorRow } = await import("@/lib/contracts/fillPlaceholders")
    const { extractLabelPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const cloned = cloneLocadorRow(AC_PF_TABLE_XML, 2)
    const placeholders = extractLabelPlaceholders(cloned)
    expect(placeholders.length).toBe(16)
  })

  it("inserts clones before the closing </w:tbl> (single closing tag)", async () => {
    const { cloneLocadorRow } = await import("@/lib/contracts/fillPlaceholders")
    const result = cloneLocadorRow(AC_PF_TABLE_XML, 2)
    expect((result.match(/<\/w:tbl>/g) || []).length).toBe(1)
  })
})

describe("pluralizeLocadorRefs (CONTR-12)", () => {
  it("replaces 'el LOCADOR' with 'los LOCADORES'", async () => {
    const { pluralizeLocadorRefs } = await import("@/lib/contracts/fillPlaceholders")
    const result = pluralizeLocadorRefs(ADENDA_LOCADOR_XML)
    expect(result).toContain("los LOCADORES")
  })

  it("replaces 'El LOCADOR' with 'Los LOCADORES'", async () => {
    const { pluralizeLocadorRefs } = await import("@/lib/contracts/fillPlaceholders")
    const result = pluralizeLocadorRefs(ADENDA_LOCADOR_XML)
    expect(result).toContain("Los LOCADORES")
  })

  it("does NOT modify 'del LOCADOR'", async () => {
    const { pluralizeLocadorRefs } = await import("@/lib/contracts/fillPlaceholders")
    const result = pluralizeLocadorRefs(ADENDA_LOCADOR_XML)
    expect(result).toContain("del LOCADOR")
    expect(result).not.toContain("dlos LOCADORES")
  })

  it("does NOT modify 'al LOCADOR'", async () => {
    const { pluralizeLocadorRefs } = await import("@/lib/contracts/fillPlaceholders")
    const result = pluralizeLocadorRefs(ADENDA_LOCADOR_XML)
    expect(result).toContain("al LOCADOR")
  })
})
