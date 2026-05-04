import { headers } from 'next/headers'
import { Webhook } from 'svix'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { generateSlug } from '@/lib/utils'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set')
    return new Response('Server configuration error', { status: 500 })
  }

  // Next.js 15+: headers() is async
  const headerPayload = await headers()
  const svixId        = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  // CRITICAL: Use raw text — JSON.parse then re-stringify breaks the Svix HMAC signature
  const payload = await req.text()

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(payload, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data

    // Derive a name from Clerk user data — fallback to email prefix
    // Note: Clerk collects person name, not restaurant name. Onboarding UX handles the rename.
    const name =
      [first_name, last_name].filter(Boolean).join(' ').trim() ||
      email_addresses[0]?.email_address?.split('@')[0] ||
      'restaurante'

    const slug = generateSlug(name)

    await dbConnect()

    // $setOnInsert ensures idempotency — duplicate webhook deliveries don't overwrite confirmed slugs
    await Restaurant.findOneAndUpdate(
      { clerkId },
      { $setOnInsert: { clerkId, name, slug, slugConfirmed: false } },
      { upsert: true, new: true }
    )
  }

  return new Response('OK', { status: 200 })
}
