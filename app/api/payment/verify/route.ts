import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';
import {
  verifyPaymentWithRetry,
  normalizePaymentSender,
  DEFAULT_PAYMENT_VERIFY_API_URL,
  DEFAULT_PAYMENT_VERIFY_API_KEY
} from '@/server/paymentVerification';

export async function POST(req: NextRequest) {
  // Only authenticated users can verify payments
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: 'পেমেন্ট যাচাই করতে প্রথমে লগইন করুন।' }, { status: 401 });
  }

  try {
    const DBManager = await getDB();
    const settings = DBManager.getSettings();

    const apiUrl = (settings.payment_verify_api_url || DEFAULT_PAYMENT_VERIFY_API_URL).trim();
    const apiKey = (settings.payment_verify_api_key || DEFAULT_PAYMENT_VERIFY_API_KEY).trim();

    const body = await req.json();
    const { trx_id, sender_number, payment_method, amount } = body;

    const cleanTrx = (trx_id || '').trim();
    const cleanNumber = (sender_number || '').trim().replace(/[^0-9]/g, '');

    if (!cleanNumber && !cleanTrx) {
      return NextResponse.json({
        verified: false,
        code: 'MISSING_PARAMS',
        message: 'যে নম্বর থেকে টাকা পাঠিয়েছেন তা প্রদান করুন।'
      }, { status: 400 });
    }

    if (cleanTrx) {
      const trxCheck = DBManager.isTrxIdUsed(cleanTrx);
      if (trxCheck.used) {
        return NextResponse.json({
          success: false,
          verified: false,
          code: 'ALREADY_VERIFIED',
          message: `TrxID "${cleanTrx}" টি ইতিমধ্যে পূর্বে ব্যবহার করা হয়েছে (${trxCheck.orderType === 'package_orders' ? 'প্যাকেজ অর্ডার' : 'সাধারণ অর্ডার'} #${trxCheck.order?.order_code || trxCheck.order?.id})! এই TrxID পুনরায় ব্যবহার করা যাবে না।`
        }, { status: 400 });
      }
    }

    const senderKey = normalizePaymentSender(payment_method || 'bkash');
    const numAmount = Number(amount) || 0;

    const result = await verifyPaymentWithRetry({
      apiUrl,
      apiKey,
      trxId: cleanTrx || undefined,
      sender: senderKey,
      number: cleanNumber || undefined,
      amount: numAmount,
      maxAttempts: 1 // Fast single-shot check for continuous 3-sec polling
    });

    // 1. Success case
    if (result.verified && result.code === 'VERIFIED_SUCCESS') {
      return NextResponse.json({
        success: true,
        verified: true,
        code: 'VERIFIED_SUCCESS',
        message: result.message || 'পেমেন্ট সফলভাবে যাচাই হয়েছে।',
        data: result.data,
        sender: senderKey,
        number: cleanNumber,
        amount: numAmount
      });
    }

    // 2. Not found yet (SMS hasn't arrived or customer hasn't sent money yet)
    // Return 200 with verified: false so polling continues smoothly without client throw
    if (result.code === 'TRANSACTION_NOT_FOUND') {
      return NextResponse.json({
        success: false,
        verified: false,
        code: 'TRANSACTION_NOT_FOUND',
        message: 'পেমেন্ট এখনও মেলেনি। ৩ সেকেন্ড পর পর স্বয়ংক্রিয় অনুসন্ধান চলছে...'
      }, { status: 200 });
    }

    // 3. Fatal errors: ALREADY_VERIFIED or AMOUNT_MISMATCH
    return NextResponse.json({
      success: false,
      verified: false,
      code: result.code,
      message: result.message,
      details: result.data || result.raw
    }, { status: 400 });

  } catch (err: any) {
    console.error('Payment verify route error:', err);
    return NextResponse.json({
      success: false,
      verified: false,
      code: 'SERVER_ERROR',
      message: 'পেমেন্ট যাচাইয়ের সময় সমস্যা হয়েছে: ' + err.message
    }, { status: 500 });
  }
}
