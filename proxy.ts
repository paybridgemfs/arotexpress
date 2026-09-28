import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const APP_URL = process.env.APP_URL;
  const { pathname } = request.nextUrl;

  // Bypass security check for OAuth callbacks and Webhooks
  if (pathname.startsWith('/api/gdrive/callback')) {
    return NextResponse.next();
  }

  // Security check for /api routes when APP_URL is configured
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    const forwardedHost = request.headers.get('x-forwarded-host');
    const secFetchSite = request.headers.get('sec-fetch-site');

    // Allow same-origin browser calls
    if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') {
      return NextResponse.next();
    }

    const isAllowedUrl = (urlStr: string | null) => {
      if (!urlStr) return false;
      if (APP_URL && urlStr.startsWith(APP_URL)) return true;
      if (host && urlStr.includes(host)) return true;
      if (forwardedHost && urlStr.includes(forwardedHost)) return true;
      if (urlStr.includes('localhost') || urlStr.includes('127.0.0.1') || urlStr.includes('.run.app')) return true;
      if (urlStr.includes('google.com') || urlStr.includes('accounts.google.com')) return true;
      return false;
    };

    if (origin) {
      if (!isAllowedUrl(origin)) {
        return NextResponse.json({ error: 'CORS policy violation' }, { status: 403 });
      }
    } else if (referer) {
      if (!isAllowedUrl(referer)) {
        return NextResponse.json({ error: 'Direct API access is blocked' }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
