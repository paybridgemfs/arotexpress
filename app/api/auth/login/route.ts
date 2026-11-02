import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkLoginRateLimit, recordLoginFailure, resetLoginRateLimit } from '@/app/lib/rateLimit';

const JWT_SECRET = process.env.JWT_SECRET || 'arot_express_secret_key_2026';

export async function POST(req: NextRequest) {
  try {
    const blockCheck = checkLoginRateLimit(req, 'user_login');
    if (blockCheck.blocked) {
      return NextResponse.json(
        { error: `বারবার ভুল তথ্য দেওয়ার কারণে আপনার আইপি (IP) থেকে ১৫ মিনিটের জন্য লগইন সাময়িকভাবে ব্লক করা হয়েছে। দয়া করে ${blockCheck.minutesLeft} মিনিট পরে চেষ্টা করুন।` },
        { status: 429 }
      );
    }

    const { phone, password, rememberMe } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: 'মোবাইল নম্বর ও পাসওয়ার্ড দিন' }, { status: 400 });
    }

    const cleanDigits = phone.trim().replace(/[^0-9]/g, '');
    const DBManager = await getDB();
    const user = DBManager.findUserByPhone(cleanDigits) || DBManager.findUserByPhone(phone.trim());
    if (!user) {
      recordLoginFailure(req, 'user_login');
      return NextResponse.json({ error: 'ভুল নম্বর বা পাসওয়ার্ড' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password.trim(), user.password_hash);
    if (!validPassword) {
      recordLoginFailure(req, 'user_login');
      return NextResponse.json({ error: 'ভুল নম্বর বা পাসওয়ার্ড' }, { status: 401 });
    }

    resetLoginRateLimit(req, 'user_login');

    const { password_hash, ...safeUser } = user;
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign({ id: safeUser.id, phone: safeUser.phone, role: 'user', name: safeUser.name }, JWT_SECRET, { expiresIn: tokenExpiry });
    return NextResponse.json({ user: safeUser, token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
