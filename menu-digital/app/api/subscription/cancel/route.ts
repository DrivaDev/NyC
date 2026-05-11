import { auth } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { cancelPreapproval } from '@/lib/mpApi'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return Response.json({ error: 'Restaurante no encontrado' }, { status: 404 })

  const preapprovalId = restaurant.subscriptionId
  if (!preapprovalId) {
    return Response.json({ error: 'No hay suscripción activa' }, { status: 400 })
  }

  try {
    await cancelPreapproval(preapprovalId)

    await Restaurant.updateOne(
      { clerkId: userId },
      { $set: { subscriptionStatus: 'cancelled', subscriptionId: '' } },
    )

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion`,
      303,
    )
  } catch (err) {
    console.error('[subscription/cancel]', err)
    return Response.json({ error: 'No se pudo cancelar. Intentá más tarde.' }, { status: 500 })
  }
}
