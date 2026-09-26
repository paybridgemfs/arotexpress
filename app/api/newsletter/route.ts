import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const DBManager = await getDB();
  const subscribers = DBManager.getNewsletterSubscribers();
  return NextResponse.json({ subscribers });
}

export async function POST(req: NextRequest) {
  const DBManager = await getDB();
  const body = await req.json().catch(() => ({}));
  const { contact } = body;

  if (!contact || typeof contact !== 'string') {
    return NextResponse.json({ error: 'দয়া করে আপনার সঠিক ইমেইল অ্যাড্রেস দিন' }, { status: 400 });
  }

  const clean = contact.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return NextResponse.json({ error: 'দয়া করে সঠিক ইমেইল ফরম্যাট লিখুন (যেমন: user@example.com)' }, { status: 400 });
  }

  const result = DBManager.addNewsletterSubscriber(clean);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error || (authResult.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const DBManager = await getDB();
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get('id') || '0', 10);

  if (!id) {
    return NextResponse.json({ error: 'Valid subscriber ID required' }, { status: 400 });
  }

  const success = DBManager.deleteNewsletterSubscriber(id);
  return NextResponse.json({ success });
}
