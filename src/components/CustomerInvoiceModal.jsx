"use client";
import React from 'react';
import { motion } from 'motion/react';
import { X, Printer, Download, CheckCircle2, Phone, MapPin, Building2, Calendar, Clock, CreditCard, Banknote, Truck, User } from 'lucide-react';
import { useStoreData } from '../context/StoreDataContext';
import { toBengaliNumber, formatStockDisplay } from '../utils/bengali.js';
import { printElement } from '../utils/printHelper.js';

function safeFormatDate(dateVal) {
  try {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

function safeFormatTime(dateVal) {
  try {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

export default function CustomerInvoiceModal({ isOpen = true, order, settings: propSettings, onClose }) {
  if (isOpen === false || !order) return null;

  const storeData = useStoreData();
  const settings = propSettings || storeData?.settings || {};

  const siteName = settings?.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteTagline = settings?.site_tagline || 'Arot Express — তাজা পাইকারি ও খুচরা মুদি বাজার';
  const siteHelpline = settings?.site_helpline || '০১৭১২-৩৪৫৬৭৮';
  const siteAddress = settings?.site_address || 'ঢাকা, বাংলাদেশ';
  
  const logoImageUrl = settings?.logo_image_url || '';
  const logoTextEn = settings?.logo_text_en || 'AE';

  let items = [];
  try {
    items = Array.isArray(order.items_json)
      ? order.items_json
      : (typeof order.items_json === 'string' ? JSON.parse(order.items_json) : []);
  } catch (e) {
    items = [];
  }

  const subtotal = order.subtotal || (order.total_amount - (order.delivery_fee || 0));
  const deliveryFee = order.delivery_fee || 0;
  const totalAmount = order.total_amount || (subtotal + deliveryFee);

  const handlePrint = () => {
    printElement('printable-customer-invoice', {
      type: 'a4',
      title: `Invoice-${order.order_code || order.id || 'Order'}`
    });
  };

  const getStatusBn = (status) => {
    switch (status) {
      case 'pending':
      case 'পেন্ডিং':
        return 'পেন্ডিং (অপেক্ষারত)';
      case 'processing':
      case 'প্রসেসিং':
        return 'প্রসেসিং চলছে';
      case 'shipped':
      case 'পাঠানো হয়েছে':
        return 'ডেলিভারিতে অন-ওয়ে';
      case 'delivered':
      case 'ডেলিভার্ড':
      case 'সম্পন্ন':
        return 'সফলভাবে ডেলিভার্ড';
      case 'cancelled':
      case 'বাতিল':
        return 'বাতিলকৃত';
      default:
        return status;
    }
  };

  return (
    <div
      className="admin-modal-overlay invoice-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <motion.div
        className="admin-modal-card invoice-modal-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ maxWidth: '680px', width: '95%' }}
      >
        {/* Modal Action Bar (Hidden in print) */}
        <div className="admin-modal-header no-print">
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
            <CheckCircle2 size={18} color="var(--green-dim)" />
            <span>কাস্টমার ক্যাশ মেমো / ইনভয়েস</span>
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.button
              type="button"
              className="admin-btn"
              onClick={handlePrint}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px' }}
            >
              <Printer size={15} />
              <span>প্রিন্ট / PDF সেভ</span>
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

        {/* Modal Scrollable Body */}
        <div className="admin-modal-body" style={{ padding: 0 }}>
          {/* Printable Cash Memo Area */}
          <div 
            className="invoice-print-area" 
            id="printable-customer-invoice"
            style={{ padding: '20px 24px', background: '#fff', color: '#111827', fontFamily: 'inherit' }}
          >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111827', paddingBottom: '12px', gap: '14px' }}>
            <div>
              {logoImageUrl ? (
                <div style={{ marginBottom: '6px' }}>
                  <img
                    src={logoImageUrl}
                    alt={siteName}
                    style={{
                      maxHeight: '48px',
                      maxWidth: '220px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>{siteTagline}</div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, borderRadius: '4px', fontSize: '15px' }}>
                    {logoTextEn}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#111827' }}>{siteName}</h2>
                    <div style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '1px' }}>{siteTagline}</div>
                  </div>
                </div>
              )}
              <div style={{ fontSize: '11.5px', color: '#4b5563', marginTop: '5px', lineHeight: 1.35 }}>
                <div>ঠিকানা: {siteAddress}</div>
                <div>হেল্পলাইন: <strong className="mono">{siteHelpline}</strong></div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', background: '#111827', color: '#fff', padding: '3px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ক্যাশ মেমো / ইনভয়েস
              </div>
              <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginTop: '4px' }}>
                {order.order_code || `#ORD-${order.id}`}
              </div>
              <div style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '2px' }}>
                তারিখ: {safeFormatDate(order.created_at)}
              </div>
              {safeFormatTime(order.created_at) && (
                <div style={{ fontSize: '11.5px', color: '#6b7280' }}>
                  সময়: <span className="mono">{safeFormatTime(order.created_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer & Delivery Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ background: '#f9fafb', padding: '10px 12px', borderRadius: '4px', border: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                গ্রাহকের তথ্য
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{order.customer_name}</div>
              <div className="mono" style={{ fontSize: '12.5px', color: '#374151', marginTop: '2px' }}>
                মোবাইল: <strong>{order.customer_phone}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '3px', lineHeight: 1.35 }}>
                <strong>ঠিকানা:</strong> {order.delivery_address}
                {order.delivery_area && <span> ({order.delivery_area})</span>}
              </div>
            </div>

            <div style={{ background: '#f9fafb', padding: '10px 12px', borderRadius: '4px', border: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                অর্ডার ও ডেলিভারি স্ট্যাটাস
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px' }}>
                <span style={{ color: '#6b7280' }}>অর্ডার স্ট্যাটাস:</span>
                <span style={{ fontWeight: 700, color: order.status === 'delivered' ? '#059669' : '#111827' }}>
                  {getStatusBn(order.status)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px' }}>
                <span style={{ color: '#6b7280' }}>পেমেন্ট মাধ্যম:</span>
                <span style={{ fontWeight: 600 }}>
                  {order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি (COD)' : order.payment_method}
                </span>
              </div>
              {order.trx_id && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ color: '#6b7280' }}>TrxID:</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#2563eb' }}>{order.trx_id}</span>
                </div>
              )}
              {order.delivery_rider_name && (
                <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #d1d5db', fontSize: '12px' }}>
                  <span style={{ color: '#6b7280' }}>ডেলিভারিম্যান: </span>
                  <strong>{order.delivery_rider_name}</strong>
                  {order.delivery_rider_phone && <span className="mono"> ({order.delivery_rider_phone})</span>}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div style={{ margin: '12px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: '8%', color: '#374151' }}>ক্রম</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', width: '46%', color: '#374151' }}>পণ্যের বিবরণ</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: '16%', color: '#374151' }}>পরিমাণ</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: '15%', color: '#374151' }}>একক দর</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: '15%', color: '#374151' }}>মোট টাকা</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td className="mono" style={{ padding: '7px 8px', textAlign: 'center', color: '#6b7280' }}>
                      {toBengaliNumber(idx + 1)}
                    </td>
                    <td style={{ padding: '7px 8px' }}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{it.brand || it.product_name || it.name}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                        {(it.catBn || it.category_name ? `${it.catBn || it.category_name} · ` : '') + (it.unit || '')}
                      </div>
                    </td>
                    <td className="mono" style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 600 }}>
                      {formatStockDisplay(it.qty, it.unit)}
                    </td>
                    <td className="mono" style={{ padding: '7px 8px', textAlign: 'right', color: '#4b5563' }}>
                      ৳{toBengaliNumber(it.price)}
                    </td>
                    <td className="mono" style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                      ৳{toBengaliNumber(it.price * it.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Notes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginTop: '12px' }}>
            <div style={{ flex: '1 1 240px', fontSize: '11.5px', color: '#6b7280', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: '3px' }}>বিশেষ দ্রষ্টব্য:</div>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                <li>ডেলিভারিম্যানের উপস্থিতিতে পণ্য ও মেমো চেক করে নিন।</li>
                <li>যেকোনো প্রয়োজনে আমাদের হেল্পলাইন নম্বরে যোগাযোগ করুন।</li>
                <li>{siteName}-এর সাথে কেনাকাটা করার জন্য ধন্যবাদ!</li>
              </ul>
            </div>

            <div style={{ flex: '0 0 230px', background: '#f9fafb', padding: '10px 12px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                <span style={{ color: '#6b7280' }}>পণ্যের মূল্য:</span>
                <span className="mono font-bold">৳{toBengaliNumber(subtotal)}</span>
              </div>
              {order.discount_total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px', color: '#16a34a' }}>
                  <span>প্যাকেজ ছাড়:</span>
                  <span className="mono font-bold">-৳{toBengaliNumber(order.discount_total)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                <span style={{ color: '#6b7280' }}>ডেলিভারি চার্জ:</span>
                <span className="mono font-bold">৳{toBengaliNumber(deliveryFee)}</span>
              </div>
              <div style={{ borderTop: '2px solid #111827', margin: '6px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800 }}>
                <span>সর্বমোট প্রদেয়:</span>
                <span className="mono" style={{ color: '#dc2626' }}>৳{toBengaliNumber(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Signature Lines */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '22px', paddingTop: '14px', borderTop: '1px dashed #d1d5db', fontSize: '11.5px', color: '#6b7280' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '130px', borderTop: '1px solid #9ca3af', marginBottom: '4px' }}></div>
              <span>গ্রাহকের স্বাক্ষর</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '130px', borderTop: '1px solid #9ca3af', marginBottom: '4px' }}></div>
              <span>অনুমোদিত স্বাক্ষর ({siteName})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Bottom Close Button (No print) */}
      <div className="admin-modal-footer no-print">
          <button
            type="button"
            className="admin-btn secondary"
            onClick={onClose}
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={handlePrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} />
            <span>প্রিন্ট / PDF সেভ</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
