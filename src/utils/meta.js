// Utility to dynamically synchronize browser favicon and meta tags with settings
export function updateAppMeta(settings) {
  if (typeof document === 'undefined' || !settings) return;

  // 1. Update Meta Tags & Title
  const siteName = settings.site_name?.trim() || 'Arot Express';
  const siteTagline = settings.site_tagline?.trim() || 'আপনার আড়ৎ, এখন এক ক্লিকে';
  
  // The title requested by the user: "website er title e tagline/upo-shironam e ja thakbe setai bosbe"
  const documentTitle = siteTagline || siteName;
  
  if (document.title !== documentTitle) {
    document.title = documentTitle;
  }
  
  const metaTitleEl = document.getElementById('meta-title');
  if (metaTitleEl) metaTitleEl.innerText = documentTitle;

  // Open Graph and Twitter tags: Use Hero Title and Hero Subtitle for better preview
  const ogTitle = (settings.header_title?.trim() || siteName).replace('\n', ' ');
  const ogDesc = settings.header_subtitle?.trim() || siteTagline;
  
  // Explicitly check for banner_url, fallback to logo if banner is not provided
  const bannerUrl = settings.banner_url?.trim() || settings.logo_image_url?.trim() || '';

  const setMetaContent = (nameOrProperty, content) => {
    if (!content) return;
    let el = document.querySelector(`meta[property="${nameOrProperty}"]`) || 
             document.querySelector(`meta[name="${nameOrProperty}"]`) ||
             document.getElementById(nameOrProperty);
    if (!el) {
      el = document.createElement('meta');
      if (nameOrProperty.startsWith('og:')) {
        el.setAttribute('property', nameOrProperty);
      } else {
        el.setAttribute('name', nameOrProperty);
      }
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaContent('description', ogDesc);
  setMetaContent('og:title', ogTitle);
  setMetaContent('og:description', ogDesc);
  setMetaContent('twitter:title', ogTitle);
  setMetaContent('twitter:description', ogDesc);
  
  // Explicitly use bannerUrl to set the og:image and twitter:image tags
  if (bannerUrl) {
    setMetaContent('og:image', bannerUrl);
    setMetaContent('twitter:image', bannerUrl);
  }

  // 2. Update Favicon
  let faviconUrl = '';
  if (settings.logo_type === 'image' && settings.logo_image_url?.trim()) {
    faviconUrl = settings.logo_image_url.trim();
  } else {
    const text = (settings.logo_text_en || settings.logo_text_bn || 'AE').trim();
    const cleanText = text.slice(0, 5);
    const fontSize = cleanText.length <= 2 ? 34 : cleanText.length <= 3 ? 26 : 20;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="fav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00875A"/>
      <stop offset="100%" stop-color="#004D36"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#fav-grad)"/>
  <rect x="2" y="2" width="60" height="60" rx="14" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
  <text x="32" y="34" text-anchor="middle" dominant-baseline="central" fill="#FFFFFF" font-family="'Dosis', 'Noto Serif Bengali', serif" font-weight="900" font-size="${fontSize}">${cleanText}</text>
</svg>`;
    faviconUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  // Update or create standard favicon link element
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
  
  // Add Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.href = window.location.href.split('?')[0]; // Remove query params for canonical
  
  
  // Add SEO Keywords
  const keywords = `${siteName}, ${siteTagline}, ecommerce, grocery, online shopping`.replace(/[—\-।|,]/g, '').replace(/\s+/g, ', ');
  
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.name = 'keywords';
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.content = keywords;
  
  // Add Schema.org JSON-LD structured data for better SEO
  let scriptSchema = document.querySelector('script[type="application/ld+json"]');
  if (!scriptSchema) {
    scriptSchema = document.createElement('script');
    scriptSchema.type = 'application/ld+json';
    document.head.appendChild(scriptSchema);
  }
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "description": ogDesc,
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": window.location.origin + "/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
  
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": window.location.origin,
    "logo": faviconUrl,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings.site_helpline || "",
      "contactType": "customer service"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": settings.site_address || ""
    }
  };
  
  scriptSchema.textContent = JSON.stringify([schemaData, orgSchema]);

  // Also update Apple Touch Icon
  let appleLink = document.querySelector("link[rel='apple-touch-icon']");
  if (!appleLink) {
    appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleLink);
  }
  appleLink.href = faviconUrl;
}
