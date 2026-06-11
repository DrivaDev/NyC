"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(
  _: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/tma",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" }
    }
    throw error // Re-lanzar NEXT_REDIRECT para que Next.js procese el redirect
  }
}
