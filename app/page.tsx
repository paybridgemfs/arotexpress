import React from 'react';
import type { Metadata } from 'next';
import HomeClientView from '@/src/components/HomeClientView';
import { getDB } from './lib/db';
import { toBengaliNumber } from '@/src/utils/bengali';

// Force dynamic so any update in PostgreSQL or admin panel reflects immediately on server rendering
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
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedParams = searchParams ? await searchParams : {};
  const catQuery = resolvedParams.category || resolvedParams.cat;
  const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://arot-express.com';

  try {
    const DBManager = await getDB();
    const categories = DBManager.getCategories() || [];
    const settings: any = DBManager.getSettings() || {};
    const siteName = (settings.site_name || 'আড়ৎ এক্সপ্রেস (Arot Express)').trim();

    if (catQuery && typeof catQuery === 'string') {
      const cat = categories.find((c: any) => String(c.id) === String(catQuery) || c.en?.toLowerCase() === catQuery.toLowerCase());
      if (cat) {
        const title = `${cat.bn} (${cat.en}) — ${siteName}`;
        const brandNames = (cat.brands || []).map((b: any) => b.name).join(', ');
        const description = brandNames
          ? `${cat.bn} এর উপলব্ধ ব্র্যান্ড ও পণ্য: ${brandNames}। আড়ত দরে অনলাইনে অর্ডার করুন।`
          : `${cat.bn} (${cat.en}) পণ্য আড়ত দরে ঘরে বসে অর্ডার করুন।`;

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
            url: `${siteUrl.replace(/\/+$/, '')}/?category=${cat.id}`,
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
  } catch (e) {
    // fallback
  }

  return {};
}

export default async function HomePage() {
  let groups: any[] = [];
  let categories: any[] = [];
  let settings: any = {};

  try {
    const DBManager = await getDB();
    groups = DBManager.getGroups() || [];
    categories = DBManager.getCategories() || [];
    settings = DBManager.getSettings() || {};
  } catch (err) {
    console.error('SSR HomePage DB fetch error:', err);
  }

  // Filter active groups and active categories for server HTML pre-rendering
  const activeGroups = groups.filter((g: any) => g.is_active !== false);
  const activeCategories = categories.filter((c: any) => {
    const parentGroup = groups.find((g: any) => g.key === c.group);
    return parentGroup ? parentGroup.is_active !== false : true;
  });

  return (
    <>
      {/* 
        1. Fully Server-Rendered Semantic Content:
        Directly embedded into the initial HTML response from the server.
        Search engines (Google), AI crawlers (Gemini, ChatGPT), and lightweight bots
        can instantly read all products, categories, titles, and descriptions 
        without needing to execute JavaScript!
      */}
      <section 
        className="seo-crawler-content" 
        aria-label="সব ক্যাটাগরি ও মুদি পণ্য তালিকা (Server Pre-rendered)"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        <h1>{settings?.header_title || 'মুদি বাজারের পুরো লিস্ট, এক জায়গায়।'}</h1>
        <p>{settings?.header_subtitle || 'চাল-ডাল থেকে মাছ-মসলা — আড়তের মতো দরে, ঘরে বসে অর্ডার করুন।'}</p>
        
        {activeGroups.map((group: any) => {
          const groupCats = activeCategories.filter((cat: any) => cat.group === group.key);
          if (groupCats.length === 0) return null;

          return (
            <article key={`ssr-grp-${group.key}`}>
              <h2>{group.bn} ({group.en})</h2>
              <ul>
                {groupCats.map((cat: any) => (
                  <li key={`ssr-cat-${cat.id}`}>
                    <h3>
                      <a href={`/category/${cat.id}`}>{cat.bn} - {cat.en}</a>
                    </h3>
                    {cat.brands && cat.brands.length > 0 && (
                      <p>
                        ব্র্যান্ড/পণ্য: {cat.brands.map((b: any) => `${b.name} (৳${toBengaliNumber(b.price)} / ${b.unit})`).join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      {/* 
        2. Dynamic Client Component:
        Handles the interactive animated user interface, cart drawer, live search, 
        smooth scrolling, and real-time client hydration seamlessly.
      */}
      <HomeClientView />
    </>
  );
}
