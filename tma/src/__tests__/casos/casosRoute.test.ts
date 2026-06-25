// @vitest-environment node
import { describe, it, expect, vi } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { email: "nsilva@nyc.com.ar" } }),
}))

vi.mock("@/lib/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/models/Caso", () => {
  const mockCaso = {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: "507f1f77bcf86cd799439011", nombre: "Test Caso", responsable: "Rivera",
            fechaIngreso: new Date("2026-06-15T12:00:00"), fechaVencimiento: new Date("2026-12-31T12:00:00") },
        ]),
      }),
    }),
    create: vi.fn().mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      nombre: "Test Caso",
      responsable: "Rivera",
      fechaIngreso: new Date("2026-06-15T12:00:00"),
      fechaVencimiento: new Date("2026-12-31T12:00:00"),
    }),
    findByIdAndDelete: vi.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011" }),
  }
  return { default: mockCaso }
})

vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose")
  return { ...(actual as object), isValidObjectId: vi.fn().mockReturnValue(true) }
})

describe("GET /api/casos — CASOS-03", () => {
  it("retorna 401 cuando no hay sesión", async () => {
    const authMock = await import("@/auth")
    vi.mocked(authMock.auth).mockResolvedValueOnce(null)
    const { GET } = await import("@/app/api/casos/route")
    const req = new Request("http://localhost/api/casos") as unknown as import("next/server").NextRequest
    const response = await GET(req)
    expect(response.status).toBe(401)
  })

  it("retorna 200 con array de casos cuando hay sesión", async () => {
    const { GET } = await import("@/app/api/casos/route")
    const req = new Request("http://localhost/api/casos") as unknown as import("next/server").NextRequest
    const response = await GET(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(1)
    expect(data[0].nombre).toBe("Test Caso")
  })
})

describe("POST /api/casos — CASOS-01", () => {
  it("retorna 401 cuando no hay sesión", async () => {
    const authMock = await import("@/auth")
    vi.mocked(authMock.auth).mockResolvedValueOnce(null)
    const { POST } = await import("@/app/api/casos/route")
    const request = new Request("http://localhost/api/casos", {
      method: "POST",
      body: JSON.stringify({}),
    })
    const response = await POST(request as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(401)
  })

  it("retorna 400 cuando el body tiene campos vacíos (CASOS-02)", async () => {
    const { POST } = await import("@/app/api/casos/route")
    const request = new Request("http://localhost/api/casos", {
      method: "POST",
      body: JSON.stringify({ nombre: "", fechaIngreso: "", fechaVencimiento: "", responsable: "" }),
    })
    const response = await POST(request as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(400)
  })

  it("retorna 201 con datos válidos (CASOS-01)", async () => {
    const { POST } = await import("@/app/api/casos/route")
    const request = new Request("http://localhost/api/casos", {
      method: "POST",
      body: JSON.stringify({
        nombre: "Test Caso",
        fechaIngreso: "15/06/2026",
        fechaVencimiento: "31/12/2026",
        responsable: "Rivera",
      }),
    })
    const response = await POST(request as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.nombre).toBe("Test Caso")
  })
})

describe("DELETE /api/casos — CASOS-07", () => {
  it("retorna 401 cuando no hay sesión", async () => {
    const authMock = await import("@/auth")
    vi.mocked(authMock.auth).mockResolvedValueOnce(null)
    const { DELETE } = await import("@/app/api/casos/route")
    const request = new Request("http://localhost/api/casos?id=507f1f77bcf86cd799439011", { method: "DELETE" })
    const response = await DELETE(request as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(401)
  })

  it("retorna 400 cuando el id no es un ObjectId válido", async () => {
    const mongooseMock = await import("mongoose")
    vi.mocked(mongooseMock.isValidObjectId).mockReturnValueOnce(false)
    const { DELETE } = await import("@/app/api/casos/route")
    const request = new Request("http://localhost/api/casos?id=invalid-id", { method: "DELETE" })
    const response = await DELETE(request as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(400)
  })

  it("retorna 200 cuando el id es válido y el caso existe (CASOS-07)", async () => {
    const { DELETE } = await import("@/app/api/casos/route")
    const request = new Request("http://localhost/api/casos?id=507f1f77bcf86cd799439011", { method: "DELETE" })
    const response = await DELETE(request as unknown as import("next/server").NextRequest)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.ok).toBe(true)
  })
})
