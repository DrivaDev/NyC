'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Tag,
  UtensilsCrossed,
  QrCode,
  Settings,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  enabled: boolean
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={16} />,
    enabled: true,
  },
  {
    label: 'Categorías',
    href: '/dashboard/categories',
    icon: <Tag size={16} />,
    enabled: true,
  },
  {
    label: 'Platos',
    href: '/dashboard/dishes',
    icon: <UtensilsCrossed size={16} />,
    enabled: true,
  },
  {
    label: 'Mi QR',
    href: '/dashboard/qr',
    icon: <QrCode size={16} />,
    enabled: false,
  },
  {
    label: 'Configuración',
    href: '/dashboard/settings',
    icon: <Settings size={16} />,
    enabled: true,
  },
]

interface SidebarProps {
  restaurantName?: string
  onNavigate?: () => void
}

export default function Sidebar({ restaurantName, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const email    = user?.primaryEmailAddress?.emailAddress ?? ''

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-brand-acento h-screen shrink-0">
      {/* Header */}
      <div className="px-4 py-5 border-b border-brand-acento">
        <span className="text-base font-bold text-brand-titulares">Menú Digital</span>
        {restaurantName && (
          <p className="text-xs font-light text-brand-texto truncate mt-1">
            {restaurantName}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-400 cursor-not-allowed select-none"
                title="Disponible próximamente"
              >
                <span className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </span>
                <span className="text-xs font-medium bg-brand-acento text-brand-titulares px-1.5 py-0.5 rounded-full">
                  Pronto
                </span>
              </span>
            )
          }

          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors duration-100 ${
                isActive
                  ? 'bg-brand-acento text-brand-titulares font-medium'
                  : 'text-brand-texto font-normal hover:bg-brand-fondo'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — UserButton + nombre + mail */}
      <div className="px-4 py-4 border-t border-brand-acento flex items-center gap-3 min-w-0">
        <UserButton />
        {fullName && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-brand-titulares truncate leading-tight">
              {fullName}
            </span>
            <span className="text-xs font-light text-brand-texto truncate leading-tight">
              {email}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
