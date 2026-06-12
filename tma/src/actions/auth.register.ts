"use server"

import { signIn } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcryptjs from "bcryptjs"
import { registerSchema } from "@/lib/validations"
import { AuthError } from "next-auth"

// Allowlist fija en código (D-09) — exactamente estos 5 emails
const ALLOWLIST = [
  "nsilva@nyc.com.ar",
  "crivera@nyc.com.ar",
  "tderosa@nyc.com.ar",
  "vespinola@nyc.com.ar",
  "ekoch@nyc.com.ar",
  "driva.devv@gmail.com",
]

// Mensaje genérico para no filtrar información sobre la allowlist
const NOT_AUTHORIZED_MSG = "Este email no está autorizado para registrarse"

export async function registerUser(
  _: unknown,
  formData: FormData
): Promise<{ error?: string } | void> {
  // 1. Validar formato con Zod
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? "Datos inválidos" }
  }

  const { email, password } = parsed.data

  // 2. Verificar allowlist ANTES de consultar DB (T6 — AUTH-02, D-10)
  if (!ALLOWLIST.includes(email.toLowerCase())) {
    return { error: NOT_AUTHORIZED_MSG }
  }

  // 3. Verificar email único (D-02) — usar mismo mensaje para no revelar
  // qué emails de la allowlist ya están registrados
  await connectDB()
  const existing = await User.findOne({ email: email.toLowerCase() }).lean()
  if (existing) {
    return { error: NOT_AUTHORIZED_MSG }
  }

  // 4. Hash de contraseña (AUTH-04) — NUNCA loggear password
  const passwordHash = await bcryptjs.hash(password, 12)
  await User.create({
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date(),
  })

  // 5. Auto-login tras registro exitoso (D-04)
  // CRÍTICO: signIn lanza NEXT_REDIRECT — re-lanzar todo excepto AuthError
  try {
    await signIn("credentials", { email, password, redirectTo: "/tma" })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Error al iniciar sesión automáticamente. Intentá loguearte manualmente." }
    }
    throw error // Re-lanzar NEXT_REDIRECT para que Next.js procese el redirect
  }
}
