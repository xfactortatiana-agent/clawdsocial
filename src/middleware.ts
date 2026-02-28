import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/settings(.*)'])
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/api/auth(.*)'])

export default clerkMiddleware((auth, req) => {
  // Don't protect public routes
  if (isPublicRoute(req)) {
    return
  }
  
  // Protect specific routes
  if (isProtectedRoute(req)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
