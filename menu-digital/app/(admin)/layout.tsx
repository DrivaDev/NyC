import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import Sidebar from '@/components/dashboard/Sidebar'

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
    <div className="flex h-screen bg-brand-fondo overflow-hidden">
      <Sidebar restaurantName={restaurant?.name} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-14 bg-white border-b border-brand-acento flex items-center px-6 justify-between shrink-0">
          <h1 className="text-base font-bold text-brand-titulares">Dashboard</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          {children}
          <footer className="mt-auto pt-6 text-center">
            <p className="text-xs font-light text-brand-texto">Desarrollado por Driva Dev</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
