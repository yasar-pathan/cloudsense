import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('cs_token')?.value;

  // Root redirect
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/connect') ||
    pathname.startsWith('/usage') ||
    pathname.startsWith('/budgets') ||
    pathname.startsWith('/anomalies') ||
    pathname.startsWith('/alerts');

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If token is in cookie and attempting protected page, allow
  // If no cookie token, we also have client-side auth guard in dashboard layout for localStorage
  if (isProtectedPage && !token) {
    // We let request pass to client where useAuth/dashboard layout checks localStorage
    // If neither exists, client redirects to /login
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|monitoring).*)'],
};
