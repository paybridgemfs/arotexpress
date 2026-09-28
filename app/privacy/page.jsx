import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'প্রাইভেসি পলিসি (Privacy Policy) — আড়ৎ এক্সপ্রেস',
  description: 'আড়ৎ এক্সপ্রেসের প্রাইভেসি পলিসি এবং তথ্য সুরক্ষা নীতিমালা।'
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--green, #006C4C)',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '20px'
        }}
      >
        <ArrowLeft size={16} />
        <span>হোমে ফিরে যান</span>
      </Link>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid #E2E8F0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: '#E6F4EA', color: '#137333', padding: '10px', borderRadius: '12px' }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            প্রাইভেসি পলিসি (Privacy Policy)
          </h1>
        </div>

        <p style={{ color: '#64748B', fontSize: '13.5px', marginBottom: '24px' }}>
          সর্বশেষ আপডেট: ২৮ সেপ্টেম্বর, ২০২৬
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#334155', lineHeight: '1.7', fontSize: '15px' }}>
          <section>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ১. তথ্য সংগ্রহ ও ব্যবহার
            </h2>
            <p>
              <strong>আড়ৎ এক্সপ্রেস (Arot Express)</strong> গ্রাহকদের গোপনীয়তা ও তথ্য সুরক্ষাকে সর্বোচ্চ অগ্রাধিকার দেয়। আমাদের সাইটে অর্ডার প্রসেসিং, ডেলিভারি সম্পন্নকরণ এবং গ্রাহক সেবার জন্য প্রয়োজনীয় তথ্য (যেমন: নাম, ফোন নম্বর, ঠিকানা) সংগ্রহ করা হয়।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ২. গুগল ড্রাইভ ও ক্লাউড স্টোরেজ
            </h2>
            <p>
              অ্যাডমিন প্যানেলের মাধ্যমে আপলোডকৃত পণ্যের ছবি ও মিডিয়া ফাইল সুরক্ষিতভাবে অ্যাডমিনের নিজস্ব গুগল ড্রাইভে সংরক্ষিত থাকে। আমরা কোনো অযাচিত তথ্য সংগ্রহ বা ড্রাইভের অন্যান্য ফাইলে অননুমোদিত অ্যাক্সেস গ্রহণ করি না। শুধুমাত্র আমাদের অ্যাপ্লিকেশনের মাধ্যমে আপলোড করা ফাইলসমূহেই সীমিত অ্যাক্সেস ব্যবহৃত হয়।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ৩. তথ্যের নিরাপত্তা ও থার্ড-পার্টি শেয়ারিং
            </h2>
            <p>
              আমরা কোনো গ্রাহক বা ব্যবহারকারীর ব্যক্তিগত তথ্য কোনো বাণিজ্যিক উদ্দেশ্যে তৃতীয় কোনো পক্ষের কাছে বিক্রি, ভাড়া বা হস্তান্তর করি না।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ৪. যোগাযোগ
            </h2>
            <p>
              পলিসি সংক্রান্ত যেকোনো তথ্য বা প্রশ্নের জন্য আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন: <strong>support@arotexpress.com</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
