"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStoreData } from '@/src/context/StoreDataContext';

export default function FrontendLoadingScreen() {
  const { settings, categories, groups, loading } = useStoreData();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(15);

  useEffect(() => {
    // 1. Initial smooth progress simulation
    const timer1 = setTimeout(() => setProgress(45), 100);
    const timer2 = setTimeout(() => setProgress(75), 250);

    // 2. Check when page and critical store data are ready
    const checkIfReady = () => {
      const hasData = (categories && categories.length > 0) || (groups && groups.length > 0);
      const isDocReady = typeof document !== 'undefined' && (document.readyState === 'complete' || document.readyState === 'interactive');
      return (!loading && hasData) || isDocReady;
    };

    const finishLoading = () => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
      }, 350); // slight buffer for progress bar 100% completion visual
    };

    // Minimum display timer for smooth animation (500ms)
    const minDisplayTimer = setTimeout(() => {
      if (checkIfReady()) {
        finishLoading();
      } else {
        // Fallback max wait timer (1.5 seconds)
        const fallbackTimer = setTimeout(finishLoading, 1000);
        return () => clearTimeout(fallbackTimer);
      }
    }, 450);

    // Window load listener
    const handleWindowLoad = () => {
      setProgress(95);
    };

    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        setProgress(90);
      } else {
        window.addEventListener('load', handleWindowLoad);
      }
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(minDisplayTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', handleWindowLoad);
      }
    };
  }, [loading, categories, groups]);

  const siteName = (settings && settings.site_name ? settings.site_name.trim() : '') || 'আড়ৎ এক্সপ্রেস';
  const logoImageUrl = settings?.logo_image_url || '';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="frontend-loader-overlay"
          className="frontend-loader-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            filter: 'blur(4px)',
            transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F8FAF8 0%, #FFFFFF 50%, #F0F7F3 100%)',
            pointerEvents: 'all',
            overflow: 'hidden'
          }}
        >
          {/* Ambient Glow Background Spheres */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.55, 0.35]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 108, 76, 0.15) 0%, rgba(245, 158, 11, 0.08) 60%, transparent 80%)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }}
          />

          {/* Loader Center Card */}
          <motion.div
            initial={{ scale: 0.9, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 28px',
              maxWidth: '340px',
              width: '90%',
              textAlign: 'center'
            }}
          >
            {/* Logo / Brand Icon with Orbiting Ring */}
            <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Spinning Orbital Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: '2px dashed rgba(0, 108, 76, 0.25)',
                  borderTopColor: '#006C4C'
                }}
              />

              {/* Pulsing Backing Badge */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '22px',
                  background: 'linear-gradient(145deg, #006C4C 0%, #004D36 100%)',
                  boxShadow: '0 12px 30px rgba(0, 108, 76, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
              >
                {logoImageUrl ? (
                  <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                    <Image
                      src={logoImageUrl}
                      alt={siteName}
                      fill
                      sizes="56px"
                      priority
                      referrerPolicy="no-referrer"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <ShoppingBag size={34} strokeWidth={2.2} />
                )}
              </motion.div>

              {/* Sparkle Accent Icon */}
              <motion.div
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  rotate: [0, 45, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)'
                }}
              >
                <Sparkles size={13} strokeWidth={2.5} />
              </motion.div>
            </div>

            {/* Brand Title */}
            <motion.h2
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#006C4C',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
                fontFamily: 'var(--font-bn, serif)'
              }}
            >
              {siteName}
            </motion.h2>

            {/* Dynamic Status Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                fontSize: '13px',
                color: '#4B5563',
                margin: '0 0 20px 0',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>তাজা পণ্যের সমাহার লোড হচ্ছে...</span>
            </motion.p>

            {/* Glowing Smooth Progress Bar */}
            <div
              style={{
                width: '180px',
                height: '6px',
                background: 'rgba(0, 108, 76, 0.1)',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <motion.div
                initial={{ width: '10%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #006C4C 0%, #10B981 60%, #F59E0B 100%)',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)'
                }}
              />
            </div>

            {/* 3 Bouncing Dots Indicator */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '16px', alignItems: 'center' }}>
              {[0, 1, 2].map((idx) => (
                <motion.span
                  key={`dot-${idx}`}
                  animate={{
                    y: [0, -5, 0],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: idx * 0.18,
                    ease: 'easeInOut'
                  }}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#006C4C'
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
