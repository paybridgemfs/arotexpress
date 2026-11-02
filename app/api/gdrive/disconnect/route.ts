import { NextRequest, NextResponse } from 'next/server';
import { DBManager } from '../../../../server/db';
import { authenticateToken } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error || (auth.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: auth.error || 'শুধুমাত্র অ্যাডমিন গুগল ড্রাইভ ডিসকানেক্ট করতে পারেন' }, { status: auth.error ? (auth.status || 401) : 403 });
  }

  try {
    await DBManager.init();
    await DBManager.disconnectGDrive();
    return NextResponse.json({ success: true, message: 'গুগল একাউন্ট সফলভাবে ডিসকানেক্ট করা হয়েছে' });
  } catch (err: any) {
    console.error('Error disconnecting GDrive:', err);
    return NextResponse.json({ error: err.message || 'ডিসকানেক্ট করতে ব্যর্থ' }, { status: 500 });
  }
}
