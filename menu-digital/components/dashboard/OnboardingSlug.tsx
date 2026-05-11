'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { confirmSlug } from '@/actions/restaurant'

interface OnboardingSlugProps {
  initialSlug: string
}

export default function OnboardingSlug({ initialSlug }: OnboardingSlugProps) {
  const [slug, setSlug] = useState(initialSlug)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://menudig.com.ar'

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.set('slug', slug)

    startTransition(async () => {
      const result = await confirmSlug(formData)
      if (result.success) {
        setToast({ type: 'success', message: 'Dirección confirmada correctamente.' })
        setTimeout(() => {
          // Reload to transition to normal dashboard state
          window.location.reload()
        }, 1500)
      } else {
        setError(result.error ?? 'Algo salió mal. Intentá de nuevo.')
        setToast({ type: 'error', message: result.error ?? 'Algo salió mal. Intentá de nuevo.' })
        setTimeout(() => setToast(null), 4000)
      }
    })
  }

  return (
    <>
      <div className="max-w-lg mx-auto py-8">
        <p className="text-xs font-medium text-brand-principal uppercase tracking-wide mb-6">
          Paso 1 de 1
        </p>

        <h1 className="text-2xl font-bold text-brand-titulares mb-2">
          Tu dirección de menú
        </h1>
        <p className="text-sm font-normal text-brand-texto mb-8">
          Esta es la URL única de tu restaurante. Podés editarla ahora — después no podrás cambiarla.
        </p>

        <div className="bg-white rounded-lg shadow-sm border border-brand-acento p-6">
          {/* URL preview */}
          <p className="text-sm font-medium text-brand-texto mb-2">
            Tu menú estará disponible en:
          </p>
          <div className="flex items-center bg-brand-fondo rounded-md px-4 py-3 mb-6">
            <span className="font-mono text-sm text-brand-texto select-none">
              {appUrl.replace(/^https?:\/\//, '')}/menu/
            </span>
            <span className="font-mono text-sm font-medium text-brand-principal">
              {slug}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="slug-input"
              className="block text-sm font-medium text-brand-texto mb-2"
            >
              Dirección del menú
            </label>
            <input
              id="slug-input"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              maxLength={60}
              placeholder="nombre-de-tu-restaurante"
              disabled={isPending}
              className="
                w-full border border-gray-200 rounded-md px-3 py-3
                text-sm font-mono text-brand-texto bg-white
                placeholder:text-gray-400
                focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal
                transition-colors duration-100
                disabled:border-gray-100 disabled:bg-gray-50
              "
            />
            <p className="text-xs font-light text-brand-texto mt-2">
              Solo letras minúsculas, números y guiones. Máximo 60 caracteres.
            </p>

            {error && (
              <p className="text-xs text-brand-danger mt-2" role="alert">
                {error}
              </p>
            )}

            {/* Warning banner */}
            <div className="flex items-start gap-2 mt-6 p-3 bg-brand-acento rounded-md">
              <AlertTriangle size={14} className="text-brand-titulares mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-brand-titulares">
                Una vez confirmada, esta dirección no puede modificarse.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="
                mt-6 w-full bg-brand-principal text-white
                text-sm font-medium
                rounded-lg px-4 py-3 min-h-[44px]
                hover:bg-[#C2410C]
                focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-150
              "
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Guardando...
                </span>
              ) : (
                'Confirmar dirección'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`bg-white rounded-lg shadow-sm px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-xs border ${
              toast.type === 'success' ? 'border-brand-acento' : 'border-brand-danger/30'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-brand-principal shrink-0" />
            ) : (
              <XCircle size={18} className="text-brand-danger shrink-0" />
            )}
            <p className="text-sm font-medium text-brand-texto">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  )
}
