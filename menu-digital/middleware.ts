import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)'])
const isPublicRoute    = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/menu/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Stamp the current pathname onto the *request* headers so Server Component
  // layouts can read it via headers().get('x-pathname').
  // NOTE: NextResponse.next({ request: { headers } }) is the correct pattern —
  // setting headers directly on the response object only adds them to the
  // browser-visible HTTP response, NOT to the headers() call in server components.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)

  if (isPublicRoute(req)) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    '/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api(?!/webhooks)|trpc)(.*)',
  ],
}
