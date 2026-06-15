import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CasosDashboard } from "@/components/casos/CasosDashboard"

export default async function CasosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <CasosDashboard />
}
