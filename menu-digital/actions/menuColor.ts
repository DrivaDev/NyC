'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'

// Validates that the value is a well-formed CSS hex color (#RRGGBB)
function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export async function updateMenuColor(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const color = formData.get('menuColor')?.toString().trim() ?? ''
  if (!isValidHexColor(color)) {
    return { success: false, error: 'Color inválido. Debe ser un código hexadecimal (#RRGGBB).' }
  }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  await Restaurant.updateOne({ clerkId: userId }, { $set: { menuColor: color } })

  revalidatePath('/menu/' + restaurant.slug)
  revalidatePath('/dashboard/settings')

  return { success: true }
}
