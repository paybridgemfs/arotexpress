/**
 * Payment method branding logos and helpers
 * High-definition, responsive vector SVG logos for bKash, Nagad, Rocket, Upay, etc.
 * Sized and optimized to display crisp within max-w-[128px] h-[68px]
 */

// bKash Official Colors: Pink (#E2136E), White
export const BKASH_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 136" width="256" height="136">
  <rect width="256" height="136" rx="16" fill="#E2136E"/>
  <g transform="translate(18, 22)">
    <!-- bKash Origami Bird -->
    <path d="M52 14 L24 46 L62 46 Z" fill="#FFFFFF" opacity="0.95"/>
    <path d="M62 46 L88 20 L84 62 Z" fill="#FFFFFF"/>
    <path d="M62 46 L40 76 L76 72 Z" fill="#FFFFFF" opacity="0.9"/>
    <path d="M84 62 L112 52 L94 78 Z" fill="#FFFFFF"/>
    <!-- bKash Typography -->
    <text x="118" y="58" font-family="'Segoe UI', Roboto, 'Noto Sans Bengali', sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" letter-spacing="-1">bKash</text>
    <text x="120" y="82" font-family="'Noto Sans Bengali', 'SolaimanLipi', sans-serif" font-weight="700" font-size="19" fill="#FFFFFF" opacity="0.95">বিকাশ</text>
  </g>
</svg>
`)}`;

// Nagad Official Colors: Vibrant Orange (#F7941D) / Red (#E31A22)
export const NAGAD_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 136" width="256" height="136">
  <defs>
    <linearGradient id="nagadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F97316"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
  </defs>
  <rect width="256" height="136" rx="16" fill="url(#nagadGrad)"/>
  <g transform="translate(20, 20)">
    <!-- Nagad Flame Symbol -->
    <circle cx="48" cy="48" r="32" fill="#FFFFFF" opacity="0.2"/>
    <path d="M48 22 C36 34 34 50 44 64 C48 70 54 74 60 72 C68 69 68 56 62 50 C58 46 54 46 52 42 C48 34 56 26 48 22 Z" fill="#FFFFFF"/>
    <circle cx="36" cy="58" r="6" fill="#FDE047"/>
    <!-- Nagad Typography -->
    <text x="96" y="54" font-family="'Noto Sans Bengali', 'SolaimanLipi', sans-serif" font-weight="900" font-size="36" fill="#FFFFFF">নগদ</text>
    <text x="98" y="80" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="18" fill="#FFFFFF" letter-spacing="1">nagad</text>
  </g>
</svg>
`)}`;

// Rocket Official Colors: Dutch-Bangla Purple (#8C3494) / White
export const ROCKET_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 136" width="256" height="136">
  <defs>
    <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333EA"/>
      <stop offset="100%" stop-color="#6B21A8"/>
    </linearGradient>
  </defs>
  <rect width="256" height="136" rx="16" fill="url(#rocketGrad)"/>
  <g transform="translate(24, 22)">
    <!-- Rocket Icon -->
    <path d="M38 68 L24 82 L34 84 L42 76 Z" fill="#FDE047"/>
    <path d="M62 20 C42 30 38 52 40 68 L58 72 C70 58 76 38 62 20 Z" fill="#FFFFFF"/>
    <circle cx="52" cy="42" r="5" fill="#7E22CE"/>
    <path d="M36 50 L26 56 L38 66 Z" fill="#FFFFFF" opacity="0.8"/>
    <path d="M58 70 L64 82 L70 72 Z" fill="#FFFFFF" opacity="0.8"/>
    <!-- Rocket Typography -->
    <text x="86" y="52" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="30" fill="#FFFFFF" letter-spacing="-0.5">Rocket</text>
    <text x="88" y="78" font-family="'Noto Sans Bengali', 'SolaimanLipi', sans-serif" font-weight="700" font-size="20" fill="#FDE047">রকেট</text>
  </g>
</svg>
`)}`;

// Upay Official Colors: Navy (#002D72) / Yellow (#FFD100)
export const UPAY_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 136" width="256" height="136">
  <rect width="256" height="136" rx="16" fill="#002D72"/>
  <g transform="translate(32, 24)">
    <path d="M28 24 L28 50 C28 62 38 70 50 70 C62 70 72 62 72 50 L72 24 L56 24 L56 50 C56 54 53 57 50 57 C47 57 44 54 44 50 L44 24 Z" fill="#FFD100"/>
    <text x="88" y="58" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" fill="#FFFFFF">upay</text>
    <text x="90" y="80" font-family="'Noto Sans Bengali', 'SolaimanLipi', sans-serif" font-weight="700" font-size="18" fill="#FFD100">উপায়</text>
  </g>
</svg>
`)}`;

// Cash on Delivery Card Logo
export const COD_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 136" width="256" height="136">
  <rect width="256" height="136" rx="16" fill="#006C4C"/>
  <g transform="translate(24, 26)">
    <rect x="12" y="14" width="60" height="42" rx="6" fill="#E8F8EE" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="42" cy="35" r="11" fill="#006C4C"/>
    <text x="37" y="40" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">৳</text>
    <text x="86" y="44" font-family="'Noto Sans Bengali', 'SolaimanLipi', sans-serif" font-weight="800" font-size="22" fill="#FFFFFF">ক্যাশ অন</text>
    <text x="86" y="66" font-family="'Noto Sans Bengali', 'SolaimanLipi', sans-serif" font-weight="800" font-size="22" fill="#86EFAC">ডেলিভারি</text>
  </g>
</svg>
`)}`;

/**
 * Returns a guaranteed valid logo URL for any payment method.
 * If user uploaded a custom logo_url, uses that; otherwise falls back to official brand SVG.
 */
export function getPaymentMethodLogo(method) {
  if (!method) return BKASH_SVG;

  // Custom uploaded logo
  if (method.logo_url && typeof method.logo_url === 'string' && method.logo_url.trim().length > 5) {
    return method.logo_url.trim();
  }
  if (method.logo && typeof method.logo === 'string' && method.logo.trim().length > 5) {
    return method.logo.trim();
  }

  const str = `${method.code || ''} ${method.name_bn || ''} ${method.name_en || ''}`.toLowerCase();

  if (str.includes('bkash') || str.includes('বিকাশ')) {
    return BKASH_SVG;
  }
  if (str.includes('nagad') || str.includes('নগদ')) {
    return NAGAD_SVG;
  }
  if (str.includes('rocket') || str.includes('রকেট') || str.includes('16216') || str.includes('dbbl')) {
    return ROCKET_SVG;
  }
  if (str.includes('upay') || str.includes('উপায়') || str.includes('ইউপে')) {
    return UPAY_SVG;
  }
  if (str.includes('cod') || str.includes('ক্যাশ') || str.includes('cash')) {
    return COD_SVG;
  }

  return BKASH_SVG;
}
