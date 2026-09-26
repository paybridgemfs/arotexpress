"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  PhoneCall,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Printer,
  X,
  RefreshCw,
  User,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { usePackageBox } from '../context/PackageBoxContext.jsx';
import { useStoreData } from '../context/StoreDataContext';
import { toBengaliNumber } from '../utils/bengali.js';
import CustomerInvoiceModal from './CustomerInvoiceModal.jsx';

function safeFormatDate(dateVal) {
  try {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
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

export default function OrderTrackingModal({ initialOrderCode = '', initialOrder = null, settings, onClose }) {
  const cartContext = useCart() || {};
  const { replaceCartWithOrder, setIsCartOpen, showToast } = cartContext;

  const packageBoxContext = usePackageBox() || {};
  const { loadPackageOrderItems } = packageBoxContext;

  const storeDataContext = useStoreData() || {};
  const { packageProducts = [], settings: contextSettings } = storeDataContext;

  const effectiveSettings = settings || contextSettings;

  const [orderCode, setOrderCode] = useState(initialOrderCode || (initialOrder ? initialOrder.order_code : ''));
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setOrderCode(initialOrder.order_code || '');
    } else if (initialOrderCode) {
      setOrderCode(initialOrderCode);
      fetchOrder(initialOrderCode);
    }
  }, [initialOrderCode, initialOrder]);

  const fetchOrder = async (codeToFetch) => {
    const code = (codeToFetch || orderCode || '').trim();
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const headers = {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('arot_express_token') : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/orders/track/${encodeURIComponent(code)}`, { headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'অর্ডারটি খুঁজে পাওয়া যায়নি');
      }
      setOrder(data);
    } catch (err) {
      setError(err?.message || 'অর্ডার ট্র্যাক করতে ত্রুটি হয়েছে');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!orderCode.trim()) {
      setError('দয়া করে অর্ডার কোড লিখুন (যেমন: AE-123456)');
      return;
    }
    fetchOrder(orderCode);
  };

  // 1-Click Reorder Function
  const handleReorder = async () => {
    if (!order) return;
    let items = order.items_json;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      if (showToast) showToast('অর্ডারে কোনো পণ্য পাওয়া যায়নি');
      return;
    }

    setReordering(true);
    const isPackage = Boolean(
      order.is_package_order ||
      order.is_package ||
      order.isPackage ||
      (order.order_code && order.order_code.startsWith('PK-'))
    );

    if (isPackage && typeof loadPackageOrderItems === 'function') {
      await loadPackageOrderItems(items, packageProducts);
      if (showToast) showToast('প্যাকেজ পণ্যগুলো সফলভাবে প্যাকেজ বক্সে যোগ করা হয়েছে!');
      if (onClose) onClose();
      setTimeout(() => {
        const el = document.getElementById('hero-package-box');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    } else if (typeof replaceCartWithOrder === 'function') {
      replaceCartWithOrder(items);
      if (onClose) onClose();
    }
    setReordering(false);
  };

  const getStepIndex = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'pending' || s === 'পেন্ডিং') return 0;
    if (s === 'processing' || s === 'প্রসেসিং') return 1;
    if (s === 'shipped' || s === 'পাঠানো হয়েছে' || s === 'ডেলিভারিতে আছে' || s === 'অন-ডেলিভারি' || s === 'অন-ওয়ে') return 2;
    if (s === 'delivered' || s === 'ডেলিভার্ড' || s === 'সম্পন্ন') return 3;
    if (s === 'cancelled' || s === 'বাতিল') return -1;
    return 0;
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order && (order.status === 'cancelled' || order.status === 'বাতিল');
  const isPackageOrder = order && (order.is_package_order || (order.order_code && order.order_code.startsWith('PK-')));

  const steps = [
    { title: 'অর্ডার গৃহীত', desc: 'অর্ডার নিশ্চিত হয়েছে', icon: Clock },
    { title: 'প্রসেসিং চলছে', desc: 'প্যাকেজিং ও প্রস্তুতি', icon: Package },
    { title: 'অন-ওয়ে (Shipped)', desc: 'ডেলিভারিম্যানের কাছে হস্তান্তর', icon: Truck },
    { title: 'ডেলিভার্ড সম্পন্ন', desc: 'সফলভাবে হস্তান্তর', icon: CheckCircle2 }
  ];

  return (
    <>
      <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
        <motion.div
          className="admin-modal-card"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{ maxWidth: '640px', width: '95%' }}
        >
          {/* Header */}
          <div className="admin-modal-header">
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15.5px' }}>
              <Truck size={18} color="var(--green, #006C4C)" />
              <span>লাইভ অর্ডার ট্র্যাকিং ও ডেলিভারি স্ট্যাটাস</span>
            </h4>
            <button
              type="button"
              className="close-modal-btn"
              onClick={onClose}
              aria-label="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>

          <div className="admin-modal-body" style={{ padding: '20px' }}>
            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                অর্ডার কোড দিয়ে খুঁজুন:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted, #999)' }} />
                  <input
                    type="text"
                    placeholder="যেমন: AE-123456"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)', background: '#F8FAF9' }}
                  />
                </div>
                <motion.button
                  type="submit"
                  className="admin-btn"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', borderRadius: '8px', padding: '9px 16px' }}
                >
                  {loading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                  <span>ট্র্যাক করুন</span>
                </motion.button>
              </div>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: '#ffeded', border: '1px solid #FECDD3', color: 'var(--danger, #dc2626)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            {order && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* Order Summary Header Box */}
                <div style={{ background: '#F8FAF9', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--rule, #e5e0d8)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--muted, #666)', textTransform: 'uppercase', fontWeight: 600 }}>Order Code</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div className="mono" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink, #1f2937)' }}>
                          {order.order_code || `#ORD-${order.id}`}
                        </div>
                        {isPackageOrder && (
                          <span style={{ fontSize: '11px', fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Package size={12} />
                            <span>প্যাকেজ অফার অর্ডার</span>
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted, #666)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>তারিখ: {safeFormatDate(order.created_at)}</span>
                        {safeFormatTime(order.created_at) && (
                          <>
                            <span>·</span>
                            <span className="mono">{safeFormatTime(order.created_at)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--muted, #666)', fontWeight: 600 }}>সর্বমোট বিল</div>
                      <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green, #006C4C)' }}>
                        ৳{toBengaliNumber(order.total_amount || 0)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink, #374151)' }}>
                        পেমেন্ট: <strong>{order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : order.payment_method}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Stepper */}
                <div style={{ margin: '20px 0', padding: '0 4px' }}>
                  <h5 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 700, color: 'var(--ink, #1f2937)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={16} color="var(--green, #006C4C)" />
                    <span>ডেলিভারি অগ্রগতি (Live Timeline)</span>
                  </h5>

                  {isCancelled ? (
                    <div style={{ background: '#ffeded', padding: '12px', borderRadius: '8px', border: '1px solid #FECDD3', textAlign: 'center', color: 'var(--danger, #dc2626)', fontSize: '13px' }}>
                      <strong>অর্ডারটি বাতিল করা হয়েছে</strong>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                      {steps.map((step, idx) => {
                        const IconComponent = step.icon;
                        const isDone = idx <= currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                          <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: isDone ? 'var(--green, #006C4C)' : '#F1F5F3',
                                color: isDone ? '#fff' : 'var(--muted, #999)',
                                border: isCurrent ? '2px solid var(--green, #006C4C)' : (isDone ? 'none' : '1px solid var(--rule, #e5e0d8)'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                margin: '0 auto 6px auto',
                                transition: 'all 0.3s ease',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(0, 108, 76, 0.15)' : 'none'
                              }}
                            >
                              <IconComponent size={16} style={{ margin: 'auto' }} />
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : (isDone ? 600 : 400), color: isDone ? 'var(--ink, #1f2937)' : 'var(--muted, #888)', lineHeight: 1.3 }}>
                              {step.title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Delivery Rider Notification Card (If Shipped or Rider Assigned) */}
                {order.delivery_rider_name && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      margin: '18px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                          অর্ডারের ডেলিভারিম্যান
                        </div>
                        <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#14532d' }}>
                          {order.delivery_rider_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1px' }}>
                          <span>বাহন: <strong>{order.delivery_rider_vehicle || 'মোটরসাইকেল'}</strong></span>
                          {order.delivery_rider_phone && (
                            <span className="mono font-bold">({order.delivery_rider_phone})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {order.delivery_rider_phone && (
                      <motion.a
                        href={`tel:${order.delivery_rider_phone}`}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                          background: 'var(--green, #006C4C)',
                          color: '#fff',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          textDecoration: 'none'
                        }}
                      >
                        <PhoneCall size={13} />
                        <span>কল দিন</span>
                      </motion.a>
                    )}
                  </motion.div>
                )}

                {/* Delivery Address & Customer Info */}
                <div style={{ background: '#F8FAF9', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)', marginBottom: '16px', fontSize: '12.5px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink, #1f2937)', marginBottom: '3px' }}>
                    গ্রাহক: {order.customer_name} ({order.customer_phone})
                  </div>
                  <div style={{ color: 'var(--muted, #555)', lineHeight: 1.4 }}>
                    <strong>ডেলিভারি ঠিকানা:</strong> {order.delivery_address} {order.delivery_area ? `(${order.delivery_area})` : ''}
                  </div>
                </div>

                {/* Action Buttons: 1-Click Reorder & Cash Memo Invoice */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--rule, #e5e0d8)' }}>
                  <motion.button
                    type="button"
                    className="admin-btn"
                    onClick={handleReorder}
                    disabled={reordering}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ flex: '1 1 180px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', fontSize: '13px', borderRadius: '8px' }}
                  >
                    <ShoppingBag size={15} />
                    <span>পুনরায় অর্ডার (Re-order)</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setShowInvoice(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ flex: '1 1 160px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', fontSize: '13px', borderRadius: '8px' }}
                  >
                    <Printer size={15} />
                    <span>ক্যাশ মেমো / ইনভয়েস</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="admin-modal-footer" style={{ background: '#fcfbf9' }}>
            <button
              type="button"
              className="admin-btn secondary"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              বন্ধ করুন
            </button>
          </div>
        </motion.div>
      </div>

      {/* Invoice / Cash Memo Popup */}
      <AnimatePresence>
        {showInvoice && order && (
          <CustomerInvoiceModal
            order={order}
            settings={effectiveSettings}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
