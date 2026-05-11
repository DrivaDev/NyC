import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import DashboardShell from '@/components/dashboard/DashboardShell'

// ── Subscription access helper ─────────────────────────────────────────────

interface RestaurantLean {
  _id: string
  name: string
  slug: string
  slugConfirmed: boolean
  subscriptionStatus: string
  trialEndsAt?: string | Date | null
  subscriptionPeriodEnd?: string | Date | null
}

function hasActiveAccess(r: RestaurantLean): boolean {
  if (r.subscriptionStatus === 'active')   return true
  if (r.subscriptionStatus === 'past_due') return true  // grace period
  if (r.subscriptionStatus === 'trial') {
    if (!r.trialEndsAt) return true
    return new Date(r.trialEndsAt) > new Date()
  }
  return false
}

// ── Layout ─────────────────────────────────────────────────────────────────

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Read pathname stamped by middleware (needed to avoid redirect loop on the subscription page)
  const headersList = await headers()
  const pathname    = headersList.get('x-pathname') ?? ''

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<RestaurantLean>()

  // Block access when trial/subscription is expired — except on the subscription page itself
  const onSubscriptionPage = pathname.startsWith('/dashboard/suscripcion')
  if (restaurant && !hasActiveAccess(restaurant) && !onSubscriptionPage) {
    redirect('/dashboard/suscripcion')
  }

  // Serialize dates for client-component props
  const trialEndsAt = restaurant?.trialEndsAt
    ? new Date(restaurant.trialEndsAt).toISOString()
    : null
  const subscriptionPeriodEnd = restaurant?.subscriptionPeriodEnd
    ? new Date(restaurant.subscriptionPeriodEnd).toISOString()
    : null

  return (
    <DashboardShell
      restaurantName={restaurant?.name}
      subscriptionStatus={restaurant?.subscriptionStatus ?? 'trial'}
      trialEndsAt={trialEndsAt}
      subscriptionPeriodEnd={subscriptionPeriodEnd}
    >
      {children}
    </DashboardShell>
  )
}
