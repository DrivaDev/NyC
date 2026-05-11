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

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<RestaurantLean>()

  // Serialize dates for client-component props
  const trialEndsAt = restaurant?.trialEndsAt
    ? new Date(restaurant.trialEndsAt).toISOString()
    : null
  const subscriptionPeriodEnd = restaurant?.subscriptionPeriodEnd
    ? new Date(restaurant.subscriptionPeriodEnd).toISOString()
    : null

  // Pass subscriptionExpired to DashboardShell so it can redirect client-side.
  // We intentionally do NOT call server-side redirect() here and do NOT swap out
  // {children} for a redirect component. Either approach removes the RSC children
  // slot from the cached layout output, causing pages to render blank after a
  // client-side navigation. DashboardShell uses usePathname() (reliable on the
  // client) to redirect and keeps {children} always mounted.
  const subscriptionExpired = restaurant ? !hasActiveAccess(restaurant) : false

  return (
    <DashboardShell
      restaurantName={restaurant?.name}
      subscriptionStatus={restaurant?.subscriptionStatus ?? 'trial'}
      trialEndsAt={trialEndsAt}
      subscriptionPeriodEnd={subscriptionPeriodEnd}
      subscriptionExpired={subscriptionExpired}
    >
      {children}
    </DashboardShell>
  )
}
