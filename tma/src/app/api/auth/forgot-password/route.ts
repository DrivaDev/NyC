import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import ResetToken from "@/models/ResetToken"
import { sendPasswordResetEmail } from "@/lib/mailer"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const email = (body.email ?? "").toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  await connectDB()

  // Always return the same response to avoid email enumeration
  const user = await User.findOne({ email })
  if (user) {
    // Delete any existing token for this email
    await ResetToken.deleteMany({ email })

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await ResetToken.create({ email, token, expiresAt })

    const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    try {
      await sendPasswordResetEmail(email, resetUrl)
    } catch (err) {
      console.error("Error enviando email de reset:", err)
      return NextResponse.json({ error: "Error al enviar el email. Intentá más tarde." }, { status: 500 })
    }
  }

  // Same response whether user exists or not (security: prevents enumeration)
  return NextResponse.json({ ok: true })
}
