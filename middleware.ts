import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware for Supabase authentication
 * 
 * This middleware:
 * 1. Refreshes authentication tokens automatically
 * 2. Protects routes that require authentication (/chat, /profile, /dashboard, etc.)
 * 3. Redirects authenticated users away from auth pages (/login, /signup)
 * 4. Handles session management with proper cookie handling
 * 
 * Requirements: 3.6, 9.4, 9.5, 9.6, 9.7
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - this is crucial for maintaining auth state
  // This will automatically refresh the token if it's expired
  const { data: { user }, error } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/chat-new',
    '/profile',
    '/dashboard',
    '/applications',
    '/eligibility',
  ]

  // Redirect root to /chat-new if authenticated, /login if not
  if (pathname === '/') {
    if (user && !error) {
      return NextResponse.redirect(new URL('/chat-new', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Define auth routes that authenticated users shouldn't access
  const authRoutes = ['/login', '/signup', '/reset-password']

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Requirement 9.5: Protect routes - redirect unauthenticated users to login
  if (isProtectedRoute && (!user || error)) {
    const redirectUrl = new URL('/login', request.url)
    // Add the original URL as a redirect parameter so we can send them back after login
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Requirement 9.6: Redirect authenticated users away from auth pages
  if (isAuthRoute && user && !error) {
    // Check if there's a redirect parameter
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const redirectUrl = new URL(redirectTo || '/chat-new', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Return the response with updated cookies
  return response
}

/**
 * Matcher configuration to specify which routes the middleware should run on
 * 
 * This matcher:
 * - Excludes static files (_next/static, _next/image)
 * - Excludes favicon and other asset files
 * - Runs on all other routes to ensure proper auth handling
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}
