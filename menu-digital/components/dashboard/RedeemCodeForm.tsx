'use client'

import { useActionState } from 'react'
import { Loader2, Tag } from 'lucide-react'
import { redeemPromoCode } from '@/actions/promoCode'

type RedeemState = { success: boolean; error?: string; message?: string }
const initialState: RedeemState = { success: false }

export function RedeemCodeForm() {
  const [state, formAction, pending] = useActionState(redeemPromoCode, initialState)

  return (
    <div className="bg-white rounded-xl border border-brand-acento p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-brand-acento flex items-center justify-center shrink-0">
          <Tag size={16} className="text-brand-titulares" />
        </div>
        <div>
          <p className="text-sm font-bold text-brand-titulares">Código de descuento</p>
          <p className="text-xs font-normal text-brand-texto">
            ¿Tenés un código? Ingresalo para activar o extender tu suscripción.
          </p>
        </div>
      </div>

      <form action={formAction} className="flex items-start gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <input
            name="code"
            type="text"
            placeholder="CÓDIGO"
            disabled={pending || state.success}
            className="border border-gray-200 rounded-md px-3 py-2.5 text-sm font-mono uppercase placeholder:normal-case focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal disabled:bg-gray-50 w-full"
          />
          {state.error && (
            <p className="text-xs text-brand-danger">{state.error}</p>
          )}
          {state.success && state.message && (
            <p className="text-xs text-green-700 font-medium">{state.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending || state.success}
          className="shrink-0 flex items-center gap-2 bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-[#C2410C] disabled:opacity-50 transition-colors"
        >
          {pending && <Loader2 size={13} className="animate-spin" />}
          Aplicar
        </button>
      </form>
    </div>
  )
}
