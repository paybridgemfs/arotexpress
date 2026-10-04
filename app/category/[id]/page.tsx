import React from 'react';
import type { Metadata } from 'next';
import CategoryDetailClientView from '@/src/components/CategoryDetailClientView';
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
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const catId = parseInt(resolvedParams.id, 10);
  const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://arot-express.com';

  try {
    const DBManager = await getDB();
    const categories = DBManager.getCategories() || [];
    const settings: any = DBManager.getSettings() || {};
    const cat = categories.find((c: any) => c.id === catId || String(c.id) === String(resolvedParams.id));

    if (cat) {
      const siteName = (settings.site_name || 'Arot Express').trim();
      const title = `${cat.bn} (${cat.en}) — ${siteName}`;
      const brandNames = (cat.brands || []).map((b: any) => b.name).join(', ');
      const description = brandNames
        ? `${cat.bn} এর উপলব্ধ ব্র্যান্ড ও পণ্য: ${brandNames}। আড়ত দরে অনলাইনে অর্ডার করুন।`
        : `${cat.bn} (${cat.en}) পণ্য আড়ত দরে ঘরে বসে অর্ডার করুন।`;

      // Select category image (or first brand image, or store banner as fallback)
      const rawImage = cat.icon || ((cat as any).image as string) || (cat.brands && cat.brands.length > 0 && cat.brands[0].image ? cat.brands[0].image : '') || settings.banner_url || settings.logo_image_url || '';
      const absoluteImageUrl = rawImage ? resolveAbsoluteUrl(rawImage, siteUrl) : '';

      const ogImages = absoluteImageUrl
        ? [
            {
              url: absoluteImageUrl,
              secureUrl: absoluteImageUrl,
              width: 800,
              height: 800,
              alt: `${cat.bn} (${cat.en})`,
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
          url: `${siteUrl.replace(/\/+$/, '')}/category/${cat.id}`,
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
  } catch (e) {
    // fallback
  }

  return {
    title: 'ক্যাটাগরি বিস্তারিত — Arot Express',
    description: 'তাজা পাইকারি ও খুচরা মুদি বাজার'
  };
}

export default async function CategoryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const categoryIdParam = resolvedParams.id;
  const numId = parseInt(categoryIdParam, 10);

  let category: any = null;
  try {
    const DBManager = await getDB();
    const categories = DBManager.getCategories() || [];
    category = categories.find((c: any) => c.id === numId || String(c.id) === String(categoryIdParam));
  } catch (err) {
    console.error('SSR Category fetch error:', err);
  }

  return (
    <>
      {/* 
        Server-Pre-rendered SEO semantic information:
        Instant crawlability for Gemini, Google, and bots
      */}
      {category && (
        <section 
          className="seo-crawler-content" 
          aria-label={`${category.bn} পণ্য তালিকা`}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
        >
          <h1>{category.bn} - {category.en}</h1>
          {category.brands && category.brands.length > 0 && (
            <ul>
              {category.brands.map((b: any, idx: number) => (
                <li key={`cat-brand-${idx}`}>
                  <strong>{b.name}</strong> - ৳{toBengaliNumber(b.price)} প্রতি {b.unit}
                  {b.stock !== undefined && ` (স্টক: ${toBengaliNumber(b.stock)})`}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Interactive client component */}
      <CategoryDetailClientView categoryIdParam={categoryIdParam} />
    </>
  );
}
