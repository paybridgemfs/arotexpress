import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';

export async function GET() {
  const DBManager = await getDB();
  return NextResponse.json(DBManager.getPaymentMethods());
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DBManager = await getDB();
  const body = await req.json();
  
  // Check for upsert (existing code)
  const allMethods = DBManager.getPaymentMethods();
  const oldMethod = allMethods.find(p => p.code === body.code);
  
  const method = await DBManager.addPaymentMethod(body);
  
  // Cleanup old logo if it changed during upsert
  if (oldMethod?.logo_delete_url && body.logo_delete_url && oldMethod.logo_delete_url !== body.logo_delete_url) {
    try {
      const { deleteDriveFile } = await import('../../lib/gdrive');
      await deleteDriveFile(oldMethod.logo_delete_url);
    } catch (e) {
      console.warn('Old payment logo deletion failed during upsert:', e);
    }
  }
  
  return NextResponse.json(method);
}
