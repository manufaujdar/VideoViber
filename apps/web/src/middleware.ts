import { NextResponse, type NextRequest } from 'next/server';

const SKIP_PREFIXES = ['/api/', '/_next/', '/icons/'];
const SKIP_EXACT = ['/favicon.ico', '/manifest.webmanifest', '/robots.txt', '/sitemap.xml'];

function shouldSkip(pathname: string) {
  if (SKIP_EXACT.includes(pathname)) return true;
  return SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  const lowercasePath = pathname.toLowerCase();
  if (pathname !== lowercasePath) {
    const url = request.nextUrl.clone();
    url.pathname = lowercasePath;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
