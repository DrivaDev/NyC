import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Caso from "@/models/Caso"
import { CasosEstadisticas } from "@/components/casos/CasosEstadisticas"

export default async function EstadisticasPage() {
  const session = await auth()
  if (!session) redirect("/login")

  await connectDB()
  const raw = await Caso.find({}, { _id: 1, createdAt: 1 }).lean()

  const casos = raw.map(c => ({
    _id: String(c._id),
    createdAt: (c.createdAt as Date).toISOString(),
  }))

  return <CasosEstadisticas initialCasos={casos} />
}
