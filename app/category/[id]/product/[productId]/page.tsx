import React from 'react';
import type { Metadata } from 'next';
import ProductDetailViewClient from '@/src/components/ProductDetailViewClient';
import { getDB } from '@/app/lib/db';
import { toBengaliNumber } from '@/src/utils/bengali';

export const dynamic = 'force-dynamic';

function resolveAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string; productId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const catId = parseInt(resolvedParams.id, 10);
  const prodId = resolvedParams.productId;
  const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://arot-express.com';

  try {
    const DBManager = await getDB();
    const categories = DBManager.getCategories() || [];
    const settings: any = DBManager.getSettings() || {};
    const cat = categories.find((c: any) => c.id === catId || String(c.id) === String(resolvedParams.id));

    if (cat && cat.brands) {
      const prod = cat.brands.find((b: any) => String(b.id) === String(prodId) || String(b.name) === decodeURIComponent(prodId)) || cat.brands[0];
      if (prod) {
        const siteName = (settings.site_name || 'Arot Express').trim();
        const title = `${prod.name} (${prod.unit}) — ${cat.bn} | ${siteName}`;
        const description = `${prod.name} (${prod.unit}) আড়ত মূল্যে কিনুন ৳${prod.price} টাকায়। ${cat.bn} ক্যাটাগরির তাজা পণ্য ঘরে বসে অর্ডার করুন।`;

        const rawImage = prod.image || cat.icon || settings.banner_url || settings.logo_image_url || '';
        const absoluteImageUrl = rawImage ? resolveAbsoluteUrl(rawImage, siteUrl) : '';

        const ogImages = absoluteImageUrl
          ? [
              {
                url: absoluteImageUrl,
                secureUrl: absoluteImageUrl,
                width: 800,
                height: 800,
                alt: prod.name,
                type: 'image/jpeg'
              }
            ]
          : [];

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            url: `${siteUrl.replace(/\/+$/, '')}/category/${cat.id}/product/${prod.id || prod.name}`,
            siteName,
            locale: 'bn_BD',
            type: 'website',
            images: ogImages
          },
          twitter: {
            card: absoluteImageUrl ? 'summary_large_image' : 'summary',
            title,
            description,
            images: absoluteImageUrl ? [absoluteImageUrl] : []
          }
        };
      }
    }
  } catch (e) {}

  return {
    title: 'পণ্য বিস্তারিত — Arot Express',
    description: 'তাজা পাইকারি ও খুচরা মুদি বাজার'
  };
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const resolvedParams = await params;
  const categoryId = resolvedParams.id;
  const productId = resolvedParams.productId;
  const numCatId = parseInt(categoryId, 10);

  let category: any = null;
  let product: any = null;

  try {
    const DBManager = await getDB();
    const categories = DBManager.getCategories() || [];
    category = categories.find((c: any) => c.id === numCatId || String(c.id) === String(categoryId)) || null;

    if (category && category.brands) {
      product = category.brands.find((b: any) => String(b.id) === String(productId) || String(b.name) === decodeURIComponent(productId)) || null;
    }
  } catch (err) {}

  return (
    <ProductDetailViewClient
      categoryId={categoryId}
      productId={productId}
      initialCategory={category ? JSON.parse(JSON.stringify(category)) : null}
      initialProduct={product ? JSON.parse(JSON.stringify(product)) : null}
    />
  );
}
