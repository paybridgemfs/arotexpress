import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';

export async function GET() {
  const DBManager = await getDB();
  return NextResponse.json(DBManager.getGroups());
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const DBManager = await getDB();
    const { en, bn, key, is_active } = await req.json();
    if (!bn || !en) {
      return NextResponse.json({ error: 'গ্রুপের বাংলা ও ইংরেজি নাম আবশ্যক' }, { status: 400 });
    }
    const newGroup = DBManager.addGroup({ en, bn, key, is_active });
    return NextResponse.json(newGroup);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
