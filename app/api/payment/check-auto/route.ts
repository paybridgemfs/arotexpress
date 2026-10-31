import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { verifyPaymentWithRetry, normalizePaymentSender } from '@/server/paymentVerification';

export async function POST(req: NextRequest) {
  try {
    const DBManager = await getDB();
    const settings = DBManager.getSettings();

    const body = await req.json();
    const { order_id, order_type = 'regular', payment_method_code, sender_number, trx_id } = body;

    if (!order_id) {
      return NextResponse.json({ verified: false, error: 'অর্ডার আইডি প্রদান করা হয়নি' }, { status: 400 });
    }

    const cleanSenderNumber = String(sender_number || '').trim().replace(/[^0-9]/g, '');
    if (!cleanSenderNumber || cleanSenderNumber.length !== 11 || !cleanSenderNumber.startsWith('01')) {
      return NextResponse.json({
        verified: false,
        code: 'INVALID_SENDER_NUMBER',
        message: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
      }, { status: 400 });
    }

    const orderType = order_type === 'package' ? 'package_orders' : 'orders';
    const order = DBManager.getOrderById(order_id, orderType);

    if (!order) {
      return NextResponse.json({ verified: false, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি' }, { status: 404 });
    }

    // If order was already verified and confirmed, return success immediately
    if (order.payment_status === 'verified' && (order.status === 'confirmed' || order.status === 'পেন্ডিং' || order.status === 'processing')) {
      return NextResponse.json({
        success: true,
        verified: true,
        already_verified: true,
        message: 'পেমেন্ট ইতিমধ্যে সফলভাবে যাচাই হয়েছে।',
        order: {
          id: order.id,
          order_code: order.order_code,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          status: order.status
        }
      });
    }

    // Check payment gateway settings
    if (!settings.payment_verify_enabled || !settings.payment_verify_api_url || !settings.payment_verify_api_key) {
      return NextResponse.json({
        verified: false,
        code: 'GATEWAY_INACTIVE',
        message: 'স্বয়ংক্রিয় পেমেন্ট যাচাই সিস্টেম বর্তমানে নিষ্ক্রিয় রয়েছে। অ্যাডমিন সেটিংস চেক করুন।'
      }, { status: 400 });
    }

    // Resolve payment method name
    const paymentMethods = DBManager.getPaymentMethods() || [];
    const matchedMethod = paymentMethods.find((p: any) =>
      p.code?.toLowerCase() === String(payment_method_code).toLowerCase() ||
      p.name_en?.toLowerCase() === String(payment_method_code).toLowerCase() ||
      p.name_bn === payment_method_code
    );
    const methodNameBn = matchedMethod?.name_bn || payment_method_code || 'অনলাইন পেমেন্ট';
    const senderKey = normalizePaymentSender(payment_method_code || 'bkash');

    const cleanTrx = String(trx_id || '').trim();
    if (cleanTrx) {
      const trxCheck = DBManager.isTrxIdUsed(cleanTrx, order.id, orderType);
      if (trxCheck.used) {
        return NextResponse.json({
          verified: false,
          code: 'ALREADY_VERIFIED',
          message: `TrxID "${cleanTrx}" টি ইতিমধ্যে পূর্বে ব্যবহার করা হয়েছে (${trxCheck.orderType === 'package_orders' ? 'প্যাকেজ অর্ডার' : 'সাধারণ অর্ডার'} #${trxCheck.order?.order_code || trxCheck.order?.id})! এই TrxID দিয়ে পেমেন্ট করা যাবে না।`
        }, { status: 400 });
      }
    }

    const orderAmount = Math.round(Number(order.total_amount) || 0);

    console.log(`[PaymentGateway] Auto-verifying Order #${order.order_code || order.id} (${orderType}) for ${cleanSenderNumber} via ${senderKey}, Amount: ৳${orderAmount}${cleanTrx ? `, TrxID: ${cleanTrx}` : ''}`);

    const verifyResult = await verifyPaymentWithRetry({
      apiUrl: settings.payment_verify_api_url,
      apiKey: settings.payment_verify_api_key,
      trxId: cleanTrx || undefined,
      sender: senderKey,
      number: cleanSenderNumber,
      amount: orderAmount
    });

    if (verifyResult.verified && verifyResult.code === 'VERIFIED_SUCCESS') {
      const foundTrx = verifyResult.data?.trxId || cleanTrx || '';

      // Check if the verified TrxID has already been claimed by another order
      if (foundTrx) {
        const trxCheck = DBManager.isTrxIdUsed(foundTrx, order.id, orderType);
        if (trxCheck.used) {
          return NextResponse.json({
            verified: false,
            code: 'ALREADY_VERIFIED',
            message: `লেনদেনটি সফল হলেও TrxID "${foundTrx}" পূর্বে আরেকটি অর্ডারে ব্যবহার করা হয়েছে!`
          }, { status: 400 });
        }
      }

      // Confirm order payment in database
      const confirmedOrder = DBManager.confirmOrderPayment(order.id, orderType, {
        payment_method: methodNameBn,
        sender_number: cleanSenderNumber,
        trx_id: foundTrx,
        payment_verified_data: verifyResult.data
      });

      // Clear customer's stored cart in database if authenticated
      if (order.user_id) {
        try {
          DBManager.saveUserCart(order.user_id, {});
        } catch {}
      }

      console.log(`[PaymentGateway] ✅ Order #${order.order_code || order.id} successfully PAID and CONFIRMED! TrxID: ${foundTrx}`);

      return NextResponse.json({
        success: true,
        verified: true,
        code: 'VERIFIED_SUCCESS',
        message: 'পেমেন্ট সফলভাবে যাচাই হয়েছে! আপনার অর্ডারটি নিশ্চিত করা হয়েছে।',
        order: {
          id: confirmedOrder?.id || order.id,
          order_code: confirmedOrder?.order_code || order.order_code,
          customer_name: confirmedOrder?.customer_name || order.customer_name,
          customer_phone: confirmedOrder?.customer_phone || order.customer_phone,
          total_amount: confirmedOrder?.total_amount || order.total_amount,
          payment_status: confirmedOrder?.payment_status || 'verified',
          status: confirmedOrder?.status || 'confirmed',
          payment_method: methodNameBn,
          sender_number: cleanSenderNumber,
          trx_id: foundTrx,
          type: order_type
        }
      });
    }

    // Not yet found or error
    return NextResponse.json({
      success: false,
      verified: false,
      code: verifyResult.code || 'PENDING',
      message: verifyResult.message || 'পেমেন্ট খোঁজা হচ্ছে...',
      details: verifyResult.data
    });

  } catch (err: any) {
    console.error('Payment check-auto route error:', err);
    return NextResponse.json({
      success: false,
      verified: false,
      code: 'SERVER_ERROR',
      message: 'পেমেন্ট অনুসন্ধানে সার্ভার সমস্যা: ' + err.message
    }, { status: 500 });
  }
}
