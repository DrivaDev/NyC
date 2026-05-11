'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { validateSlug } from '@/lib/utils'

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

  // Verify the restaurant belongs to this user and is not yet confirmed
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) {
    return { success: false, error: 'Restaurante no encontrado.' }
  }
  if (restaurant.slugConfirmed) {
    return { success: false, error: 'La dirección ya fue confirmada y no puede modificarse.' }
  }

  // Check slug uniqueness (skip if user is keeping the same auto-generated slug)
  if (slug !== restaurant.slug) {
    const existing = await Restaurant.findOne({ slug })
    if (existing) {
      return { success: false, error: 'Esta dirección ya está en uso. Probá con otra.' }
    }
  }

  // One-time update — set slug and mark as confirmed
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
  // Dynamic import avoids static analysis by Turbopack at build time
  if (newLogoPublicId && restaurant.logoPublicId && newLogoPublicId !== restaurant.logoPublicId) {
    try {
      const { v2: cloudinary } = await import('cloudinary')
      cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      })
      await cloudinary.uploader.destroy(restaurant.logoPublicId)
    } catch (err) {
      console.error('[Cloudinary logo delete failed]', err)
    }
  }

  const update: Record<string, string> = { name, description }
  if (newLogoUrl)      update.logoUrl      = newLogoUrl
  if (newLogoPublicId) update.logoPublicId = newLogoPublicId

  // Allow clearing the logo when the user explicitly sends empty strings
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
