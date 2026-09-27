import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateToken(req);
    if (authResult.error || (authResult.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন ছবি ডিলিট করতে পারবেন।' }, { status: 401 });
    }

    const body = await req.json();
    const deleteUrl = body?.delete_url;

    if (!deleteUrl || typeof deleteUrl !== 'string' || !deleteUrl.startsWith('http')) {
      return NextResponse.json({ error: 'সঠিক ডিলিট লিংক পাওয়া যায়নি।' }, { status: 400 });
    }

    // Call the delete URL on ImgBB
    try {
      const pageRes = await fetch(deleteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const html = await pageRes.text();

      // Look for auth_token in ImgBB's confirmation page
      const authMatch = html.match(/name="auth_token"\s+value="([^"]+)"/i) || html.match(/PF\.obj\.config\.auth_token\s*=\s*"([^"]+)"/i);
      const actionMatch = html.match(/<form[^>]+action="([^"]+)"/i);

      if (authMatch && authMatch[1]) {
        const postUrl = actionMatch && actionMatch[1] ? actionMatch[1] : deleteUrl;
        const formData = new URLSearchParams();
        formData.append('auth_token', authMatch[1]);
        formData.append('action', 'delete');
        formData.append('delete', 'image');

        await fetch(postUrl, {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': deleteUrl
          },
          body: formData.toString()
        });
      }
    } catch (remoteErr: any) {
      console.warn('ImgBB remote deletion notice:', remoteErr.message);
    }

    return NextResponse.json({ success: true, message: 'ImgBB থেকে ছবিটি ডিলিট সম্পন্ন হয়েছে।' });
  } catch (err: any) {
    console.error('Delete image route error:', err);
    return NextResponse.json({ error: err.message || 'ইমেজ ডিলিট ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
