import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Tag, UtensilsCrossed } from 'lucide-react'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import OnboardingSlug from '@/components/dashboard/OnboardingSlug'
import QRCard from '@/components/dashboard/QRCard'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
    _id: string
    name: string
    slug: string
    slugConfirmed: boolean
  }>()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://menudig.com.ar'

  // State A — Webhook not yet delivered (restaurant doc missing)
  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 size={32} className="animate-spin text-brand-principal mb-4" />
        <p className="text-base font-medium text-brand-titulares">
          Configurando tu cuenta...
        </p>
        <p className="text-sm font-normal text-brand-texto mt-1">
          Estamos preparando tu espacio. Esto tarda unos segundos.
        </p>
      </div>
    )
  }

  // State B — Onboarding gate (restaurant exists, slug not yet confirmed)
  if (!restaurant.slugConfirmed) {
    return <OnboardingSlug initialSlug={restaurant.slug} />
  }

  // State C — Normal dashboard (slug confirmed)
  // QR is generated client-side in QRCard — no server-side qrcode import needed
  const menuUrl = `${appUrl}/menu/${restaurant.slug}`

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-brand-titulares mb-1">
          Bienvenido, {restaurant.name}
        </h1>
        <p className="text-sm font-normal text-brand-texto">
          Administrá tu menú digital desde acá.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR preview card */}
        <QRCard menuUrl={menuUrl} slug={restaurant.slug} />

        {/* Quick actions card */}
        <div className="bg-white rounded-lg shadow-sm border border-brand-acento p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-brand-titulares">
            Acciones rápidas
          </h2>

          <Link
            href="/dashboard/categories"
            className="flex items-center gap-3 px-4 py-4 rounded-lg border border-brand-acento hover:bg-brand-fondo transition-colors duration-150 group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-acento shrink-0">
              <Tag size={18} className="text-brand-titulares" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-titulares group-hover:underline">
                Agregar categoría
              </p>
              <p className="text-xs font-light text-brand-texto">
                Organizá tu menú en secciones
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/dishes"
            className="flex items-center gap-3 px-4 py-4 rounded-lg border border-brand-acento hover:bg-brand-fondo transition-colors duration-150 group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-acento shrink-0">
              <UtensilsCrossed size={18} className="text-brand-titulares" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-titulares group-hover:underline">
                Agregar plato
              </p>
              <p className="text-xs font-light text-brand-texto">
                Sumá un nuevo plato al menú
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
