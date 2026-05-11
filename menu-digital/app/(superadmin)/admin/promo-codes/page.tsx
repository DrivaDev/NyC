import { dbConnect } from '@/lib/dbConnect'
import { PromoCode } from '@/models/PromoCode'
import PromoCodesClient from '@/components/admin/PromoCodesClient'

export default async function PromoCodesPage() {
  await dbConnect()

  const raw = await PromoCode.find().sort({ createdAt: -1 }).lean<{
    _id: string
    code: string
    description: string
    freeMonths: number
    maxUses: number
    usedCount: number
    expiresAt?: Date | null
    active: boolean
    createdAt: Date
  }[]>()

  const codes = raw.map(c => ({
    _id:         String(c._id),
    code:        c.code,
    description: c.description,
    freeMonths:  c.freeMonths,
    maxUses:     c.maxUses,
    usedCount:   c.usedCount,
    expiresAt:   c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
    active:      c.active,
    createdAt:   new Date(c.createdAt).toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Códigos de descuento</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Creá y gestioná códigos que activan meses gratuitos de suscripción.
        </p>
      </div>
      <PromoCodesClient codes={codes} />
    </div>
  )
}
