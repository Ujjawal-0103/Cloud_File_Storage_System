import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Identify public auth & sharing pages
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const isAuthCallback = pathname.startsWith('/auth/callback');

  const isPublicShare =
    pathname.startsWith('/public') ||
    pathname.startsWith('/api/backend/sharing/public');

  // Rule 1: If not logged in and trying to access dashboard/protected routes -> redirect to /login
  if (!token && !isAuthPage && !isAuthCallback && !isPublicShare && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rule 2: If logged in and trying to visit login/register -> redirect to /dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
