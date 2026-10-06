import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkRateLimit } from '@/app/lib/rateLimit';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'arot_express_secret_key_2026';

function parseDeviceInfo(userAgent: string, ipAddress: string) {
  let os = 'Unknown OS';
  let browser = 'Web Browser';

  const ua = userAgent || '';

  // Detect OS
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/ipad/i.test(ua)) os = 'iPadOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Detect Browser
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Browser';

  const deviceName = `${browser} on ${os}`;

  return { deviceName, browser, os, ipAddress: ipAddress || '127.0.0.1' };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting: Max 6 attempts per minute
    const rateCheck = checkRateLimit(req, 'admin_login', 6, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `অনেক বেশি ব্যর্থ চেষ্টা করা হয়েছে। দয়া করে ${rateCheck.resetInSeconds} সেকেন্ড অপেক্ষা করুন।` },
        { status: 429 }
      );
    }

    const { username, password, force_logout_others } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'অ্যাডমিন ইউজারনেম এবং পাসওয়ার্ড দিন' }, { status: 400 });
    }

    const DBManager = await getDB();
    const admin = DBManager.findAdminByUsername(username.trim());
    if (!admin) {
      return NextResponse.json({ error: 'শুধুমাত্র অনুমোদিত অ্যাডমিন লগইন করতে পারবেন' }, { status: 401 });
    }

    // 2. Secure async bcrypt check
    const validPassword = await bcrypt.compare(password.trim(), admin.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: 'ভুল অ্যাডমিন পাসওয়ার্ড' }, { status: 401 });
    }

    // 3. Capture current device & IP details
    const ua = req.headers.get('user-agent') || '';
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');
    const { deviceName, browser, os, ipAddress } = parseDeviceInfo(ua, clientIp);

    // 4. Multi-Device Admin Session Management (Max 3 Devices Enforced)
    const MAX_ALLOWED_DEVICES = 3;

    // Check if same device (same IP & same device/browser/OS) already has an active session
    const activeSessions = DBManager.getAdminSessions(admin.id);
    const existingSameDeviceSession = activeSessions.find(
      (s) => s.admin_id === admin.id && s.ip_address === ipAddress && (s.device_name === deviceName || (s.browser === browser && s.os === os))
    );

    // If same device already logged in previously, automatically replace old session with new one (prevent duplicate rows)
    if (existingSameDeviceSession) {
      await DBManager.removeAdminSession(existingSameDeviceSession.session_token);
    }

    // If force logout others requested, purge all previous sessions for this admin
    if (force_logout_others === true) {
      await DBManager.removeAllAdminSessions(admin.id);
    } else {
      // Check remaining active sessions count for distinct devices
      const remainingSessions = DBManager.getAdminSessions(admin.id);
      if (remainingSessions.length >= MAX_ALLOWED_DEVICES) {
        return NextResponse.json(
          {
            error: `সর্বোচ্চ ${MAX_ALLOWED_DEVICES}টি ডিভাইসে ইতিমধ্যে অ্যাডমিন লগইন করা আছে।`,
            code: 'MAX_DEVICES_REACHED',
            active_devices_count: remainingSessions.length,
            max_allowed: MAX_ALLOWED_DEVICES
          },
          { status: 403 }
        );
      }
    }

    // Create secure unique session token
    const sessionToken = crypto.randomUUID();
    await DBManager.addAdminSession(admin.id, sessionToken, {
      device_name: deviceName,
      browser,
      os,
      ip_address: ipAddress
    });

    const { password_hash, ...safeAdmin } = admin;
    const token = jwt.sign(
      {
        id: safeAdmin.id,
        username: safeAdmin.username,
        role: 'admin',
        name: safeAdmin.name,
        session_token: sessionToken
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      user: { ...safeAdmin, role: 'admin', phone: safeAdmin.username },
      token,
      session_token: sessionToken,
      message: force_logout_others ? 'পূর্বের সব ডিভাইস লগআউট করে সফলভাবে লগইন সম্পন্ন হয়েছে।' : 'সফলভাবে লগইন হয়েছে।'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
