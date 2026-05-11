import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const email = user.emailAddresses[0]?.emailAddress
  if (email !== process.env.ADMIN_EMAIL) redirect('/dashboard')

  return <AdminShell>{children}</AdminShell>
}
