"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import ConfirmationView from '@/src/components/ConfirmationView.jsx';
import { useStoreData } from '@/src/context/StoreDataContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ConfirmPage() {
  const router = useRouter();
  const { lastOrder, setLastOrder, settings } = useStoreData();
  const [checking, setChecking] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(lastOrder || null);

  useEffect(() => {
    // 1. Check if we already have the active order in store context
    if (lastOrder && (lastOrder.order_code || lastOrder.id)) {
      setActiveOrder(lastOrder);
      setChecking(false);
      return;
    }

    // 2. Check if there's a recently confirmed order in sessionStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('arot_last_placed_order');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.order_code || parsed.id)) {
            setActiveOrder(parsed);
            if (!lastOrder) {
              setLastOrder(parsed);
            }
            setChecking(false);
            return;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse stored order:', e);
    }

    // 3. No order found - user accessed directly without placing an order
    setChecking(false);
    const timeout = setTimeout(() => {
      router.replace('/');
    }, 1200);

    return () => clearTimeout(timeout);
  }, [lastOrder, setLastOrder, router]);

  useEffect(() => {
    const siteName = (settings && settings.site_name ? settings.site_name.trim() : '') || 'আড়ৎ এক্সপ্রেস (Arot Express)';
    const title = activeOrder ? `অর্ডার নিশ্চিতকরণ — ${siteName}` : `অনুমোদিত নয় — ${siteName}`;
    if (document.title !== title) {
      document.title = title;
    }
  }, [settings?.site_name, activeOrder]);

  if (checking) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
          অর্ডার যাচাই করা হচ্ছে...
        </div>
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <motion.div
        key="confirm-unauthorized"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: '520px',
          margin: '60px auto',
          padding: '40px 24px',
          background: '#FFFFFF',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#991B1B', margin: '0 0 8px' }}>
          সরাসরি প্রবেশ অনুমোদিত নয়
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
          কোনো সক্রিয় অর্ডার নিশ্চিত করা ছাড়া এই পেজে প্রবেশ করা যাবে না। আপনাকে হোমপেজে ফিরিয়ে নেওয়া হচ্ছে...
        </p>
        <button
          type="button"
          onClick={() => router.replace('/')}
          className="cta"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 22px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> <span>হোম পেজে ফিরে যান</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="confirm-view"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      style={{ width: '100%' }}
    >
      <ConfirmationView
        order={activeOrder}
        onContinueShopping={() => router.push('/')}
      />
    </motion.div>
  );
}
