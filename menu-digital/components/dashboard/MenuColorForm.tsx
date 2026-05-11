'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { updateMenuColor } from '@/actions/menuColor'

const PRESETS = [
  { label: 'Naranja (default)', value: '#EA580C' },
  { label: 'Rojo', value: '#DC2626' },
  { label: 'Azul', value: '#2563EB' },
  { label: 'Verde', value: '#16A34A' },
  { label: 'Violeta', value: '#7C3AED' },
  { label: 'Rosa', value: '#DB2777' },
  { label: 'Negro', value: '#1C1917' },
]

const initialState = { success: false as boolean, error: undefined as string | undefined }

export default function MenuColorForm({ initialColor }: { initialColor: string }) {
  const [state, formAction, pending] = useActionState(updateMenuColor, initialState)
  const [color, setColor] = useState(initialColor)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (state.success) {
      setSuccessMsg('Color actualizado.')
      const t = setTimeout(() => setSuccessMsg(null), 3000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="menuColor" value={color} />

      {/* Color picker + hex input */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-brand-texto">
          Color del menú
        </label>

        {/* Preset swatches */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              onClick={() => setColor(preset.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all duration-100 ${
                color === preset.value
                  ? 'border-brand-texto scale-110 shadow-md'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: preset.value }}
              aria-label={preset.label}
              aria-pressed={color === preset.value}
            />
          ))}

          {/* Custom color picker */}
          <label
            title="Color personalizado"
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center cursor-pointer overflow-hidden relative"
          >
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Color personalizado"
            />
            <span className="text-gray-400 text-xs font-bold pointer-events-none">+</span>
          </label>
        </div>

        {/* Preview + hex value */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-brand-texto">{color.toUpperCase()}</span>
            <span className="text-xs font-light text-brand-texto">
              Se aplica a la navegación y acentos del menú público
            </span>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="rounded-md bg-brand-acento/30 border border-brand-acento px-4 py-3">
          <p className="text-sm font-medium text-brand-titulares">{successMsg}</p>
        </div>
      )}
      {state.error && (
        <div className="rounded-md bg-brand-danger/10 border border-brand-danger/30 px-4 py-3">
          <p className="text-sm font-medium text-brand-danger">{state.error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-principal text-white text-sm font-medium rounded-lg px-6 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Guardando...
            </span>
          ) : (
            'Guardar color'
          )}
        </button>
      </div>
    </form>
  )
}
