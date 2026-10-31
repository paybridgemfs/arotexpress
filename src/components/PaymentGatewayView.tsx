"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Clock,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  CreditCard,
  Phone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  Lock,
  Sparkles
} from 'lucide-react';
import { useStoreData } from '@/src/context/StoreDataContext';
import { useCart } from '@/src/context/CartContext.jsx';
import { toBengaliNumber } from '@/src/utils/bengali.js';

interface OrderDetails {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  payment_status: string;
  status: string;
  payment_method?: string;
  sender_number?: string;
  type: 'regular' | 'package';
  created_at?: string;
}

interface PaymentSession {
  orderId: number;
  orderType: 'regular' | 'package';
  methodCode: string;
  senderNumber: string;
  endTime: number;
}

export default function PaymentGatewayView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const orderType = (searchParams.get('type') || 'regular') as 'regular' | 'package';

  const { settings, paymentMethods, fetchData } = useStoreData();
  const { clearCart } = useCart();

  const [loadingOrder, setLoadingOrder] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [orderError, setOrderError] = useState('');

  // Selected payment method & sender number
  const [selectedMethodCode, setSelectedMethodCode] = useState<string>('');
  const [senderNumber, setSenderNumber] = useState<string>('');
  const [numberError, setNumberError] = useState<string>('');

  // 5-minute countdown session state
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [pollStatusMessage, setPollStatusMessage] = useState<string>('');
  const [pollAttempts, setPollAttempts] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Manual TrxID fallback
  const [showTrxFallback, setShowTrxFallback] = useState<boolean>(false);
  const [manualTrxId, setManualTrxId] = useState<string>('');
  const [manualVerifyError, setManualVerifyError] = useState<string>('');
  const [manualVerifying, setManualVerifying] = useState<boolean>(false);

  // Verified Success state
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  // Polling ref
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRunningRef = useRef<boolean>(false);

  // 1. Fetch Order Details on Mount
  useEffect(() => {
    if (!orderId) {
      setOrderError('কোনো অর্ডার আইডি প্রদান করা হয়নি।');
      setLoadingOrder(false);
      return;
    }

    fetch(`/api/payment/order-details?order_id=${orderId}&type=${orderType}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'অর্ডার তথ্য লোড করতে সমস্যা হয়েছে');
        }
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        // Pre-fill sender phone from customer phone if applicable
        if (data.customer_phone && /^01[3-9]\d{8}$/.test(data.customer_phone)) {
          setSenderNumber(data.customer_phone);
        }

        // If already verified, show success immediately
        if (data.payment_status === 'verified' && (data.status === 'confirmed' || data.status === 'পেন্ডিং')) {
          setIsPaymentSuccess(true);
          setSuccessOrder(data);
        }
      })
      .catch((err) => {
        setOrderError(err.message || 'অর্ডার তথ্য পাওয়া যায়নি');
      })
      .finally(() => {
        setLoadingOrder(false);
      });
  }, [orderId, orderType]);

  // 2. Load any existing ongoing session from localStorage (preserves timer across minimizes & reloads!)
  useEffect(() => {
    if (!orderId) return;
    try {
      const storageKey = `arot_payment_session_${orderId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: PaymentSession = JSON.parse(saved);
        const now = Date.now();
        const left = Math.max(0, Math.floor((parsed.endTime - now) / 1000));

        if (left > 0) {
          setSession(parsed);
          setSelectedMethodCode(parsed.methodCode);
          setSenderNumber(parsed.senderNumber);
          setRemainingSeconds(left);
        } else {
          // Session expired
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.warn('Session restore error:', e);
    }
  }, [orderId]);

  // 3. Active countdown ticker that computes time accurately from endTime (bulletproof against tab switch/minimizing)
  useEffect(() => {
    if (!session) return;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((session.endTime - now) / 1000));
      setRemainingSeconds(left);

      if (left <= 0) {
        // Expired
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // 4. Background Auto-Verification Polling (calls server every 3.5 seconds)
  const pollVerification = useCallback(async (trxOverride?: string) => {
    if (!session || isPaymentSuccess || isPollingRunningRef.current) return;

    isPollingRunningRef.current = true;
    setIsVerifying(true);

    try {
      const res = await fetch('/api/payment/check-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: session.orderId,
          order_type: session.orderType,
          payment_method_code: session.methodCode,
          sender_number: session.senderNumber,
          trx_id: trxOverride || undefined
        })
      });

      const data = await res.json().catch(() => ({}));
      setPollAttempts((prev) => prev + 1);

      if (data.verified === true && (data.code === 'VERIFIED_SUCCESS' || data.already_verified)) {
        // PAYMENT VERIFIED SUCCESSFULLY!
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        // Clean up session from localStorage
        try {
          localStorage.removeItem(`arot_payment_session_${session.orderId}`);
        } catch {}

        setIsPaymentSuccess(true);
        setSuccessOrder(data.order || order);

        // Clear user cart
        try {
          clearCart();
        } catch {}

        // Store last placed order for confirm page
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('arot_last_placed_order', JSON.stringify(data.order || order));
        }

        // Redirect to confirm page after 1.8 seconds with celebratory animation
        setTimeout(() => {
          router.replace(`/confirm?orderId=${session.orderId}`);
        }, 1800);
        return;
      }

      if (data.message) {
        setPollStatusMessage(data.message);
      }
    } catch (e: any) {
      console.warn('Auto poll error:', e.message);
    } finally {
      isPollingRunningRef.current = false;
      setIsVerifying(false);
    }
  }, [session, isPaymentSuccess, order, clearCart, router]);

  // Start polling when session is active
  useEffect(() => {
    if (!session || isPaymentSuccess || remainingSeconds <= 0) return;

    // Immediate first check
    pollVerification();

    // Recurring check every 3.5 seconds
    pollIntervalRef.current = setInterval(() => {
      pollVerification();
    }, 3500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [session, isPaymentSuccess, remainingSeconds, pollVerification]);

  // Handle Starting the 5-Minute Session
  const handleStartPaymentSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (!selectedMethodCode) {
      setNumberError('অনুগ্রহ করে একটি পেমেন্ট মাধ্যম বেছে নিন');
      return;
    }

    const cleanNum = senderNumber.trim().replace(/[^0-9]/g, '');
    if (!cleanNum || cleanNum.length !== 11 || !cleanNum.startsWith('01')) {
      setNumberError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    setNumberError('');
    const durationMs = 5 * 60 * 1000; // 5 minutes (300 seconds)
    const newSession: PaymentSession = {
      orderId: order.id,
      orderType,
      methodCode: selectedMethodCode,
      senderNumber: cleanNum,
      endTime: Date.now() + durationMs
    };

    try {
      localStorage.setItem(`arot_payment_session_${order.id}`, JSON.stringify(newSession));
    } catch {}

    setSession(newSession);
    setRemainingSeconds(300);
    setPollAttempts(0);
    setPollStatusMessage('সার্ভারে আপনার পেমেন্ট খোঁজা শুরু হয়েছে...');
  };

  // Handle Manual TrxID Submit
  const handleManualTrxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTrx = manualTrxId.trim();
    if (!cleanTrx) {
      setManualVerifyError('অনুগ্রহ করে TrxID প্রদান করুন');
      return;
    }

    setManualVerifyError('');
    setManualVerifying(true);

    try {
      await pollVerification(cleanTrx);
    } catch (e: any) {
      setManualVerifyError(e.message || 'ভেরিফিকেশনে ত্রুটি হয়েছে');
    } finally {
      setManualVerifying(false);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldName: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // Format mm:ss in Bengali numbers
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${toBengaliNumber(mm)}:${toBengaliNumber(ss)}`;
  };

  // Active payment methods (excluding cod)
  const activeOnlineMethods = (paymentMethods || []).filter(
    (p: any) => p.is_active !== false && p.code?.toLowerCase() !== 'cod'
  );

  const currentSelectedMethod = activeOnlineMethods.find(
    (p: any) => p.code?.toLowerCase() === selectedMethodCode.toLowerCase()
  );

  const siteLogo = settings?.logo_image_url || '';
  const siteName = settings?.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteTagline = settings?.site_tagline || 'তাজা পাইকারি ও খুচরা মুদি বাজার';

  // Helper to render method logo using Next.js Image or fallback
  const renderMethodLogo = (method: any, size = 42) => {
    if (method.logo && typeof method.logo === 'string' && method.logo.trim()) {
      return (
        <div
          style={{
            position: 'relative',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.06)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px'
          }}
        >
          <Image
            src={method.logo.trim()}
            alt={method.name_bn || 'পেমেন্ট'}
            fill
            sizes={`${size}px`}
            referrerPolicy="no-referrer"
            style={{ objectFit: 'contain' }}
          />
        </div>
      );
    }

    // Default colorful badges
    const code = (method.code || '').toLowerCase();
    let bg = '#006C4C';
    let text = 'Pay';
    if (code.includes('bkash')) {
      bg = '#E2136E';
      text = 'বিকাশ';
    } else if (code.includes('nagad')) {
      bg = '#F7941D';
      text = 'নগদ';
    } else if (code.includes('rocket')) {
      bg = '#8C3494';
      text = 'রকেট';
    } else if (code.includes('upay')) {
      bg = '#003B70';
      text = 'উপায়';
    }

    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '10px',
          background: bg,
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: size > 40 ? '13px' : '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}
      >
        {text}
      </div>
    );
  };

  // Loading state
  if (loadingOrder) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAF8' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '38px', height: '38px', border: '3px solid #E2E8F0', borderTopColor: 'var(--green, #006C4C)', borderRadius: '50%', margin: '0 auto 14px' }} />
          <div style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 600 }}>পেমেন্ট গেটওয়ে প্রস্তুত হচ্ছে...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (orderError || !order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#F8FAF8' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ maxWidth: '460px', width: '100%', background: '#FFFFFF', border: '1px solid var(--rule, #E2E8F0)', borderRadius: '16px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink, #0F172A)', margin: '0 0 8px' }}>অর্ডার খুঁজে পাওয়া যায়নি</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--muted, #64748B)', margin: '0 0 24px', lineHeight: 1.5 }}>
            {orderError || 'অনুগ্রহ করে কার্ট চেকআউট থেকে পুনরায় চেষ্টা করুন।'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="cta"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> <span>হোম পেজে ফিরে যান</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // SUCCESS STATE CELEBRATION
  if (isPaymentSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#F0FDF4' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, type: 'spring' }}
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            border: '2px solid #86EFAC',
            borderRadius: '20px',
            padding: '40px 24px',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(22, 101, 52, 0.12)'
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#22C55E',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              boxShadow: '0 6px 18px rgba(34, 197, 94, 0.35)'
            }}
          >
            <Check size={40} strokeWidth={3} />
          </motion.div>

          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#166534', margin: '0 0 6px' }}>
            পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!
          </h1>
          <p style={{ fontSize: '14px', color: '#15803D', fontWeight: 600, margin: '0 0 20px' }}>
            আপনার অর্ডারটি নিশ্চিত করা হয়েছে এবং প্রস্তুত করা হচ্ছে।
          </p>

          <div style={{ background: '#F8FAF9', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>অর্ডার কোড:</span>
              <strong style={{ color: 'var(--ink)' }}>#{order.order_code || order.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>পরিশোধিত টাকা:</span>
              <strong style={{ color: 'var(--green, #006C4C)', fontSize: '15px' }}>৳{toBengaliNumber(order.total_amount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>পেমেন্ট মাধ্যম:</span>
              <strong style={{ color: 'var(--ink)' }}>{currentSelectedMethod?.name_bn || order.payment_method || 'অনলাইন পেমেন্ট'}</strong>
            </div>
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #CBD5E1', borderTopColor: 'var(--green)', borderRadius: '50%' }} />
            <span>অর্ডার কনফার্মেশন পেজে নিয়ে যাওয়া হচ্ছে...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAF8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px 60px'
      }}
    >
      {/* 1. BRAND HEADER SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '26px'
        }}
      >
        {siteLogo ? (
          <div style={{ position: 'relative', width: '160px', height: '48px', marginBottom: '8px' }}>
            <Image
              src={siteLogo}
              alt={siteName}
              fill
              sizes="160px"
              priority
              referrerPolicy="no-referrer"
              style={{ objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--green, #006C4C)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>
              AE
            </div>
            <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ink)' }}>{siteName}</span>
          </div>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#15803D', fontWeight: 700, background: '#DCFCE7', padding: '3px 10px', borderRadius: '9999px', marginTop: '4px' }}>
          <Lock size={12} />
          <span>নিরাপদ ও এনক্রিপ্টেড পেমেন্ট গেটওয়ে</span>
        </div>
      </motion.div>

      {/* 2. ORDER SUMMARY MINI CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid var(--rule, #E2E8F0)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>অর্ডার রেফারেন্স</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>#{order.order_code || order.id}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>গ্রাহক: {order.customer_name} ({order.customer_phone})</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>পরিশোধযোগ্য মোট বিল</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--green, #006C4C)', letterSpacing: '-0.5px' }}>
            ৳{toBengaliNumber(order.total_amount)}
          </div>
        </div>
      </motion.div>

      {/* 3. MAIN PAYMENT FORM CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid var(--rule, #E2E8F0)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
        }}
      >
        <form onSubmit={handleStartPaymentSession}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: 'var(--green)' }} />
            <span>আপনার পেমেন্ট মাধ্যম বেছে নিন</span>
          </h2>

          {/* Payment Methods Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {activeOnlineMethods.map((method: any) => {
              const isSelected = selectedMethodCode.toLowerCase() === method.code?.toLowerCase();
              return (
                <div
                  key={method.id || method.code}
                  onClick={() => {
                    setSelectedMethodCode(method.code);
                    if (numberError) setNumberError('');
                  }}
                  style={{
                    border: isSelected ? '2px solid var(--green, #006C4C)' : '1.5px solid var(--rule, #E2E8F0)',
                    backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: isSelected ? '0 4px 12px rgba(0, 108, 76, 0.12)' : 'none'
                  }}
                >
                  {renderMethodLogo(method, 40)}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {method.name_bn}
                      </strong>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid var(--green, #006C4C)' : '2px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          flexShrink: 0
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{method.account_type || 'পার্সোনাল'}</span>
                      {method.number && <span className="mono">({method.number})</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SENDER NUMBER INPUT (Appears seamlessly when a method is chosen) */}
          <AnimatePresence>
            {selectedMethodCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ background: '#F8FAF9', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                  <label
                    htmlFor="sender-phone"
                    style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}
                  >
                    যে নম্বর থেকে টাকা পাঠাবেন সেই নম্বর দিন <span style={{ color: 'red' }}>*</span>
                  </label>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--muted)' }}>
                    আপনার {currentSelectedMethod?.name_bn || 'মোবাইল ব্যাংকিং'} প্রেরক নম্বরটি দিন (যেমন: 017XXXXXXXX)
                  </p>

                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
                      <Phone size={16} />
                    </div>
                    <input
                      id="sender-phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={senderNumber}
                      onChange={(e) => {
                        setSenderNumber(e.target.value);
                        if (numberError) setNumberError('');
                      }}
                      maxLength={11}
                      className="mono"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 38px',
                        fontSize: '15px',
                        fontWeight: 700,
                        border: numberError ? '1.5px solid var(--danger, #DC2626)' : '1.5px solid var(--rule, #CBD5E1)',
                        borderRadius: '10px',
                        background: '#FFFFFF',
                        color: 'var(--ink)',
                        letterSpacing: '0.5px'
                      }}
                    />
                  </div>
                  {numberError && (
                    <div style={{ fontSize: '12px', color: 'var(--danger, #DC2626)', marginTop: '6px', fontWeight: 600 }}>
                      {numberError}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTION BUTTON */}
          <button
            type="submit"
            disabled={!selectedMethodCode}
            style={{
              width: '100%',
              padding: '14px 20px',
              backgroundColor: selectedMethodCode ? 'var(--green, #006C4C)' : '#94A3B8',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '15px',
              borderRadius: '9999px',
              border: 'none',
              cursor: selectedMethodCode ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: selectedMethodCode ? '0 4px 16px rgba(0, 108, 76, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <span>পেমেন্ট করুন (৳{toBengaliNumber(order.total_amount)})</span>
            <Sparkles size={16} />
          </button>
        </form>
      </motion.div>

      {/* 4. 5-MINUTE COUNTDOWN & AUTO-VERIFICATION MODAL */}
      <AnimatePresence>
        {session && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflowY: 'auto'
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              style={{
                maxWidth: '480px',
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '28px 22px',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              {/* TOP HEADER: TIMER & STATUS */}
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: remainingSeconds > 60 ? '#FEF3C7' : '#FEE2E2', color: remainingSeconds > 60 ? '#92400E' : '#991B1B', padding: '6px 16px', borderRadius: '9999px', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                  <Clock size={16} className={remainingSeconds > 0 ? 'animate-pulse' : ''} />
                  <span>সময় বাকি: <strong className="mono" style={{ fontSize: '16px' }}>{formatTime(remainingSeconds)}</strong></span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ink)', margin: '4px 0 2px' }}>
                  {currentSelectedMethod?.name_bn || 'পেমেন্ট'} সম্পন্ন করুন
                </h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>
                  ৫ মিনিটের মধ্যে টাকা পাঠালে সার্ভার স্বয়ংক্রিয়ভাবে অর্ডার কনফার্ম করবে
                </p>
              </div>

              {/* PAYMENT TARGET BOX (Receiver Account Number, Amount, Type) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '16px',
                  padding: '18px 16px',
                  marginBottom: '16px'
                }}
              >
                {/* Method & Account Type */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentSelectedMethod && renderMethodLogo(currentSelectedMethod, 32)}
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#166534' }}>
                      {currentSelectedMethod?.name_bn || 'মোবাইল ব্যাংকিং'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, background: '#FFFFFF', color: '#166534', padding: '3px 8px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                    {currentSelectedMethod?.account_type || 'পার্সোনাল (Send Money)'}
                  </span>
                </div>

                {/* Receiver Account Number with 1-Click Copy */}
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '12px 14px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>এই নম্বরে টাকা পাঠান</div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.5px' }}>
                      {currentSelectedMethod?.number || '01XXXXXXXXX'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentSelectedMethod?.number || '', 'number')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: copiedField === 'number' ? '#22C55E' : 'var(--green, #006C4C)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {copiedField === 'number' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedField === 'number' ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                  </button>
                </div>

                {/* Amount to send with 1-Click Copy */}
                <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '10px 14px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>টাকার সঠিক পরিমাণ</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--green, #006C4C)' }}>
                      ৳{toBengaliNumber(order.total_amount)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(order.total_amount), 'amount')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: copiedField === 'amount' ? '#22C55E' : '#EEF2F6',
                      color: copiedField === 'amount' ? '#FFFFFF' : '#334155',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {copiedField === 'amount' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedField === 'amount' ? 'কপি হয়েছে!' : 'টাকা কপি'}</span>
                  </button>
                </div>
              </div>

              {/* SENDER INFO SUMMARY */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAF9', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '14px', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--muted)' }}>আপনার প্রেরক নম্বর:</span>
                <span className="mono" style={{ fontWeight: 800, color: 'var(--ink)' }}>{session.senderNumber}</span>
              </div>

              {/* ADMIN INSTRUCTIONS IF DEFINED */}
              {currentSelectedMethod?.instructions_bn && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', fontSize: '12.5px', color: '#92400E', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HelpCircle size={14} /> নির্দেশনাবলী:
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>{currentSelectedMethod.instructions_bn}</div>
                </div>
              )}

              {/* AUTO-POLLING STATUS PULSE */}
              <div
                style={{
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="animate-ping" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#38BDF8', opacity: 0.75 }} />
                  <RefreshCw size={14} className="animate-spin" style={{ color: '#0284C7' }} />
                </div>
                <div style={{ flex: 1, fontSize: '12px', color: '#0369A1', lineHeight: 1.4 }}>
                  <strong>সার্ভারে স্বয়ংক্রিয় অনুসন্ধান চলছে...</strong>
                  <div style={{ fontSize: '11px', color: '#0284C7' }}>
                    {pollStatusMessage || 'টাকা পাঠানোর সাথে সাথেই নিশ্চিত করা হবে। অপেক্ষা করুন...'} (চেক: {toBengaliNumber(pollAttempts)} বার)
                  </div>
                </div>
              </div>

              {/* TRANSACTION ID FALLBACK ACCORDION */}
              <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '12px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowTrxFallback(!showTrxFallback)}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    fontSize: '12.5px',
                    color: 'var(--green, #006C4C)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>Transaction ID দিয়ে ভেরিফাই করতে চান?</span>
                  {showTrxFallback ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <AnimatePresence>
                  {showTrxFallback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginTop: '10px' }}
                    >
                      <form onSubmit={handleManualTrxSubmit} style={{ background: '#F8FAF9', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <label style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                          আপনার TrxID ট্রানজেকশন কোড লিখুন
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="যেমন: 8N7A6D5E"
                            value={manualTrxId}
                            onChange={(e) => {
                              setManualTrxId(e.target.value.toUpperCase());
                              if (manualVerifyError) setManualVerifyError('');
                            }}
                            className="mono"
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              fontSize: '13.5px',
                              fontWeight: 700,
                              borderRadius: '8px',
                              border: manualVerifyError ? '1px solid #DC2626' : '1px solid #CBD5E1',
                              background: '#FFFFFF'
                            }}
                          />
                          <button
                            type="submit"
                            disabled={manualVerifying}
                            style={{
                              background: 'var(--green, #006C4C)',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 14px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: manualVerifying ? 'wait' : 'pointer'
                            }}
                          >
                            {manualVerifying ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
                          </button>
                        </div>
                        {manualVerifyError && (
                          <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '6px', fontWeight: 600 }}>
                            {manualVerifyError}
                          </div>
                        )}
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TIMEOUT EXPIRED STATE BUTTONS */}
              {remainingSeconds <= 0 && (
                <div style={{ textAlign: 'center', padding: '12px', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA', marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#991B1B', fontWeight: 800, marginBottom: '6px' }}>
                    ⏰ ৫ মিনিটের সময় শেষ হয়েছে
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '11.5px', color: '#7F1D1D' }}>
                    আপনি কি টাকা পাঠিয়েছেন? পাঠিয়ে থাকলে TrxID দিয়ে ভেরিফাই করুন অথবা পুনরায় ৫ মিনিট সময় চালু করুন।
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const durationMs = 5 * 60 * 1000;
                        const renewed: PaymentSession = {
                          ...session,
                          endTime: Date.now() + durationMs
                        };
                        try {
                          localStorage.setItem(`arot_payment_session_${session.orderId}`, JSON.stringify(renewed));
                        } catch {}
                        setSession(renewed);
                        setRemainingSeconds(300);
                      }}
                      style={{
                        background: 'var(--green, #006C4C)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      আরো ৫ মিনিট নিন
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem(`arot_payment_session_${session.orderId}`);
                        } catch {}
                        setSession(null);
                      }}
                      style={{
                        background: '#FFFFFF',
                        color: '#475569',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      পদ্ধতি পরিবর্তন করুন
                    </button>
                  </div>
                </div>
              )}

              {/* CANCEL / CLOSE BUTTON */}
              <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('আপনি কি পেমেন্ট সেশন বন্ধ করতে চান?')) {
                      try {
                        localStorage.removeItem(`arot_payment_session_${session.orderId}`);
                      } catch {}
                      setSession(null);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    fontSize: '12px',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  অন্য পদ্ধতিতে পেমেন্ট করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
