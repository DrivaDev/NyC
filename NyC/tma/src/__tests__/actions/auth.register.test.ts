import { describe, it, expect, vi, beforeEach } from "vitest"

// Mocks deben declararse ANTES de los imports del módulo bajo test
vi.mock("@/lib/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/models/User", () => ({
  default: {
    // findOne returns an object with .lean() — mirrors the Mongoose Query API
    findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    create: vi.fn(),
  },
}))

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}))

// next-auth importa "next/server" sin extensión .js — incompatible con Vitest ESM
// Mockear para evitar el error de resolución de módulo en tests
vi.mock("next-auth", () => ({
  default: vi.fn(),
  AuthError: class AuthError extends Error {
    constructor(message?: string) {
      super(message)
      this.name = "AuthError"
    }
  },
}))

// Import del módulo real — después de los mocks
import { registerUser } from "@/actions/auth.register"

describe("registerUser — AUTH-01, AUTH-02, AUTH-04", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("AUTH-02: retorna error cuando el email no está en la allowlist", async () => {
    const formData = new FormData()
    formData.append("email", "noauthorized@example.com")
    formData.append("password", "password123")
    const result = await registerUser(undefined, formData)
    expect(result).toEqual({ error: "Este email no está autorizado para registrarse" })
  })

  it("AUTH-02: no consulta la DB cuando el email no está en la allowlist", async () => {
    const { connectDB } = await import("@/lib/mongodb")
    const formData = new FormData()
    formData.append("email", "noauth@example.com")
    formData.append("password", "password123")
    await registerUser(undefined, formData)
    expect(connectDB).not.toHaveBeenCalled()
  })

  it("AUTH-01: crea usuario cuando el email está en la allowlist y no existe", async () => {
    const User = (await import("@/models/User")).default
    // User.findOne().lean() returns null — user does not exist
    vi.mocked(User.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as never)
    vi.mocked(User.create).mockResolvedValue({} as never)
    const { signIn } = await import("@/auth")
    vi.mocked(signIn).mockResolvedValue(undefined as never)
    const formData = new FormData()
    formData.append("email", "nsilva@nyc.com.ar")
    formData.append("password", "password123")
    await registerUser(undefined, formData)
    expect(User.create).toHaveBeenCalledOnce()
  })

  it("AUTH-04: nunca guarda password en plaintext — solo passwordHash", async () => {
    const User = (await import("@/models/User")).default
    vi.mocked(User.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as never)
    vi.mocked(User.create).mockResolvedValue({} as never)
    const { signIn } = await import("@/auth")
    vi.mocked(signIn).mockResolvedValue(undefined as never)
    const formData = new FormData()
    formData.append("email", "nsilva@nyc.com.ar")
    formData.append("password", "plainpass")
    await registerUser(undefined, formData)
    const callArg = vi.mocked(User.create).mock.calls[0][0] as Record<string, unknown>
    expect(callArg).not.toHaveProperty("password")
    expect(callArg).toHaveProperty("passwordHash")
    expect(callArg.passwordHash).not.toBe("plainpass")
  })

  it("AUTH-01: retorna error cuando el email ya existe en la DB", async () => {
    const User = (await import("@/models/User")).default
    // User.findOne().lean() returns an existing user
    vi.mocked(User.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ email: "nsilva@nyc.com.ar" })
    } as never)
    const formData = new FormData()
    formData.append("email", "nsilva@nyc.com.ar")
    formData.append("password", "password123")
    const result = await registerUser(undefined, formData)
    // Implementation uses same generic message for both "not in allowlist" and "already exists"
    // to avoid revealing which allowlist emails are registered (security: D-10)
    expect(result).toEqual({ error: "Este email no está autorizado para registrarse" })
  })
})
