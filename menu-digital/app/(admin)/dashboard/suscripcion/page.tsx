import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { Check, AlertTriangle, Clock, CreditCard, XCircle } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Status card configs ────────────────────────────────────────────────────

type Status = 'trial' | 'active' | 'past_due' | 'cancelled'

interface StatusConfig {
  icon: React.ReactNode
  title: string
  bgClass: string
  borderClass: string
}

function getStatusConfig(status: Status, trialDays: number | null): StatusConfig {
  switch (status) {
    case 'active':
      return {
        icon: <Check size={20} className="text-green-700" />,
        title: 'Suscripción activa',
        bgClass: 'bg-green-50',
        borderClass: 'border-green-200',
      }
    case 'trial':
      return {
        icon: <Clock size={20} className="text-brand-titulares" />,
        title: trialDays === 0
          ? 'Tu período de prueba venció hoy'
          : `Período de prueba — ${trialDays} día${trialDays === 1 ? '' : 's'} restante${trialDays === 1 ? '' : 's'}`,
        bgClass: 'bg-brand-acento/30',
        borderClass: 'border-brand-acento',
      }
    case 'past_due':
      return {
        icon: <AlertTriangle size={20} className="text-brand-danger" />,
        title: 'Pago pendiente',
        bgClass: 'bg-brand-danger/5',
        borderClass: 'border-brand-danger/30',
      }
    case 'cancelled':
      return {
        icon: <XCircle size={20} className="text-gray-500" />,
        title: 'Suscripción cancelada',
        bgClass: 'bg-gray-50',
        borderClass: 'border-gray-200',
      }
  }
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function SuscripcionPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
    subscriptionStatus: Status
    trialEndsAt?: Date | null
    subscriptionId?: string
    subscriptionPeriodEnd?: Date | null
  }>()

  if (!restaurant) redirect('/dashboard')

  const status    = restaurant.subscriptionStatus ?? 'trial'
  const trialDays = daysUntil(restaurant.trialEndsAt)
  const config    = getStatusConfig(status, trialDays)

  const isActive     = status === 'active'
  const canSubscribe = status !== 'active'

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-titulares mb-1">Suscripción</h1>
        <p className="text-sm font-normal text-brand-texto">
          Gestioná tu plan mensual de MenuDig.
        </p>
      </div>

      {/* Status card */}
      <div className={`rounded-xl border ${config.bgClass} ${config.borderClass} p-6`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{config.icon}</div>
          <div className="flex-1">
            <p className="text-base font-bold text-brand-titulares">{config.title}</p>

            {status === 'trial' && trialDays !== null && trialDays > 0 && (
              <p className="text-sm font-normal text-brand-texto mt-1">
                Tu prueba gratuita vence el <strong>{formatDate(restaurant.trialEndsAt)}</strong>.
                Suscribite antes para no perder el acceso.
              </p>
            )}
            {status === 'trial' && trialDays === 0 && (
              <p className="text-sm font-normal text-brand-texto mt-1">
                Suscribite ahora para continuar usando MenuDig sin interrupciones.
              </p>
            )}
            {status === 'active' && restaurant.subscriptionPeriodEnd && (
              <p className="text-sm font-normal text-brand-texto mt-1">
                Próximo cobro el <strong>{formatDate(restaurant.subscriptionPeriodEnd)}</strong>.
              </p>
            )}
            {status === 'past_due' && (
              <p className="text-sm font-normal text-brand-texto mt-1">
                No pudimos procesar tu último pago. Suscribite nuevamente para restablecer el acceso.
              </p>
            )}
            {status === 'cancelled' && (
              <p className="text-sm font-normal text-brand-texto mt-1">
                Tu suscripción fue cancelada. Podés volver a suscribirte cuando quieras.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Plan details */}
      <div className="bg-white rounded-xl border border-brand-acento p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-brand-acento flex items-center justify-center">
            <CreditCard size={18} className="text-brand-titulares" />
          </div>
          <div>
            <p className="text-base font-bold text-brand-titulares">Plan Mensual</p>
            <p className="text-2xl font-bold text-brand-principal leading-none mt-0.5">
              $20.000<span className="text-sm font-normal text-brand-texto">/mes</span>
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-2 mb-6">
          {[
            'Menú público sin límite de platos',
            'Código QR descargable',
            'Fotos de platos incluidas',
            'Colores y apariencia personalizados',
            'Actualizaciones ilimitadas en tiempo real',
            'Soporte por email',
          ].map(f => (
            <li key={f} className="flex items-center gap-2 text-sm font-normal text-brand-texto">
              <Check size={14} className="text-brand-principal shrink-0" strokeWidth={3} />
              {f}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {canSubscribe && (
            /* POST form → API route → MP checkout redirect */
            <form action="/api/subscription/create" method="POST">
              <button
                type="submit"
                className="w-full bg-brand-principal text-white text-sm font-semibold rounded-lg px-6 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors"
              >
                {status === 'active' ? 'Gestionar suscripción' : 'Suscribirme — $20.000/mes'}
              </button>
            </form>
          )}

          {isActive && (
            <form
              action="/api/subscription/cancel"
              method="POST"
              onSubmit={(e) => {
                if (!confirm('¿Seguro que querés cancelar tu suscripción? Perderás el acceso al panel.')) {
                  e.preventDefault()
                }
              }}
            >
              <button
                type="submit"
                className="w-full border border-gray-200 text-brand-texto text-sm font-medium rounded-lg px-6 py-3 min-h-[44px] hover:bg-gray-50 transition-colors"
              >
                Cancelar suscripción
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-brand-fondo border border-brand-acento px-5 py-4">
        <p className="text-xs font-normal text-brand-texto leading-relaxed">
          El cobro se realiza mensualmente de forma automática a través de{' '}
          <strong className="font-semibold">Mercado Pago</strong>. Podés cancelar en cualquier
          momento desde esta página. Tu menú público permanece accesible para tus clientes
          independientemente del estado de tu suscripción.
        </p>
      </div>
    </div>
  )
}
