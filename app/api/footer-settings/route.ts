import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  const DBManager = await getDB();
  const footerSettings = DBManager.getFooterSettings();
  return NextResponse.json(footerSettings);
}

export async function PUT(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const DBManager = await getDB();
  const body = await req.json();
  const updated = DBManager.updateFooterSettings(body);
  return NextResponse.json(updated);
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const DBManager = await getDB();
  const body = await req.json().catch(() => ({}));
  if (body.action === 'reset') {
    const resetData = DBManager.resetFooterSettings();
    return NextResponse.json(resetData);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
