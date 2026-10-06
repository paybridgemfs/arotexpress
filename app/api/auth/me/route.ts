import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/auth';
import { getDB } from '@/app/lib/db';

export async function GET(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const DBManager = await getDB();
  const user = authResult.user as any;

  if (user.role === 'admin') {
    // If admin token has session_token, verify session is not revoked
    if (user.session_token && !DBManager.validateAdminSession(user.session_token)) {
      return NextResponse.json(
        { error: 'আপনার এই সেশনটি দূর থেকে লগআউট করে দেওয়া হয়েছে।' },
        { status: 401 }
      );
    }

    if (user.session_token) {
      DBManager.updateAdminSessionActivity(user.session_token);
    }

    const admin = DBManager.findAdminById(user.id) as any;
    if (admin) {
      const { password_hash, ...safeAdmin } = admin;
      return NextResponse.json({
        user: { ...safeAdmin, phone: safeAdmin.username, role: 'admin', session_token: user.session_token }
      });
    }
  } else if (user.role === 'rider') {
    const rider = DBManager.findRiderById(user.id) as any;
    if (rider) {
      const { password_hash, ...safeRider } = rider;
      return NextResponse.json({ user: { ...safeRider, role: 'rider' } });
    }
  } else {
    const customer = DBManager.findUserById(user.id) as any;
    if (customer) {
      const { password_hash, ...safeUser } = customer;
      return NextResponse.json({ user: safeUser });
    }
  }

  return NextResponse.json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি' }, { status: 404 });
}
