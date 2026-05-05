'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { Category } from '@/models/Category'
import { Dish } from '@/models/Dish'

// ─── createCategory ───────────────────────────────────────────────────────────
export async function createCategory(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const name = formData.get('name')?.toString().trim()
  if (!name) return { success: false, error: 'El nombre de la categoría es obligatorio.' }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  // Assign order = current max + 1
  const maxOrderDoc = await Category
    .findOne({ restaurantId: restaurant._id })
    .sort({ order: -1 })
    .lean<{ order: number }>()

  await Category.create({
    restaurantId: restaurant._id,
    name,
    order: (maxOrderDoc?.order ?? -1) + 1,
  })

  revalidatePath('/menu/' + restaurant.slug)
  return { success: true }
}

// ─── updateCategory ───────────────────────────────────────────────────────────
export async function updateCategory(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const categoryId = formData.get('categoryId')?.toString()
  const name = formData.get('name')?.toString().trim()
  if (!name) return { success: false, error: 'El nombre de la categoría es obligatorio.' }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  // Ownership check: verify this category belongs to this restaurant
  const category = await Category.findOne({ _id: categoryId, restaurantId: restaurant._id })
  if (!category) return { success: false, error: 'Categoría no encontrada.' }

  await Category.updateOne(
    { _id: categoryId, restaurantId: restaurant._id },
    { $set: { name } }
  )

  revalidatePath('/menu/' + restaurant.slug)
  return { success: true }
}

// ─── deleteCategory ───────────────────────────────────────────────────────────
export async function deleteCategory(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const categoryId = formData.get('categoryId')?.toString()
  if (!categoryId) return { success: false, error: 'Datos inválidos.' }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  // Ownership check
  const category = await Category.findOne({ _id: categoryId, restaurantId: restaurant._id }).lean<{ _id: string }>()
  if (!category) return { success: false, error: 'Categoría no encontrada.' }

  // Referential integrity guard (CAT-03): block delete if dishes exist
  const dishCount = await Dish.countDocuments({ categoryId: category._id })
  if (dishCount > 0) {
    return {
      success: false,
      error: 'No podés eliminar esta categoría porque tiene platos asociados. Eliminá o reasigná los platos primero.',
    }
  }

  await Category.deleteOne({ _id: categoryId, restaurantId: restaurant._id })
  revalidatePath('/menu/' + restaurant.slug)
  return { success: true }
}

// ─── reorderCategory ──────────────────────────────────────────────────────────
export async function reorderCategory(prevState: any, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const categoryId = formData.get('categoryId')?.toString()
  const direction  = formData.get('direction')?.toString()  // 'up' | 'down'
  if (!categoryId || (direction !== 'up' && direction !== 'down')) {
    return { success: false, error: 'Datos inválidos.' }
  }

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{ _id: string; slug: string }>()
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  const target = await Category
    .findOne({ _id: categoryId, restaurantId: restaurant._id })
    .lean<{ _id: string; order: number }>()
  if (!target) return { success: false, error: 'Categoría no encontrada.' }

  const neighbor = await Category.findOne({
    restaurantId: restaurant._id,
    order: direction === 'up' ? target.order - 1 : target.order + 1,
  }).lean<{ _id: string; order: number }>()

  // Already at boundary — no-op is a success
  if (!neighbor) return { success: true }

  // CR-03: sentinel swap — avoids duplicate-order collision window between writes
  // Step 1: park target at a sentinel value no real order can reach
  const SENTINEL = -9999
  await Category.updateOne({ _id: target._id },   { $set: { order: SENTINEL } })
  // Step 2: move neighbor into target's old slot
  await Category.updateOne({ _id: neighbor._id }, { $set: { order: target.order } })
  // Step 3: move target into neighbor's old slot
  await Category.updateOne({ _id: target._id },   { $set: { order: neighbor.order } })

  revalidatePath('/menu/' + restaurant.slug)
  return { success: true }
}
