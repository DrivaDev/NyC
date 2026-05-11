import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import RestaurantProfileForm from '@/components/dashboard/RestaurantProfileForm'
import MenuColorForm from '@/components/dashboard/MenuColorForm'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
    _id: string
    name: string
    slug: string
    logoUrl: string
    logoPublicId: string
    description: string
    menuColor: string
  }>()

  if (!restaurant) redirect('/dashboard')

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-titulares mb-1">Configuración</h1>
        <p className="text-sm font-normal text-brand-texto">
          Actualizá el perfil y la apariencia de tu menú.
        </p>
      </div>

      {/* Perfil del restaurante */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-acento p-6">
        <h2 className="text-base font-bold text-brand-titulares mb-5">Perfil del restaurante</h2>
        <RestaurantProfileForm
          initialName={restaurant.name}
          initialLogoUrl={restaurant.logoUrl ?? ''}
          initialLogoPublicId={restaurant.logoPublicId ?? ''}
          initialDescription={restaurant.description ?? ''}
        />
      </div>

      {/* Color del menú público */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-acento p-6">
        <h2 className="text-base font-bold text-brand-titulares mb-1">Apariencia del menú</h2>
        <p className="text-sm font-normal text-brand-texto mb-5">
          Elegí el color de acento que se muestra en la navegación de tu menú público.
        </p>
        <MenuColorForm initialColor={restaurant.menuColor ?? '#EA580C'} />
      </div>
    </div>
  )
}
