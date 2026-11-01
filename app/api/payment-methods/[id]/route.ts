import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DBManager = await getDB();
  const body = await req.json();
  const targetId = (await params).id;
  
  // Get old data before update for cleanup
  const allMethods = DBManager.getPaymentMethods();
  const oldMethod = allMethods.find(p => String(p.id) === String(targetId) || p.code === String(targetId));
  
  const updated = await DBManager.updatePaymentMethod(targetId, body);
  
  // Cleanup old logo if it changed
  if (oldMethod?.logo_delete_url && body.logo_delete_url && oldMethod.logo_delete_url !== body.logo_delete_url) {
    try {
      const { deleteDriveFile } = await import('../../../lib/gdrive');
      await deleteDriveFile(oldMethod.logo_delete_url);
    } catch (e) {
      console.warn('Old payment logo deletion failed:', e);
    }
  }
  
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DBManager = await getDB();
  const deletedMethod = await DBManager.deletePaymentMethod((await params).id);
  
  if (deletedMethod) {
    // Cleanup logo from Drive
    if (deletedMethod.logo_delete_url) {
      try {
        const { deleteDriveFile } = await import('../../../lib/gdrive');
        await deleteDriveFile(deletedMethod.logo_delete_url);
      } catch (e) {
        console.warn('Deleted payment logo cleanup failed:', e);
      }
    }
    return NextResponse.json({ success: true, message: 'পেমেন্ট মেথড ডিলিট করা হয়েছে' });
  }
  return NextResponse.json({ error: 'পেমেন্ট মেথড খুঁজে পাওয়া যায়নি' }, { status: 404 });
}
