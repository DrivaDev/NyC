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
    // Limpiar error del campo al editar
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    // Validación client-side con Zod (CASOS-02)
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
        router.push("/tma/casos")
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
        : "border-[#FECBA1] focus:ring-brand-primary/30 focus:border-brand-primary/50",
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
            href="/tma/casos"
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
              border: "1px solid #FECBA1",
              boxShadow: "0 1px 3px 0 rgba(154,52,18,0.06), 0 1px 2px -1px rgba(154,52,18,0.04)",
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
                  placeholder="Ej: García c/ López s/ daños"
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
                <input
                  type="date"
                  value={values.fechaIngreso}
                  onChange={handleChange("fechaIngreso")}
                  className={inputClass("fechaIngreso")}
                />
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
                  type="date"
                  value={values.fechaVencimiento}
                  onChange={handleChange("fechaVencimiento")}
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
