import nodemailer from "nodemailer"

export function createTransport() {
  const user = process.env.GMAIL_USER ?? "driva.devv@gmail.com"
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!pass) throw new Error("GMAIL_APP_PASSWORD no está configurado")

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transport = createTransport()
  await transport.sendMail({
    from: `"TMA Nicholson & Cano" <${process.env.GMAIL_USER ?? "driva.devv@gmail.com"}>`,
    to,
    subject: "Recuperación de contraseña — TMA",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e2352; margin-bottom: 16px;">Recuperar contraseña</h2>
        <p style="color: #555; margin-bottom: 24px;">
          Recibimos una solicitud para resetear tu contraseña en TMA.
          Hacé clic en el botón para continuar. El link expira en <strong>1 hora</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#78ccd0;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">
          Resetear contraseña
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:32px;">
          Si no solicitaste esto, ignorá este mail. Tu contraseña no cambia.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin-top:32px;" />
        <p style="color:#aaa;font-size:11px;">TMA &mdash; Nicholson &amp; Cano</p>
      </div>
    `,
  })
}
