import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, getRedirectUri } from '../../../lib/gdrive';
import { authenticateToken } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const customRedirect = searchParams.get('redirect_uri');
  const redirectUri = customRedirect || getRedirectUri(req);
  const url = getAuthUrl(redirectUri);

  return NextResponse.json({ url, redirectUri });
}
