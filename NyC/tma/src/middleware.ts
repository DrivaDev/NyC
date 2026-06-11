import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // D-05: / redirige según estado de sesión
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/tma" : "/login", req.url)
    )
  }

  // D-11 / AUTH-06: Rutas bajo /tma/* requieren sesión activa
  if (pathname.startsWith("/tma") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Aplicar middleware a todas las rutas excepto assets estáticos y api/auth
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
