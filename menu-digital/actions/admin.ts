'use server'

import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { Category } from '@/models/Category'
import { Dish } from '@/models/Dish'
import { PromoCode } from '@/models/PromoCode'

// ── Auth guard ─────────────────────────────────────────────────────────────────
async function assertAdmin() {
  const user = await currentUser()
  if (!user) throw new Error('No autenticado')
  const email = user.emailAddresses[0]?.emailAddress
  if (email !== process.env.ADMIN_EMAIL) throw new Error('No autorizado')
}

// ── Account actions ────────────────────────────────────────────────────────────

export async function activateSubscription(restaurantId: string, months = 1) {
  await assertAdmin()
  await dbConnect()
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + months)
  await Restaurant.updateOne(
    { _id: restaurantId },
    { $set: { subscriptionStatus: 'active', subscriptionPeriodEnd: periodEnd } },
  )
  revalidatePath('/admin')
  revalidatePath('/admin/accounts')
  return { success: true }
}

export async function setSubscriptionStatus(
  restaurantId: string,
  status: 'trial' | 'active' | 'past_due' | 'cancelled',
) {
  await assertAdmin()
  await dbConnect()
  await Restaurant.updateOne({ _id: restaurantId }, { $set: { subscriptionStatus: status } })
  revalidatePath('/admin')
  revalidatePath('/admin/accounts')
  return { success: true }
}

export async function deleteAccount(restaurantId: string) {
  await assertAdmin()
  await dbConnect()
  await Dish.deleteMany({ restaurantId })
  await Category.deleteMany({ restaurantId })
  await Restaurant.deleteOne({ _id: restaurantId })
  revalidatePath('/admin')
  revalidatePath('/admin/accounts')
  return { success: true }
}

// ── Promo code actions ─────────────────────────────────────────────────────────

export async function createPromoCode(_prevState: unknown, formData: FormData) {
  await assertAdmin()

  const code = formData.get('code')?.toString().trim().toUpperCase()
  if (!code) return { success: false, error: 'El código es obligatorio.' }

  const description = formData.get('description')?.toString().trim() ?? ''
  const freeMonths  = parseInt(formData.get('freeMonths')?.toString() ?? '1', 10)
  const maxUses     = parseInt(formData.get('maxUses')?.toString()    ?? '0', 10)
  const expiresAtStr = formData.get('expiresAt')?.toString()
  const expiresAt   = expiresAtStr ? new Date(expiresAtStr) : null

  if (!Number.isFinite(freeMonths) || freeMonths < 1)
    return { success: false, error: 'Los meses gratuitos deben ser al menos 1.' }
  if (!Number.isFinite(maxUses) || maxUses < 0)
    return { success: false, error: 'Los usos máximos no pueden ser negativos.' }

  await dbConnect()
  const existing = await PromoCode.findOne({ code })
  if (existing) return { success: false, error: `El código "${code}" ya existe.` }

  await PromoCode.create({ code, description, freeMonths, maxUses, expiresAt })

  revalidatePath('/admin/promo-codes')
  return { success: true, error: undefined }
}

export async function togglePromoCode(id: string, active: boolean) {
  await assertAdmin()
  await dbConnect()
  await PromoCode.updateOne({ _id: id }, { $set: { active } })
  revalidatePath('/admin/promo-codes')
  return { success: true }
}

export async function deletePromoCode(id: string) {
  await assertAdmin()
  await dbConnect()
  await PromoCode.deleteOne({ _id: id })
  revalidatePath('/admin/promo-codes')
  return { success: true }
}
