"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { useStoreData } from '../context/StoreDataContext';

export default function FrontendLoadingScreen() {
  const { settings, loading } = useStoreData();
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Only show on first initial site load in this session
    try {
      if (typeof window !== 'undefined') {
        const hasLoaded = sessionStorage.getItem('arot_initial_loaded');
        if (hasLoaded) {
          setShow(false);
          return;
        }
      }
    } catch {
      // Ignore sessionStorage access errors
    }

    setShow(true);

    // Smooth simulated progress bar
    let cur = 15;
    setProgress(15);

    const interval = setInterval(() => {
      cur += Math.floor(Math.random() * 20) + 10;
      if (cur >= 95) {
        cur = 95;
        clearInterval(interval);
      }
      setProgress(cur);
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // When store data is ready (or after minimum animation time), complete the progress bar and dismiss
  useEffect(() => {
    if (!show) return;

    if (!loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setShow(false);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('arot_initial_loaded', 'true');
          }
        } catch {}
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [loading, show]);

  // Fallback auto-dismiss after 2 seconds to avoid any hanging
  useEffect(() => {
    if (!show) return;
    const fallbackTimer = setTimeout(() => {
      setProgress(100);
      setShow(false);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('arot_initial_loaded', 'true');
        }
      } catch {}
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [show]);

  if (!show) return null;

  const logoUrl = settings?.logo_image_url;
  const siteName = settings?.site_name || 'আড়ৎ এক্সপ্রেস';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="site-initial-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
        >
          {/* Logo container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '28px'
            }}
          >
            {logoUrl ? (
              <div style={{ position: 'relative', width: '200px', height: '60px', maxWidth: '80vw' }}>
                <Image
                  src={logoUrl}
                  alt={siteName}
                  fill
                  sizes="200px"
                  style={{ objectFit: 'contain' }}
                  priority
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #006C4C 0%, #004D36 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <ShoppingBag size={24} />
                </div>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#006C4C',
                    letterSpacing: '-0.3px'
                  }}
                >
                  {siteName}
                </span>
              </div>
            )}
          </motion.div>

          {/* Clean Progress Bar */}
          <div
            style={{
              width: '180px',
              height: '4px',
              backgroundColor: '#E2E8F0',
              borderRadius: '9999px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <motion.div
              style={{
                height: '100%',
                backgroundColor: '#006C4C',
                borderRadius: '9999px',
                width: `${progress}%`,
                transition: 'width 0.2s ease'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
