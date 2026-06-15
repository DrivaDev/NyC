import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CasosSidebar } from "@/components/casos/CasosSidebar"

export default async function CasosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-screen bg-brand-background">
      <CasosSidebar />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
