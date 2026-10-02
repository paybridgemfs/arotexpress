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
  RefreshCw,
  User,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ReceiptText,
  BadgeAlert,
  ArrowLeft,
  Lock,
  LogIn,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { usePackageBox } from '../context/PackageBoxContext.jsx';
import { useStoreData } from '../context/StoreDataContext';
import { toBengaliNumber } from '../utils/bengali.js';
import CustomerInvoiceModal from './CustomerInvoiceModal.jsx';

function safeFormatDate(dateVal: any) {
  try {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

function safeFormatTime(dateVal: any) {
  try {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

export default function OrderTrackingPageView({ initialOrderCode = '' }: { initialOrderCode?: string }) {
  const { user, token, adminToken, openAuthModal } = useAuth();
  const { replaceCartWithOrder, showToast } = useCart();
  const { loadPackageOrderItems } = usePackageBox();
  const { packageProducts = [], settings } = useStoreData();

  const [orderId, setOrderId] = useState(initialOrderCode || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [searchMode, setSearchMode] = useState<'code' | 'my_orders'>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (!user) {
      setPhone('');
      setOrderList([]);
      setOrder((prev: any) => (prev && !prev.is_masked ? null : prev));
    } else if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (initialOrderCode) {
      setOrderId(initialOrderCode);
      handleTrack(initialOrderCode, '');
    }
  }, [initialOrderCode]);

  const handleTrack = async (targetOrderId?: string, targetPhone?: string) => {
    const oid = (targetOrderId !== undefined ? targetOrderId : orderId).trim();
    const ph = (targetPhone !== undefined ? targetPhone : (user ? (user.phone || phone) : '')).trim();

    if (!oid && !ph) {
      setError(user ? 'অনুগ্রহ করে অর্ডার কোড দিন অথবা আপনার সব অর্ডার দেখুন।' : 'অনুগ্রহ করে আপনার অর্ডারের কোড প্রদান করুন (যেমন: AE-123456)।');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);
    setOrderList([]);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      // Strictly attach authorization header ONLY if an account is actively logged in
      const activeAuthToken = user ? token : (adminToken || null);

      if (activeAuthToken) {
        headers['Authorization'] = `Bearer ${activeAuthToken}`;
      }

      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: oid || undefined,
          phone: ph || undefined
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.requiresAuth) {
          setError(data.error || 'এই সুবিধাটি পেতে অনুগ্রহ করে লগইন করুন।');
          openAuthModal('login');
          return;
        }
        throw new Error(data.error || 'অর্ডারটি ট্র্যাক করা সম্ভব হয়নি।');
      }

      if (data.multiple && Array.isArray(data.orders)) {
        setOrderList(data.orders);
      } else if (data.order) {
        setOrder(data.order);
      } else {
        throw new Error('কোনো অর্ডারের তথ্য পাওয়া যায়নি');
      }
    } catch (err: any) {
      setError(err?.message || 'অর্ডার ট্র্যাক করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchMyOrders = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setOrderId('');
    handleTrack('', user.phone);
  };

  const handleSelectFromList = (selectedCode: string) => {
    setOrderId(selectedCode);
    handleTrack(selectedCode, user?.phone || '');
  };

  const handleReorder = async () => {
    if (!order) return;
    if (order.is_masked) {
      showToast('পুনরায় অর্ডার করতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন');
      openAuthModal('login');
      return;
    }

    let items = order.items_json;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      showToast('অর্ডারে কোনো পণ্য পাওয়া যায়নি');
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
      showToast('প্যাকেজ পণ্যগুলো সফলভাবে প্যাকেজ বক্সে যোগ করা হয়েছে!');
    } else if (typeof replaceCartWithOrder === 'function') {
      replaceCartWithOrder(items);
      showToast('পণ্যগুলো কার্টে যোগ করা হয়েছে!');
    }
    setReordering(false);
  };

  const getStepIndex = (status: string) => {
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
    { title: 'অর্ডার গৃহীত', desc: 'সিস্টেমে নিশ্চিত হয়েছে', icon: Clock },
    { title: 'প্রসেসিং ও প্যাকিং', desc: 'ফ্রেশ পণ্য বাছাই ও প্রস্তুত', icon: Package },
    { title: 'অন-ওয়ে (Shipped)', desc: 'রাইডারের মাধ্যমে প্রেরিত', icon: Truck },
    { title: 'ডেলিভার্ড সম্পন্ন', desc: 'দোরগোড়ায় সফল হস্তান্তর', icon: CheckCircle2 }
  ];

  const parsedItems = order ? (typeof order.items_json === 'string' ? JSON.parse(order.items_json || '[]') : (order.items_json || [])) : [];

  return (
    <div style={{ width: '100%', minHeight: '80vh', padding: '30px 16px 60px' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        
        {/* Page Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#DCFCE7',
              color: '#15803D',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '10px'
            }}
          >
            <Truck size={15} />
            <span>লাইভ পার্সেল ও ডেলিভারি ট্র্যাকিং</span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--ink, #1F2937)', margin: '0 0 8px' }}>
            আপনার অর্ডারের বর্তমান অবস্থা জানুন
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted, #64748B)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.5 }}>
            অর্ডার কোড দিয়ে যে কোনো পার্সেলের লাইভ ডেলিভারি স্ট্যাটাস ও রাইডারের ফোন নম্বর দেখুন।
          </p>
        </div>

        {/* Search Input Box */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#FFFFFF',
            border: '1.5px solid var(--rule, #E2E8F0)',
            borderRadius: '16px',
            padding: '24px 20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            marginBottom: '26px'
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: user ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--ink, #1F2937)', marginBottom: '6px' }}>
                  অর্ডার কোড / আইডি:
                </label>
                <div style={{ position: 'relative' }}>
                  <Package size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted, #94A3B8)' }} />
                  <input
                    type="text"
                    placeholder="যেমন: AE-123456 বা PK-123456"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 36px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC',
                      color: 'var(--ink)'
                    }}
                  />
                </div>
              </div>

              {/* Phone Field ONLY visible if user is logged in to ensure user order privacy */}
              {user && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink, #1F2937)' }}>
                      আমার অ্যাকাউন্ট নম্বর:
                    </label>
                    <span style={{ fontSize: '11.5px', color: 'var(--green)', fontWeight: 700 }}>লগইন আছেন</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted, #94A3B8)' }} />
                    <input
                      type="tel"
                      value={user.phone}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 36px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#F1F5F9',
                        color: 'var(--ink)',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Privacy & Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              {!user ? (
                <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} color="#64748B" />
                  <span>
                    ব্যক্তিগত তথ্যের সুরক্ষার্থে লগইন ছাড়া পণ্যের বিস্তারিত নাম ও পূর্ণাঙ্গ নম্বর গোপন (Mask) থাকবে।{' '}
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      style={{ color: 'var(--green)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      লগইন করুন
                    </button>
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleFetchMyOrders}
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      color: 'var(--ink)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <User size={14} />
                    <span>আমার সব অর্ডার দেখুন</span>
                  </button>
                </div>
              )}

              <motion.button
                type="submit"
                className="cta"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'var(--green, #006C4C)',
                  color: '#ffffff',
                  boxShadow: 'var(--shadow-green)'
                }}
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                <span>{loading ? 'অনুসন্ধান চলছে...' : 'অর্ডার ট্র্যাক করুন'}</span>
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECDD3',
              color: '#DC2626',
              padding: '14px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)'
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span style={{ lineHeight: 1.4 }}>{error}</span>
          </motion.div>
        )}

        {/* Multiple Orders Found for User */}
        {orderList.length > 0 && !order && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--rule, #E2E8F0)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                আপনার অ্যাকাউন্টে {toBengaliNumber(orderList.length)}টি অর্ডার রয়েছে:
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>যে কোনো অর্ডারে ক্লিক করে লাইভ ট্র্যাক করুন</span>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {orderList.map((ord) => (
                <div
                  key={ord.id || ord.order_code}
                  onClick={() => handleSelectFromList(ord.order_code)}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--green)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink)' }}>
                        {ord.order_code}
                      </span>
                      {ord.is_package_order && (
                        <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '10.5px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>
                          প্যাকেজ
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>
                      তারিখ: {safeFormatDate(ord.created_at)} · {toBengaliNumber(ord.items_count || 0)}টি আইটেম · এলাকা: {ord.delivery_area || 'ঢাকা'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--green)' }}>
                        ৳{toBengaliNumber(ord.total_amount || 0)}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: ord.status === 'delivered' || ord.status === 'ডেলিভার্ড' ? '#DCFCE7' : '#FEF3C7',
                          color: ord.status === 'delivered' || ord.status === 'ডেলিভার্ড' ? '#166534' : '#92400E'
                        }}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <ChevronRight size={18} color="var(--muted)" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detailed Real-Time Tracking View */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header Summary Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid var(--rule, #E2E8F0)',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '20px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
              }}
            >
              {/* Privacy Warning Banner if Masked */}
              {order.is_masked && (
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#92400E'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <EyeOff size={15} />
                    <span>ব্যক্তিগত গোপনীয়তা রক্ষায় নাম, ফোন নম্বর ও পণ্য তালিকা আংশিক মাস্ক করা রয়েছে।</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    style={{ background: 'none', border: 'none', color: '#B45309', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    লগইন করুন →
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    অর্ডার কোড
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                    <span className="mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
                      {order.order_code || `#ORD-${order.id}`}
                    </span>
                    {isPackageOrder && (
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={12} /> প্যাকেজ অফার
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    <span>অর্ডারের সময়: {safeFormatDate(order.created_at)}</span>
                    {safeFormatTime(order.created_at) && (
                      <>
                        <span>•</span>
                        <span className="mono">{safeFormatTime(order.created_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700 }}>সর্বমোট মূল্য</div>
                  <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--green)' }}>
                    ৳{toBengaliNumber(order.total_amount || 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink)' }}>
                    পেমেন্ট: <strong>{order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : order.payment_method}</strong>
                  </div>
                </div>
              </div>

              {/* Progress Stepper */}
              <div style={{ marginTop: '26px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={17} color="var(--green)" />
                    <span>ডেলিভারি অগ্রগতি (Live Shipment Timeline)</span>
                  </h4>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: isCancelled ? '#FEE2E2' : (currentStep === 3 ? '#DCFCE7' : '#FEF3C7'),
                      color: isCancelled ? '#991B1B' : (currentStep === 3 ? '#166534' : '#92400E')
                    }}
                  >
                    বর্তমান অবস্থা: {order.status}
                  </span>
                </div>

                {isCancelled ? (
                  <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '10px', border: '1px solid #FECDD3', textAlign: 'center', color: '#DC2626' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>⚠️ অর্ডারটি বাতিল করা হয়েছে</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>বিস্তারিত তথ্যের জন্য হেল্পলাইনে যোগাযোগ করুন।</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', position: 'relative' }}>
                    {steps.map((step, idx) => {
                      const IconComponent = step.icon;
                      const isDone = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: isDone ? 'var(--green, #006C4C)' : '#F1F5F3',
                              color: isDone ? '#fff' : 'var(--muted, #94A3B8)',
                              border: isCurrent ? '2.5px solid var(--green, #006C4C)' : (isDone ? 'none' : '1px solid #CBD5E1'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 8px auto',
                              transition: 'all 0.3s ease',
                              boxShadow: isCurrent ? '0 0 0 5px rgba(0, 108, 76, 0.18)' : 'none'
                            }}
                          >
                            <IconComponent size={18} />
                          </div>
                          <div style={{ fontSize: '12.5px', fontWeight: isCurrent ? 800 : (isDone ? 700 : 500), color: isDone ? 'var(--ink)' : 'var(--muted)', lineHeight: 1.25 }}>
                            {step.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Rider Notification Banner (If assigned) */}
            {order.delivery_rider_name && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #BBF7D0',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 800, textTransform: 'uppercase' }}>
                      অর্ডারের ডেলিভারিম্যান
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#14532D' }}>
                      {order.delivery_rider_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
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
                      color: '#ffffff',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    <PhoneCall size={15} />
                    <span>রাইডারকে কল দিন</span>
                  </motion.a>
                )}
              </motion.div>
            )}

            {/* Delivery Address & Customer Information */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--rule, #E2E8F0)',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '20px'
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="var(--green)" />
                  <span>ডেলিভারি ঠিকানা ও গ্রাহক তথ্য</span>
                </div>
                {order.is_masked && (
                  <span style={{ fontSize: '11.5px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> সুরক্ষিত (তথ্য লুকানো)
                  </span>
                )}
              </h4>

              {order.is_masked ? (
                /* Blurred Privacy Container - Real data NEVER exists here or in response */
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', padding: '14px', background: '#F8FAFC', border: '1px dashed #CBD5E1' }}>
                  {/* Dummy placeholder blurred text (Zero actual user info) */}
                  <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.5 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                      <div><span style={{ color: 'var(--muted)' }}>গ্রাহকের নাম:</span> <strong>মুহাম্মদ আবদুল্লাহ</strong></div>
                      <div><span style={{ color: 'var(--muted)' }}>মোবাইল নম্বর:</span> <strong className="mono">০১৭xxxxxxxx</strong></div>
                      <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--muted)' }}>পূর্ণ ঠিকানা:</span> <strong>রোড ১২, সেক্টর ৪, উত্তরা, ঢাকা</strong></div>
                    </div>
                  </div>

                  {/* Overlay Lock Badge */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.82)',
                    backdropFilter: 'blur(2px)',
                    padding: '10px',
                    textAlign: 'center',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontWeight: 700, fontSize: '13px' }}>
                      <Lock size={15} />
                      <span>ব্যক্তিগত গোপনীয়তার স্বার্থে গ্রাহকের নাম ও ঠিকানা সুরক্ষিত রাখা হয়েছে</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      style={{
                        background: 'var(--green, #006C4C)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <LogIn size={13} />
                      <span>তথ্য দেখতে অ্যাকাউন্টে লগইন করুন</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>গ্রাহকের নাম:</span>{' '}
                    <strong style={{ color: 'var(--ink)' }}>{order.customer_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>মোবাইল নম্বর:</span>{' '}
                    <strong className="mono" style={{ color: 'var(--ink)' }}>{order.customer_phone}</strong>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--muted)' }}>পূর্ণ ঠিকানা:</span>{' '}
                    <strong style={{ color: 'var(--ink)' }}>{order.delivery_address}</strong>{' '}
                    {order.delivery_area && (
                      <span style={{ background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {order.delivery_area}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Itemized Order Memo List */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--rule, #E2E8F0)',
                borderRadius: '14px',
                padding: '18px 20px',
                marginBottom: '24px'
              }}
            >
              <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ReceiptText size={16} color="var(--green)" />
                  <span>
                    অর্ডারের পণ্য তালিকা ({toBengaliNumber(order.items_count || parsedItems.length || 0)}টি আইটেম)
                  </span>
                </div>
                {order.is_masked && (
                  <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 600 }}>
                    মেমো সুরক্ষিত
                  </span>
                )}
              </h4>

              {order.is_masked ? (
                /* Blurred Items Container - Real product data NEVER sent from server */
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', padding: '14px', background: '#F8FAFC', border: '1px dashed #CBD5E1', marginBottom: '14px' }}>
                  <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none', opacity: 0.5, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FFFFFF', borderRadius: '6px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 700 }}>মিনিকেট চাল প্রিমিয়াম × ২</div>
                      <div className="mono font-bold">৳১৫০</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FFFFFF', borderRadius: '6px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 700 }}>ফ্রেশ সয়াবিন তেল ১ লিটার × ১</div>
                      <div className="mono font-bold">৳১৮৫</div>
                    </div>
                  </div>

                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.82)',
                    backdropFilter: 'blur(2px)',
                    padding: '10px',
                    textAlign: 'center',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontWeight: 700, fontSize: '13px' }}>
                      <ShieldCheck size={16} />
                      <span>ব্যক্তিগত গোপনীয়তার স্বার্থে পণ্যের মেমো ও নাম লুকানো রয়েছে</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      style={{
                        background: 'var(--green, #006C4C)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <LogIn size={13} />
                      <span>মেমো দেখতে লগইন করুন</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {parsedItems.map((item: any, idx: number) => {
                    const itemName = item.product_name || item.brand || item.name || `পণ্য #${idx + 1}`;
                    const itemPrice = item.final_price || item.price || 0;
                    const itemQty = item.qty || item.quantity || 1;
                    const itemUnit = item.unit || '';

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          background: '#F8FAFC',
                          borderRadius: '6px',
                          fontSize: '13px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                            {itemName} ×{toBengaliNumber(itemQty)}
                          </div>
                          {itemUnit && (
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>একক: {itemUnit}</div>
                          )}
                        </div>
                        <div className="mono" style={{ fontWeight: 800, color: 'var(--ink)' }}>
                          ৳{toBengaliNumber(itemPrice * itemQty)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px dashed #E2E8F0', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>পণ্য উপমোট (Subtotal)</span>
                  <span className="mono">৳{toBengaliNumber(order.subtotal || order.total_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>ডেলিভারি চার্জ</span>
                  <span className="mono">৳{toBengaliNumber(order.delivery_fee || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px', color: 'var(--green)', paddingTop: '4px' }}>
                  <span>সর্বমোট বিল</span>
                  <span className="mono">৳{toBengaliNumber(order.total_amount || 0)}</span>
                </div>
              </div>

              {/* Action Buttons: 1-Click Reorder & Cash Memo */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
                {!order.is_masked ? (
                  <>
                    <motion.button
                      type="button"
                      className="cta"
                      onClick={handleReorder}
                      disabled={reordering}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: '1 1 200px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        fontSize: '13.5px',
                        borderRadius: '8px',
                        background: 'var(--green, #006C4C)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <ShoppingBag size={16} />
                      <span>পুনরায় অর্ডার (1-Click Reorder)</span>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => setShowInvoice(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        flex: '1 1 180px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        fontSize: '13.5px',
                        borderRadius: '8px',
                        background: '#F1F5F9',
                        color: 'var(--ink, #1F2937)',
                        border: '1px solid #CBD5E1',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Printer size={16} />
                      <span>ক্যাশ মেমো / ইনভয়েস</span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    type="button"
                    className="cta"
                    onClick={() => openAuthModal('login')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      flex: '1 1 100%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 18px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      background: 'var(--green, #006C4C)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <LogIn size={16} />
                    <span>পূর্ণাঙ্গ ক্যাশ মেমো দেখতে ও রি-অর্ডার করতে অ্যাকাউন্টে লগইন করুন</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Customer Invoice Modal */}
      <AnimatePresence>
        {showInvoice && order && !order.is_masked && (
          <CustomerInvoiceModal
            order={order}
            settings={settings}
            onClose={() => setShowInvoice(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
