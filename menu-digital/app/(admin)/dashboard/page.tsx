import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Loader2, Clock } from 'lucide-react'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import OnboardingSlug from '@/components/dashboard/OnboardingSlug'

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
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-titulares mb-1">
          Bienvenido, {restaurant.name}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-brand-acento p-6 max-w-lg">
        <h2 className="text-base font-bold text-brand-titulares mb-4">
          Tu menú digital
        </h2>
        <p className="text-sm font-normal text-brand-texto mb-2">
          Tu menú estará disponible en:
        </p>
        <div className="flex items-center gap-2 bg-brand-fondo rounded-md px-4 py-3">
          <span className="font-mono text-sm text-brand-texto">
            {appUrl.replace(/^https?:\/\//, '')}/menu/
          </span>
          <span className="font-mono text-sm font-medium text-brand-principal">
            {restaurant.slug}
          </span>
        </div>
        <p className="text-xs font-light text-brand-texto mt-3 flex items-center gap-1">
          <Clock size={12} />
          El enlace se activará cuando publiques tu menú (disponible en la Fase 3)
        </p>
      </div>
    </>
  )
}
