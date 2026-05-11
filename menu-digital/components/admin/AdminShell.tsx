'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Tag, ArrowLeft } from 'lucide-react'

const NAV = [
  { href: '/admin',              label: 'Estadísticas', icon: LayoutDashboard },
  { href: '/admin/accounts',     label: 'Cuentas',      icon: Users },
  { href: '/admin/promo-codes',  label: 'Códigos',      icon: Tag },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col shrink-0 bg-white border-r border-gray-200">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-base font-bold text-brand-titulares">MenuDig</span>
            <span className="text-[10px] font-bold text-white bg-brand-principal rounded px-1.5 py-0.5 leading-none tracking-wide uppercase">
              Admin
            </span>
          </div>
          <p className="text-xs text-gray-400">Panel de administración</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100 ${
                  active
                    ? 'bg-brand-acento text-brand-titulares'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Back to dashboard */}
        <div className="px-3 pb-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors duration-100"
          >
            <ArrowLeft size={15} />
            Volver al dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
