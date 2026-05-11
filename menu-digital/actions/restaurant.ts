'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createHmac } from 'crypto'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { validateSlug } from '@/lib/utils'

// Delete a Cloudinary asset using the REST API + native crypto (no SDK needed)
async function cloudinaryDestroy(publicId: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey    = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET as string
  const timestamp = Math.round(Date.now() / 1000)
  const toSign    = `public_id=${publicId}&timestamp=${timestamp}`
  const signature = createHmac('sha1', apiSecret).update(toSign + apiSecret).digest('hex')

  const body = new URLSearchParams({
    public_id: publicId,
    api_key:   apiKey!,
    timestamp: String(timestamp),
    signature,
  })

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  })
}

export async function confirmSlug(formData: FormData) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'No autorizado.' }
  }

  const slug = formData.get('slug')?.toString().trim().toLowerCase()

  if (!slug) {
    return { success: false, error: 'La dirección no puede estar vacía.' }
  }

  const validationError = validateSlug(slug)
  if (validationError) {
    return { success: false, error: validationError }
  }

  await dbConnect()

  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) {
    return { success: false, error: 'Restaurante no encontrado.' }
  }
  if (restaurant.slugConfirmed) {
    return { success: false, error: 'La dirección ya fue confirmada y no puede modificarse.' }
  }

  if (slug !== restaurant.slug) {
    const existing = await Restaurant.findOne({ slug })
    if (existing) {
      return { success: false, error: 'Esta dirección ya está en uso. Probá con otra.' }
    }
  }

  await Restaurant.updateOne(
    { clerkId: userId, slugConfirmed: false },
    { $set: { slug, slugConfirmed: true } }
  )

  return { success: true }
}

export async function updateRestaurantProfile(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const name = formData.get('name')?.toString().trim()
  if (!name) return { success: false, error: 'El nombre del restaurante es obligatorio.' }

  const newLogoUrl      = formData.get('logoUrl')?.toString() ?? ''
  const newLogoPublicId = formData.get('logoPublicId')?.toString() ?? ''
  const description     = formData.get('description')?.toString().trim() ?? ''

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  // If a new logo was uploaded and there was a previous one, delete the old asset
  if (newLogoPublicId && restaurant.logoPublicId && newLogoPublicId !== restaurant.logoPublicId) {
    try {
      await cloudinaryDestroy(restaurant.logoPublicId)
    } catch (err) {
      console.error('[Cloudinary logo delete failed]', err)
    }
  }

  const update: Record<string, string> = { name, description }
  if (newLogoUrl)      update.logoUrl      = newLogoUrl
  if (newLogoPublicId) update.logoPublicId = newLogoPublicId

  if (formData.get('clearLogo') === 'true') {
    update.logoUrl      = ''
    update.logoPublicId = ''
  }

  await Restaurant.updateOne({ clerkId: userId }, { $set: update })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  revalidatePath('/menu/' + restaurant.slug)

  return { success: true }
}
