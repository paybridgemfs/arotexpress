import { NextRequest, NextResponse } from 'next/server';
import { getDriveAccountStats } from '../../../lib/gdrive';
import { authenticateToken } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const stats = await getDriveAccountStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error('Error in GDrive status route:', err);
    return NextResponse.json({ error: err.message || 'স্ট্যাটাস লোড করতে ব্যর্থ' }, { status: 500 });
  }
}
