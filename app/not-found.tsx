"use client";
import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Home, Search, AlertCircle } from 'lucide-react';

export default function NotFound() {
  React.useEffect(() => {
    document.title = 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি (404) — আড়ৎ এক্সপ্রেস';
  }, []);
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: '#F8FAF8',
        color: '#191C1B'
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '40px 28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Visual Badge / Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: '#E8F8EE',
            color: '#006C4C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            position: 'relative'
          }}
        >
          <ShoppingBag size={40} strokeWidth={2.2} />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              background: '#DC2626',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '2px solid #FFFFFF'
            }}
          >
            !
          </div>
        </div>

        {/* 404 Heading */}
        <span
          style={{
            fontSize: '14px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#006C4C',
            background: '#E8F8EE',
            padding: '4px 14px',
            borderRadius: '9999px',
            marginBottom: '12px'
          }}
        >
          Error 404
        </span>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#191C1B',
            marginBottom: '10px',
            lineHeight: 1.3
          }}
        >
          পৃষ্ঠাটি খুঁজে পাওয়া যায়নি!
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#64748B',
            marginBottom: '28px',
            lineHeight: 1.6,
            maxWidth: '380px'
          }}
        >
          আপনি যে পেজটি খুঁজছেন তা হয়তো সরানো হয়েছে, মুছে ফেলা হয়েছে অথবা লিংকটিতে কোনো ভুল রয়েছে।
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%'
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 24px',
              borderRadius: '14px',
              background: '#006C4C',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              transition: 'background 0.2s',
              boxShadow: '0 4px 14px rgba(0, 108, 76, 0.25)'
            }}
          >
            <Home size={18} />
            মূল পাতায় ফিরে যান
          </Link>

          <Link
            href="/profile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '14px',
              background: '#F3F7F4',
              color: '#191C1B',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              border: '1px solid #E2E8F0'
            }}
          >
            <Search size={16} />
            আপনার অর্ডার ও প্রোফাইল দেখুন
          </Link>
        </div>
      </div>
    </div>
  );
}
