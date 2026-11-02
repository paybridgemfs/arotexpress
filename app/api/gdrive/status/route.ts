import { NextRequest, NextResponse } from 'next/server';
import { getDriveAccountStats } from '../../../lib/gdrive';
import { authenticateToken } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error || (auth.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: auth.error || 'শুধুমাত্র অ্যাডমিন ড্রাইভ স্ট্যাটাস দেখতে পারেন' }, { status: auth.error ? (auth.status || 401) : 403 });
  }

  try {
    const stats = await getDriveAccountStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error('Error in GDrive status route:', err);
    return NextResponse.json({ error: err.message || 'স্ট্যাটাস লোড করতে ব্যর্থ' }, { status: 500 });
  }
}
