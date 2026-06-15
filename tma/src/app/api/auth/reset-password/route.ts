import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import ResetToken from "@/models/ResetToken"
import bcryptjs from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  let body: { token?: string; newPassword?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { token, newPassword } = body
  if (!token || !newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Token y nueva contraseña (mínimo 8 caracteres) son requeridos" },
      { status: 400 }
    )
  }

  await connectDB()

  const resetToken = await ResetToken.findOne({ token })
  if (!resetToken || resetToken.expiresAt < new Date()) {
    await ResetToken.deleteOne({ token })
    return NextResponse.json({ error: "El link expiró o no es válido" }, { status: 400 })
  }

  const user = await User.findOne({ email: resetToken.email })
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  user.passwordHash = await bcryptjs.hash(newPassword, 12)
  await user.save()
  await ResetToken.deleteOne({ token })

  return NextResponse.json({ ok: true })
}
