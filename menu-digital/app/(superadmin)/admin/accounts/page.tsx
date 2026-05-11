import { clerkClient } from '@clerk/nextjs/server'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import AccountsClient from '@/components/admin/AccountsClient'

export default async function AccountsPage() {
  await dbConnect()

  const restaurants = await Restaurant.find()
    .sort({ createdAt: -1 })
    .lean<{
      _id: string
      name: string
      clerkId: string
      subscriptionStatus: string
      trialEndsAt?: Date | null
      subscriptionPeriodEnd?: Date | null
      createdAt: Date
    }[]>()

  // Batch-fetch Clerk users for email display
  const clerk = await clerkClient()
  const clerkIds = restaurants.map(r => r.clerkId).filter(Boolean)
  let emailMap: Record<string, string> = {}

  if (clerkIds.length > 0) {
    try {
      const result = await clerk.users.getUserList({ userId: clerkIds, limit: 200 })
      emailMap = Object.fromEntries(
        result.data.map(u => [u.id, u.emailAddresses[0]?.emailAddress ?? ''])
      )
    } catch {
      // Non-fatal: email column will be blank
    }
  }

  const accounts = restaurants.map(r => ({
    _id:                  String(r._id),
    name:                 r.name,
    email:                emailMap[r.clerkId] ?? '',
    subscriptionStatus:   r.subscriptionStatus,
    trialEndsAt:          r.trialEndsAt ? new Date(r.trialEndsAt).toISOString() : null,
    subscriptionPeriodEnd: r.subscriptionPeriodEnd
      ? new Date(r.subscriptionPeriodEnd).toISOString()
      : null,
    createdAt:            new Date(r.createdAt).toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Cuentas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} registrada{accounts.length !== 1 ? 's' : ''}.
        </p>
      </div>
      <AccountsClient accounts={accounts} />
    </div>
  )
}
