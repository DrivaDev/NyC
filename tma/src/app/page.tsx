import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { TmaPageContent } from "@/components/TmaPageContent"

export default async function RootPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <TmaPageContent />
}
