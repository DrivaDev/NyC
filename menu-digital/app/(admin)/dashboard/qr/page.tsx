import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import QRCard from '@/components/dashboard/QRCard'

export default async function QRPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
    _id: string
    name: string
    slug: string
    slugConfirmed: boolean
  }>()

  if (!restaurant || !restaurant.slugConfirmed) {
    redirect('/dashboard')
  }

  // QR is generated client-side in QRCard — no server-side qrcode import needed
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://menudig.com.ar'
  const menuUrl = `${appUrl}/menu/${restaurant.slug}`

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-titulares mb-1">Mi QR</h1>
        <p className="text-sm font-normal text-brand-texto">
          Descargá tu código QR o compartí el link de tu menú.
        </p>
      </div>

      <div className="max-w-sm">
        <QRCard menuUrl={menuUrl} slug={restaurant.slug} />
      </div>
    </div>
  )
}
