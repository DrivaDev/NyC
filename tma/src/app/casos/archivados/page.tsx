import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Caso from "@/models/Caso"
import { CasosArchivados } from "@/components/casos/CasosArchivados"

export default async function ArchivadosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  await connectDB()
  const raw = await Caso.find({ archivado: true })
    .sort({ fechaVencimiento: 1 })
    .lean()

  const casos = raw.map(c => ({
    _id: String(c._id),
    nombre: c.nombre,
    responsable: c.responsable,
    fechaIngreso: (c.fechaIngreso as Date).toISOString(),
    fechaVencimiento: (c.fechaVencimiento as Date).toISOString(),
  }))

  return <CasosArchivados initialCasos={casos} />
}
