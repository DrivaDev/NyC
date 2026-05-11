import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
    _id: string
    name: string
    slug: string
    slugConfirmed: boolean
  }>()

  return (
    <DashboardShell restaurantName={restaurant?.name}>
      {children}
    </DashboardShell>
  )
}
