import type { Metadata } from 'next';
import '../src/index.css';
import Providers from './providers';
import { getDB } from './lib/db';

function resolveAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://arot-express.com';
  try {
    const DBManager = await getDB();
    const settings: any = DBManager.getSettings() || {};

    const siteName = (settings.site_name || 'আড়ৎ এক্সপ্রেস (Arot Express)').trim();
    const siteTagline = (settings.site_tagline || 'তাজা পাইকারি ও খুচরা মুদি বাজার').trim();
    const headerTitle = (settings.header_title || 'মুদি বাজারের পুরো লিস্ট, এক জায়গায়।').trim();
    const description = (
      settings.header_subtitle ||
      settings.site_tagline ||
      'চাল-ডাল থেকে মাছ-মসলা — আড়তের মতো দরে, ঘরে বসে অর্ডার করুন। ব্র্যান্ড বেছে নিন, কার্টে যোগ করুন, ডেলিভারি নিশ্চিত করুন।'
    ).trim();

    const bannerUrl = (settings.banner_url || settings.logo_image_url || '').trim();
    const absoluteBannerUrl = bannerUrl ? resolveAbsoluteUrl(bannerUrl, siteUrl) : '';

    const title = `${siteName} — ${siteTagline || headerTitle}`;

    const openGraphImages = absoluteBannerUrl
      ? [
          {
            url: absoluteBannerUrl,
            secureUrl: absoluteBannerUrl,
            width: 1200,
            height: 630,
            alt: siteName,
            type: 'image/jpeg',
          },
        ]
      : [];

    return {
      metadataBase: new URL(siteUrl),
      title: {
        default: title,
        template: `%s | ${siteName}`,
      },
      description,
      applicationName: siteName,
      authors: [{ name: siteName }],
      keywords: [
        'arot express',
        'আড়ৎ এক্সপ্রেস',
        'মুদি বাজার',
        'পাইকারি বাজার',
        'ঢাকা গ্রোসারি ডেলিভারি',
        'নিত্যপণ্য',
        'grocery bd',
        'চাল ডাল তেল'
      ],
      openGraph: {
        title,
        description,
        url: siteUrl,
        siteName: siteName,
        locale: 'bn_BD',
        type: 'website',
        images: openGraphImages,
      },
      twitter: {
        card: absoluteBannerUrl ? 'summary_large_image' : 'summary',
        title,
        description,
        images: absoluteBannerUrl ? [absoluteBannerUrl] : [],
        creator: '@arotexpress',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (e) {
    const fallbackTitle = 'আড়ৎ এক্সপ্রেস (Arot Express) — তাজা পাইকারি ও খুচরা মুদি বাজার';
    const fallbackDesc = 'চাল-ডাল থেকে মাছ-মসলা — আড়তের মতো দরে, ঘরে বসে অর্ডার করুন।';
    return {
      metadataBase: new URL(siteUrl),
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: siteUrl,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDesc,
      },
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://arot-express.com';
  let faviconUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23006C4C'/%3E%3Ctext x='32' y='35' text-anchor='middle' dominant-baseline='central' fill='%23FFFFFF' font-family='sans-serif' font-weight='900' font-size='34'%3EAE%3C/text%3E%3C/svg%3E";
  let initialData: any = null;
  let siteTitle = 'আড়ৎ এক্সপ্রেস (Arot Express) — তাজা পাইকারি ও খুচরা মুদি বাজার';
  let siteDescription = 'চাল-ডাল থেকে মাছ-মসলা — আড়তের মতো দরে, ঘরে বসে অর্ডার করুন। ব্র্যান্ড বেছে নিন, কার্টে যোগ করুন, ডেলিভারি নিশ্চিত করুন।';
  let ogImageUrl = '';

  try {
    const DBManager = await getDB();
    const rawSettings: any = DBManager.getSettings() || {};
    const settings: any = { ...rawSettings };
    // Strictly remove private API keys and verification secrets from SSR client payload
    delete settings.payment_verify_api_key;
    delete settings.payment_verify_api_url;

    const siteName = (settings.site_name || 'আড়ৎ এক্সপ্রেস (Arot Express)').trim();
    const siteTagline = (settings.site_tagline || 'তাজা পাইকারি ও খুচরা মুদি বাজার').trim();
    siteTitle = `${siteName} — ${siteTagline}`;
    siteDescription = (settings.header_subtitle || settings.site_tagline || siteDescription).trim();

    if (settings.banner_url?.trim()) {
      ogImageUrl = resolveAbsoluteUrl(settings.banner_url.trim(), siteUrl);
    } else if (settings.logo_image_url?.trim()) {
      ogImageUrl = resolveAbsoluteUrl(settings.logo_image_url.trim(), siteUrl);
    }

    if (settings.logo_type === 'image' && settings.logo_image_url?.trim()) {
      faviconUrl = settings.logo_image_url.trim();
    }

    // Prepare complete initial state for Server-Side Rendering (SSR)
    const rawGroups = DBManager.getGroups() || [];
    const rawCategories = DBManager.getCategories() || [];
    const rawPaymentMethods = DBManager.getPaymentMethods() || [];
    const rawDeliveryAreas = DBManager.getDeliveryAreas() || [];
    const rawPackageProducts = DBManager.getPackageProducts() || [];
    const rawFooterSettings = DBManager.getFooterSettings() || {};

    initialData = {
      groups: JSON.parse(JSON.stringify(rawGroups)),
      categories: JSON.parse(JSON.stringify(rawCategories)),
      settings: JSON.parse(JSON.stringify(settings)),
      footerSettings: JSON.parse(JSON.stringify(rawFooterSettings)),
      paymentMethods: JSON.parse(JSON.stringify(rawPaymentMethods)),
      deliveryAreas: JSON.parse(JSON.stringify(rawDeliveryAreas)),
      packageProducts: JSON.parse(JSON.stringify(rawPackageProducts)),
      defaultDeliveryFee: typeof settings.default_delivery_fee === 'number' ? settings.default_delivery_fee : 60
    };
  } catch (e) {
    // fallback gracefully if database initialization encounters any transient issue
  }

  // Generate Schema.org JSON-LD structured data for Google, Gemini and AI web crawlers
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: initialData?.settings?.site_name || 'Arot Express',
    description: initialData?.settings?.header_subtitle || 'মুদি বাজারের পুরো লিস্ট, এক জায়গায়। তাজা পাইকারি ও খুচরা মুদি বাজার।',
    url: siteUrl,
    currenciesAccepted: 'BDT',
    paymentAccepted: 'Cash on Delivery, bKash, Nagad, Rocket',
    priceRange: '৳৳',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'মুদি পণ্যের তালিকা (Grocery Catalog)',
      itemListElement: (initialData?.categories || []).map((cat: any) => ({
        '@type': 'OfferCatalog',
        name: `${cat.bn} (${cat.en})`,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: (cat.brands || []).length,
        itemListElement: (cat.brands || []).map((b: any) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: b.name,
            category: cat.bn,
            offers: {
              '@type': 'Offer',
              price: b.price,
              priceCurrency: 'BDT',
              availability: (b.stock === undefined || b.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              unitText: b.unit
            }
          }
        }))
      }))
    }
  };

  return (
    <html lang="bn" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" type="image/svg+xml" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />
        
        {/* WhatsApp & Social Media Preview Direct Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={initialData?.settings?.site_name || 'আড়ৎ এক্সপ্রেস'} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        {ogImageUrl && (
          <>
            <meta property="og:image" content={ogImageUrl} />
            <meta property="og:image:secure_url" content={ogImageUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:type" content="image/jpeg" />
          </>
        )}
        <meta name="twitter:card" content={ogImageUrl ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Dosis:wght@400;500;600;700;800&family=Noto+Serif+Bengali:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div id="root">
          <Providers initialData={initialData}>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
