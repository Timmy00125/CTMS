import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for API routes, backend routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/transcript') ||
    pathname.startsWith('/academic-sessions') ||
    pathname.startsWith('/students') ||
    pathname.startsWith('/grades') ||
    pathname.startsWith('/gpa') ||
    pathname.startsWith('/ingestion') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /\.(svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Read the access token or refresh token from the cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // Consider the user authenticated if they have either token
  const hasToken = !!(accessToken || refreshToken);

  // Define routes that should be accessible without authentication
  const isPublicRoute = pathname === '/login' || pathname === '/register';

  // If the user doesn't have a token and is trying to access a protected route
  if (!hasToken && !isPublicRoute) {
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
