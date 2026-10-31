import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PaymentGatewayView from '@/src/components/PaymentGatewayView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'নিরাপদ অনলাইন পেমেন্ট — আড়ৎ এক্সপ্রেস',
  description: 'বিকাশ, নগদ বা রকেটের মাধ্যমে সরাসরি নিরাপদ ও স্বয়ংক্রিয় পেমেন্ট সম্পন্ন করুন।',
  robots: {
    index: false,
    follow: false
  }
};

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAF8' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '38px', height: '38px', border: '3px solid #E2E8F0', borderTopColor: 'var(--green, #006C4C)', borderRadius: '50%', margin: '0 auto 14px' }} />
            <div style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 600 }}>পেমেন্ট গেটওয়ে লোড হচ্ছে...</div>
          </div>
        </div>
      }
    >
      <PaymentGatewayView />
    </Suspense>
  );
}
