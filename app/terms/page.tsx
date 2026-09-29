import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'শর্তাবলী ও নিয়মাবলী (Terms of Service) — আড়ৎ এক্সপ্রেস',
  description: 'আড়ৎ এক্সপ্রেসের ব্যবহারের সাধারণ শর্তাবলী ও নীতিমালা।'
};

export default function TermsPage() {
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
            <FileText size={28} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
            শর্তাবলী ও নিয়মাবলী (Terms of Service)
          </h1>
        </div>

        <p style={{ color: '#64748B', fontSize: '13.5px', marginBottom: '24px' }}>
          সর্বশেষ আপডেট: ২৮ সেপ্টেম্বর, ২০২৬
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#334155', lineHeight: '1.7', fontSize: '15px' }}>
          <section>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ১. সেবার আওতা ও গ্রহণযোগ্যতা
            </h2>
            <p>
              <strong>আড়ৎ এক্সপ্রেস (Arot Express)</strong> প্ল্যাটফর্মে প্রবেশ ও ব্যবহারের মাধ্যমে আপনি এই সকল শর্তাবলী মেনে নিতে সম্মত হচ্ছেন।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ২. অর্ডার ও পেমেন্ট
            </h2>
            <p>
              পণ্য অর্ডার করার সময় গ্রাহককে সঠিক তথ্য প্রদান করতে হবে। পণ্য পৌঁছানোর পর ক্যাশ অন ডেলিভারি (COD) বা অনুমোদিত মোবাইল ব্যাংকিং (বিকাশ/নগদ) এর মাধ্যমে মূল্য পরিশোধ করতে হবে।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ৩. ক্লাউড সার্ভিস ও অ্যাডমিন কন্ট্রোল
            </h2>
            <p>
              অ্যাডমিন পোর্টালের ফাইল ব্যবস্থাপনা ও ব্যাকআপের জন্য অনুমোদিত গুগল এপিআই সার্ভিস ব্যবহৃত হয়, যা গুগলের ডেটা পলিসি ও টার্মস অনুযায়ী পরিচালিত।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              ৪. পরিবর্তন ও পরিমার্জন
            </h2>
            <p>
              কর্তৃপক্ষ যেকোনো সময়ে সেবার মান উন্নয়নকল্পে এই শর্তাবলী সংশোধন করার অধিকার সংরক্ষণ করে।
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
