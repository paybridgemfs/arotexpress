"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Receipt, Printer, X, FileText } from 'lucide-react';
import { toBengaliNumber, formatStockDisplay } from '../utils/bengali.js';
import { printElement } from '../utils/printHelper.js';

export default function PosReceiptModal({ order, settings: initialSettings, onClose, onOpenFullInvoice }) {
  const [settings, setSettings] = useState(initialSettings || null);

  useEffect(() => {
    if (!settings) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data) setSettings(data);
        })
        .catch(() => {});
    }
  }, [settings]);

  if (!order) return null;

  const handlePrint = () => {
    printElement('printable-pos-receipt', {
      type: 'pos',
      title: `POS-${order.order_code || order.id || 'Receipt'}`
    });
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  const formattedTime = order.created_at
    ? new Date(order.created_at).toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
      case 'পেন্ডিং': return 'অপেক্ষমান (Pending)';
      case 'processing':
      case 'প্রসেসিং': return 'প্রক্রিয়াকরণ চলছে (Processing)';
      case 'shipped':
      case 'পাঠানো হয়েছে':
      case 'ডেলিভারিতে আছে': return 'ডেলিভারিতে পাঠানো হয়েছে (Shipped)';
      case 'delivered':
      case 'ডেলিভার্ড':
      case 'সম্পন্ন': return 'ডেলিভারি সম্পন্ন (Delivered)';
      case 'cancelled':
      case 'বাতিল': return 'অর্ডার বাতিল (Cancelled)';
      default: return status;
    }
  };

  // Dynamic values from database settings
  const siteName = settings?.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteTagline = settings?.site_tagline || settings?.header_subtitle || 'Arot Express — তাজা পাইকারি ও খুচরা মুদি বাজার';
  const siteAddress = settings?.site_address || settings?.footer_address || 'ঢাকা, বাংলাদেশ';
  const siteHelpline = settings?.site_helpline || '০১৭১২-৩৪৫৬৭৮';
  
  const logoType = settings?.logo_type || 'text';
  const logoTextBn = settings?.logo_text_bn || 'আ.এ';
  const logoImageUrl = settings?.logo_image_url || '';

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-container">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="pos-action-bar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} />
            <strong style={{ fontSize: '15px' }}>অর্ডার রসিদ</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onOpenFullInvoice && (
              <button
                type="button"
                className="admin-btn secondary"
                style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={onOpenFullInvoice}
                title="A4 সাইজ পূর্ণাঙ্গ ক্যাশ মেমো / ইনভয়েস দেখুন"
              >
                <FileText size={14} />
                <span>A4 ইনভয়েস</span>
              </button>
            )}
            <motion.button
              type="button"
              className="pos-print-btn"
              onClick={handlePrint}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} />
              <span>প্রিন্ট</span>
            </motion.button>
            <button
              type="button"
              className="close-modal-btn"
              onClick={onClose}
              aria-label="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Thermal Cash Memo / Receipt Paper in Scrollable Area */}
        <div className="pos-receipt-scroll-wrap">
          <div className="pos-receipt-paper" id="printable-pos-receipt">
            {/* Header - Dynamic from Database Settings */}
            <div className="pos-header">
              {logoType === 'image' && logoImageUrl ? (
                <img src={logoImageUrl} alt={siteName} style={{ height: '45px', objectFit: 'contain', margin: '0 auto 8px' }} />
              ) : (
                <div className="pos-store-stamp">{logoTextBn}</div>
              )}
              <p className="pos-store-tagline">{siteTagline}</p>
              <p className="pos-store-contact">{siteAddress} | হটলাইন: {siteHelpline}</p>
              <div className="pos-dashed-line"></div>
              <div className="pos-memo-title">*** ক্যাশ মেমো / চালান (CASH MEMO / RECEIPT) ***</div>
            </div>

            {/* Order Metadata */}
            <div className="pos-info-grid">
              <div className="pos-info-row">
                <span className="label">অর্ডার নম্বর:</span>
                <span className="val mono font-bold">{order.order_code || `#ORD-${order.id}`}</span>
              </div>
              <div className="pos-info-row">
                <span className="label">তারিখ ও সময়:</span>
                <span className="val">{formattedDate} ({formattedTime})</span>
              </div>
              <div className="pos-info-row">
                <span className="label">অর্ডার স্ট্যাটাস:</span>
                <span className="val font-semibold">{getStatusText(order.status)}</span>
              </div>
            </div>

            <div className="pos-dashed-line"></div>

            {/* Customer Information */}
            <div className="pos-customer-box">
              <div className="pos-section-title">গ্রাহকের বিবরণ:</div>
              <div className="pos-info-row">
                <span className="label">নাম:</span>
                <span className="val font-bold">{order.customer_name}</span>
              </div>
              <div className="pos-info-row">
                <span className="label">মোবাইল:</span>
                <span className="val mono font-bold">{order.customer_phone}</span>
              </div>
              {order.delivery_area && (
                <div className="pos-info-row">
                  <span className="label">এলাকা:</span>
                  <span className="val">{order.delivery_area}</span>
                </div>
              )}
              <div className="pos-info-row">
                <span className="label">ঠিকানা:</span>
                <span className="val">{order.delivery_address}</span>
              </div>
            </div>

            <div className="pos-dashed-line"></div>

            {/* Items Table */}
            <table className="pos-items-table">
              <thead>
                <tr>
                  <th style={{ width: '42%', textAlign: 'left' }}>পণ্য / আইটেম</th>
                  <th style={{ width: '18%', textAlign: 'center' }}>একক</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>পরিমাণ</th>
                  <th style={{ width: '25%', textAlign: 'right' }}>মোট (৳)</th>
                </tr>
              </thead>
              <tbody>
                {order.items_json?.map((it, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>
                        {it.productId || it.product_id ? <span style={{ color: '#666', fontSize: '11px', marginRight: '4px' }}>#{it.productId || it.product_id}</span> : null}
                        {it.brand || it.product_name || it.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#555' }}>({it.catBn || it.category_name || it.unit})</div>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '11.5px' }}>{it.unit || '—'}</td>
                    <td style={{ textAlign: 'center', fontSize: '11.5px' }}>
                      {formatStockDisplay(it.qty, it.unit)}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '12px' }}>
                      ৳{toBengaliNumber(it.price * it.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pos-dashed-line"></div>

            {/* Price Calculation */}
            <div className="pos-calc-box">
              <div className="pos-calc-row">
                <span>পণ্যের উপমোট (Subtotal):</span>
                <span className="mono">৳{toBengaliNumber(order.subtotal || (order.total_amount - (order.delivery_fee || 0)))}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="pos-calc-row" style={{ color: '#16a34a', fontWeight: 600 }}>
                  <span>প্যাকেজ ছাড় (Discount):</span>
                  <span className="mono">-৳{toBengaliNumber(order.discount_total)}</span>
                </div>
              )}
              <div className="pos-calc-row">
                <span>ডেলিভারি চার্জ (Delivery):</span>
                <span className="mono">৳{toBengaliNumber(order.delivery_fee || 0)}</span>
              </div>
              <div className="pos-calc-row total">
                <span>সর্বমোট প্রদেয় (Grand Total):</span>
                <span className="mono">৳{toBengaliNumber(order.total_amount)}</span>
              </div>
            </div>

            <div className="pos-dashed-line"></div>

            {/* Payment Details */}
            <div className="pos-payment-info">
              <div className="pos-info-row">
                <span className="label">পেমেন্ট মাধ্যম:</span>
                <span className="val font-bold" style={{ textTransform: 'uppercase' }}>
                  {order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি (COD)' : order.payment_method}
                </span>
              </div>
              {order.trx_id && (
                <div className="pos-info-row">
                  <span className="label">TrxID / ট্রানজেকশন:</span>
                  <span className="val mono font-bold">{order.trx_id}</span>
                </div>
              )}
              <div className="pos-info-row">
                <span className="label">পেমেন্ট অবস্থা:</span>
                <span className="val font-semibold">
                  {order.payment_method === 'cod' ? 'ডেলিভারির সময় নগদ প্রদেয়' : 'পরিশোধিত (Paid)'}
                </span>
              </div>
            </div>

            <div className="pos-dashed-line"></div>

            {/* Footer - Dynamic from Site Settings */}
            <div className="pos-footer">
              <p style={{ fontWeight: 600 }}>আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!</p>
              <p style={{ fontSize: '10px', marginTop: '3px', color: '#444' }}>
                পণ্য বা সার্ভিস সংক্রান্ত যে কোনো অনুসন্ধানে {siteName}-এর সাথে থাকুন।
              </p>
              <p style={{ fontSize: '9px', color: '#777', marginTop: '6px' }}>
                কম্পিউটার জেনারেটেড ডিজিটাল রসিদ — কোনো স্বাক্ষরের প্রয়োজন নেই।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
