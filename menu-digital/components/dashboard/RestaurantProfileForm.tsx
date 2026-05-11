'use client'

import { useState, useEffect, useActionState } from 'react'
import { Loader2, X } from 'lucide-react'
import { updateRestaurantProfile } from '@/actions/restaurant'

interface Props {
  initialName: string
  initialLogoUrl: string
  initialLogoPublicId: string
  initialDescription: string
}

const initialState = { success: false as boolean, error: undefined as string | undefined }

export default function RestaurantProfileForm({ initialName, initialLogoUrl, initialLogoPublicId, initialDescription }: Props) {
  const [state, formAction, pending] = useActionState(updateRestaurantProfile, initialState)

  // Logo upload state — managed separately from form (client-side upload)
  const [logoUrl, setLogoUrl]           = useState(initialLogoUrl)
  const [logoPublicId, setLogoPublicId] = useState(initialLogoPublicId)
  const [isUploading, setIsUploading]   = useState(false)
  const [uploadError, setUploadError]   = useState<string | null>(null)
  const [clearLogo, setClearLogo]       = useState(false)

  // Show toast-like feedback via inline banner
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (state.success) {
      setSuccessMsg('Perfil actualizado correctamente.')
      const t = setTimeout(() => setSuccessMsg(null), 4000)
      return () => clearTimeout(t)
    }
  }, [state])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

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
    setClearLogo(false)
    try {
      const signRes = await fetch('/api/sign-cloudinary-params', { method: 'POST' })
      if (!signRes.ok) throw new Error('sign-failed')
      const { signature, timestamp, api_key, cloud_name } = await signRes.json()

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

      setLogoUrl(data.secure_url)
      setLogoPublicId(data.public_id)
    } catch {
      setUploadError('No pudimos subir la imagen. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemoveLogo() {
    setLogoUrl('')
    setLogoPublicId('')
    setClearLogo(true)
    setUploadError(null)
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* Hidden logo fields */}
      <input type="hidden" name="logoUrl"      value={logoUrl} />
      <input type="hidden" name="logoPublicId" value={logoPublicId} />
      <input type="hidden" name="clearLogo"    value={clearLogo ? 'true' : 'false'} />

      {/* Restaurant name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-brand-texto" htmlFor="restaurant-name">
          Nombre del restaurante <span className="text-brand-danger">*</span>
        </label>
        <input
          id="restaurant-name"
          type="text"
          name="name"
          defaultValue={initialName}
          placeholder="Ej. La Trattoria"
          disabled={pending}
          className="w-full border border-gray-200 rounded-md px-3 py-3 text-sm font-normal text-brand-texto bg-white placeholder:text-gray-400 focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal transition-colors duration-100 disabled:border-gray-100 disabled:bg-gray-50"
        />
      </div>

      {/* Logo upload */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-brand-texto">Logo del restaurante</span>

        {/* Current logo preview */}
        {logoUrl && (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-brand-acento bg-brand-fondo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="Logo actual" className="w-full h-full object-contain p-1" />
            <button
              type="button"
              onClick={handleRemoveLogo}
              disabled={pending}
              aria-label="Eliminar logo"
              className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-brand-danger/10 hover:border-brand-danger/50 transition-colors duration-100 disabled:opacity-50"
            >
              <X size={10} className="text-brand-texto" />
            </button>
          </div>
        )}

        {/* File input */}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading || pending}
          className="block w-full text-sm text-brand-texto file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-brand-acento file:text-sm file:font-medium file:text-brand-titulares file:bg-brand-fondo file:cursor-pointer hover:file:bg-brand-acento/40 transition-colors duration-100 disabled:opacity-50"
        />
        <p className="text-xs font-light text-brand-texto">JPG, PNG o WebP. Máximo 5 MB. Se mostrará en tu menú público.</p>

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

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-normal text-brand-texto" htmlFor="restaurant-description">
          Descripción <span className="text-sm font-normal text-brand-texto">(opcional)</span>
        </label>
        <textarea
          id="restaurant-description"
          name="description"
          defaultValue={initialDescription}
          placeholder="Ej. Cocina italiana casera en el corazón de Palermo..."
          maxLength={200}
          rows={3}
          disabled={pending}
          className="w-full border border-gray-200 rounded-md px-3 py-3 text-sm font-normal text-brand-texto bg-white placeholder:text-gray-400 focus:outline-none focus:border-brand-principal focus:ring-1 focus:ring-brand-principal transition-colors duration-100 disabled:border-gray-100 disabled:bg-gray-50 resize-none"
        />
        <p className="text-sm font-normal text-brand-texto">Máximo 200 caracteres. Se muestra en tu menú público.</p>
      </div>

      {/* Feedback banners */}
      {successMsg && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm font-medium text-green-800">{successMsg}</p>
        </div>
      )}
      {state.error && !state.success && (
        <div className="rounded-md bg-brand-danger/10 border border-brand-danger/30 px-4 py-3">
          <p className="text-sm font-medium text-brand-danger" role="alert">{state.error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending || isUploading || uploadError !== null}
          className="bg-brand-principal text-white text-sm font-medium rounded-lg px-6 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Guardando...
            </span>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>
    </form>
  )
}
