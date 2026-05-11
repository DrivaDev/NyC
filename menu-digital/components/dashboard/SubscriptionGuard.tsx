'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Rendered by AdminLayout when the user's trial/subscription is expired.
 * Triggers an immediate client-side replace to /dashboard/suscripcion.
 *
 * Why not server-side redirect():
 *   Calling redirect() in the layout during a Clerk post-login RSC navigation
 *   leaves the layout segment cache broken → destination page renders blank.
 *   Rendering the layout fully and navigating from the client avoids this.
 *
 * The client-side pathname check below is a safety net: if the server layout
 * ever renders this component while we're already on the subscription page
 * (e.g. stale x-pathname in a rare race), we bail out instead of looping.
 */
export function SubscriptionGuard() {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname.startsWith('/dashboard/suscripcion')) {
      router.replace('/dashboard/suscripcion')
    }
  }, [pathname, router])

  return null
}
