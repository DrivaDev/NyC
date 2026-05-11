'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Trash2, Zap } from 'lucide-react'
import { activateSubscription, deleteAccount } from '@/actions/admin'

interface Account {
  _id: string
  name: string
  email: string
  subscriptionStatus: string
  trialEndsAt: string | null
  subscriptionPeriodEnd: string | null
  createdAt: string
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activa',    className: 'bg-green-100 text-green-700' },
  trial:     { label: 'Trial',     className: 'bg-brand-acento text-brand-titulares' },
  past_due:  { label: 'Vencida',   className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelada', className: 'bg-gray-100 text-gray-500' },
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AccountsClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [actionId, setActionId]     = useState<string | null>(null)
  const [confirmId, setConfirmId]   = useState<string | null>(null)
  const [months, setMonths]         = useState<Record<string, number>>({})
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function handleActivate(id: string) {
    const m = months[id] ?? 1
    setActionId(id)
    startTransition(async () => {
      const res = await activateSubscription(id, m)
      setActionId(null)
      if (res.success) { showToast('success', 'Suscripción activada.'); router.refresh() }
      else showToast('error', 'Error al activar.')
    })
  }

  function handleDelete(id: string) {
    setActionId(id)
    setConfirmId(null)
    startTransition(async () => {
      const res = await deleteAccount(id)
      setActionId(null)
      if (res.success) { showToast('success', 'Cuenta eliminada.'); router.refresh() }
      else showToast('error', 'Error al eliminar.')
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Restaurante</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-left">Vence</th>
                <th className="px-5 py-3 text-left">Creada</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => {
                const statusMeta = STATUS_LABELS[acc.subscriptionStatus] ?? STATUS_LABELS.cancelled
                const vence = acc.subscriptionStatus === 'active'
                  ? acc.subscriptionPeriodEnd
                  : acc.trialEndsAt
                const isActioning = actionId === acc._id && pending

                return (
                  <tr key={acc._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{acc.name}</td>
                    <td className="px-5 py-3 text-gray-500">{acc.email || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 tabular-nums">{fmt(vence)}</td>
                    <td className="px-5 py-3 text-gray-500 tabular-nums">{fmt(acc.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Activate: month selector + button */}
                        {acc.subscriptionStatus !== 'active' && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={24}
                              value={months[acc._id] ?? 1}
                              onChange={e => setMonths(p => ({ ...p, [acc._id]: Number(e.target.value) }))}
                              disabled={isActioning}
                              className="w-14 border border-gray-200 rounded-md px-2 py-1.5 text-xs text-center focus:outline-none focus:border-brand-principal"
                            />
                            <span className="text-xs text-gray-400">mes</span>
                            <button
                              onClick={() => handleActivate(acc._id)}
                              disabled={isActioning}
                              className="flex items-center gap-1 bg-brand-principal text-white text-xs font-medium rounded-md px-2.5 py-1.5 hover:bg-[#C2410C] disabled:opacity-50 transition-colors"
                            >
                              {isActioning ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                              Activar
                            </button>
                          </div>
                        )}

                        {/* Delete */}
                        {confirmId !== acc._id ? (
                          <button
                            onClick={() => setConfirmId(acc._id)}
                            disabled={isActioning}
                            className="flex items-center justify-center w-7 h-7 rounded-md border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-red-600">¿Eliminar?</span>
                            <button
                              onClick={() => handleDelete(acc._id)}
                              disabled={isActioning}
                              className="text-xs font-medium text-white bg-red-500 rounded-md px-2.5 py-1 hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              {isActioning ? 'Eliminando...' : 'Sí'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              No
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    No hay cuentas registradas.
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
