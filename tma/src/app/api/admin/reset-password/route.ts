import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcryptjs from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET no configurado" }, { status: 500 })
  }

  const authHeader = request.headers.get("x-admin-secret")
  if (!authHeader || authHeader !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let body: { email?: string; newPassword?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { email, newPassword } = body
  if (!email || !newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "email y newPassword (mínimo 8 caracteres) son requeridos" },
      { status: 400 }
    )
  }

  await connectDB()
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  user.passwordHash = await bcryptjs.hash(newPassword, 12)
  await user.save()

  return NextResponse.json({ ok: true, message: `Contraseña de ${email} actualizada` })
}
