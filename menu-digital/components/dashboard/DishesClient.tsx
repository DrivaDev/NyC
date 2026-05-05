'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UtensilsCrossed, CheckCircle2, XCircle, AlertTriangle, ImageOff, Pencil, Trash2 } from 'lucide-react'
import DishModal from './DishModal'
import AvailabilityToggle from './AvailabilityToggle'
import { deleteDish } from '@/actions/dishes'
import Link from 'next/link'

interface Category {
  _id: string
  name: string
  order: number
}

interface Dish {
  _id: string
  name: string
  description: string
  price: number
  available: boolean
  imageUrl: string
  imagePublicId: string
  categoryId?: string
  allergens: string[]
}

interface Props {
  dishes: Dish[]
  categories: Category[]
}

export default function DishesClient({ dishes: initialDishes, categories }: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen]             = useState(false)
  const [editTarget, setEditTarget]           = useState<Dish | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId]           = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(dish: Dish) {
    setEditTarget(dish)
    setModalOpen(true)
  }

  function handleModalSuccess(message: string) {
    setModalOpen(false)
    setEditTarget(null)
    showToast('success', message)
    router.refresh() // WR-01: re-fetch Server Component data
  }

  async function handleDelete(dishId: string) {
    setDeletingId(dishId)
    const fd = new FormData()
    fd.append('dishId', dishId)
    const result = await deleteDish({ success: false }, fd)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (result.success) {
      showToast('success', 'Plato eliminado correctamente.')
      router.refresh() // WR-01: re-fetch Server Component data
    } else {
      showToast('error', result.error ?? 'Algo salió mal. Intentá de nuevo.')
    }
  }

  const categoryMap = Object.fromEntries(categories.map(c => [c._id, c.name]))

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* Page header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-titulares">Platos</h1>
        <button
          onClick={openCreate}
          disabled={categories.length === 0}
          className="bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Nuevo plato
        </button>
      </div>

      {/* Prerequisite warning — no categories yet */}
      {categories.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-brand-acento/40 rounded-lg border border-brand-acento">
          <AlertTriangle size={16} className="text-brand-titulares mt-0.5 shrink-0" />
          <p className="text-sm font-normal text-brand-titulares">
            Primero necesitás crear al menos una categoría antes de agregar platos.
            <Link href="/dashboard/categories" className="font-medium underline ml-1">
              Ir a Categorías
            </Link>
          </p>
        </div>
      )}

      {/* Content area */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-acento overflow-hidden">
        {initialDishes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center border-t border-brand-acento">
            <UtensilsCrossed size={32} className="text-brand-acento mb-4" />
            <p className="text-base font-medium text-brand-titulares mb-1">Sin platos todavía</p>
            <p className="text-sm font-normal text-brand-texto mb-6">
              Agregá tu primer plato para empezar a armar tu menú.
            </p>
            <button
              onClick={openCreate}
              disabled={categories.length === 0}
              className="bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Nuevo plato
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-acento bg-brand-fondo">
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-texto uppercase tracking-wide">Imagen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-texto uppercase tracking-wide">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-texto uppercase tracking-wide">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-texto uppercase tracking-wide">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-brand-texto uppercase tracking-wide">Disponible</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-brand-texto uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {initialDishes.map(dish => (
                  <tr
                    key={dish._id}
                    className="border-b border-brand-acento hover:bg-brand-acento/20 transition-colors duration-100"
                  >
                    {/* Image cell */}
                    <td className="px-6 py-3">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-brand-fondo shrink-0 flex items-center justify-center">
                        {dish.imageUrl ? (
                          <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff size={16} className="text-gray-300" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-6 py-3 font-normal text-brand-texto">{dish.name}</td>

                    {/* Category */}
                    <td className="px-6 py-3 text-brand-texto">
                      {dish.categoryId ? (categoryMap[dish.categoryId] ?? '—') : '—'}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-3 font-medium font-mono text-brand-texto">
                      ${(dish.price / 100).toFixed(2)}
                    </td>

                    {/* Availability toggle */}
                    <td className="px-6 py-3">
                      <AvailabilityToggle
                        dish={dish}
                        onToggleError={(msg) => showToast('error', msg)}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3 text-right">
                      {confirmDeleteId !== dish._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(dish)}
                            aria-label="Editar plato"
                            className="flex items-center justify-center w-8 h-8 rounded-md border border-brand-acento bg-white text-brand-texto hover:bg-brand-fondo transition-colors duration-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(dish._id)}
                            aria-label="Eliminar plato"
                            className="flex items-center justify-center w-8 h-8 rounded-md border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors duration-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3 animate-in fade-in duration-150">
                          <span className="text-xs font-medium text-red-600">¿Eliminar?</span>
                          <button
                            onClick={() => handleDelete(dish._id)}
                            disabled={deletingId === dish._id}
                            className="text-xs font-medium text-white bg-red-600 rounded-md px-3 py-1.5 min-h-[32px] hover:bg-red-700 disabled:opacity-50 transition-colors duration-100"
                          >
                            {deletingId === dish._id ? 'Eliminando...' : 'Sí, eliminar'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-medium text-brand-texto hover:underline"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dish modal */}
      {modalOpen && (
        <DishModal
          mode={editTarget ? 'edit' : 'create'}
          dish={editTarget}
          categories={categories}
          onClose={() => { setModalOpen(false); setEditTarget(null) }}
          onSuccess={handleModalSuccess}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`bg-white rounded-lg shadow-sm px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-xs border ${
            toast.type === 'success' ? 'border-brand-acento' : 'border-red-200'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle2 size={18} className="text-brand-principal shrink-0" />
              : <XCircle size={18} className="text-red-500 shrink-0" />
            }
            <p className="text-sm font-medium text-brand-texto">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
