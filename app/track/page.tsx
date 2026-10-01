"use client";
import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderTrackingPageView from '@/src/components/OrderTrackingPageView';
import { useStoreData } from '@/src/context/StoreDataContext';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('id') || searchParams.get('order_id') || '';
  const { settings } = useStoreData();

  useEffect(() => {
    const siteName = (settings && settings.site_name ? settings.site_name.trim() : '') || 'আড়ৎ এক্সপ্রেস (Arot Express)';
    const title = `লাইভ অর্ডার ট্র্যাকিং — ${siteName}`;
    if (document.title !== title) {
      document.title = title;
    }
  }, [settings?.site_name]);

  return <OrderTrackingPageView initialOrderCode={initialCode} />;
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-pulse" style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            অর্ডার ট্র্যাকিং লোড হচ্ছে...
          </div>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
