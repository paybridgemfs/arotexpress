import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, getRedirectUri } from '../../../lib/gdrive';
import { authenticateToken } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error || (auth.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: auth.error || 'শুধুমাত্র অ্যাডমিন গুগল ড্রাইভ সংযোগ করতে পারেন' }, { status: auth.error ? (auth.status || 401) : 403 });
  }

  const { searchParams } = new URL(req.url);
  const customRedirect = searchParams.get('redirect_uri');
  const redirectUri = customRedirect || getRedirectUri(req);
  const url = getAuthUrl(redirectUri);

  return NextResponse.json({ url, redirectUri });
}
