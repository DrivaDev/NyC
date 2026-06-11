import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcryptjs from "bcryptjs"
import { loginSchema } from "@/lib/validations"
import { AuthError } from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = await loginSchema.safeParseAsync(credentials)
        if (!parsed.success) throw new AuthError("Credenciales inválidas")
        const { email, password } = parsed.data

        await connectDB()

        // SEGURIDAD T1: Siempre ejecutar bcryptjs.compare aunque el usuario
        // no exista, para evitar timing attack de enumeración.
        const user = await User.findOne({ email }).lean()
        const dummyHash =
          "$2a$12$dummyhashtopreventtimingattackonusernotfound"
        const passwordHash = user?.passwordHash ?? dummyHash

        const valid = await bcryptjs.compare(password, passwordHash)

        if (!user || !valid) {
          throw new AuthError("Credenciales inválidas")
        }

        return { id: user._id.toString(), email: user.email }
      },
    }),
  ],
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
  pages: {
    signIn: "/login",
  },
})
