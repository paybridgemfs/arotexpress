import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';

export async function POST(req: NextRequest) {
  try {
    const DBManager = await getDB();
    const body = await req.json();
    const { order_id, order_type = 'regular', reason = 'গ্রাহক পেমেন্ট বাতিল করেছেন' } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'অর্ডার আইডি প্রদান করা হয়নি' }, { status: 400 });
    }

    const orderType = order_type === 'package' ? 'package_orders' : 'orders';
    const order = DBManager.getOrderById(order_id, orderType);

    if (!order) {
      return NextResponse.json({ error: 'অর্ডারটি খুঁজে পাওয়া যায়নি' }, { status: 404 });
    }

    // Only allow cancelling if payment is NOT verified
    if (order.payment_status === 'verified') {
      return NextResponse.json({
        error: 'যাচাইকৃত সফল পেমেন্ট বাতিল করা সম্ভব নয়',
        cannot_cancel: true
      }, { status: 400 });
    }

    const cancelledOrder = DBManager.cancelUnpaidOrder(order.id, orderType);

    return NextResponse.json({
      success: true,
      message: 'পেমেন্ট ও অর্ডারটি সফলভাবে বাতিল করা হয়েছে',
      order: cancelledOrder
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'অর্ডার বাতিল করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
