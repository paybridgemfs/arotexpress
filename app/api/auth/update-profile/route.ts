import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'arot_express_secret_key_2026';

export async function PUT(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const DBManager = await getDB();
    const { name, password, new_password, current_password, phone, username, avatar, avatar_delete_url } = await req.json();
    const userPayload = authResult.user as any;

    if (userPayload.role === 'admin') {
      const currentAdmin = DBManager.data.admins.find(a => a.id === userPayload.id) ||
        DBManager.data.admins.find(a => a.username && a.username.toLowerCase() === (userPayload.username || '').toLowerCase());
      if (!currentAdmin) return NextResponse.json({ error: 'অ্যাডমিন পাওয়া যায়নি' }, { status: 404 });

      const newPass = (new_password || '').trim();
      const currentPass = (current_password || password || '').trim();

      // If admin wants to change password
      if (newPass) {
        if (!currentPass) {
          return NextResponse.json({ error: 'পাসওয়ার্ড পরিবর্তন করতে বর্তমান পাসওয়ার্ড দিন' }, { status: 400 });
        }
        const isMatch = await bcrypt.compare(currentPass, currentAdmin.password_hash);
        if (!isMatch) {
          return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড সঠিক নয়' }, { status: 400 });
        }
        if (newPass.length < 6) {
          return NextResponse.json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
        }
      }

      const targetUsername = (username || phone || '').trim();
      if (targetUsername) {
        if (targetUsername.length < 3) {
          return NextResponse.json({ error: 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে' }, { status: 400 });
        }
        const conflict = DBManager.data.admins.find(
          a => a.id !== currentAdmin.id && a.username && a.username.toLowerCase() === targetUsername.toLowerCase()
        );
        if (conflict) {
          return NextResponse.json({ error: 'এই ইউজারনেমটি ইতিমধ্যে অন্য একজন অ্যাডমিনের রয়েছে' }, { status: 400 });
        }
      }

      const updated = await DBManager.updateAdminProfile(currentAdmin.id, {
        name: name ? name.trim() : currentAdmin.name,
        username: targetUsername || currentAdmin.username,
        password: newPass || undefined
      });

      if (!updated) {
        return NextResponse.json({ error: 'অ্যাডমিন প্রোফাইল আপডেট ব্যর্থ হয়েছে' }, { status: 500 });
      }

      const token = jwt.sign(
        { id: updated.id, username: updated.username, role: 'admin', name: updated.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return NextResponse.json({ user: { ...updated, phone: updated.username }, token });
    } else {
      const currentUser = DBManager.data.users.find(u => u.id === userPayload.id);
      if (!currentUser) return NextResponse.json({ error: 'ইউজার পাওয়া যায়নি' }, { status: 404 });

      if (password) {
        const isMatch = await bcrypt.compare(password, currentUser.password_hash);
        if (!isMatch) return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড সঠিক নয়' }, { status: 400 });
      }

      if (new_password && new_password.trim().length < 6) {
        return NextResponse.json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
      }

      const updated = await DBManager.updateUserProfile(userPayload.id, {
        name: name !== undefined ? (name ? name.trim() : currentUser.name) : undefined,
        password: new_password || undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        avatar_delete_url: avatar_delete_url !== undefined ? avatar_delete_url : undefined
      });

      const token = jwt.sign(
        { id: updated!.id, phone: updated!.phone, role: 'user', name: updated!.name, avatar: updated!.avatar },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return NextResponse.json({ user: updated, token });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
