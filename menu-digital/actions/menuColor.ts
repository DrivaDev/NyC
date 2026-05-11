'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

export async function updateMenuTheme(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const fields = {
    menuColor:      formData.get('menuColor')?.toString().trim() ?? '',
    menuBgColor:    formData.get('menuBgColor')?.toString().trim() ?? '',
    menuTitleColor: formData.get('menuTitleColor')?.toString().trim() ?? '',
    menuTextColor:  formData.get('menuTextColor')?.toString().trim() ?? '',
  }

  for (const [key, val] of Object.entries(fields)) {
    if (!isValidHexColor(val)) {
      return { success: false, error: `Color inválido en "${key}". Debe ser #RRGGBB.` }
    }
  }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  await Restaurant.updateOne({ clerkId: userId }, { $set: fields })

  revalidatePath('/menu/' + restaurant.slug)
  revalidatePath('/dashboard/settings')

  return { success: true, error: undefined }
}
