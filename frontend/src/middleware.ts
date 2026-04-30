import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Read the access token or refresh token from the cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Consider the user authenticated if they have either token
  const hasToken = !!(accessToken || refreshToken);

  const { pathname } = request.nextUrl;

  // Define routes that should be accessible without authentication
  const isPublicRoute = pathname === '/login' || pathname === '/register';

  // If the user doesn't have a token and is trying to access a protected route
  if (!hasToken && !isPublicRoute) {
    // Allow access to the root path if it's explicitly meant to be public,
    // but typically standard Next.js app protects everything except public routes.
    // If we want root '/' to redirect to login:
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If the user has a token and tries to access login or register
  if (hasToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Otherwise, let the request proceed
  return NextResponse.next();
}

// Configure the paths where this middleware should run
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public files with extensions (.svg, .png, .jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
