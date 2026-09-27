import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AUTH MIDDLEWARE
 * 
 * Enforces session presence for protected routes.
 * Strict verification (signature and claims) is performed in Server Components 
 * and API routes using the Node.js runtime and Firebase Admin SDK.
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get('session');

  // Define protected route patterns
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders');
  const isAuthRoute = pathname === '/login';

  // 1. If trying to access a protected route without a session
  if (isProtectedRoute && !session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. We allow the request to continue to /login.
  // The LoginPage component will handle redirection if it detects 
  // a valid Firebase client user. This prevents infinite loops 
  // if the session cookie is stale.

  // 3. For all other routes or if session exists for protected routes
  // We allow the request to continue. The Server Component Layout 
  // for /dashboard/layout.tsx and /admin/layout.tsx will perform 
  // the strict JWT verification (including email_verified and role).
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
