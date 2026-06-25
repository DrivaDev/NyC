import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CasosArchivados } from "@/components/casos/CasosArchivados"

export default async function ArchivadosPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <CasosArchivados />
}
