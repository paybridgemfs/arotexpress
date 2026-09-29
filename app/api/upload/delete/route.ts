import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/auth';
import { deleteDriveFile } from '@/app/lib/gdrive';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateToken(req);
    if (authResult.error || (authResult.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন ছবি ডিলিট করতে পারবেন।' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const target = body?.delete_url || body?.file_id || body?.url;

    if (!target) {
      return NextResponse.json({ error: 'সঠিক ডিলিট লিংক পাওয়া যায়নি।' }, { status: 400 });
    }

    const success = await deleteDriveFile(target);
    return NextResponse.json({ success, message: 'গুগল ড্রাইভ থেকে ছবিটি ডিলিট সম্পন্ন হয়েছে।' });
  } catch (err: any) {
    console.error('Delete image route error:', err);
    return NextResponse.json({ error: err.message || 'ইমেজ ডিলিট ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
