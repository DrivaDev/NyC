'use client'

import { useRef, useEffect, useState } from 'react'
import { useActionState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createDish, updateDish } from '@/actions/dishes'
import { ALLERGENS } from '@/lib/allergens'

interface Category { _id: string; name: string }
interface Dish {
  _id: string; name: string; description: string; price: number;
  available: boolean; imageUrl: string; imagePublicId: string;
  categoryId?: string; allergens: string[]
}

interface Props {
  mode: 'create' | 'edit'
  dish: Dish | null
  categories: Category[]
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const initialState = { success: false as boolean, error: undefined as string | undefined }

export default function DishModal({ mode, dish, categories, onClose, onSuccess, onError }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const action = mode === 'edit' ? updateDish : createDish
  const [state, formAction, pending] = useActionState(action, initialState)

  // ── Controlled field state (preserves values on error) ────────────────────
  const [name, setName]             = useState(dish?.name ?? '')
  const [description, setDescription] = useState(dish?.description ?? '')
  const [price, setPrice]           = useState(dish ? (dish.price / 100).toFixed(2) : '')
  const [categoryId, setCategoryId] = useState(dish?.categoryId ?? '')
  const [allergens, setAllergens]   = useState<string[]>(dish?.allergens ?? [])
  const [available, setAvailable]   = useState(dish?.available ?? true)

  // ── Image upload state — managed separately from form (client-side upload) ──
  const [imageUrl, setImageUrl]           = useState(dish?.imageUrl ?? '')
  const [imagePublicId, setImagePublicId] = useState(dish?.imagePublicId ?? '')
  const [isUploading, setIsUploading]     = useState(false)
  const [uploadError, setUploadError]     = useState<string | null>(null)

  useEffect(() => { dialogRef.current?.showModal() }, [])

  useEffect(() => {
    if (state.success) {
      const message = mode === 'create' ? 'Plato creado correctamente.' : 'Plato actualizado correctamente.'
      onSuccess(message)
    } else if (state.error) {
      onError(state.error)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleAllergen(key: string) {
    setAllergens(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation (per UI-SPEC and D-04)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen supera el límite de 5 MB. Elegí una imagen más pequeña.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Formato no permitido. Usá JPG, PNG o WebP.')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    try {
      // Step 1: get signature from our server (CLOUDINARY_API_SECRET stays server-side)
      const signRes = await fetch('/api/sign-cloudinary-params', { method: 'POST' })
      if (!signRes.ok) throw new Error('sign-failed')
      const { signature, timestamp, api_key, cloud_name } = await signRes.json()

      // Step 2: POST file directly to Cloudinary
      const body = new FormData()
      body.append('file', file)
      body.append('api_key', api_key)
      body.append('timestamp', String(timestamp))
      body.append('signature', signature)
      body.append('folder', 'menu-digital')

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        { method: 'POST', body }
      )
      if (!uploadRes.ok) throw new Error('upload-failed')
      const data = await uploadRes.json()

      // Step 3: store results in state; hidden fields will carry them to the Server Action
      setImageUrl(data.secure_url)
      setImagePublicId(data.public_id)
    } catch {
      setUploadError('No pudimos subir la imagen. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 m-0 p-0 bg-white rounded-lg shadow-sm w-full max-w-lg border border-brand-acento outline-none"
        onClose={onClose}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-acento">
          <h2 className="text-base font-bold text-brand-titulares">
            {mode === 'create' ? 'Nuevo plato' : 'Editar plato'}
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
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
          <form id="dish-modal-form" action={formAction} className="space-y-4">
            {mode === 'edit' && dish && (
              <input type="hidden" name="dishId" value={dish._id} />
            )}
            {/* Hidden image fields — set by client-side upload */}
            <input type="hidden" name="imageUrl"      value={imageUrl} />
            <input type="hidden" name="imagePublicId" value={imagePublicId} />

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-texto" htmlFor="dish-name">
                Nombre del plato <span className="text-brand-danger">*</span>
              </label>
              <input
                id="dish-name"
                type="text"
                name="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Milanesa a la napolitana"
                disabled={pending}
                autoFocus
                className="w-full border border-gray-200 rounded-md px-3 py-3 text-sm font-normal text-brand-texto bg-white placeholder:text-gray-400 focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal transition-colors duration-100 disabled:border-gray-100 disabled:bg-gray-50"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-texto" htmlFor="dish-desc">Descripción</label>
              <textarea
                id="dish-desc"
                name="description"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describí el plato brevemente"
                disabled={pending}
                className="w-full border border-gray-200 rounded-md px-3 py-3 text-sm font-normal text-brand-texto bg-white placeholder:text-gray-400 focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal resize-none transition-colors duration-100 disabled:border-gray-100 disabled:bg-gray-50"
              />
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-texto" htmlFor="dish-price">
                Precio <span className="text-brand-danger">*</span>
              </label>
              <div className="flex items-center border border-gray-200 rounded-md focus-within:border-brand-principal focus-within:ring-1 focus-within:ring-brand-principal">
                <span className="px-3 py-3 text-sm font-normal text-brand-texto bg-brand-fondo border-r border-gray-200 rounded-l-md">$</span>
                <input
                  id="dish-price"
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={pending}
                  className="flex-1 px-3 py-3 text-sm font-mono text-brand-texto bg-white rounded-r-md outline-none disabled:bg-gray-50"
                />
              </div>
              <p className="text-xs font-light text-brand-texto">Ingresá el precio en pesos (ej. 1500.00). Usá 0 para platos sin costo.</p>
            </div>

            {/* Category selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-texto" htmlFor="dish-category">
                Categoría <span className="text-brand-danger">*</span>
              </label>
              <select
                id="dish-category"
                name="categoryId"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                disabled={pending}
                className="w-full border border-gray-200 rounded-md px-3 py-3 text-sm font-normal text-brand-texto bg-white focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal transition-colors duration-100 cursor-pointer disabled:bg-gray-50"
              >
                <option value="">Seleccioná una categoría</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Image upload */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-brand-texto">Imagen del plato</label>
              {imageUrl && (
                <div className="w-20 h-20 rounded-md overflow-hidden border border-brand-acento">
                  <img src={imageUrl} alt="Imagen actual" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isUploading || pending}
                className="block w-full text-sm text-brand-texto file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-brand-acento file:text-sm file:font-medium file:text-brand-titulares file:bg-brand-fondo file:cursor-pointer hover:file:bg-brand-acento/40 transition-colors duration-100 disabled:opacity-50"
              />
              <p className="text-xs font-light text-brand-texto">JPG, PNG o WebP. Máximo 5 MB.</p>
              {isUploading && (
                <div className="flex items-center gap-2 text-xs text-brand-texto">
                  <Loader2 size={12} className="animate-spin text-brand-principal" />
                  Subiendo imagen...
                </div>
              )}
              {uploadError && (
                <p className="text-xs text-brand-danger" role="alert">{uploadError}</p>
              )}
            </div>

            {/* Allergen grid */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-brand-texto">Alérgenos</span>
              <div className="grid grid-cols-2 gap-2">
                {ALLERGENS.map(allergen => (
                  <label
                    key={allergen.key}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:bg-brand-fondo transition-colors duration-100 has-[:checked]:border-brand-acento has-[:checked]:bg-brand-acento/30"
                  >
                    <input
                      type="checkbox"
                      name="allergens"
                      value={allergen.key}
                      checked={allergens.includes(allergen.key)}
                      onChange={() => toggleAllergen(allergen.key)}
                      className="w-4 h-4 accent-brand-principal"
                    />
                    <span className="text-sm font-normal text-brand-texto">{allergen.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs font-light text-brand-texto">14 alérgenos EU — Reglamento 1169/2011</p>
            </div>

            {/* Availability */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="available"
                  value="true"
                  checked={available}
                  onChange={e => setAvailable(e.target.checked)}
                  className="w-4 h-4 accent-brand-principal"
                />
                <span className="text-sm font-medium text-brand-texto">Disponible</span>
              </label>
            </div>

            {/* General form error */}
            {state.error && !state.success && (
              <p role="alert" className="text-xs text-brand-danger">{state.error}</p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-acento flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending || isUploading}
            className="border border-brand-principal text-brand-principal bg-transparent text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-brand-fondo focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="dish-modal-form"
            disabled={pending || isUploading || uploadError !== null}
            className="bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Guardando...
              </span>
            ) : (
              mode === 'create' ? 'Crear plato' : 'Guardar cambios'
            )}
          </button>
        </div>
      </dialog>
    </>
  )
}
