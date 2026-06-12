import type { NextAuthConfig } from "next-auth"

// Edge-safe config — NO imports de bcryptjs, mongoose, ni módulos Node.js.
// Usado por proxy.ts (middleware Edge) y extendido por auth.ts (Node.js runtime).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  providers: [],
}
