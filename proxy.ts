import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'authjs.session-token';
const SESSION_COOKIE_SECURE = '__Secure-authjs.session-token';

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(SESSION_COOKIE)?.value ||
      request.cookies.get(SESSION_COOKIE_SECURE)?.value,
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isGated =
    pathname.startsWith('/products/account') ||
    pathname.startsWith('/api/products/downloads');

  if (!isGated) return NextResponse.next();

  if (hasSessionCookie(request)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/products/account/:path*', '/api/products/downloads/:path*'],
};
