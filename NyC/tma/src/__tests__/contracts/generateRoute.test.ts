import { describe, it, expect, vi } from "vitest"

// Mock auth to return a session (avoid NextAuth dep in unit test)
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { email: "nsilva@nyc.com.ar" } }),
}))

// Mock the lib modules to isolate route handler logic
vi.mock("@/lib/contracts/extractPlaceholders", () => ({
  extractXmlFromBuffer: vi.fn().mockReturnValue("<w:document/>"),
  extractHighlightPlaceholders: vi.fn().mockReturnValue([{ id: "ph_0", context: "ctx" }]),
  loadTemplateXml: vi.fn().mockReturnValue({ zip: {}, xml: "<w:document/>" }),
}))

vi.mock("@/lib/contracts/geminiClient", () => ({
  callGemini: vi.fn().mockResolvedValue({ ph_0: "Test Value" }),
}))

vi.mock("@/lib/contracts/fillPlaceholders", () => ({
  fillHighlightPlaceholders: vi.fn().mockReturnValue("<w:document/>"),
  generateDocxBuffer: vi.fn().mockReturnValue(Buffer.from("fake-docx")),
}))

// Mock fs so no real files needed
vi.mock("fs", () => ({
  readFileSync: vi.fn().mockReturnValue(Buffer.from("fake-template")),
}))

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
