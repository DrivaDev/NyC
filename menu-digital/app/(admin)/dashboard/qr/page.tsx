import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://menudig.com.ar'
  const menuUrl = `${appUrl}/menu/${restaurant.slug}`
  const qrDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 256,
    margin: 2,
    color: { dark: '#1C1917', light: '#FFFFFF' },
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-titulares mb-1">Mi QR</h1>
        <p className="text-sm font-normal text-brand-texto">
          Descargá tu código QR o compartí el link de tu menú.
        </p>
      </div>

      <div className="max-w-sm">
        <QRCard menuUrl={menuUrl} qrDataUrl={qrDataUrl} slug={restaurant.slug} />
      </div>
    </div>
  )
}
