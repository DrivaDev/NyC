// @vitest-environment node
import { describe, it, expect, vi } from "vitest"

// Mock auth to return a session (avoid NextAuth dep in unit test)
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { email: "nsilva@nyc.com.ar" } }),
}))

// Mock the lib modules to isolate route handler logic
vi.mock("@/lib/contracts/extractPlaceholders", () => ({
  extractXmlFromBuffer: vi.fn().mockReturnValue("<w:document/>"),
  extractHighlightPlaceholders: vi.fn().mockReturnValue([
    { id: "ph_0", context: "ctx", label: "FIELD", _startPos: 0, _endPos: 10, _rprXml: "" },
  ]),
  extractLabelPlaceholders: vi.fn().mockReturnValue([
    { id: "lph_0", label: "Nombre y Apellido", _insertPos: 10 },
    { id: "lph_1", label: "Domicilio", _insertPos: 20 },
    { id: "lph_2", label: "Ciudad", _insertPos: 30 },
    { id: "lph_3", label: "País", _insertPos: 40 },
    { id: "lph_4", label: "Código Postal", _insertPos: 50 },
    { id: "lph_5", label: "Número de teléfono", _insertPos: 60 },
    { id: "lph_6", label: "Dirección de correo electrónico", _insertPos: 70 },
    { id: "lph_7", label: "DNI/CUIT", _insertPos: 80 },
  ]),
  extractUnderscoredPlaceholders: vi.fn().mockReturnValue([]),
  loadTemplateXml: vi.fn().mockReturnValue({ zip: {}, xml: "<w:document/>" }),
}))

vi.mock("@/lib/contracts/geminiClient", () => ({
  callGemini: vi.fn().mockResolvedValue({ ph_0: "Test Value" }),
}))

vi.mock("@/lib/contracts/fillPlaceholders", () => ({
  applySplices: vi.fn().mockReturnValue("<w:document/>"),
  buildHighlightSplices: vi.fn().mockReturnValue([]),
  buildLabelSplices: vi.fn().mockReturnValue([]),
  buildUnderscoredSplices: vi.fn().mockReturnValue([]),
  generateDocxBuffer: vi.fn().mockReturnValue(Buffer.from("fake-docx")),
  cloneLocadorRow: vi.fn((xml: string) => xml),
  pluralizeLocadorRefs: vi.fn((xml: string) => xml),
}))

// Mock extractDocText to prevent pdf-parse from loading browser globals (DOMMatrix)
vi.mock("@/lib/contracts/extractDocText", () => ({
  processUploadedFile: vi.fn().mockResolvedValue(null),
}))

// Mock fs so no real files needed
// writeFileSync must be present so vi.spyOn can attach (CONTR-15 spy test)
vi.mock("fs", () => ({
  readFileSync: vi.fn().mockReturnValue(Buffer.from("fake-template")),
  writeFileSync: vi.fn(),
}))

