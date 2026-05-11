import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])
const isPublicRoute    = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/menu/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Stamp every response with the current pathname so Server Component layouts
  // can read it via headers() without needing usePathname() (which is client-only).
  const res = NextResponse.next()
  res.headers.set('x-pathname', req.nextUrl.pathname)

  if (isPublicRoute(req)) return res

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  return res
})

export const config = {
  matcher: [
    '/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api(?!/webhooks)|trpc)(.*)',
  ],
}
