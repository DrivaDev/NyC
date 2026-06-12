import { describe, it, expect } from "vitest"
import { ADENDA_XML, createAdendaFixture } from "../fixtures/createFixtures"

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

  it("leaves placeholder empty (empty w:t) when Gemini returns empty string", async () => {
    const { fillHighlightPlaceholders } = await import("@/lib/contracts/fillPlaceholders")
    const { extractHighlightPlaceholders } = await import("@/lib/contracts/extractPlaceholders")
    const placeholders = extractHighlightPlaceholders(ADENDA_XML)
    const values: Record<string, string> = { ph_0: "", ph_1: "" }
    const result = fillHighlightPlaceholders(ADENDA_XML, values, placeholders)
    // Original placeholder text removed; yellow highlight preserved
    expect(result).not.toContain("NOMBRE DEL LOCADOR")
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