describe("POST /api/contracts/generate — multi-locador (CONTR-11, CONTR-12)", () => {
  it("AC model with locadorCount=2 calls callGemini twice (one per locador)", async () => {
    const geminiModule = await import("@/lib/contracts/geminiClient")
    vi.mocked(geminiModule.callGemini).mockClear()
    vi.mocked(geminiModule.callGemini).mockResolvedValue({ lph_0: "Test" })
    const { POST } = await import("@/app/api/contracts/generate/route")
    const fd = new FormData()
    fd.append("modelId", "ac-pf")
    fd.append("notes", "")
    fd.append("locadorCount", "2")
    fd.append("personFiles_0", new Blob([new Uint8Array([1])], { type: "application/pdf" }), "doc0.pdf")
    fd.append("personFiles_1", new Blob([new Uint8Array([2])], { type: "application/pdf" }), "doc1.pdf")
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: fd,
    })
    await POST(request as any)
    expect(vi.mocked(geminiModule.callGemini).mock.calls.length).toBe(2)
  })

  it("AC model with locadorCount=2 calls cloneLocadorRow with 2", async () => {
    const fillModule = await import("@/lib/contracts/fillPlaceholders")
    vi.mocked(fillModule.cloneLocadorRow).mockClear()
    const { POST } = await import("@/app/api/contracts/generate/route")
    const fd = new FormData()
    fd.append("modelId", "ac-pf")
    fd.append("notes", "")
    fd.append("locadorCount", "2")
    fd.append("personFiles_0", new Blob([new Uint8Array([1])], { type: "application/pdf" }), "doc0.pdf")
    fd.append("personFiles_1", new Blob([new Uint8Array([2])], { type: "application/pdf" }), "doc1.pdf")
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: fd,
    })
    await POST(request as any)
    const calls = vi.mocked(fillModule.cloneLocadorRow).mock.calls
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0][1]).toBe(2)
  })

  it("Adenda model with locadorCount=2 calls pluralizeLocadorRefs", async () => {
    const fillModule = await import("@/lib/contracts/fillPlaceholders")
    vi.mocked(fillModule.pluralizeLocadorRefs).mockClear()
    const { POST } = await import("@/app/api/contracts/generate/route")
    const fd = new FormData()
    fd.append("modelId", "adenda-carta-oferta-pf-pesos")
    fd.append("notes", "")
    fd.append("locadorCount", "2")
    fd.append("personFiles_0", new Blob([new Uint8Array([1])], { type: "application/pdf" }), "doc0.pdf")
    fd.append("personFiles_1", new Blob([new Uint8Array([2])], { type: "application/pdf" }), "doc1.pdf")
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: fd,
    })
    await POST(request as any)
    expect(vi.mocked(fillModule.pluralizeLocadorRefs)).toHaveBeenCalled()
  })

  it("Adenda model with locadorCount=2 calls callGemini exactly once", async () => {
    const geminiModule = await import("@/lib/contracts/geminiClient")
    vi.mocked(geminiModule.callGemini).mockClear()
    vi.mocked(geminiModule.callGemini).mockResolvedValue({ ph_0: "Test" })
    const { POST } = await import("@/app/api/contracts/generate/route")
    const fd = new FormData()
    fd.append("modelId", "adenda-carta-oferta-pf-pesos")
    fd.append("notes", "")
    fd.append("locadorCount", "2")
    fd.append("personFiles_0", new Blob([new Uint8Array([1])], { type: "application/pdf" }), "doc0.pdf")
    fd.append("personFiles_1", new Blob([new Uint8Array([2])], { type: "application/pdf" }), "doc1.pdf")
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: fd,
    })
    await POST(request as any)
    expect(vi.mocked(geminiModule.callGemini).mock.calls.length).toBe(1)
  })

  it("rejects total file count over 20 across all locadores (400)", async () => {
    const { POST } = await import("@/app/api/contracts/generate/route")
    const fd = new FormData()
    fd.append("modelId", "ac-pf")
    fd.append("notes", "")
    fd.append("locadorCount", "2")
    // 21 files total across 2 locadores
    for (let i = 0; i < 11; i++) {
      fd.append("personFiles_0", new Blob([new Uint8Array([i])], { type: "application/pdf" }), `doc${i}.pdf`)
    }
    for (let i = 0; i < 10; i++) {
      fd.append("personFiles_1", new Blob([new Uint8Array([i])], { type: "application/pdf" }), `doc${i}.pdf`)
    }
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: fd,
    })
    const response = await POST(request as any)
    expect(response.status).toBe(400)
  })
})

describe("POST /api/contracts/generate (CONTR-13, CONTR-15)", () => {
  it("returns 401 when no session", async () => {
    const authMock = await import("@/auth")
    vi.mocked(authMock.auth).mockResolvedValueOnce(null)
    const { POST } = await import("@/app/api/contracts/generate/route")
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: new FormData(),
    })
    const response = await POST(request as any)
    expect(response.status).toBe(401)
  })

  it("returns 400 when modelId is invalid (not in MODELS map)", async () => {
    const { POST } = await import("@/app/api/contracts/generate/route")
    const fd = new FormData()
    fd.append("modelId", "../../etc/passwd")
    fd.append("notes", "")
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: fd,
    })
    const response = await POST(request as any)
    expect(response.status).toBe(400)
  })

  it("returns binary response with correct Content-Type for valid request (CONTR-13)", async () => {
    const { POST } = await import("@/app/api/contracts/generate/route")
    const fd = new FormData()
    fd.append("modelId", "adenda-carta-oferta-pf-pesos")
    fd.append("notes", "")
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: fd,
    })
    const response = await POST(request as any)
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    expect(response.headers.get("X-Fields-Completed")).toMatch(/^\d+\/\d+$/)
  })

  it("does not write any files to /tmp during generation (CONTR-15)", async () => {
    const fs = await import("fs")
    const writeFileSpy = vi.spyOn(fs, "writeFileSync" as any)
    const { POST } = await import("@/app/api/contracts/generate/route")
    const fd = new FormData()
    fd.append("modelId", "adenda-carta-oferta-pf-pesos")
    fd.append("notes", "")
    const request = new Request("http://localhost/api/contracts/generate", {
      method: "POST",
      body: fd,
    })
    await POST(request as any)
    expect(writeFileSpy).not.toHaveBeenCalled()
  })
})
