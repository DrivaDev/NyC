import { auth, currentUser } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { createPreapproval } from '@/lib/mpApi'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return Response.json({ error: 'Sin email en la cuenta' }, { status: 400 })

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return Response.json({ error: 'Restaurante no encontrado' }, { status: 404 })

  // If already active, redirect straight to dashboard
  if (restaurant.subscriptionStatus === 'active') {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion`,
      303,
    )
  }

  try {
    const preapproval = await createPreapproval({
      payerEmail: email,
      backUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion`,
    })

    // Persist preapproval ID so the webhook can look it up later
    await Restaurant.updateOne(
      { clerkId: userId },
      { $set: { subscriptionId: preapproval.id } },
    )

    // 303 → browser follows redirect with GET (safe after POST)
    return Response.redirect(preapproval.init_point, 303)
  } catch (err) {
    console.error('[subscription/create]', err)
    return Response.json({ error: 'No se pudo iniciar la suscripción. Intentá más tarde.' }, { status: 500 })
  }
}
