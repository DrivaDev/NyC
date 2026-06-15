"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(
  _: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const email = formData.get("email")
  const password = formData.get("password")

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Datos de formulario inválidos" }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" }
    }
    throw error // Re-lanzar NEXT_REDIRECT para que Next.js procese el redirect
  }
}
