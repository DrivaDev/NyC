import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the entire Google Generative AI module
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({ ph_0: "Juan Pérez", ph_1: "", ph_2: "Buenos Aires" }),
          },
        }),
      }),
    }
  }),
}))

describe("callGemini (CONTR-08, CONTR-09)", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key"
  })

  it("returns a Record<string, string> parsed from Gemini JSON response", async () => {
    const { callGemini } = await import("@/lib/contracts/geminiClient")
    const placeholders = [
      { id: "ph_0", context: "Nombre del locador" },
      { id: "ph_1", context: "Número de expediente" },
      { id: "ph_2", context: "Ciudad" },
    ]
    const result = await callGemini(placeholders, ["Texto de documento"], [], "")
    expect(result).toEqual({ ph_0: "Juan Pérez", ph_1: "", ph_2: "Buenos Aires" })
  })

  it("accepts empty string values for fields Gemini cannot fill (CONTR-09)", async () => {
    const { callGemini } = await import("@/lib/contracts/geminiClient")
    const placeholders = [{ id: "ph_0", context: "ctx" }, { id: "ph_1", context: "ctx2" }]
    const result = await callGemini(placeholders, [], [], "")
    // ph_1 is "" — Gemini returned empty (no invented data)
    expect(result["ph_1"]).toBe("")
  })

  it("prompt contains all placeholder IDs", async () => {
    const { buildPrompt } = await import("@/lib/contracts/geminiClient")
    const placeholders = [{ id: "ph_0", context: "Nombre" }, { id: "ph_1", context: "CUIT" }]
    const prompt = buildPrompt(placeholders, ["doc text"], "nota extra")
    expect(prompt).toContain("ph_0")
    expect(prompt).toContain("ph_1")
    expect(prompt).toContain("nota extra")
  })
})
