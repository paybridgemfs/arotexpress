/**
 * Standalone High-Precision Print Engine for Web & POS
 * Extracts target printable HTML and executes print inside an isolated, clean iframe
 * with dedicated zero-overflow CSS. Eliminates blank pages, layout breaking,
 * and background SPA DOM clutter completely.
 */

export function printElement(elementOrId, options = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const {
    type = 'a4', // 'a4' | 'pos' | 'landscape'
    title = document.title || 'Print Document',
    customCss = ''
  } = options;

  let targetEl = null;
  if (typeof elementOrId === 'string') {
    targetEl = document.getElementById(elementOrId);
  } else if (elementOrId instanceof HTMLElement) {
    targetEl = elementOrId;
  }

  if (!targetEl) {
    console.warn('[PrintHelper] Target element not found:', elementOrId);
    window.print();
    return;
  }

  // Clone element to prevent mutating live React state
  const clone = targetEl.cloneNode(true);

  // Remove buttons, toolbars, and non-printable elements from the clone
  const noPrintElements = clone.querySelectorAll('.no-print, button, .admin-modal-header, .admin-modal-footer, input[type="file"]');
  noPrintElements.forEach((el) => el.remove());

  // Remove any previously existing print iframe
  let iframe = document.getElementById('__arot_print_frame__');
  if (iframe) {
    iframe.remove();
  }

  // Create clean, hidden iframe
  iframe = document.createElement('iframe');
  iframe.id = '__arot_print_frame__';
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    console.warn('[PrintHelper] Cannot access iframe document, falling back to window.print()');
    window.print();
    return;
  }

  const isPos = type === 'pos';
  const isLandscape = type === 'landscape';

  const baseCss = `
    @import url('https://fonts.googleapis.com/css2?family=Dosis:wght@400;500;600;700;800&family=Noto+Serif+Bengali:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: ${isPos ? '78mm auto' : isLandscape ? 'A4 landscape' : 'A4 portrait'};
      margin: ${isPos ? '3mm 2mm' : '8mm 8mm'};
    }

    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      color: #111827 !important;
      font-family: 'Dosis', 'Noto Serif Bengali', serif !important;
      font-size: ${isPos ? '9pt' : '10pt'};
      line-height: ${isPos ? '1.35' : '1.4'};
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      -webkit-font-smoothing: antialiased;
    }

    .mono {
      font-family: 'Dosis', 'Noto Serif Bengali', serif !important;
      font-variant-numeric: tabular-nums;
    }

    /* Common Table Styling for Crystal Clear Prints */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
      margin-top: 4px !important;
      margin-bottom: 8px !important;
    }

    th, td {
      border-color: #D1D5DB !important;
      word-break: break-word !important;
      vertical-align: middle !important;
    }

    thead {
      display: table-header-group !important;
    }

    tfoot {
      display: table-footer-group !important;
    }

    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* ------------------------------------------- */
    /* 1. POS Thermal Receipt (78mm Width)        */
    /* ------------------------------------------- */
    ${isPos ? `
      body {
        width: 76mm !important;
        max-width: 76mm !important;
        margin: 0 auto !important;
        padding: 1mm !important;
      }
      .pos-receipt-paper, #printable-pos-receipt {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
      .pos-items-table {
        width: 100% !important;
        font-size: 8.5pt !important;
      }
      .pos-items-table th, .pos-items-table td {
        padding: 3px 1px !important;
        border-bottom: 1px dashed #999 !important;
      }
      .pos-dashed-line {
        border-top: 1px dashed #111 !important;
        margin: 6px 0 !important;
      }
      .pos-customer-box, .pos-calc-box, .pos-payment-info {
        background: #F9FAFB !important;
        border: 1px solid #E5E7EB !important;
        padding: 6px 8px !important;
        border-radius: 4px !important;
        margin-bottom: 6px !important;
      }
    ` : `
      /* ------------------------------------------- */
      /* 2. Full A4 / Landscape Business Documents  */
      /* ------------------------------------------- */
      body {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
      }
      .invoice-print-area, #printable-customer-invoice, #printable-report-sheet, .printable-report-area {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
      th {
        background-color: #F8FAFC !important;
        font-weight: 700 !important;
      }
    `}

    /* Anti-Cutoff & Page Break Guard Rules */
    tr, th, td, img, svg, canvas, figure,
    .pos-calc-box, .pos-payment-info, .pos-footer, .pos-customer-box,
    .signature-block, .report-stat-card, .report-chart-box {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    ${customCss}
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>${baseCss}</style>
      </head>
      <body>
        ${clone.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Allow layout and web fonts to settle, then invoke clean print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('[PrintHelper] Iframe print exception, fallback to window.print():', err);
      window.print();
    }
  }, 220);
}
