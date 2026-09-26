/**
 * Bulletproof clipboard copy function that works reliably even inside iframes,
 * HTTP contexts, mobile web views, and browsers with restricted clipboard permissions.
 *
 * @param {string|number} text - The text to copy
 * @returns {Promise<boolean>} - Resolves to true if copy succeeded, false otherwise
 */
export async function copyToClipboard(text) {
  if (text === null || text === undefined) return false;
  const str = String(text).trim();
  if (!str) return false;

  // Method 1: Try modern Clipboard API if supported
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch (err) {
      // Fallback silently when iframe blocks clipboard-write
    }
  }

  // Method 2: Fallback using temporary textarea & document.execCommand('copy')
  try {
    if (typeof document === 'undefined') return false;

    const textarea = document.createElement('textarea');
    textarea.value = str;
    // Style to avoid visual flickering, scrolling, or mobile zoom
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';
    textarea.style.zIndex = '-9999';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    if (textarea && textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }

    return !!successful;
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
}

export default copyToClipboard;
