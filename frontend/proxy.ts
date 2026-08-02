import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check if the user has an authentication token in their cookies
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Identify if the user is on the login or register page
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Rule 1: If they are NOT logged in and try to access the dashboard, send them to /login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rule 2: If they ARE logged in and try to visit /login or /register, send them to the dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// This tells Next.js to run this check on all pages except standard background files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
