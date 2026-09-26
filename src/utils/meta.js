// Utility to dynamically synchronize browser title and favicon safely with settings
export function updateAppMeta(settings) {
  if (typeof document === 'undefined' || !settings) return;

  try {
    // 1. Update Document Title safely
    const siteName = (settings.site_name || 'Arot Express').trim();
    const siteTagline = (settings.site_tagline || '').trim();
    
    const documentTitle = siteTagline || siteName;
    if (documentTitle && document.title !== documentTitle) {
      document.title = documentTitle;
    }

    // 2. Favicon update (in-place modification of existing link tags only, without creating or removing DOM nodes)
    const customFavicon = (settings.favicon_image_url || settings.logo_image_url || '').trim();
    if (customFavicon) {
      const iconLinks = document.querySelectorAll("link[rel*='icon']");
      iconLinks.forEach((link) => {
        if (link && link.href !== customFavicon) {
          link.href = customFavicon;
        }
      });
    }
  } catch (e) {
    // Graceful silent fallback
  }
}
