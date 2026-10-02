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

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const DBManager = await getDB();
  const rawCode = (await params).code;
  let order = DBManager.findOrderByCode(rawCode);
  let isPackage = false;
  if (!order) {
    order = DBManager.findPackageOrderByCode(rawCode);
    if (order) isPackage = true;
  }
  if (!order) {
    return NextResponse.json({ error: 'অর্ডার কোডটি সঠিক নয় অথবা কোনো অর্ডার পাওয়া যায়নি' }, { status: 404 });
  }

  // Check if requester is authenticated as the owner or an admin
  const authResult = await authenticateToken(req);
  const user = !authResult.error ? (authResult.user as any) : null;
  const isAdmin = user && user.role === 'admin';
  
  let isOwner = false;
  if (isAdmin) {
    isOwner = true;
  } else if (user) {
    const userPhone = normalizePhoneDigits(user.phone);
    const orderPhone = normalizePhoneDigits(order.customer_phone);
    if (order.user_id && user.id === order.user_id) {
      isOwner = true;
    } else if (userPhone && orderPhone && (userPhone.endsWith(orderPhone) || orderPhone.endsWith(userPhone))) {
      isOwner = true;
    }
  }

  if (isOwner) {
    return NextResponse.json({
      ...order,
      is_package_order: isPackage,
      is_owner: true,
      is_masked: false
    });
  }

  // Sanitize sensitive PII for unauthenticated or public guest tracking
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
    items_json: maskItems(order.items_json),
    items_count: Array.isArray(order.items_json)
      ? order.items_json.length
      : (typeof order.items_json === 'string' ? (JSON.parse(order.items_json || '[]').length) : 0),
    customer_name: maskName(order.customer_name),
    customer_phone: maskPhoneNumber(order.customer_phone),
    delivery_address: maskAddress(order.delivery_address, order.delivery_area),
    delivery_area: order.delivery_area,
    delivery_rider_name: order.delivery_rider_name,
    delivery_rider_phone: order.delivery_rider_phone,
    delivery_rider_vehicle: order.delivery_rider_vehicle,
    delivery_note: null,
    is_masked: true,
    is_owner: false
  };

  return NextResponse.json(sanitizedOrder);
}
