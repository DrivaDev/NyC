import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcryptjs from "bcryptjs"
import { loginSchema } from "@/lib/validations"
import { AuthError } from "next-auth"

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET no está definido en las variables de entorno")
}

// Computed once at module load — ensures bcryptjs.compare always does full KDF work
// even when a user is not found, preventing timing-based user enumeration.
const DUMMY_HASH = bcryptjs.hashSync("__timing_sentinel__", 12)

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
        const passwordHash = user?.passwordHash ?? DUMMY_HASH

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
