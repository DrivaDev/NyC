import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ContratoWizard } from "./ContratoWizard"

export default async function ContratosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <ContratoWizard />
}
