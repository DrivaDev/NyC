"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [error, setError] = useState("")

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-[14px] text-red-600 mb-4">Link inválido o expirado.</p>
        <Link href="/forgot-password" className="text-[13px] text-brand-primary hover:text-brand-title transition-colors">
          Solicitar nuevo link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (password.length < 8) {
      setError("Mínimo 8 caracteres")
      return
    }
    setStatus("loading")
    setError("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error inesperado")
        setStatus("error")
      } else {
        setStatus("done")
        setTimeout(() => router.push("/login"), 2500)
      }
    } catch {
      setError("Error de red. Intentá de nuevo.")
      setStatus("error")
    }
  }

  if (status === "done") {
    return (
      <div className="text-center mt-4">
        <p className="text-[14px] text-brand-text mb-2">✓ Contraseña actualizada</p>
        <p className="text-[12px] text-brand-text/60">Redirigiendo al login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
      <p className="text-[13px] text-brand-text/60">Elegí una nueva contraseña.</p>

      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Nueva contraseña (mínimo 8 caracteres)"
        className="w-full rounded-xl text-[14px] text-brand-text focus:outline-none transition-colors"
        style={{ padding: "10px 14px", border: "1px solid #a8dbde", background: "#f0f9fa" }}
        onFocus={e => { e.target.style.borderColor = "#78ccd0" }}
        onBlur={e => { e.target.style.borderColor = "#a8dbde" }}
      />
      <input
        type="password"
        required
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder="Repetir contraseña"
        className="w-full rounded-xl text-[14px] text-brand-text focus:outline-none transition-colors"
        style={{ padding: "10px 14px", border: "1px solid #a8dbde", background: "#f0f9fa" }}
        onFocus={e => { e.target.style.borderColor = "#78ccd0" }}
        onBlur={e => { e.target.style.borderColor = "#a8dbde" }}
      />

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-opacity"
        style={{ backgroundColor: "#78ccd0", opacity: status === "loading" ? 0.6 : 1 }}
      >
        {status === "loading" ? "Actualizando..." : "Cambiar contraseña"}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
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
          Nueva contraseña
        </h1>
        <Suspense fallback={<p className="text-center text-[13px] text-brand-text/60 mt-4">Cargando...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
