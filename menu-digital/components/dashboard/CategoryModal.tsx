'use client'

import { useRef, useEffect } from 'react'
import { useActionState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createCategory, updateCategory } from '@/actions/categories'

interface Category {
  _id: string
  name: string
  order: number
}

interface Props {
  mode: 'create' | 'edit'
  category: Category | null
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const initialState = { success: false as boolean, error: undefined as string | undefined }

export default function CategoryModal({ mode, category, onClose, onSuccess, onError }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const action = mode === 'edit' ? updateCategory : createCategory
  const [state, formAction, pending] = useActionState(action, initialState)

  // Open dialog on mount
  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  // React to action result
  useEffect(() => {
    if (state.success) {
      const message = mode === 'create'
        ? 'Categoría creada correctamente.'
        : 'Categoría actualizada correctamente.'
      onSuccess(message)
    } else if (state.error) {
      onError(state.error)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Dialog panel */}
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 m-0 p-0 bg-white rounded-lg shadow-sm w-full max-w-sm border border-brand-acento outline-none"
        onClose={onClose}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-acento">
          <h2 className="text-base font-bold text-brand-titulares">
            {mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-8 h-8 rounded-md text-brand-texto hover:bg-brand-fondo transition-colors duration-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <form id="modal-form" action={formAction}>
            {/* Hidden categoryId for edit mode */}
            {mode === 'edit' && category && (
              <input type="hidden" name="categoryId" value={category._id} />
            )}

            {/* Name field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-texto" htmlFor="cat-name">
                Nombre <span className="text-brand-danger">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                name="name"
                defaultValue={category?.name ?? ''}
                placeholder="Ej. Entradas, Principales, Postres"
                className="w-full border border-gray-200 rounded-md px-3 py-3 text-sm font-normal text-brand-texto bg-white placeholder:text-gray-400 focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal transition-colors duration-100 disabled:border-gray-100 disabled:bg-gray-50"
                disabled={pending}
                autoFocus
              />
              {state.error && (
                <p role="alert" className="text-xs text-brand-danger">{state.error}</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-acento flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="border border-brand-principal text-brand-principal bg-transparent text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-brand-fondo focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="modal-form"
            disabled={pending}
            className="bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Guardando...
              </span>
            ) : (
              mode === 'create' ? 'Crear categoría' : 'Guardar cambios'
            )}
          </button>
        </div>
      </dialog>
    </>
  )
}
