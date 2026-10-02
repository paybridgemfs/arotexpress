import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';
import { authenticateToken } from '@/app/lib/auth';

function normalizePhoneDigits(phone?: string) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

function maskPhoneNumber(phone?: string) {
  if (!phone) return '০১********* (গোপন)';
  const clean = String(phone).trim();
  if (clean.length <= 5) return '০১********* (গোপন)';
  return clean.substring(0, 3) + '*****' + clean.substring(clean.length - 2) + ' (গোপন)';
}

function maskName(name?: string) {
  if (!name) return 'গ্রাহক (নাম গোপন)';
  const clean = String(name).trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'গ্রাহক (নাম গোপন)';
  return (
    parts
      .map((p) => {
        if (p.length <= 2) return p[0] + '*';
        return p[0] + '*'.repeat(Math.min(Math.max(p.length - 2, 2), 4)) + p[p.length - 1];
      })
      .join(' ') + ' (গোপন)'
  );
}

function maskAddress(address?: string, area?: string) {
  if (area) {
    return `${area} (ব্যক্তিগত গোপনীয়তার স্বার্থে পূর্ণ ঠিকানা গোপন রাখা হয়েছে)`;
  }
  return 'ব্যক্তিগত গোপনীয়তার স্বার্থে বাসার পূর্ণাঙ্গ ঠিকানা গোপন রাখা হয়েছে';
}

function maskItems(itemsJson: any) {
  let items = itemsJson;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) return [];

  return items.map((it: any, idx: number) => ({
    product_name: `পণ্য #${idx + 1}`,
    brand: `পণ্য #${idx + 1}`,
    qty: it.qty || it.quantity || 1,
    unit: it.unit || 'আইটেম',
    price: it.price || it.final_price || 0,
    final_price: it.price || it.final_price || 0,
    is_masked: true
  }));
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

  // Check authentication
  const authResult = await authenticateToken(req);
  const authUser = !authResult.error ? (authResult.user as any) : null;
  const isAdmin = authUser && authUser.role === 'admin';

  // 1. Phone number search requested:
  // SECURITY REQUIREMENT: Phone number lookup is strictly restricted to logged-in users for their own numbers (or admins)
  if (cleanPhone && !cleanOrderId) {
    if (!authUser) {
      return NextResponse.json(
        {
          error: 'মোবাইল নম্বর দিয়ে অর্ডারের তালিকা দেখতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।',
          requiresAuth: true
        },
        { status: 401 }
      );
    }

    const authUserPhoneDigits = normalizePhoneDigits(authUser.phone);
    const isSelfPhone =
      phoneDigits &&
      authUserPhoneDigits &&
      (authUserPhoneDigits.endsWith(phoneDigits) || phoneDigits.endsWith(authUserPhoneDigits));

    if (!isAdmin && !isSelfPhone) {
      return NextResponse.json(
        {
          error: 'আপনি কেবলমাত্র আপনার নিজস্ব অ্যাকাউন্টে ব্যবহৃত মোবাইল নম্বরের অর্ডার দেখতে পারবেন।',
          code: 'UNAUTHORIZED_PHONE_QUERY'
        },
        { status: 403 }
      );
    }

    const targetPhoneToSearch = isAdmin ? cleanPhone : authUser.phone;
    const orders = DBManager.findOrdersByPhone(targetPhoneToSearch);

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        {
          error: `আপনার অ্যাকাউন্টে (${targetPhoneToSearch}) কোনো সক্রিয় বা পূর্ববর্তী অর্ডার পাওয়া যায়নি।`,
          orders: []
        },
        { status: 404 }
      );
    }

    if (orders.length === 1) {
      return NextResponse.json({
        verified: true,
        is_owner: true,
        is_masked: false,
        order: orders[0],
        multiple: false,
        totalFound: 1
      });
    }

    return NextResponse.json({
      verified: true,
      is_owner: true,
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

  // 2. Order ID search requested (both unauthenticated and authenticated):
  if (cleanOrderId) {
    let order = DBManager.findOrderByCode(cleanOrderId);
    if (!order) {
      return NextResponse.json(
        { error: `"${cleanOrderId}" কোডের কোনো অর্ডার পাওয়া যায়নি। সঠিক কোড দিন (যেমন: AE-123456)` },
        { status: 404 }
      );
    }

    const isPackage = Boolean(order.is_package_order || (order.order_code && order.order_code.startsWith('PK-')));
    const orderPhoneDigits = normalizePhoneDigits(order.customer_phone);

    // Determine ownership
    let isOwner = false;
    if (isAdmin) {
      isOwner = true;
    } else if (authUser) {
      const authUserPhoneDigits = normalizePhoneDigits(authUser.phone);
      if (order.user_id && authUser.id === order.user_id) {
        isOwner = true;
      } else if (
        orderPhoneDigits &&
        authUserPhoneDigits &&
        (orderPhoneDigits.endsWith(authUserPhoneDigits) || authUserPhoneDigits.endsWith(orderPhoneDigits))
      ) {
        isOwner = true;
      }
    }

    // A: Logged in owner -> Full UNMASKED details
    if (isOwner) {
      return NextResponse.json({
        verified: true,
        is_owner: true,
        is_masked: false,
        order: {
          ...order,
          is_package_order: isPackage
        }
      });
    }

    // B: Guest or non-owner -> MASKED details (Protecting User Identity & Order Privacy)
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
      // Masked item list & masked customer info
      items_json: maskItems(order.items_json),
      items_count: Array.isArray(order.items_json)
        ? order.items_json.length
        : (typeof order.items_json === 'string' ? (JSON.parse(order.items_json || '[]').length) : 0),
      customer_name: maskName(order.customer_name),
      customer_phone: maskPhoneNumber(order.customer_phone),
      delivery_address: maskAddress(order.delivery_address, order.delivery_area),
      delivery_area: order.delivery_area,
      // Delivery man info remains accessible for order coordination
      delivery_rider_name: order.delivery_rider_name,
      delivery_rider_phone: order.delivery_rider_phone,
      delivery_rider_vehicle: order.delivery_rider_vehicle,
      delivery_note: null,
      is_masked: true,
      is_owner: false
    };

    return NextResponse.json({
      verified: false,
      is_owner: false,
      is_masked: true,
      order: sanitizedOrder
    });
  }

  return NextResponse.json(
    { error: 'অনুগ্রহ করে অর্ডার কোড অথবা মোবাইল নম্বর প্রদান করুন' },
    { status: 400 }
  );
}
