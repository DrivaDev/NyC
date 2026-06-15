import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

// Edge-compatible: solo importa auth.config.ts, nunca auth.ts (que tiene bcryptjs/mongoose)
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isPublic =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"

  if (!isPublic && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isPublic && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico|.*\\.\\w+).*)"],
}
