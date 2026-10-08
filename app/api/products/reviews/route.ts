import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/app/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');
  const categoryId = searchParams.get('category_id');

  if (!productId || !categoryId) {
    return NextResponse.json({ error: 'Missing product_id or category_id' }, { status: 400 });
  }

  try {
    const DBManager = await getDB();
    const reviews = await DBManager.getProductReviews(productId, categoryId);
    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, category_id, user_name, rating, comment } = body;

    const DBManager = await getDB();
    const result = await DBManager.addProductReview({
      product_id,
      category_id,
      user_name,
      rating,
      comment
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
