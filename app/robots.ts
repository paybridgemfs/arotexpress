import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://arot-express.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/delivery', '/delivery-man', '/api/'],
    },
    sitemap: `${baseUrl.replace(/\/+$/, '')}/sitemap.xml`,
  };
}
