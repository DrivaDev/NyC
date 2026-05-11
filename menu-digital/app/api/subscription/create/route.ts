import { auth, currentUser } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'

const MP_API = 'https://api.mercadopago.com'

export async function POST() {
  // ── Verify env vars are present ──────────────────────────────────────────
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    console.error('[subscription/create] MP_ACCESS_TOKEN is not set in environment')
    return Response.json({ error: 'Configuración incompleta: MP_ACCESS_TOKEN falta en Vercel.' }, { status: 500 })
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return Response.json({ error: 'Sin email en la cuenta' }, { status: 400 })

  // ── DB ────────────────────────────────────────────────────────────────────
  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId })
  if (!restaurant) return Response.json({ error: 'Restaurante no encontrado' }, { status: 404 })

  if (restaurant.subscriptionStatus === 'active') {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion`, 303)
  }

  // ── Call MP API ───────────────────────────────────────────────────────────
  const backUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion`

  let mpResponse: Response
  let mpBody: string

  try {
    mpResponse = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'MenuDig — Plan Mensual',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 20000,
          currency_id: 'ARS',
        },
        back_url: backUrl,
        payer_email: email,
        status: 'pending',
      }),
    })
    mpBody = await mpResponse.text()
  } catch (networkErr) {
    console.error('[subscription/create] Network error calling MP API:', networkErr)
    return Response.json({ error: 'Error de red al conectar con Mercado Pago.' }, { status: 502 })
  }

  if (!mpResponse.ok) {
    // Log full MP error for debugging in Vercel logs
    console.error(`[subscription/create] MP API ${mpResponse.status}:`, mpBody)
    return Response.json(
      { error: `Error de Mercado Pago (${mpResponse.status}): ${mpBody}` },
      { status: 502 },
    )
  }

  let preapproval: { id: string; init_point: string }
  try {
    preapproval = JSON.parse(mpBody)
  } catch {
    console.error('[subscription/create] Invalid JSON from MP:', mpBody)
    return Response.json({ error: 'Respuesta inválida de Mercado Pago.' }, { status: 502 })
  }

  // ── Persist & redirect ────────────────────────────────────────────────────
  await Restaurant.updateOne(
    { clerkId: userId },
    { $set: { subscriptionId: preapproval.id } },
  )

  return Response.redirect(preapproval.init_point, 303)
}
