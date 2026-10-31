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
  const updated = DBManager.updatePaymentMethod((await params).id, body);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DBManager = await getDB();
  const success = await DBManager.deletePaymentMethod((await params).id);
  if (success) {
    return NextResponse.json({ success: true, message: 'পেমেন্ট মেথড ডিলিট করা হয়েছে' });
  }
  return NextResponse.json({ error: 'পেমেন্ট মেথড খুঁজে পাওয়া যায়নি' }, { status: 404 });
}
