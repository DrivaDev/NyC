import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Caso from "@/models/Caso"
import { CasosDashboard } from "@/components/casos/CasosDashboard"

export default async function CasosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  await connectDB()
  const raw = await Caso.find({ archivado: { $ne: true } })
    .sort({ fechaVencimiento: 1 })
    .lean()

  const casos = raw.map(c => ({
    _id: String(c._id),
    nombre: c.nombre,
    responsable: c.responsable,
    fechaIngreso: (c.fechaIngreso as Date).toISOString(),
    fechaVencimiento: (c.fechaVencimiento as Date).toISOString(),
  }))

  return <CasosDashboard initialCasos={casos} />
}
