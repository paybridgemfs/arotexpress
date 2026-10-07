"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Wrench, Clock, Phone, MessageCircle, ShieldAlert, Sparkles, RefreshCcw } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';

interface MaintenanceModeViewProps {
  settings?: any;
}

export default function MaintenanceModeView({ settings = {} }: MaintenanceModeViewProps) {
  const siteName = settings?.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteTagline = settings?.site_tagline || 'তাজা পাইকারি ও খুচরা মুদি বাজার';
  const helpline = settings?.site_helpline || '০১৭১২-৩৪৫৬৭৮';
  const maintenanceTitle = settings?.maintenance_title || 'সিস্টেম আপডেট ও রক্ষণাবেক্ষণের কাজ চলছে';
  const maintenanceMessage =
    settings?.maintenance_message ||
    'আমাদের পাইকারি ও খুচরা মুদি বাজার প্ল্যাটফর্মটিকে আরও দ্রুত, নিরাপদ এবং উন্নত করতে রুটিন মেইনটেন্যান্স ও ডাটাবেজ অপ্টিমাইজেশনের কাজ চলছে। খুব শীঘ্রই আমরা নতুন ফিচারে লাইভ হব।';
  const estimatedTime = settings?.maintenance_estimated_time || 'শীঘ্রই ফিরছি';
  const logoImageUrl = settings?.logo_image_url || '';

  // Auto-check if maintenance mode has been turned off by admin every 12 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data && data.is_maintenance_mode === false) {
            window.location.reload();
          }
        }
      } catch (e) {}
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: '#F8FAFC',
        backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px',
        fontFamily: 'var(--font-main, sans-serif)',
        color: '#0F172A'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
          padding: 'clamp(32px, 5vw, 48px)',
          textAlign: 'left',
          position: 'relative'
        }}
      >
        {/* Top Status & Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', gap: '16px' }}>
          <div>
            {logoImageUrl ? (
              <div style={{ position: 'relative', width: '140px', height: '40px' }}>
                <Image
                  src={logoImageUrl}
                  alt={siteName}
                  fill
                  sizes="140px"
                  referrerPolicy="no-referrer"
                  style={{ objectFit: 'contain', objectPosition: 'left' }}
                />
              </div>
            ) : (
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#006C4C', letterSpacing: '-0.5px' }}>
                {siteName}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>{siteTagline}</div>
          </div>

          <div
            style={{
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FDE68A',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '11.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D97706', display: 'inline-block' }}></span>
            রক্ষণাবেক্ষণ চলছে
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(20px, 4vw, 24px)',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.3px',
            margin: '0 0 12px',
            lineHeight: 1.35
          }}
        >
          {maintenanceTitle}
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.7,
            color: '#475569',
            margin: '0 0 28px'
          }}
        >
          {maintenanceMessage}
        </p>

        {/* Estimated Time Box */}
        {estimatedTime && (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#DCFCE7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                আনুমানিক সময়সীমা
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '1px' }}>
                {estimatedTime}
              </div>
            </div>
          </div>
        )}

        {/* Contact Helpline Section */}
        <div
          style={{
            borderTop: '1px solid #E2E8F0',
            paddingTop: '20px',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>
              জরুরি প্রয়োজনে যোগাযোগ:
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#006C4C', marginTop: '2px' }}>
              {helpline}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={`tel:${helpline.replace(/[^0-9]/g, '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#1E293B',
                textDecoration: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease'
              }}
            >
              <Phone size={13} color="#006C4C" /> কল করুন
            </a>
            <a
              href={`https://wa.me/88${helpline.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#16A34A',
                border: '1px solid #15803D',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#FFFFFF',
                textDecoration: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageCircle size={13} /> হোয়াটসঅ্যাপ
            </a>
          </div>
        </div>

        {/* Live sync auto footer note */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '11.5px',
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <RefreshCcw size={11} className="spin" />
          <span>সাইট লাইভ হওয়া মাত্র এই পেজটি স্বয়ংক্রিয়ভাবে রিফ্রেশ হবে</span>
        </div>
      </motion.div>
    </main>
  );
}
