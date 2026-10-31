import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('order_id');
  const type = (searchParams.get('type') || 'regular') as 'regular' | 'package';

  if (!orderId) {
    return NextResponse.json({ error: 'অর্ডার আইডি পাওয়া যায়নি' }, { status: 400 });
  }

  try {
    const DBManager = await getDB();
    const orderType = type === 'package' ? 'package_orders' : 'orders';
    const order = DBManager.getOrderById(orderId, orderType);

    if (!order) {
      return NextResponse.json({ error: 'অর্ডারটি খুঁজে পাওয়া যায়নি' }, { status: 404 });
    }

    // Return sanitized order data for the payment gateway screen
    return NextResponse.json({
      id: order.id,
      order_code: order.order_code,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      total_amount: Number(order.total_amount) || 0,
      subtotal: Number(order.subtotal) || 0,
      delivery_fee: Number(order.delivery_fee) || 0,
      payment_status: order.payment_status,
      status: order.status,
      payment_method: order.payment_method,
      sender_number: order.sender_number || '',
      type,
      created_at: order.created_at
    });
  } catch (err: any) {
    console.error('Payment order-details route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
