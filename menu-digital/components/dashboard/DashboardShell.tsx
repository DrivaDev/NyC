'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import Sidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

interface DashboardShellProps {
  restaurantName?: string
  subscriptionStatus?: string
  trialEndsAt?: string | null
  subscriptionPeriodEnd?: string | null
  subscriptionExpired?: boolean   // true when trial/subscription lapsed
  children: React.ReactNode
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function DashboardShell({
  restaurantName,
  subscriptionStatus = 'trial',
  trialEndsAt,
  subscriptionPeriodEnd,
  subscriptionExpired = false,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  // Redirect expired users to the subscription page.
  // Using client-side pathname (usePathname) is reliable regardless of RSC caching.
  // The layout always renders {children} to keep the RSC children slot intact —
  // if the layout conditionally swaps children for a redirect component the slot
  // disappears from the cached RSC output and pages never render.
  const onSubscriptionPage = pathname.startsWith('/dashboard/suscripcion')
  const needsRedirect = subscriptionExpired && !onSubscriptionPage

  useEffect(() => {
    if (needsRedirect) {
      router.replace('/dashboard/suscripcion')
    }
  }, [needsRedirect, router])

  // Determine if we should show a warning banner
  const trialDays = subscriptionStatus === 'trial' ? daysUntil(trialEndsAt) : null
  const showTrialWarning  = trialDays !== null && trialDays <= 3
  const showPastDueBanner = subscriptionStatus === 'past_due'

  return (
    <div className="flex h-screen bg-brand-fondo overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0">
        <Sidebar
          restaurantName={restaurantName}
          subscriptionStatus={subscriptionStatus}
          trialEndsAt={trialEndsAt}
        />
      </aside>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          restaurantName={restaurantName}
          subscriptionStatus={subscriptionStatus}
          trialEndsAt={trialEndsAt}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Right column */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Trial / past_due warning banners */}
        {showPastDueBanner && (
          <div className="bg-brand-danger/10 border-b border-brand-danger/30 px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-danger">
              <AlertTriangle size={15} />
              Tu último pago no fue procesado. Actualizá tu suscripción para evitar la pérdida de acceso.
            </div>
            <Link
              href="/dashboard/suscripcion"
              className="shrink-0 text-xs font-semibold text-brand-danger underline hover:no-underline"
            >
              Ver suscripción
            </Link>
          </div>
        )}

        {showTrialWarning && !showPastDueBanner && (
          <div className="bg-brand-acento border-b border-brand-principal/30 px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-titulares">
              <AlertTriangle size={15} />
              Tu período de prueba vence en {trialDays === 0 ? 'hoy' : `${trialDays} día${trialDays === 1 ? '' : 's'}`}.
            </div>
            <Link
              href="/dashboard/suscripcion"
              className="shrink-0 text-xs font-semibold text-brand-titulares underline hover:no-underline"
            >
              Suscribirme
            </Link>
          </div>
        )}

        {/* Main content — always rendered to keep the RSC children slot alive.
            Hidden while a subscription redirect is pending to avoid a content flash. */}
        <main className={`flex-1 overflow-y-auto p-8 flex flex-col ${needsRedirect ? 'invisible' : ''}`}>
          {children}
          <footer className="mt-auto pt-6 text-center">
            <p className="text-xs font-light text-brand-texto">
              Desarrollado por <strong className="font-bold">Driva Dev</strong>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
