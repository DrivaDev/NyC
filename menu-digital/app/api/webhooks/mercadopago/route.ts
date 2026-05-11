import { headers } from 'next/headers'
import { createHmac } from 'crypto'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { getPreapproval, getPayment, mpStatusToOurs } from '@/lib/mpApi'

// ── Signature validation ───────────────────────────────────────────────────

/**
 * MP signs every webhook with HMAC-SHA256.
 * Header format:  x-signature: ts=1704147896,v1=<hex>
 * Signed manifest: "id:{data.id};request-id:{x-request-id};ts:{ts};"
 */
function validateSignature(
  dataId: string,
  requestId: string,
  xSignature: string,
  secret: string,
): boolean {
  try {
    const parts = Object.fromEntries(
      xSignature.split(',').map(p => p.split('=')),
    ) as { ts?: string; v1?: string }
    const { ts, v1 } = parts
    if (!ts || !v1) return false

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
    const expected = createHmac('sha256', secret).update(manifest).digest('hex')
    return expected === v1
  } catch {
    return false
  }
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const headersList = await headers()
  const xSignature  = headersList.get('x-signature')  ?? ''
  const xRequestId  = headersList.get('x-request-id') ?? ''

  let body: { type?: string; action?: string; data?: { id?: string | number } }
  try {
    body = await req.json()
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const dataId = String(body?.data?.id ?? '')
  if (!dataId) return new Response('Missing data.id', { status: 400 })

  // Validate signature when secret is configured
  const secret = process.env.MP_WEBHOOK_SECRET
  if (secret) {
    if (!validateSignature(dataId, xRequestId, xSignature, secret)) {
      console.warn('[mp-webhook] Invalid signature — rejected')
      return new Response('Invalid signature', { status: 401 })
    }
  } else {
    // During development, log a warning but continue
    console.warn('[mp-webhook] MP_WEBHOOK_SECRET not set — skipping signature check')
  }

  await dbConnect()

  try {
    const topic = body.type

    // ── subscription_preapproval ──────────────────────────────────────────
    if (topic === 'subscription_preapproval') {
      const preapproval = await getPreapproval(dataId)
      const newStatus   = mpStatusToOurs(preapproval.status)
      if (!newStatus) {
        return new Response('OK', { status: 200 }) // 'pending' → no change
      }

      const update: Record<string, unknown> = { subscriptionStatus: newStatus }

      // When activated, set period end to ~1 month from now
      if (newStatus === 'active') {
        const periodEnd = new Date()
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        update.subscriptionPeriodEnd = periodEnd
      }

      const result = await Restaurant.updateOne(
        { subscriptionId: dataId },
        { $set: update },
      )

      if (result.matchedCount === 0) {
        console.warn(`[mp-webhook] No restaurant found for preapprovalId=${dataId}`)
      }
    }

    // ── payment ───────────────────────────────────────────────────────────
    if (topic === 'payment') {
      const payment = await getPayment(dataId)
      const preapprovalId = payment?.metadata?.preapproval_id
                         ?? payment?.subscription_id
                         ?? null

      if (!preapprovalId) {
        // Payment not linked to a subscription — ignore
        return new Response('OK', { status: 200 })
      }

      if (payment.status === 'approved') {
        const periodEnd = new Date()
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        await Restaurant.updateOne(
          { subscriptionId: preapprovalId },
          { $set: { subscriptionStatus: 'active', subscriptionPeriodEnd: periodEnd } },
        )
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        await Restaurant.updateOne(
          { subscriptionId: preapprovalId },
          { $set: { subscriptionStatus: 'past_due' } },
        )
      }
    }
  } catch (err) {
    console.error('[mp-webhook] Error processing event:', err)
    // Return 200 so MP doesn't retry — we'll handle inconsistencies manually
  }

  return new Response('OK', { status: 200 })
}
