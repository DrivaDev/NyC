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
  CreditCard,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: React.ReactNode
}

interface SidebarProps {
  restaurantName?: string
  subscriptionStatus?: string
  trialEndsAt?: string | null
  onNavigate?: () => void
}

// ── Subscription badge ────────────────────────────────────────────────────────

function SubBadge({ status, trialEndsAt }: { status: string; trialEndsAt?: string | null }) {
  if (status === 'active') {
    return (
      <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
        Activa
      </span>
    )
  }
  if (status === 'trial') {
    const daysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
      : null
    const label = daysLeft !== null ? `${daysLeft}d` : 'Trial'
    return (
      <span className="text-[10px] font-semibold bg-brand-acento text-brand-titulares px-1.5 py-0.5 rounded-full">
        {label}
      </span>
    )
  }
  if (status === 'past_due') {
    return (
      <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
        Vencida
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
        Cancelada
      </span>
    )
  }
  return null
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({
  restaurantName,
  subscriptionStatus = 'trial',
  trialEndsAt,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname()
  const { user }  = useUser()

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const email    = user?.primaryEmailAddress?.emailAddress ?? ''

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: 'Categorías',
      href: '/dashboard/categories',
      icon: <Tag size={16} />,
    },
    {
      label: 'Platos',
      href: '/dashboard/dishes',
      icon: <UtensilsCrossed size={16} />,
    },
    {
      label: 'Mi QR',
      href: '/dashboard/qr',
      icon: <QrCode size={16} />,
    },
    {
      label: 'Configuración',
      href: '/dashboard/settings',
      icon: <Settings size={16} />,
    },
    {
      label: 'Suscripción',
      href: '/dashboard/suscripcion',
      icon: <CreditCard size={16} />,
      badge: <SubBadge status={subscriptionStatus} trialEndsAt={trialEndsAt} />,
    },
  ]

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-brand-acento h-screen shrink-0">
      {/* Header */}
      <div className="px-4 py-5 border-b border-brand-acento">
        <span className="text-base font-bold text-brand-titulares">MenuDig</span>
        {restaurantName && (
          <p className="text-xs font-light text-brand-texto truncate mt-1">
            {restaurantName}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors duration-100 ${
                isActive
                  ? 'bg-brand-acento text-brand-titulares font-medium'
                  : 'text-brand-texto font-normal hover:bg-brand-fondo'
              }`}
            >
              <span className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </span>
              {item.badge}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
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
