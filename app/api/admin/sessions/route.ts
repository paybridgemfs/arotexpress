import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'arot_express_secret_key_2026';

function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.role === 'admin') {
      return decoded;
    }
  } catch (e) {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'শুধুমাত্র অনুমোদিত অ্যাডমিন অ্যাক্সেস করতে পারবেন' }, { status: 401 });
    }

    const DBManager = await getDB();
    await DBManager.ensureAdminSession(admin.id, admin.session_token);
    const sessions = DBManager.getAdminSessions(admin.id);

    // Mark current session
    const currentSessionToken = admin.session_token;
    const mappedSessions = sessions.map((s) => ({
      id: s.id,
      session_token: s.session_token,
      device_name: s.device_name,
      device_type: s.device_type || 'desktop',
      browser: s.browser,
      os: s.os,
      ip_address: s.ip_address,
      location: s.location || 'Dhaka, Bangladesh',
      last_active: s.last_active,
      created_at: s.created_at,
      is_current: s.session_token === currentSessionToken
    }));

    return NextResponse.json({
      sessions: mappedSessions,
      total_count: mappedSessions.length,
      max_allowed: 3
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'শুধুমাত্র অনুমোদিত অ্যাডমিন অ্যাক্সেস করতে পারবেন' }, { status: 401 });
    }

    const DBManager = await getDB();
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {}

    const sessionTokenToDelete = body.session_token || req.nextUrl.searchParams.get('session_token');
    const deleteOtherSessions = body.all_others === true || req.nextUrl.searchParams.get('all_others') === 'true';

    if (deleteOtherSessions) {
      // Keep only current session
      const currentToken = admin.session_token;
      if (currentToken) {
        await DBManager.removeAllAdminSessionsExcept(admin.id, currentToken);
      } else {
        await DBManager.removeAllAdminSessions(admin.id);
      }
      return NextResponse.json({ success: true, message: 'অন্য সব ডিভাইস সফলভাবে লগআউট করা হয়েছে।' });
    }

    if (sessionTokenToDelete) {
      await DBManager.removeAdminSession(sessionTokenToDelete);
      return NextResponse.json({ success: true, message: 'ডিভাইসটি সফলভাবে লগআউট করা হয়েছে।' });
    }

    return NextResponse.json({ error: 'সেশন টোকেন প্রদান করুন' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
