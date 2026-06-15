import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CasoForm } from "@/components/casos/CasoForm"

export default async function CasosNuevoPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <CasoForm />
}
