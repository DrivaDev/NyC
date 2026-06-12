import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

// Edge-compatible: solo importa auth.config.ts, nunca auth.ts (que tiene bcryptjs/mongoose)
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/tma" : "/login", req.url)
    )
  }

  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    return NextResponse.redirect(new URL("/tma", req.url))
  }

  if (pathname.startsWith("/tma") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
