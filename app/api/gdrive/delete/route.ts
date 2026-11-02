import { NextRequest, NextResponse } from 'next/server';
import { deleteDriveFile } from '../../../lib/gdrive';
import { authenticateToken } from '../../../lib/auth';
import { getDB } from '@/app/lib/db';

export async function POST(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const user = auth.user as any;
  const isAdmin = user?.role === 'admin';

  try {
    const body = await req.json().catch(() => ({}));
    const target = body.delete_url || body.file_id || body.url;

    if (!target) {
      return NextResponse.json({ error: 'ডিলিট করার মতো ফাইল আইডি বা ইউআরএল পাওয়া যায়নি' }, { status: 400 });
    }

    if (!isAdmin) {
      // Check if normal user is deleting their own avatar
      const DBManager = await getDB();
      const currentUser = DBManager.findUserById(user.id);
      const isSelfAvatar = currentUser && currentUser.avatar_delete_url && currentUser.avatar_delete_url === target;
      if (!isSelfAvatar) {
        return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন ড্রাইভ থেকে পণ্য বা সাইটের ফাইল ডিলিট করতে পারেন' }, { status: 403 });
      }
    }

    const deleted = await deleteDriveFile(target);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error('Error in GDrive delete route:', err);
    return NextResponse.json({ error: err.message || 'ড্রাইভ থেকে ফাইল ডিলিট ব্যর্থ' }, { status: 500 });
  }
}
