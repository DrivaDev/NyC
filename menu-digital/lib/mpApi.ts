/**
 * Mercado Pago API helpers — fetch-based, no SDK.
 * Avoids Turbopack module-resolution issues (same approach as Cloudinary).
 */

const MP_API    = 'https://api.mercadopago.com'
const getToken  = () => process.env.MP_ACCESS_TOKEN ?? ''

function mpHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  }
}

// ── Preapproval (suscripción recurrente) ──────────────────────────────────────

export interface MpPreapproval {
  id: string
  status: 'pending' | 'authorized' | 'paused' | 'cancelled'
  init_point: string
  payer_id?: number
  next_payment_date?: string
  summarized?: { charged_quantity?: number; last_charged_amount?: number }
  auto_recurring?: { transaction_amount: number; currency_id: string }
}

/** Create a new subscription checkout. Returns the preapproval object (with init_point). */
export async function createPreapproval({
  payerEmail,
  backUrl,
}: {
  payerEmail: string
  backUrl: string
}): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: mpHeaders(),
    body: JSON.stringify({
      reason: 'MenuDig — Plan Mensual',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 20000,
        currency_id: 'ARS',
      },
      back_url: backUrl,
      payer_email: payerEmail,
      status: 'pending',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[MP] createPreapproval ${res.status}: ${body}`)
  }
  return res.json()
}

/** Fetch current state of a preapproval by its ID. */
export async function getPreapproval(id: string): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`[MP] getPreapproval ${res.status}`)
  return res.json()
}

/** Cancel (PUT status=cancelled) a preapproval. */
export async function cancelPreapproval(id: string): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    method: 'PUT',
    headers: mpHeaders(),
    body: JSON.stringify({ status: 'cancelled' }),
  })
  if (!res.ok) throw new Error(`[MP] cancelPreapproval ${res.status}`)
  return res.json()
}

/** Fetch a payment by ID (used in webhook handler). */
export async function getPayment(id: string | number) {
  const res = await fetch(`${MP_API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`[MP] getPayment ${res.status}`)
  return res.json()
}

// ── Map MP preapproval status → our subscriptionStatus ───────────────────────

export type OurStatus = 'trial' | 'active' | 'past_due' | 'cancelled'

export function mpStatusToOurs(mpStatus: MpPreapproval['status']): OurStatus | null {
  switch (mpStatus) {
    case 'authorized': return 'active'
    case 'paused':     return 'past_due'
    case 'cancelled':  return 'cancelled'
    default:           return null  // 'pending' — no change
  }
}
