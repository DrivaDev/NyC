'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Rendered by AdminLayout when the user's trial/subscription is expired.
 * Immediately triggers a client-side replace to /dashboard/suscripcion.
 * The layout is allowed to fully render (fixing the RSC segment-cache issue
 * that occurs when redirect() is thrown before the layout renders during
 * Clerk's post-login client navigation).
 */
export function SubscriptionGuard() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/suscripcion')
  }, [router])
  return null
}
