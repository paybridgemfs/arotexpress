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
    return NextResponse.json(DBManager.getPackageOrders());
  }
  const orders = DBManager.getPackageOrdersByUserId(userPayload.id);
  return NextResponse.json(orders);
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
      discount_total,
      delivery_fee,
      total_amount
    } = body;

    if (!customer_name || !customer_phone || !delivery_address || !delivery_area || !payment_method) {
      return NextResponse.json({ error: 'সকল তথ্য সঠিকভাবে দিন' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'প্যাকেজে অন্তত একটি পণ্য থাকা আবশ্যক' }, { status: 400 });
    }

    // Server-side validation of package products and prices
    const packageProducts = DBManager.data.package_products || [];
    let serverRegularSubtotal = 0;
    let serverFinalSubtotal = 0;
    let serverDiscountTotal = 0;

    const verifiedPackageItems = items.map((item: any) => {
      const qty = Math.max(1, Number(item.qty) || 1);
      const pkgProd = packageProducts.find((p: any) =>
        (item.packageProductId && p.id === item.packageProductId) ||
        (item.id && p.id === item.id) ||
        (item.productId && p.product_id === item.productId) ||
        (item.product_name && p.product_name && p.product_name.trim().toLowerCase() === item.product_name.trim().toLowerCase())
      );

      const regularPrice = pkgProd ? Number(pkgProd.regular_price) || 0 : (Number(item.regular_price) || Number(item.price) || 0);
      const finalPrice = pkgProd ? Number(pkgProd.final_price) || 0 : (Number(item.final_price) || Number(item.price) || 0);
      const discount = Math.max(0, regularPrice - finalPrice);

      serverRegularSubtotal += regularPrice * qty;
      serverFinalSubtotal += finalPrice * qty;
      serverDiscountTotal += discount * qty;

      return {
        ...item,
        productId: pkgProd?.product_id || item.productId,
        packageProductId: pkgProd?.id || item.packageProductId,
        regular_price: regularPrice,
        final_price: finalPrice,
        price: finalPrice,
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

    const calculatedTotal = serverFinalSubtotal + serverDeliveryFee;

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
          console.warn(`[PackageOrderPayment] TrxID already used in ${trxCheck.orderType} #${trxCheck.order?.order_code || trxCheck.order?.id}`);
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
        const senderKey = normalizePaymentSender(payment_method);

        if (!cleanTrx) {
          return NextResponse.json({
            error: 'অনলাইন পেমেন্টের ক্ষেত্রে ট্রানজেকশন আইডি (TrxID) দেওয়া বাধ্যতামূলক।',
            verified: false,
            code: 'TRX_REQUIRED'
          }, { status: 400 });
        }

        const verifyResult = await verifyPaymentWithRetry({
          apiUrl: settings.payment_verify_api_url,
          apiKey: settings.payment_verify_api_key,
          trxId: cleanTrx,
          sender: senderKey,
          number: String(sender_number || '').trim(),
          amount: calculatedTotal
        });

        if (!verifyResult || verifyResult.verified !== true || verifyResult.code !== 'VERIFIED_SUCCESS') {
          return NextResponse.json({
            error: verifyResult?.message || 'পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে। শুধুমাত্র সফল ভেরিফিকেশন (VERIFIED_SUCCESS) পেলেই অর্ডার সম্পন্ন হবে।',
            verified: false,
            code: verifyResult?.code || 'VERIFICATION_FAILED',
            details: verifyResult?.data || verifyResult?.raw,
            attemptsMade: verifyResult?.attemptsMade || 3
          }, { status: 400 });
        }

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
    const order = await DBManager.createPackageOrder({
      user_id: userPayload.id,
      customer_name,
      customer_phone,
      delivery_address,
      delivery_area,
      payment_method,
      sender_number: sender_number || '',
      trx_id: trx_id || '',
      items_json: verifiedPackageItems,
      subtotal: serverFinalSubtotal,
      discount_total: serverDiscountTotal,
      delivery_fee: serverDeliveryFee,
      total_amount: calculatedTotal,
      payment_status,
      payment_verified_at,
      payment_verified_data
    });

    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
