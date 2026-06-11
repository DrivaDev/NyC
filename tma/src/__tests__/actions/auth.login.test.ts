import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}))

// import { loginAction } from "@/actions/auth.login"

describe("loginAction — AUTH-03", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("AUTH-03: signIn se llama con credentials y redirectTo '/tma'", async () => {
    // TODO: implementar cuando auth.login.ts exista (Plan 03)
    // const { signIn } = await import("@/auth")
    // vi.mocked(signIn).mockResolvedValue(undefined)
    // const formData = new FormData()
    // formData.append("email", "nsilva@nyc.com.ar")
    // formData.append("password", "password123")
    // await loginAction(undefined, formData)
    // expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ redirectTo: "/tma" }))
    expect(true).toBe(true) // stub
  })

  it("AUTH-03: retorna error cuando AuthError es lanzado", async () => {
    // TODO: implementar cuando auth.login.ts exista (Plan 03)
    // import { AuthError } from "next-auth"
    // const { signIn } = await import("@/auth")
    // vi.mocked(signIn).mockRejectedValue(new AuthError("CredentialsSignin"))
    // const formData = new FormData()
    // formData.append("email", "nsilva@nyc.com.ar")
    // formData.append("password", "wrongpass")
    // const result = await loginAction(undefined, formData)
    // expect(result).toEqual({ error: "Email o contraseña incorrectos" })
    expect(true).toBe(true) // stub
  })
})
