'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, CheckCircle2, XCircle, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import CategoryModal from './CategoryModal'
import { deleteCategory, reorderCategory } from '@/actions/categories'

interface Category {
  _id: string
  name: string
  order: number
}

interface Props {
  categories: Category[]
}

export default function CategoriesClient({ categories: initialCategories }: Props) {
  const router = useRouter()

  // Local state — optimistic reorder updates this instantly
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [reorderPending, startReorderTransition] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(cat: Category) {
    setEditTarget(cat)
    setModalOpen(true)
  }

  function handleModalSuccess(message: string) {
    setModalOpen(false)
    setEditTarget(null)
    showToast('success', message)
    router.refresh()
  }

  function handleModalError(message: string) {
    showToast('error', message)
  }

  function handleReorder(categoryId: string, direction: 'up' | 'down') {
    const index = categories.findIndex(c => c._id === categoryId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return

    // Snapshot for rollback
    const prev = categories

    // Optimistic swap
    const next = [...categories]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
    setCategories(next)

    // Fire Server Action in background
    const fd = new FormData()
    fd.append('categoryId', categoryId)
    fd.append('direction', direction)

    startReorderTransition(async () => {
      const result = await reorderCategory({ success: false }, fd)
      if (!result.success) {
        setCategories(prev) // revert on error
        showToast('error', result.error ?? 'No se pudo reordenar. Intentá de nuevo.')
      }
      // No router.refresh() on success — local state already shows the correct order
    })
  }

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* Page header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-titulares">Categorías</h1>
        <button
          onClick={openCreate}
          className="bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors duration-150"
        >
          Nueva categoría
        </button>
      </div>

      {/* Content area */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-acento overflow-hidden">
        {categories.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center border-t border-brand-acento">
            <Tag size={32} className="text-brand-acento mb-4" />
            <p className="text-base font-medium text-brand-titulares mb-1">Sin categorías todavía</p>
            <p className="text-sm font-normal text-brand-texto mb-6">
              Creá tu primera categoría para organizar tu menú.
            </p>
            <button
              onClick={openCreate}
              className="bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors duration-150"
            >
              Nueva categoría
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-brand-acento">
            {categories.map((cat, index) => (
              <li
                key={cat._id}
                className="flex items-center justify-between px-6 py-4 hover:bg-brand-acento/30 transition-colors duration-100"
              >
                <span className="text-sm font-normal text-brand-texto">{cat.name}</span>

                <div className="flex items-center gap-2">
                  {confirmDeleteId !== cat._id && (
                    <>
                      {/* ↑ button */}
                      <button
                        onClick={() => handleReorder(cat._id, 'up')}
                        disabled={index === 0 || reorderPending}
                        aria-label="Subir categoría"
                        className="flex items-center justify-center w-8 h-8 rounded-md border border-brand-acento bg-white text-brand-texto hover:bg-brand-fondo disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-100"
                      >
                        <ChevronUp size={14} />
                      </button>

                      {/* ↓ button */}
                      <button
                        onClick={() => handleReorder(cat._id, 'down')}
                        disabled={index === categories.length - 1 || reorderPending}
                        aria-label="Bajar categoría"
                        className="flex items-center justify-center w-8 h-8 rounded-md border border-brand-acento bg-white text-brand-texto hover:bg-brand-fondo disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-100"
                      >
                        <ChevronDown size={14} />
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => openEdit(cat)}
                        aria-label="Editar categoría"
                        className="flex items-center justify-center w-8 h-8 rounded-md border border-brand-acento bg-white text-brand-texto hover:bg-brand-fondo transition-colors duration-100"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setConfirmDeleteId(cat._id)}
                        aria-label="Eliminar categoría"
                        className="flex items-center justify-center w-8 h-8 rounded-md border border-brand-danger/30 bg-white text-brand-danger hover:bg-brand-danger/10 transition-colors duration-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}

                  {/* Inline delete confirmation */}
                  {confirmDeleteId === cat._id && (
                    <div className="flex items-center gap-3 animate-in fade-in duration-150">
                      <span className="text-xs font-medium text-brand-danger">¿Eliminar?</span>
                      <form
                        action={async (fd) => {
                          setDeletePending(true)
                          const result = await deleteCategory({ success: false }, fd)
                          setDeletePending(false)
                          if (result.success) {
                            setConfirmDeleteId(null)
                            showToast('success', 'Categoría eliminada correctamente.')
                            router.refresh()
                          } else {
                            setConfirmDeleteId(null)
                            showToast('error', result.error ?? 'Algo salió mal. Intentá de nuevo.')
                          }
                        }}
                      >
                        <input type="hidden" name="categoryId" value={cat._id} />
                        <button
                          type="submit"
                          disabled={deletePending}
                          className="text-xs font-medium text-white bg-brand-danger rounded-md px-3 py-1.5 min-h-[32px] hover:bg-[#B91C1C] disabled:opacity-50 transition-colors duration-100"
                        >
                          {deletePending ? 'Eliminando...' : 'Sí, eliminar'}
                        </button>
                      </form>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-medium text-brand-texto hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Category modal */}
      {modalOpen && (
        <CategoryModal
          mode={editTarget ? 'edit' : 'create'}
          category={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null) }}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`bg-white rounded-lg shadow-sm px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-xs border ${
            toast.type === 'success' ? 'border-brand-acento' : 'border-brand-danger/30'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle2 size={18} className="text-brand-principal shrink-0" />
              : <XCircle size={18} className="text-brand-danger shrink-0" />
            }
            <p className="text-sm font-medium text-brand-texto">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
