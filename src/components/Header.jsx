"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, X, User, ShoppingCart, LogIn, LayoutGrid, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { toBengaliNumber } from '../utils/bengali.js';

export default function Header({
  settings = {},
  groups = [],
  activeGroupTab,
  searchQuery,
  setSearchQuery,
  onSelectCategory,
  onNavigateHome,
  onNavigateProfile,
  onScrollToGroup
}) {
  const router = useRouter();
  const navigate = (path) => router.push(path);
  const { user, openAuthModal } = useAuth();
  const headerRef = useRef(null);

  const { totalCount, setIsCartOpen, cartCountBump } = useCart();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const updateHeaderHeight = () => {
      if (el) {
        const h = el.getBoundingClientRect().height;
        if (h > 0) {
          document.documentElement.style.setProperty('--app-header-height', `${h}px`);
        }
      }
    };
    updateHeaderHeight();
    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      observer.observe(el);
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [groups]);

  const handleGroupClick = (groupKey) => {
    onScrollToGroup(groupKey);
  };

  const logoType = settings?.logo_type || 'text';
  const logoTextEn = settings?.logo_text_en || 'AE';
  const logoTextBn = settings?.logo_text_bn || 'আ.এ';
  const siteName = settings?.site_name || 'Arot Express';
  const siteTagline = settings?.site_tagline || 'আপনার আড়ৎ, এখন এক ক্লিকে';
  const logoImageUrl = settings?.logo_image_url || '';

  return (
    <>
      <header ref={headerRef} className="main-app-header">
        <div className="header-top">
          {/* Mobile Hamburger Drawer Trigger */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="hamburger"
            id="hamburger"
            aria-label="মেনু খুলুন"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={22} />
          </motion.button>

          {/* Website Logo Only */}
          <motion.a
            className="brand-logo-wrap"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0
            }}
            title={siteName}
          >
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={siteName}
                style={{
                  height: '42px',
                  maxHeight: '44px',
                  maxWidth: '180px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--green, #006C4C)',
                  letterSpacing: '-0.4px',
                  fontFamily: 'var(--font-head, inherit)'
                }}
              >
                {siteName}
              </div>
            )}
          </motion.a>

          {/* Desktop Searchbar */}
          <div className="searchbar desktop-searchbar">
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              id="search-input"
              placeholder="চাল, ডাল, তেল, পেঁয়াজ খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="পণ্য খুঁজুন"
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                id="clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="খোঁজ মুছুন"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </motion.button>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="header-actions">
            {mounted && user ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="user-btn"
                onClick={onNavigateProfile}
                title="প্রোফাইল ও অর্ডার দেখুন"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <User size={16} />
                <span className="user-btn-name">{user.name ? user.name.split(' ')[0] : 'প্রোফাইল'}</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="user-btn"
                onClick={() => openAuthModal('login')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <LogIn size={15} /> <span className="user-btn-name">লগইন</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              id="cart-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label="কার্ট দেখুন"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShoppingCart size={17} /> <span className="cart-btn-text">কার্ট</span>
              <span className={`count ${cartCountBump ? 'bump' : ''}`} suppressHydrationWarning>
                {mounted ? toBengaliNumber(totalCount) : '০'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Dedicated Search Bar (Visible on tablets & mobile viewports) */}
        <div className="mobile-search-row">
          <div className="searchbar mobile-searchbar">
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              id="mobile-search-input"
              placeholder="চাল, ডাল, তেল খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="পণ্য খুঁজুন"
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                aria-label="খোঁজ মুছুন"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Horizontal Category Scroll Navigation */}
        {groups.length > 0 && (
          <nav className="header-nav" id="group-chips" aria-label="ক্যাটাগরি সমূহ">
            <div className="header-nav-scroll-container">
              {groups.map((g) => (
                <motion.button
                  key={g.key}
                  whileTap={{ scale: 0.94 }}
                  className={`chip ${activeGroupTab === g.key ? 'active' : ''}`}
                  onClick={() => handleGroupClick(g.key)}
                >
                  {g.bn}
                </motion.button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Mobile Drawer (Native App Menu Sheet) */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            key="mobile-nav-overlay"
            id="mobile-overlay"
            className="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileNavOpen(false)}
          />
        )}
        {mobileNavOpen && (
          <motion.nav
            key="mobile-nav-sidebar"
            id="mobile-nav"
            className="open"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            {/* Drawer Header with Brand / User Profile Banner */}
            <div className="mn-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {logoImageUrl ? (
                  <img src={logoImageUrl} alt={siteName} style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }} />
                ) : (
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)' }}>{siteName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>{siteTagline}</div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="মেনু বন্ধ করুন"
                className="close-drawer-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Greeting / Auth Status */}
            <div className="drawer-user-card">
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>স্বাগতম,</div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user.phone}</div>
                  </div>
                  <button
                    className="drawer-profile-btn"
                    onClick={() => {
                      setMobileNavOpen(false);
                      onNavigateProfile();
                    }}
                  >
                    প্রোফাইল
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>অ্যাকাউন্ট নেই?</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>লগইন বা রেজিস্টার করুন</div>
                  </div>
                  <button
                    className="drawer-login-btn"
                    onClick={() => {
                      setMobileNavOpen(false);
                      openAuthModal('login');
                    }}
                  >
                    লগইন
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Category Links */}
            <div className="drawer-section-title">
              <LayoutGrid size={15} /> <span>ক্যাটাগরি সমূহ</span>
            </div>

            <div id="mobile-links">
              {groups.map((g) => (
                <button
                  key={g.key}
                  className={`nav-link ${activeGroupTab === g.key ? 'active' : ''}`}
                  onClick={() => {
                    setMobileNavOpen(false);
                    handleGroupClick(g.key);
                  }}
                >
                  <span className="nav-link-bn">{g.bn}</span>
                  <span className="nav-link-en">{g.en}</span>
                </button>
              ))}
            </div>

            {/* Drawer Footer info */}
            <div className="drawer-footer">
              {user?.is_admin && (
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    navigate('/admin');
                  }}
                  className="drawer-admin-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)', width: '100%', justifyContent: 'flex-start', marginBottom: '12px' }}
                >
                  <ShieldCheck size={16} /> <span>এডমিন প্যানেল</span>
                </button>
              )}
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>
                © 2026 Arot Express · দ্রুত হোম ডেলিভারি
              </p>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

