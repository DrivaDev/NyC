import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CasosEstadisticas } from "@/components/casos/CasosEstadisticas"

export default async function EstadisticasPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <CasosEstadisticas />
}
