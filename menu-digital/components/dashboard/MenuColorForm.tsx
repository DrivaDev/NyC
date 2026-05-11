'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { updateMenuTheme } from '@/actions/menuColor'

// ── Preset palettes per slot ──────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { label: 'Naranja (default)', value: '#EA580C' },
  { label: 'Rojo',    value: '#DC2626' },
  { label: 'Azul',   value: '#2563EB' },
  { label: 'Verde',  value: '#16A34A' },
  { label: 'Violeta',value: '#7C3AED' },
  { label: 'Rosa',   value: '#DB2777' },
  { label: 'Negro',  value: '#1C1917' },
]

const BG_PRESETS = [
  { label: 'Crema (default)', value: '#FFF7ED' },
  { label: 'Blanco',         value: '#FFFFFF' },
  { label: 'Gris claro',     value: '#F9FAFB' },
  { label: 'Celeste claro',  value: '#EFF6FF' },
  { label: 'Verde claro',    value: '#F0FDF4' },
  { label: 'Rosa claro',     value: '#FFF1F2' },
  { label: 'Amarillo claro', value: '#FEFCE8' },
]

const TITLE_PRESETS = [
  { label: 'Naranja oscuro (default)', value: '#9A3412' },
  { label: 'Gris oscuro',  value: '#111827' },
  { label: 'Azul oscuro',  value: '#1E3A5F' },
  { label: 'Verde oscuro', value: '#14532D' },
  { label: 'Violeta osc.', value: '#3B0764' },
  { label: 'Rojo oscuro',  value: '#7F1D1D' },
  { label: 'Negro',        value: '#000000' },
]

const TEXT_PRESETS = [
  { label: 'Casi negro (default)', value: '#1C1917' },
  { label: 'Gris oscuro',  value: '#374151' },
  { label: 'Gris medio',   value: '#4B5563' },
  { label: 'Slate',        value: '#334155' },
  { label: 'Azul gris',    value: '#1E3A5F' },
  { label: 'Marrón',       value: '#44261A' },
  { label: 'Negro',        value: '#000000' },
]

// ── Sub-component: one color picker row ──────────────────────────────────────

interface PickerProps {
  label: string
  description: string
  name: string
  value: string
  onChange: (v: string) => void
  presets: { label: string; value: string }[]
}

function ColorPicker({ label, description, name, value, onChange, presets }: PickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-brand-texto">{label}</p>
        {description && (
          <p className="text-xs font-light text-brand-texto mt-0.5">{description}</p>
        )}
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />

      {/* Swatches */}
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset.value}
            type="button"
            title={preset.label}
            onClick={() => onChange(preset.value)}
            className={`w-8 h-8 rounded-full border-2 transition-all duration-100 ${
              value === preset.value
                ? 'border-brand-texto scale-110 shadow-md'
                : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: preset.value }}
            aria-label={preset.label}
            aria-pressed={value === preset.value}
          />
        ))}

        {/* Custom picker */}
        <label
          title="Color personalizado"
          className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center cursor-pointer overflow-hidden relative"
        >
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Color personalizado"
          />
          <span className="text-gray-400 text-xs font-bold pointer-events-none">+</span>
        </label>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md border border-gray-200 shadow-sm shrink-0"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-medium text-brand-texto">{value.toUpperCase()}</span>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface Props {
  initialColor:      string
  initialBgColor:    string
  initialTitleColor: string
  initialTextColor:  string
}

const initialState = { success: false as boolean, error: undefined as string | undefined }

export default function MenuColorForm({
  initialColor,
  initialBgColor,
  initialTitleColor,
  initialTextColor,
}: Props) {
  const [state, formAction, pending] = useActionState(updateMenuTheme, initialState)
  const [color,      setColor]      = useState(initialColor)
  const [bgColor,    setBgColor]    = useState(initialBgColor)
  const [titleColor, setTitleColor] = useState(initialTitleColor)
  const [textColor,  setTextColor]  = useState(initialTextColor)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (state.success) {
      setSuccessMsg('Tema actualizado.')
      const t = setTimeout(() => setSuccessMsg(null), 3000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <form action={formAction} className="flex flex-col gap-7">

      {/* Live preview strip */}
      <div
        className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
        style={{ backgroundColor: bgColor }}
      >
        {/* Simulated nav bar */}
        <div
          className="px-4 py-2 flex gap-2 border-b"
          style={{ borderColor: color + '55' }}
        >
          <span
            className="px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            Categoría
          </span>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ color: textColor }}
          >
            Otra
          </span>
        </div>
        {/* Simulated dish row */}
        <div className="px-4 py-3 flex flex-col gap-0.5">
          <p className="text-sm font-bold" style={{ color: titleColor }}>Plato de ejemplo</p>
          <p className="text-xs"          style={{ color: textColor }}>Descripción breve del plato</p>
          <p className="text-sm font-bold" style={{ color: titleColor }}>$1.500</p>
        </div>
      </div>

      <ColorPicker
        label="Color de acento"
        description="Botones, pestañas activas, resaltados"
        name="menuColor"
        value={color}
        onChange={setColor}
        presets={ACCENT_PRESETS}
      />

      <ColorPicker
        label="Color de fondo"
        description="Fondo general del menú público"
        name="menuBgColor"
        value={bgColor}
        onChange={setBgColor}
        presets={BG_PRESETS}
      />

      <ColorPicker
        label="Color de títulos"
        description="Categorías, nombre del plato, precio"
        name="menuTitleColor"
        value={titleColor}
        onChange={setTitleColor}
        presets={TITLE_PRESETS}
      />

      <ColorPicker
        label="Color de texto"
        description="Descripciones y texto secundario"
        name="menuTextColor"
        value={textColor}
        onChange={setTextColor}
        presets={TEXT_PRESETS}
      />

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
            'Guardar tema'
          )}
        </button>
      </div>
    </form>
  )
}
