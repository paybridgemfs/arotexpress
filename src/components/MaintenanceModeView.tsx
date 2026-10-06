"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Wrench, Clock, Phone, MessageCircle, ShieldAlert, Lock } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';

interface MaintenanceModeViewProps {
  settings?: any;
}

export default function MaintenanceModeView({ settings = {} }: MaintenanceModeViewProps) {
  const router = useRouter();
  const siteName = settings?.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteTagline = settings?.site_tagline || 'আপনার আড়ৎ, এক ক্লিকে';
  const helpline = settings?.site_helpline || '০১৭১২-৩৪৫৬৭৮';
  const maintenanceTitle = settings?.maintenance_title || `${siteName} সাময়িকভাবে রক্ষণাবেক্ষণে রয়েছে`;
  const maintenanceMessage =
    settings?.maintenance_message ||
    'আমাদের ওয়েবসাইটটি আরও উন্নত করতে এবং প্রয়োজনীয় সিস্টেম আপগ্রেডের জন্য সাময়িকভাবে সাধারণ ভিজিটরদের জন্য বন্ধ রাখা হয়েছে। শীঘ্রই আমরা আরও উন্নত সেবা নিয়ে ফিরে আসছি।';
  const estimatedTime = settings?.maintenance_estimated_time || 'শীঘ্রই ফিরছি';
  const logoImageUrl = settings?.logo_image_url || '';

  // Auto-check if maintenance mode has been turned off by admin every 15 seconds
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
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'linear-gradient(145deg, #F8FAF8 0%, #EEF5F1 100%)',
        fontFamily: 'var(--font-main, sans-serif)',
        color: 'var(--ink, #191C1B)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Background Decorative Blur Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 108, 76, 0.08) 0%, rgba(0, 108, 76, 0) 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.07) 0%, rgba(217, 119, 6, 0) 70%)',
          pointerEvents: 'none'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        style={{
          maxWidth: '560px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 45px rgba(0, 40, 25, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)',
          padding: 'clamp(28px, 5vw, 44px)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Header */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {logoImageUrl ? (
            <div style={{ position: 'relative', width: '160px', height: '48px', marginBottom: '8px' }}>
              <Image
                src={logoImageUrl}
                alt={siteName}
                fill
                sizes="160px"
                referrerPolicy="no-referrer"
                style={{ objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--green, #006C4C)',
                letterSpacing: '-0.5px',
                marginBottom: '4px'
              }}
            >
              {siteName}
            </div>
          )}
          <div style={{ fontSize: '13px', color: 'var(--muted, #64748B)', fontWeight: 600 }}>{siteTagline}</div>
        </div>

        {/* Animated Maintenance Icon Card */}
        <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '24px' }}>
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '2px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B45309',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)'
            }}
          >
            <Wrench size={38} strokeWidth={2.3} />
          </motion.div>
          <span
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-6px',
              background: '#DC2626',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ShieldAlert size={12} /> Maintenance
          </span>
        </div>

        {/* Main Title & Notice */}
        <h1
          style={{
            fontSize: 'clamp(20px, 4vw, 24px)',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 12px',
            lineHeight: 1.3
          }}
        >
          {maintenanceTitle}
        </h1>

        <p
          style={{
            fontSize: '14.5px',
            lineHeight: 1.65,
            color: '#475569',
            margin: '0 0 24px',
            padding: '0 10px'
          }}
        >
          {maintenanceMessage}
        </p>

        {/* Expected ETA Pill */}
        {estimatedTime && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '28px'
            }}
          >
            <Clock size={15} color="#006C4C" />
            <span>প্রত্যাশিত লাইভ সময়: <strong style={{ color: '#006C4C' }}>{estimatedTime}</strong></span>
          </div>
        )}

        {/* Contact Helpline Strip */}
        <div
          style={{
            background: 'var(--md-surface-container-low, #F8FAF9)',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              জরুরি অর্ডার ও কাস্টমার সাপোর্ট
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green, #006C4C)', marginTop: '2px' }}>
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
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '9999px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#1E293B',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <Phone size={14} color="#006C4C" /> কল দিন
            </a>
            <a
              href={`https://wa.me/88${helpline.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#25D366',
                borderRadius: '9999px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)'
              }}
            >
              <MessageCircle size={14} /> হোয়াটসঅ্যাপ
            </a>
          </div>
        </div>

        {/* Admin Portal Gateway */}
        <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'color 0.15s ease'
            }}
          >
            <Lock size={13} />
            <span>অ্যাডমিন পোর্টাল লগইন</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
