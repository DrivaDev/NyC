"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import Link from "next/link"
import { casoSchema } from "@/lib/validations"

interface FormValues {
  nombre: string
  fechaIngreso: string
  fechaVencimiento: string
  responsable: string
}

interface FieldErrors {
  nombre?: string
  fechaIngreso?: string
  fechaVencimiento?: string
  responsable?: string
}

function formatDateDigits(rawDigits: string): string {
  let d = rawDigits.slice(0, 8)

  if (d.length >= 2) {
    const day = parseInt(d.slice(0, 2), 10)
    if (day > 31) d = "31" + d.slice(2)
  }

  if (d.length >= 4) {
    const month = parseInt(d.slice(2, 4), 10)
    if (month > 12) d = d.slice(0, 2) + "12" + d.slice(4)
  }

  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

function getTodayDDMMYYYY(): string {
  const t = new Date()
  const dd = String(t.getDate()).padStart(2, "0")
  const mm = String(t.getMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${t.getFullYear()}`
}

export function CasoForm() {
  const router = useRouter()
  const [values, setValues] = useState<FormValues>({
    nombre: "",
    fechaIngreso: "",
    fechaVencimiento: "",
    responsable: "",
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const handleChange = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(v => ({ ...v, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleDateKeyDown = (field: "fechaIngreso" | "fechaVencimiento") => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const digits = values[field].replace(/\D/g, "")

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      setValues(v => ({ ...v, [field]: formatDateDigits(digits.slice(0, -1)) }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
      return
    }

    if (/^\d$/.test(e.key)) {
      if (digits.length >= 8) { e.preventDefault(); return }
      e.preventDefault()
      setValues(v => ({ ...v, [field]: formatDateDigits(digits + e.key) }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
      return
    }

    if (!["Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handleDatePaste = (field: "fechaIngreso" | "fechaVencimiento") => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const digits = e.clipboardData.getData("text").replace(/\D/g, "")
    setValues(v => ({ ...v, [field]: formatDateDigits(digits) }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const moveCursorToEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    requestAnimationFrame(() => { el.setSelectionRange(el.value.length, el.value.length) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const result = casoSchema.safeParse(values)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof FormValues
        if (field) fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/casos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (res.ok) {
        router.push("/casos")
      } else {
        setServerError("No se pudo guardar el asunto. Intentá nuevamente.")
      }
    } catch {
      setServerError("No se pudo guardar el asunto. Intentá nuevamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (field: keyof FormValues) =>
    [
      "w-full border rounded-lg px-3 py-2 text-[13px] bg-white text-brand-text",
      "outline-none focus:ring-2 transition-colors",
      errors[field]
        ? "border-red-400 focus:ring-red-300/30"
        : "border-[#a8dbde] focus:ring-brand-primary/30 focus:border-brand-primary/50",
    ].join(" ")

  return (
    <div className="bg-brand-background min-h-screen py-12 px-4">
      <div className="max-w-[540px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <h1 className="text-[28px] font-bold text-brand-title mb-1">Nuevo Asunto</h1>
          <Link
            href="/casos"
            className="text-[13px] text-brand-primary hover:underline underline-offset-2 block mb-8"
          >
            ← Volver al Dashboard
          </Link>

          {serverError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700">
              {serverError}
            </div>
          )}

          <div
            className="rounded-2xl bg-white p-8"
            style={{
              border: "1px solid #a8dbde",
              boxShadow: "0 1px 3px 0 rgba(30,35,82,0.06), 0 1px 2px -1px rgba(30,35,82,0.04)",
            }}
          >
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Nombre */}
              <div>
                <label className="text-[13px] font-normal text-brand-text mb-1 block">
                  Nombre del asunto
                </label>
                <input
                  type="text"
                  value={values.nombre}
                  onChange={handleChange("nombre")}
                  className={inputClass("nombre")}
                />
                {errors.nombre && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.nombre}</p>
                )}
              </div>

              {/* Fecha de ingreso */}
              <div>
                <label className="text-[13px] font-normal text-brand-text mb-1 block">
                  Fecha de ingreso
                </label>
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={values.fechaIngreso}
                    onKeyDown={handleDateKeyDown("fechaIngreso")}
                    onPaste={handleDatePaste("fechaIngreso")}
                    onChange={() => {}}
                    onClick={moveCursorToEnd}
                    onSelect={moveCursorToEnd}
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    className={inputClass("fechaIngreso")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setValues(v => ({ ...v, fechaIngreso: getTodayDDMMYYYY() }))
                      if (errors.fechaIngreso) setErrors(prev => ({ ...prev, fechaIngreso: undefined }))
                    }}
                    className="shrink-0 px-3 py-2 rounded-lg border border-[#a8dbde] text-[13px] text-brand-title bg-white hover:bg-brand-accent/20 transition-colors duration-150 whitespace-nowrap"
                  >
                    Hoy
                  </button>
                </div>
                {errors.fechaIngreso && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.fechaIngreso}</p>
                )}
              </div>

              {/* Fecha de vencimiento */}
              <div>
                <label className="text-[13px] font-normal text-brand-text mb-1 block">
                  Fecha de vencimiento
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.fechaVencimiento}
                  onKeyDown={handleDateKeyDown("fechaVencimiento")}
                  onPaste={handleDatePaste("fechaVencimiento")}
                  onChange={() => {}}
                  onClick={moveCursorToEnd}
                  onSelect={moveCursorToEnd}
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  className={inputClass("fechaVencimiento")}
                />
                {errors.fechaVencimiento && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.fechaVencimiento}</p>
                )}
              </div>

              {/* Responsable */}
              <div>
                <label className="text-[13px] font-normal text-brand-text mb-1 block">
                  Responsable
                </label>
                <input
                  type="text"
                  value={values.responsable}
                  onChange={handleChange("responsable")}
                  placeholder="Nombre del responsable"
                  className={inputClass("responsable")}
                />
                {errors.responsable && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.responsable}</p>
                )}
              </div>

              {/* Botón submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                           bg-brand-primary text-white text-[13px] font-normal
                           hover:bg-brand-primary/90 disabled:opacity-60 disabled:cursor-not-allowed
                           transition-colors duration-150 min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar asunto"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
