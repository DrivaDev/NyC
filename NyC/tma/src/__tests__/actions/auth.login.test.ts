import { describe, it, expect, vi, beforeEach } from "vitest"

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

// Mock de @/auth ANTES del import del módulo bajo test
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}))

// Import del módulo real — después del mock
import { loginAction } from "@/actions/auth.login"

describe("loginAction — AUTH-03", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("AUTH-03: signIn se llama con 'credentials' y redirectTo '/tma' cuando hay credenciales", async () => {
    const { signIn } = await import("@/auth")
    vi.mocked(signIn).mockResolvedValue(undefined as never)
    const formData = new FormData()
    formData.append("email", "nsilva@nyc.com.ar")
    formData.append("password", "password123")
    await loginAction(undefined, formData)
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "nsilva@nyc.com.ar",
      password: "password123",
      redirectTo: "/tma",
    })
  })

  it("AUTH-03: retorna { error: 'Email o contraseña incorrectos' } cuando signIn lanza AuthError", async () => {
    const { signIn } = await import("@/auth")
    const { AuthError } = await import("next-auth")
    vi.mocked(signIn).mockRejectedValue(new AuthError("CredentialsSignin"))
    const formData = new FormData()
    formData.append("email", "nsilva@nyc.com.ar")
    formData.append("password", "wrongpass")
    const result = await loginAction(undefined, formData)
    expect(result).toEqual({ error: "Email o contraseña incorrectos" })
  })

  it("AUTH-03: re-lanza NEXT_REDIRECT (no AuthError) para que Next.js procese el redirect", async () => {
    const { signIn } = await import("@/auth")
    // Simular un NEXT_REDIRECT error (no es AuthError — es un error especial de Next.js)
    const nextRedirectError = new Error("NEXT_REDIRECT")
    nextRedirectError.name = "NEXT_REDIRECT"
    vi.mocked(signIn).mockRejectedValue(nextRedirectError)
    const formData = new FormData()
    formData.append("email", "nsilva@nyc.com.ar")
    formData.append("password", "password123")
    // El re-throw debe propagarse — loginAction no debe tragarse el NEXT_REDIRECT
    await expect(loginAction(undefined, formData)).rejects.toThrow("NEXT_REDIRECT")
  })
})
