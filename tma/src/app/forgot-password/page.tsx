import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background py-16 px-4">
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl p-10 text-center"
        style={{
          border: "1px solid #a8dbde",
          boxShadow: "0 4px 24px rgba(30,35,82,0.08)",
        }}
      >
        <div className="flex justify-center mb-8">
          <img src="/logo.svg" alt="Nicholson & Cano" className="h-10" />
        </div>

        <h1 className="text-[24px] font-bold text-brand-title mb-4">
          Recuperar contraseña
        </h1>

        <p className="text-[14px] text-brand-text/70 mb-6 leading-relaxed">
          Esta aplicación no tiene recuperación automática por email. Para resetear tu contraseña, contactá a tu administrador.
        </p>

        <a
          href="mailto:driva.devv@gmail.com?subject=Reset%20de%20contraseña%20TMA&body=Hola%2C%20necesito%20resetear%20mi%20contraseña.%20Mi%20email%20es%3A%20"
          className="inline-block w-full py-3 px-6 rounded-xl text-[14px] font-bold text-white mb-4"
          style={{ backgroundColor: "#78ccd0" }}
        >
          Contactar administrador
        </a>

        <Link
          href="/login"
          className="text-[12px] text-brand-text/60 hover:text-brand-primary transition-colors"
        >
          Volver al login
        </Link>
      </div>
    </div>
  )
}
