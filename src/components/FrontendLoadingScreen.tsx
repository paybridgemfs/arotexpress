"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { useStoreData } from '../context/StoreDataContext';

export default function FrontendLoadingScreen() {
  const { settings, loading, categories } = useStoreData();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(15);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    setMounted(true);
    // If already loaded in this browser session, do not show loader at all
    try {
      if (typeof window !== 'undefined') {
        const hasLoaded = sessionStorage.getItem('arot_initial_loaded');
        if (hasLoaded === 'true') {
          setShow(false);
          return;
        }
      }
    } catch {
      // Ignore sessionStorage restriction errors
    }

    // Smooth progressive loader
    let cur = 20;
    setProgress(20);

    const interval = setInterval(() => {
      cur += Math.floor(Math.random() * 18) + 8;
      if (cur >= 92) {
        cur = 92;
        clearInterval(interval);
      }
      setProgress(cur);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // When store data and categories are ready, smoothly complete to 100% and fade out
  useEffect(() => {
    if (!mounted || !show) return;

    const isDataReady = !loading && Array.isArray(categories) && categories.length > 0;

    if (isDataReady) {
      const elapsed = Date.now() - startTimeRef.current;
      const minDisplayTime = 600; // minimum duration so animation looks polished and calm
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      const timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setShow(false);
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('arot_initial_loaded', 'true');
            }
          } catch {}
        }, 320);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [loading, categories, mounted, show]);

  // Safety fallback: dismiss after max 2.2 seconds under any slow network condition
  useEffect(() => {
    if (!mounted || !show) return;
    const fallback = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setShow(false);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('arot_initial_loaded', 'true');
          }
        } catch {}
      }, 200);
    }, 2200);

    return () => clearTimeout(fallback);
  }, [mounted, show]);

  // If already loaded in session, render nothing
  if (mounted && !show) return null;

  const logoUrl = settings?.logo_image_url;
  const siteName = settings?.site_name || 'আড়ৎ এক্সপ্রেস';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="site-initial-loading-curtain"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {/* Brand Logo or Name */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '26px'
            }}
          >
            {logoUrl ? (
              <div style={{ position: 'relative', width: '200px', height: '56px', maxWidth: '80vw' }}>
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
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #006C4C 0%, #004D36 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  <ShoppingBag size={22} />
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
                transition: 'width 0.18s ease'
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
