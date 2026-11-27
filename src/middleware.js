import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  isPinProtectionEnabled,
  verifySessionToken,
} from '@/lib/auth';

export async function middleware(request) {
  if (!isPinProtectionEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Always allow auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = await verifySessionToken(token);

  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon-16x16.png|favicon-32x32.png|apple-icon.png|icon-192.png|icon-512.png|caudal-logo.png|wave-bg.jpg|wave-bg.png|manifest.webmanifest|manifest.json).*)',
  ],
};
