'use client'

import { useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react'
import { createPromoCode, togglePromoCode, deletePromoCode } from '@/actions/admin'

interface PromoCode {
  _id: string
  code: string
  description: string
  freeMonths: number
  maxUses: number
  usedCount: number
  expiresAt: string | null
  active: boolean
  createdAt: string
}

const initialState = { success: false, error: undefined as string | undefined }

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PromoCodesClient({ codes }: { codes: PromoCode[] }) {
  const router = useRouter()
  const [formState, formAction, formPending] = useActionState(createPromoCode, initialState)
  const [pending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showForm, setShowForm] = useState(false)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Close form and show toast on success
  if (formState.success && showForm) {
    setShowForm(false)
    showToast('success', 'Código creado correctamente.')
    router.refresh()
  }

  function handleToggle(id: string, currentActive: boolean) {
    setActionId(id)
    startTransition(async () => {
      const res = await togglePromoCode(id, !currentActive)
      setActionId(null)
      if (res.success) router.refresh()
      else showToast('error', 'Error al cambiar estado.')
    })
  }

  function handleDelete(id: string) {
    setActionId(id)
    setConfirmId(null)
    startTransition(async () => {
      const res = await deletePromoCode(id)
      setActionId(null)
      if (res.success) { showToast('success', 'Código eliminado.'); router.refresh() }
      else showToast('error', 'Error al eliminar.')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-[#C2410C] transition-colors"
        >
          <Plus size={15} />
          Nuevo código
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Crear código de descuento</h2>
          <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Código *</label>
              <input
                name="code"
                type="text"
                placeholder="Ej. BIENVENIDA30"
                required
                disabled={formPending}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm uppercase placeholder:normal-case focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal disabled:bg-gray-50"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Descripción</label>
              <input
                name="description"
                type="text"
                placeholder="Uso interno"
                disabled={formPending}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal disabled:bg-gray-50"
              />
            </div>

            {/* Free months */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Meses gratuitos *</label>
              <input
                name="freeMonths"
                type="number"
                min={1}
                max={24}
                defaultValue={1}
                disabled={formPending}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal disabled:bg-gray-50"
              />
            </div>

            {/* Max uses */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Usos máximos <span className="font-normal text-gray-400">(0 = ilimitado)</span></label>
              <input
                name="maxUses"
                type="number"
                min={0}
                defaultValue={0}
                disabled={formPending}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal disabled:bg-gray-50"
              />
            </div>

            {/* Expires at */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-gray-600">Fecha de vencimiento <span className="font-normal text-gray-400">(opcional)</span></label>
              <input
                name="expiresAt"
                type="date"
                disabled={formPending}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal disabled:bg-gray-50 w-full sm:w-64"
              />
            </div>

            {formState.error && (
              <p className="sm:col-span-2 text-xs text-red-600">{formState.error}</p>
            )}

            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={formPending}
                className="flex items-center gap-2 bg-brand-principal text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-[#C2410C] disabled:opacity-50 transition-colors"
              >
                {formPending && <Loader2 size={13} className="animate-spin" />}
                Crear código
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Codes table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Código</th>
                <th className="px-5 py-3 text-left">Descripción</th>
                <th className="px-5 py-3 text-left">Meses</th>
                <th className="px-5 py-3 text-left">Usos</th>
                <th className="px-5 py-3 text-left">Vence</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(code => {
                const isActioning = actionId === code._id && pending
                return (
                  <tr key={code._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-brand-titulares tracking-wider">
                      {code.code}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{code.description || '—'}</td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{code.freeMonths}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {code.usedCount}
                      {code.maxUses > 0 && <span className="text-gray-400"> / {code.maxUses}</span>}
                      {code.maxUses === 0 && <span className="text-gray-400"> / ∞</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 tabular-nums">{fmt(code.expiresAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        code.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {code.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(code._id, code.active)}
                          disabled={isActioning}
                          title={code.active ? 'Desactivar' : 'Activar'}
                          className="flex items-center justify-center w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                          {isActioning
                            ? <Loader2 size={13} className="animate-spin" />
                            : code.active
                              ? <ToggleRight size={14} className="text-green-600" />
                              : <ToggleLeft size={14} />
                          }
                        </button>

                        {/* Delete */}
                        {confirmId !== code._id ? (
                          <button
                            onClick={() => setConfirmId(code._id)}
                            disabled={isActioning}
                            className="flex items-center justify-center w-7 h-7 rounded-md border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-red-600">¿Eliminar?</span>
                            <button
                              onClick={() => handleDelete(code._id)}
                              disabled={isActioning}
                              className="text-xs text-white bg-red-500 rounded-md px-2.5 py-1 hover:bg-red-600 disabled:opacity-50"
                            >
                              Sí
                            </button>
                            <button onClick={() => setConfirmId(null)} className="text-xs text-gray-500 hover:underline">
                              No
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {codes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    No hay códigos creados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`bg-white rounded-lg shadow-sm px-4 py-3 flex items-center gap-3 min-w-[260px] border ${
            toast.type === 'success' ? 'border-green-200' : 'border-red-200'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle2 size={16} className="text-green-600 shrink-0" />
              : <XCircle size={16} className="text-red-500 shrink-0" />
            }
            <p className="text-sm font-medium text-gray-700">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
