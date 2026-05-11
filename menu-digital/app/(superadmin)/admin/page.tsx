import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { PromoCode } from '@/models/PromoCode'
import { Users, CreditCard, Clock, XCircle, Tag } from 'lucide-react'

async function getStats() {
  await dbConnect()
  const now = new Date()

  const [total, active, pastDue, cancelled, trialActive, trialExpired, totalCodes, activeCodes] =
    await Promise.all([
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ subscriptionStatus: 'active' }),
      Restaurant.countDocuments({ subscriptionStatus: 'past_due' }),
      Restaurant.countDocuments({ subscriptionStatus: 'cancelled' }),
      Restaurant.countDocuments({ subscriptionStatus: 'trial', trialEndsAt: { $gt: now } }),
      Restaurant.countDocuments({ subscriptionStatus: 'trial', trialEndsAt: { $lte: now } }),
      PromoCode.countDocuments(),
      PromoCode.countDocuments({ active: true }),
    ])

  return { total, active, pastDue, cancelled, trialActive, trialExpired, totalCodes, activeCodes }
}

interface StatCardProps {
  label: string
  value: number
  sub?: string
  icon: React.ReactNode
  accent: string
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const s = await getStats()
  const inactive = s.trialExpired + s.pastDue + s.cancelled

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Estadísticas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen del estado de la plataforma.</p>
      </div>

      {/* Main stats */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cuentas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total de cuentas"
            value={s.total}
            icon={<Users size={18} className="text-gray-600" />}
            accent="bg-gray-100"
          />
          <StatCard
            label="Suscripciones activas"
            value={s.active}
            sub="Pagando actualmente"
            icon={<CreditCard size={18} className="text-green-700" />}
            accent="bg-green-100"
          />
          <StatCard
            label="En trial"
            value={s.trialActive}
            sub="Trial vigente"
            icon={<Clock size={18} className="text-brand-titulares" />}
            accent="bg-brand-acento"
          />
          <StatCard
            label="Sin acceso activo"
            value={inactive}
            sub={`Trial vencido: ${s.trialExpired} · Cancelado: ${s.cancelled} · Vencido: ${s.pastDue}`}
            icon={<XCircle size={18} className="text-red-500" />}
            accent="bg-red-50"
          />
        </div>
      </div>

      {/* Promo codes summary */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Códigos de descuento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Total de códigos"
            value={s.totalCodes}
            icon={<Tag size={18} className="text-gray-600" />}
            accent="bg-gray-100"
          />
          <StatCard
            label="Códigos activos"
            value={s.activeCodes}
            icon={<Tag size={18} className="text-brand-titulares" />}
            accent="bg-brand-acento"
          />
        </div>
      </div>
    </div>
  )
}
