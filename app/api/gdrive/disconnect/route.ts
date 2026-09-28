import { NextRequest, NextResponse } from 'next/server';
import { DBManager } from '../../../../server/db';
import { authenticateToken } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
