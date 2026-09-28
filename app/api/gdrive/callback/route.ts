import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, fetchUserInfo, ensureDriveFolder, getRedirectUri } from '../../../lib/gdrive';
import { DBManager } from '../../../../server/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const originUrl = new URL(req.url).origin;
  const adminGdriveUrl = `${originUrl}/admin/gdrive`;

  if (error) {
    console.error('Google OAuth error from callback:', error);
    return NextResponse.redirect(`${adminGdriveUrl}?error=${encodeURIComponent('গুগল লগইন বাতিল বা ব্যর্থ হয়েছে: ' + error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${adminGdriveUrl}?error=${encodeURIComponent('কোনো অথরাইজেশন কোড পাওয়া যায়নি')}`);
  }

  try {
    const redirectUri = state ? decodeURIComponent(state) : getRedirectUri(req);
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const userInfo = await fetchUserInfo(tokens.access_token);
    const folderId = await ensureDriveFolder(tokens.access_token, 'ArotExpress Photos');

    await DBManager.init();
    await DBManager.saveGDriveConfig({
      account_email: userInfo.email || '',
      account_name: userInfo.name || '',
      account_picture: userInfo.picture || '',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      token_expiry: Date.now() + (tokens.expires_in * 1000),
      folder_id: folderId,
      is_connected: true
    });

    return NextResponse.redirect(`${adminGdriveUrl}?connected=1`);
  } catch (err: any) {
    console.error('Error handling GDrive callback:', err);
    return NextResponse.redirect(`${adminGdriveUrl}?error=${encodeURIComponent(err.message || 'গুগল ড্রাইভ সেটআপ করতে ব্যর্থ হয়েছে')}`);
  }
}
