'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

const titles: Record<string, string> = {
  '/dashboard':              'Dashboard',
  '/dashboard/categories':   'Categorías',
  '/dashboard/dishes':       'Platos',
  '/dashboard/qr':           'Mi QR',
  '/dashboard/settings':     'Configuración',
  '/dashboard/suscripcion':  'Suscripción',
}

interface DashboardHeaderProps {
  onOpenSidebar: () => void
}

export default function DashboardHeader({ onOpenSidebar }: DashboardHeaderProps) {
  const pathname = usePathname()
  const title = titles[pathname] ?? 'Dashboard'

  return (
    <header className="h-14 bg-white border-b border-brand-acento flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenSidebar()}
          aria-label="Abrir menú"
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-brand-fondo transition-colors duration-100 -ml-2"
        >
          <Menu size={20} className="text-brand-titulares" />
        </button>
        <h1 className="text-base font-bold text-brand-titulares">{title}</h1>
      </div>
    </header>
  )
}
