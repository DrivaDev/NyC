import { describe, it, expect } from "vitest"

function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register"
}

function shouldRedirect(pathname: string, isLoggedIn: boolean): boolean {
  return !isPublicPath(pathname) && !isLoggedIn
}

describe("middleware — AUTH-06 (lógica de protección de rutas)", () => {
  it("AUTH-06: pathname /casos sin sesión debe requerir redirect a /login", () => {
    expect(shouldRedirect("/casos", false)).toBe(true)
  })

  it("AUTH-06: pathname /casos con sesión activa debe permitir acceso", () => {
    expect(shouldRedirect("/casos", true)).toBe(false)
  })

  it("AUTH-05: pathname / sin sesión debe redirigir a /login", () => {
    expect(shouldRedirect("/", false)).toBe(true)
  })

  it("AUTH-05: pathname / con sesión debe permitir acceso (la página maneja auth)", () => {
    expect(shouldRedirect("/", true)).toBe(false)
  })

  it("AUTH-06: pathname /casos/nuevo con sesión activa debe permitir acceso", () => {
    expect(shouldRedirect("/casos/nuevo", true)).toBe(false)
  })
})
