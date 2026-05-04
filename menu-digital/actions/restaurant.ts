'use server'

import { auth } from '@clerk/nextjs/server'
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
