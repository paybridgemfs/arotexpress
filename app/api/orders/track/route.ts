import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';

function normalizePhoneDigits(phone?: string) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

function maskPhoneNumber(phone?: string) {
  if (!phone) return '';
  const clean = String(phone).trim();
  if (clean.length <= 5) return clean;
  return clean.substring(0, 3) + '*****' + clean.substring(clean.length - 2);
}

function maskName(name?: string) {
  if (!name) return '';
  const clean = String(name).trim();
  const parts = clean.split(' ');
  return parts
    .map((p) => {
      if (p.length <= 2) return p;
      return p[0] + '*'.repeat(p.length - 2) + p[p.length - 1];
    })
    .join(' ');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('order_id') || searchParams.get('code') || searchParams.get('orderId') || '';
  const phone = searchParams.get('phone') || '';

  return handleTrackingLookup(req, orderId, phone);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.order_id || body.orderId || body.code || '';
    const phone = body.phone || '';

    return handleTrackingLookup(req, orderId, phone);
  } catch (e: any) {
    return NextResponse.json({ error: 'অবৈধ রিকোয়েস্ট ফরম্যাট' }, { status: 400 });
  }
}

async function handleTrackingLookup(req: NextRequest, orderId: string, phone: string) {
  const DBManager = await getDB();
  const cleanOrderId = orderId.trim();
  const cleanPhone = phone.trim();
  const phoneDigits = normalizePhoneDigits(cleanPhone);

  if (!cleanOrderId && !cleanPhone) {
    return NextResponse.json(
      { error: 'অনুগ্রহ করে অর্ডার আইডি অথবা মোবাইল নম্বর প্রদান করুন' },
      { status: 400 }
    );
  }

  // Check if authenticated as admin or customer
  const authResult = await authenticateToken(req);
  const authUser = !authResult.error ? (authResult.user as any) : null;
  const isAdmin = authUser && authUser.role === 'admin';

  // CASE 1: Both Order ID and Phone provided
  if (cleanOrderId && cleanPhone) {
    let order = DBManager.findOrderByCode(cleanOrderId);
    if (!order) {
      return NextResponse.json(
        { error: `"${cleanOrderId}" কোডের কোনো অর্ডার পাওয়া যায়নি। সঠিক কোড দিন (যেমন: AE-123456)` },
        { status: 404 }
      );
    }

    const orderPhoneDigits = normalizePhoneDigits(order.customer_phone);
    const isPhoneMatched =
      phoneDigits &&
      orderPhoneDigits &&
      (orderPhoneDigits.endsWith(phoneDigits) || phoneDigits.endsWith(orderPhoneDigits));

    const isOwner = authUser && order.user_id && authUser.id === order.user_id;

    if (!isPhoneMatched && !isAdmin && !isOwner) {
      return NextResponse.json(
        {
          error: 'এই অর্ডার আইডির সাথে দেওয়া মোবাইল নম্বরের মিল পাওয়া যায়নি। অনুগ্রহ করে অর্ডারে ব্যবহৃত সঠিক নম্বরটি দিন।',
          code: 'PHONE_MISMATCH'
        },
        { status: 403 }
      );
    }

    // Full verified order return
    return NextResponse.json({
      verified: true,
      order: {
        ...order,
        is_package_order: Boolean(order.is_package_order || (order.order_code && order.order_code.startsWith('PK-')))
      }
    });
  }

  // CASE 2: Only Phone provided -> List all orders for this customer
  if (!cleanOrderId && cleanPhone) {
    if (phoneDigits.length < 6) {
      return NextResponse.json(
        { error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' },
        { status: 400 }
      );
    }

    const orders = DBManager.findOrdersByPhone(cleanPhone);
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        {
          error: `"${cleanPhone}" নম্বরে কোনো সক্রিয় বা পূর্ববর্তী অর্ডার পাওয়া যায়নি।`,
          orders: []
        },
        { status: 404 }
      );
    }

    // If exactly 1 order found, return it directly with verified flag
    if (orders.length === 1) {
      return NextResponse.json({
        verified: true,
        order: orders[0],
        multiple: false,
        totalFound: 1
      });
    }

    // If multiple orders found, return list of orders
    return NextResponse.json({
      verified: true,
      orders: orders.map((o: any) => ({
        id: o.id,
        order_code: o.order_code,
        created_at: o.created_at,
        status: o.status,
        total_amount: o.total_amount,
        items_count: Array.isArray(o.items_json)
          ? o.items_json.length
          : (typeof o.items_json === 'string' ? (JSON.parse(o.items_json || '[]').length) : 0),
        delivery_area: o.delivery_area,
        delivery_rider_name: o.delivery_rider_name,
        payment_method: o.payment_method,
        is_package_order: Boolean(o.is_package_order || (o.order_code && o.order_code.startsWith('PK-')))
      })),
      multiple: true,
      totalFound: orders.length
    });
  }

  // CASE 3: Only Order ID provided
  if (cleanOrderId && !cleanPhone) {
    let order = DBManager.findOrderByCode(cleanOrderId);
    if (!order) {
      return NextResponse.json(
        { error: `"${cleanOrderId}" কোডের কোনো অর্ডার পাওয়া যায়নি। সঠিক কোড দিন (যেমন: AE-123456)` },
        { status: 404 }
      );
    }

    const isOwnerOrAdmin = isAdmin || (authUser && order.user_id && authUser.id === order.user_id);
    const isPackage = Boolean(order.is_package_order || (order.order_code && order.order_code.startsWith('PK-')));

    if (isOwnerOrAdmin) {
      return NextResponse.json({
        verified: true,
        order: { ...order, is_package_order: isPackage }
      });
    }

    // Public sanitized order with masked details, prompting for phone if needed
    const sanitizedOrder = {
      id: order.id,
      order_code: order.order_code,
      is_package_order: isPackage,
      created_at: order.created_at,
      status: order.status,
      total_amount: order.total_amount,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      items_json: order.items_json,
      customer_name: maskName(order.customer_name),
      customer_phone: maskPhoneNumber(order.customer_phone),
      delivery_address: order.delivery_address,
      delivery_area: order.delivery_area,
      delivery_rider_name: order.delivery_rider_name,
      delivery_rider_phone: order.delivery_rider_phone,
      delivery_rider_vehicle: order.delivery_rider_vehicle,
      delivery_note: order.delivery_note,
      is_masked: true
    };

    return NextResponse.json({
      verified: false,
      is_masked: true,
      order: sanitizedOrder
    });
  }

  return NextResponse.json({ error: 'অর্ডার ট্র্যাক করা সম্ভব হয়নি' }, { status: 400 });
}
