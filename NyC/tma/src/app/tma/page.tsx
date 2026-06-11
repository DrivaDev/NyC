import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { TmaPageContent } from "@/components/TmaPageContent"

export default async function TmaPage() {
  // Doble verificación de sesión a nivel página (el middleware ya redirige,
  // pero es buena práctica verificar también en el Server Component)
  const session = await auth()
  if (!session) redirect("/login")

  return <TmaPageContent />
}
