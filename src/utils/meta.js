// Utility to dynamically synchronize browser title safely with route and settings
export function updateAppMeta(settings, customTitle = null) {
  if (typeof document === 'undefined') return;

  try {
    if (customTitle && typeof customTitle === 'string') {
      if (document.title !== customTitle) {
        document.title = customTitle;
      }
      return;
    }

    if (!settings) return;

    const siteName = (settings.site_name || 'আড়ৎ এক্সপ্রেস (Arot Express)').trim();
    const siteTagline = (settings.site_tagline || 'তাজা পাইকারি ও খুচরা মুদি বাজার').trim();
    
    const documentTitle = siteTagline ? `${siteName} — ${siteTagline}` : siteName;
    if (documentTitle && document.title !== documentTitle) {
      document.title = documentTitle;
    }
  } catch (e) {
    // Graceful silent fallback
  }
}

export function setPageTitle(title) {
  if (typeof document === 'undefined' || !title) return;
  try {
    if (document.title !== title) {
      document.title = title;
    }
  } catch (e) {
    // Graceful silent fallback
  }
}
