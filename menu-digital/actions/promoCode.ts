'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { PromoCode } from '@/models/PromoCode'

export async function redeemPromoCode(_prevState: unknown, formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado.' }

  const code = formData.get('code')?.toString().trim().toUpperCase()
  if (!code) return { success: false, error: 'Ingresá un código de descuento.' }

  await dbConnect()

  const promo = await PromoCode.findOne({ code, active: true })
  if (!promo) return { success: false, error: 'Código inválido o desactivado.' }
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date())
    return { success: false, error: 'Este código ya venció.' }
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses)
    return { success: false, error: 'Este código ya alcanzó el límite de usos.' }

  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return { success: false, error: 'Restaurante no encontrado.' }

  // Calculate new period end: extend from today or from current end, whichever is later
  const base =
    restaurant.subscriptionStatus === 'active' && restaurant.subscriptionPeriodEnd
      ? new Date(
          Math.max(
            new Date(restaurant.subscriptionPeriodEnd).getTime(),
            Date.now(),
          ),
        )
      : new Date()
  base.setMonth(base.getMonth() + promo.freeMonths)

  await Restaurant.updateOne(
    { clerkId: userId },
    { $set: { subscriptionStatus: 'active', subscriptionPeriodEnd: base } },
  )
  await PromoCode.updateOne({ _id: promo._id }, { $inc: { usedCount: 1 } })

  revalidatePath('/dashboard/suscripcion')
  return {
    success: true,
    error: undefined,
    message: `¡Código aplicado! Tu suscripción se extendió por ${promo.freeMonths} mes${promo.freeMonths > 1 ? 'es' : ''}.`,
  }
}
