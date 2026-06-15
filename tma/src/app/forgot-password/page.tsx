"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    setError("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error inesperado")
        setStatus("error")
      } else {
        setStatus("sent")
      }
    } catch {
      setError("Error de red. Intentá de nuevo.")
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background py-16 px-4">
      <div
        className="w-full max-w-[420px] bg-white rounded-2xl p-10"
        style={{ border: "1px solid #a8dbde", boxShadow: "0 4px 24px rgba(30,35,82,0.08)" }}
      >
        <div className="flex justify-center mb-8">
          <img src="/logo.svg" alt="Nicholson & Cano" className="h-10" />
        </div>

        <h1 className="text-[24px] font-bold text-brand-title mb-2 text-center">
          Recuperar contraseña
        </h1>

        {status === "sent" ? (
          <div className="text-center">
            <p className="text-[14px] text-brand-text/70 mb-6 leading-relaxed mt-4">
              Si tu email está registrado, vas a recibir un link para resetear tu contraseña en los próximos minutos.
            </p>
            <Link href="/login" className="text-[13px] text-brand-primary hover:text-brand-title transition-colors">
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
            <p className="text-[13px] text-brand-text/60">
              Ingresá tu email y te enviamos un link para crear una nueva contraseña.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@nyc.com.ar"
              className="w-full rounded-xl text-[14px] text-brand-text focus:outline-none transition-colors"
              style={{ padding: "10px 14px", border: "1px solid #a8dbde", background: "#f0f9fa" }}
              onFocus={e => { e.target.style.borderColor = "#78ccd0" }}
              onBlur={e => { e.target.style.borderColor = "#a8dbde" }}
            />

            {(status === "error") && (
              <p className="text-[11px] text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-opacity"
              style={{ backgroundColor: "#78ccd0", opacity: status === "loading" ? 0.6 : 1 }}
            >
              {status === "loading" ? "Enviando..." : "Enviar link"}
            </button>

            <Link href="/login" className="text-[12px] text-brand-text/60 hover:text-brand-primary transition-colors text-center">
              Volver al login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
