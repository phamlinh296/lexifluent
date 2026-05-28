import { type NextRequest, NextResponse } from 'next/server';

const APP_PATHS = ['/dashboard', '/writing', '/vocabulary', '/progress', '/profile', '/flashcards', '/settings'];

function isAppPath(pathname: string): boolean {
  return APP_PATHS.some((p) => pathname.startsWith(p));
}


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshCookie = request.cookies.has('lexi_rt');

  // Redirect unauthenticated users away from protected routes
  if (isAppPath(pathname) && !hasRefreshCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login/register
  if ((pathname === '/login' || pathname === '/register') && hasRefreshCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
