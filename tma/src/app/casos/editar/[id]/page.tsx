import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/mongodb"
import Caso from "@/models/Caso"
import { CasoForm } from "@/components/casos/CasoForm"

function isoToDDMMYYYY(date: Date): string {
  const d = new Date(date)
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

export default async function EditarCasoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect("/login")

  const { id } = await params

  await connectDB()
  const caso = await Caso.findById(id).lean()
  if (!caso) redirect("/casos")

  return (
    <CasoForm
      casoId={String(id)}
      initialValues={{
        nombre: caso.nombre,
        fechaIngreso: isoToDDMMYYYY(caso.fechaIngreso),
        fechaVencimiento: isoToDDMMYYYY(caso.fechaVencimiento),
        responsable: caso.responsable,
      }}
    />
  )
}
