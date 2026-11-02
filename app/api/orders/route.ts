import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';
import { verifyPaymentWithRetry, normalizePaymentSender } from '@/server/paymentVerification';

export async function GET(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DBManager = await getDB();
  const userPayload = authResult.user as any;
  if (userPayload.role === 'admin') {
    return NextResponse.json(DBManager.getOrders());
  }
  const regularOrders = (DBManager.getOrdersByUserId(userPayload.id) || []).map((o: any) => ({ ...o, is_package_order: false }));
  const packageOrders = (DBManager.getPackageOrdersByUserId(userPayload.id) || []).map((o: any) => ({ ...o, is_package_order: true }));
  const allOrders = [...regularOrders, ...packageOrders].sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return NextResponse.json(allOrders);
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (authResult.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const DBManager = await getDB();
    const body = await req.json();
    const {
      customer_name,
      customer_phone,
      delivery_address,
      delivery_area,
      payment_method,
      sender_number,
      trx_id,
      items,
      subtotal,
      delivery_fee,
      total_amount
    } = body;

    if (!customer_name || !customer_phone || !delivery_address || !delivery_area || !payment_method) {
      return NextResponse.json({ error: 'সকল তথ্য সঠিকভাবে দিন' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'কার্টে কোনো পণ্য নেই' }, { status: 400 });
    }

    // Server-side price calculation and validation
    const categories = DBManager.data.categories || [];
    let serverSubtotal = 0;
    const verifiedItems = items.map((item: any) => {
      const qty = Math.max(1, Number(item.qty) || 1);
      let brand: any = null;
      const pId = item.productId || item.product_id || item.id;
      if (pId) {
        for (const cat of categories) {
          const b = cat.brands?.find((b: any) => b.id === pId);
          if (b) {
            brand = b;
            break;
          }
        }
      }
      if (!brand) {
        for (const cat of categories) {
          if (cat.id === item.catId) {
            const b = cat.brands?.find((b: any) => b.name === item.brand);
            if (b) {
              brand = b;
              break;
            }
          }
        }
      }

      const verifiedPrice = brand ? Number(brand.price) || 0 : (Number(item.price) || 0);
      serverSubtotal += verifiedPrice * qty;

      return {
        ...item,
        price: verifiedPrice,
        qty
      };
    });

    // Server-side delivery fee calculation
    const settings = DBManager.getSettings();
    const deliveryAreas = DBManager.getDeliveryAreas();
    const matchedArea = deliveryAreas.find(
      (a: any) => a.name?.trim().toLowerCase() === String(delivery_area).trim().toLowerCase()
    );
    const serverDeliveryFee = matchedArea && matchedArea.charge !== undefined
      ? Number(matchedArea.charge)
      : (Number(settings.default_delivery_fee) || 60);

    const calculatedTotal = serverSubtotal + serverDeliveryFee;

    // Check if the selected payment is COD or online payment (bKash, Nagad, Rocket)
    const methodStr = String(payment_method || '').toLowerCase();
    const isCod = methodStr === 'cod' || methodStr.includes('ক্যাশ') || methodStr.includes('cash');

    let payment_status = isCod ? 'unpaid' : 'pending';
    let payment_verified_at: string | null = null;
    let payment_verified_data: any = null;

    if (!isCod) {
      const cleanTrx = String(trx_id || '').trim();

      // Check if trx_id is already used in any regular or package order in the database
      if (cleanTrx) {
        const trxCheck = DBManager.isTrxIdUsed(cleanTrx);
        if (trxCheck.used) {
          console.warn(`[OrderPayment] TrxID already used in ${trxCheck.orderType} #${trxCheck.order?.order_code || trxCheck.order?.id}`);
          return NextResponse.json({
            error: `TrxID "${cleanTrx}" টি ইতিমধ্যে পূর্বে ব্যবহার করা হয়েছে (${trxCheck.orderType === 'package_orders' ? 'প্যাকেজ অর্ডার' : 'সাধারণ অর্ডার'} #${trxCheck.order?.order_code || trxCheck.order?.id})! এই TrxID দিয়ে কোনোভাবেই অর্ডার প্লেস করা যাবে না।`,
            verified: false,
            code: 'ALREADY_VERIFIED'
          }, { status: 400 });
        }
      }

      const isAutoVerifyActive = Boolean(
        settings.payment_verify_enabled &&
        settings.payment_verify_api_url &&
        settings.payment_verify_api_key
      );

      if (isAutoVerifyActive) {
        if (!sender_number || !String(sender_number).trim()) {
          return NextResponse.json({
            error: 'পেমেন্ট যাচাইয়ের জন্য প্রেরক মোবাইল নম্বর আবশ্যক',
            code: 'MISSING_SENDER_NUMBER'
          }, { status: 400 });
        }

        if (!cleanTrx) {
          return NextResponse.json({
            error: 'পেমেন্ট যাচাইয়ের জন্য ট্রানজেকশন আইডি (TrxID) আবশ্যক',
            code: 'MISSING_TRX_ID'
          }, { status: 400 });
        }

        const senderKey = normalizePaymentSender(payment_method);

        console.log(`[OrderPayment] Auto-verifying order payment for customer ${customer_phone} via ${senderKey}`);
        const verifyResult = await verifyPaymentWithRetry({
          apiUrl: settings.payment_verify_api_url,
          apiKey: settings.payment_verify_api_key,
          trxId: cleanTrx,
          sender: senderKey,
          number: String(sender_number).trim(),
          amount: calculatedTotal
        });

        // ABSOLUTE MANDATE: Under NO circumstances should an order be placed unless code is strictly "VERIFIED_SUCCESS"
        if (!verifyResult || verifyResult.verified !== true || verifyResult.code !== 'VERIFIED_SUCCESS') {
          console.warn(`[OrderPayment] 🚫 Order placement REJECTED. Result code "${verifyResult?.code}" is NOT "VERIFIED_SUCCESS":`, verifyResult?.message);
          return NextResponse.json({
            error: verifyResult?.message || 'পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে। শুধুমাত্র সফল ভেরিফিকেশন (VERIFIED_SUCCESS) পেলেই অর্ডার সম্পন্ন হবে।',
            verified: false,
            code: verifyResult?.code || 'VERIFICATION_FAILED',
            details: verifyResult?.data || verifyResult?.raw,
            attemptsMade: verifyResult?.attemptsMade || 3
          }, { status: 400 });
        }

        // Verification successful strictly with VERIFIED_SUCCESS!
        payment_status = 'verified';
        payment_verified_at = new Date().toISOString();
        payment_verified_data = verifyResult.data || {
          trxId: cleanTrx,
          amount: calculatedTotal,
          sender: senderKey,
          number: sender_number
        };
      }
    }

    const userPayload = authResult.user as any;
    const order = DBManager.createOrder({
      user_id: userPayload.id,
      customer_name,
      customer_phone,
      delivery_address,
      delivery_area,
      payment_method,
      sender_number: sender_number || '',
      trx_id: trx_id || '',
      items_json: verifiedItems,
      subtotal: serverSubtotal,
      delivery_fee: serverDeliveryFee,
      total_amount: calculatedTotal,
      payment_status,
      payment_verified_at,
      payment_verified_data
    });

    DBManager.saveUserCart(userPayload.id, {});

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
