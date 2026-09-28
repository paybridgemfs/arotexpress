import { NextRequest, NextResponse } from 'next/server';
import { deleteDriveFile } from '../../../lib/gdrive';
import { authenticateToken } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const target = body.delete_url || body.file_id || body.url;

    if (!target) {
      return NextResponse.json({ error: 'ডিলিট করার মতো ফাইল আইডি বা ইউআরএল পাওয়া যায়নি' }, { status: 400 });
    }

    const deleted = await deleteDriveFile(target);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error('Error in GDrive delete route:', err);
    return NextResponse.json({ error: err.message || 'ড্রাইভ থেকে ফাইল ডিলিট ব্যর্থ' }, { status: 500 });
  }
}
