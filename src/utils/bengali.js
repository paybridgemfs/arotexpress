// Bengali numerals and Day helpers

const banglaDigits = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBengaliNumber(num, maxDecimals = 2) {
  if (num === null || num === undefined || num === '') return '';
  
  if (typeof num === 'number') {
    if (!Number.isFinite(num)) return '';
    if (Number.isInteger(num)) {
      return String(num).replace(/[0-9]/g, (digit) => banglaDigits[digit] || digit);
    }
    // Round floats to maxDecimals (default 2) to eliminate IEEE 754 float precision artifacts (e.g. 616.55000000008 -> 616.55)
    const fixed = Number(num.toFixed(maxDecimals));
    return String(fixed).replace(/[0-9]/g, (digit) => banglaDigits[digit] || digit);
  }

  // If passed as a numeric string with extra floating decimals
  if (typeof num === 'string' && !isNaN(Number(num)) && num.includes('.')) {
    const parsed = parseFloat(num);
    if (!isNaN(parsed)) {
      const fixed = Number(parsed.toFixed(maxDecimals));
      return String(fixed).replace(/[0-9]/g, (digit) => banglaDigits[digit] || digit);
    }
  }

  return String(num).replace(/[0-9]/g, (digit) => banglaDigits[digit] || digit);
}

/**
 * Formats stock display with clean Bengali number and appropriate unit.
 * E.g., if stock is 100 and unit is "২৫০ গ্রাম প্যাকেট", returns "১০০ প্যাকেট (২৫০ গ্রাম)" or "১০০ প্যাকেট"
 * If unit is "প্রতি কেজি" or "১ কেজি", returns "১০০ কেজি"
 * If unit is "৫ লিটার বোতল", returns "১০০ বোতল (৫ লিটার)"
 */
export function formatStockDisplay(stockQty, unit = '') {
  const numStr = toBengaliNumber(stockQty);
  if (!unit) return `${numStr} টি`;

  const trimmed = unit.trim();
  
  // If unit contains packet/bottle/can/piece/box
  if (/প্যাকেট|packet/i.test(trimmed)) {
    return `${numStr} প্যাকেট`;
  }
  if (/বোতল|bottle/i.test(trimmed)) {
    return `${numStr} বোতল`;
  }
  if (/জার|jar/i.test(trimmed)) {
    return `${numStr} জার`;
  }
  if (/কার্টন|কার্টুন|carton|box/i.test(trimmed)) {
    return `${numStr} কার্টন`;
  }
  if (/টি|পিস|piece|pcs/i.test(trimmed)) {
    return `${numStr} টি`;
  }
  if (/ডজন|dozen/i.test(trimmed)) {
    return `${numStr} ডজন`;
  }
  if (/হালি/i.test(trimmed)) {
    return `${numStr} হালি`;
  }
  if (/গ্রাম|gram|gm/i.test(trimmed) && !/কেজি/i.test(trimmed)) {
    // e.g. "২৫০ গ্রাম" -> "১০০ প্যাকেট" or "১০০ পিস"
    return `${numStr} প্যাকেট`;
  }
  if (/কেজি|kg/i.test(trimmed) && (/প্যাকেট|ব্যাগ|বস্তা/i.test(trimmed) || /\d+\s*কেজি/.test(trimmed))) {
    if (/বস্তা/i.test(trimmed)) return `${numStr} বস্তা`;
    if (/ব্যাগ/i.test(trimmed)) return `${numStr} ব্যাগ`;
    return `${numStr} প্যাকেট`;
  }
  if (/লিটার|liter|litre/i.test(trimmed)) {
    return `${numStr} বোতল`;
  }
  if (/কেজি|kg/i.test(trimmed)) {
    return `${numStr} কেজি`;
  }

  // Fallback
  const cleanUnit = trimmed.replace(/^প্রতি\s*/, '');
  return `${numStr} ${cleanUnit || 'টি'}`;
}

/**
 * Normalizes any order status (Bengali or English) into standard lowercase canonical key:
 * 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
 */
export function normalizeOrderStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  if (s === 'pending' || s === 'পেন্ডিং') return 'pending';
  if (s === 'processing' || s === 'প্রসেসিং') return 'processing';
  if (s === 'shipped' || s === 'পাঠানো হয়েছে' || s === 'ডেলিভারিতে আছে' || s === 'ডেলিভারিতে পাঠানো হয়েছে' || s === 'অন-ওয়ে' || s === 'অন-ডেলিভারি') return 'shipped';
  if (s === 'delivered' || s === 'ডেলিভার্ড' || s === 'সম্পন্ন' || s === 'ডেলিভারি সম্পন্ন') return 'delivered';
  if (s === 'cancelled' || s === 'বাতিল') return 'cancelled';
  return s || 'pending';
}

/**
 * Returns human-readable Bengali label for any order status
 */
export function getOrderStatusBn(status) {
  const norm = normalizeOrderStatus(status);
  switch (norm) {
    case 'pending': return 'পেন্ডিং';
    case 'processing': return 'প্রসেসিং';
    case 'shipped': return 'পাঠানো হয়েছে';
    case 'delivered': return 'ডেলিভার্ড';
    case 'cancelled': return 'বাতিল';
    default: return status || 'পেন্ডিং';
  }
}
