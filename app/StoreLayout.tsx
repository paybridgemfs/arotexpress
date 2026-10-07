"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, AlertTriangle, ArrowRight } from 'lucide-react';
import Header from '@/src/components/Header.jsx';
import Footer from '@/src/components/Footer.jsx';
import CartDrawer from '@/src/components/CartDrawer.jsx';
import AuthModal from '@/src/components/AuthModal.jsx';
import ToastContainer from '@/src/components/ToastContainer.jsx';
import ScrollManager from '@/src/components/ScrollManager';
import SocialButtons from '@/src/components/SocialButtons.jsx';
import FrontendLoadingScreen from '@/src/components/FrontendLoadingScreen';
import DesktopFloatingCart from '@/src/components/DesktopFloatingCart';
import MaintenanceModeView from '@/src/components/MaintenanceModeView';
import { useStoreData } from '@/src/context/StoreDataContext';
import { useCart } from '@/src/context/CartContext.jsx';
import { useAuth } from '@/src/context/AuthContext.jsx';
import { toBengaliNumber } from '@/src/utils/bengali.js';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    settings,
    loading,
    activeGroups,
    activeGroupTab,
    searchQuery,
    setSearchQuery,
    handleScrollToGroup
  } = useStoreData();

  const { adminUser, adminToken, isAuthHydrated } = useAuth();
  const { isCartOpen, setIsCartOpen, totalCount, subtotal } = useCart();

  // Hide header/footer and skip store maintenance checks on admin and delivery views
  const isAdminOrDelivery = pathname.startsWith('/admin') || pathname.startsWith('/delivery') || pathname.startsWith('/delivery-man');

  if (isAdminOrDelivery) {
    return <>{children}</>;
  }

  const isSuperAdmin = isAuthHydrated && !!adminUser && adminUser.role === 'admin' && !!adminToken;
  const isMaintenance = settings?.is_maintenance_mode === true;

  // While loading initial data, display FrontendLoadingScreen to prevent any flash of wrong content (maintenance vs website)
  if (loading && !isSuperAdmin) {
    return (
      <>
        <FrontendLoadingScreen />
        <div style={{ minHeight: '100vh', background: '#F8FAF8' }} />
      </>
    );
  }

  // STRICT MAINTENANCE BLOCKING:
  // If maintenance is ON and the visitor is NOT an authenticated admin, render ONLY MaintenanceModeView.
  // Nothing else is mounted in the DOM.
  if (isMaintenance && !isSuperAdmin) {
    return <MaintenanceModeView settings={settings} />;
  }

  return (
    <div className={`store-root-layout ${isCartOpen ? 'cart-drawer-active' : ''}`}>
      <FrontendLoadingScreen />
      <ScrollManager />

      {/* Admin Maintenance Mode Warning Banner (Visible ONLY to Logged-in Admin during maintenance) */}
      {isMaintenance && isSuperAdmin && (
        <div
          style={{
            background: 'linear-gradient(90deg, #9A3412 0%, #C2410C 50%, #B45309 100%)',
            color: '#FFFFFF',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'sticky',
            top: 0,
            zIndex: 99999,
            boxShadow: '0 2px 10px rgba(154, 52, 18, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#FDE68A" />
            <span>
              ⚠️ <strong>সতর্কতা:</strong> ওয়েবসাইটে বর্তমানে মেইনটেন্যান্স মোড (Maintenance Mode) চালু আছে! সাধারণ ভিজিটরদের কাছে সাইট বন্ধ দেখাচ্ছে।
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/settings')}
            style={{
              background: '#FFFFFF',
              color: '#9A3412',
              border: 'none',
              borderRadius: '9999px',
              padding: '4px 14px',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            সেটিংস থেকে বন্ধ করুন <ArrowRight size={13} />
          </button>
        </div>
      )}

      <Header
        settings={settings}
        groups={activeGroups}
        activeGroupTab={activeGroupTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectCategory={(id: any) => router.push(`/category/${id}`)}
        onNavigateHome={() => router.push('/')}
        onNavigateProfile={() => router.push('/profile')}
        onNavigateTrack={() => router.push('/track')}
        onScrollToGroup={handleScrollToGroup}
      />

      <main className="store-main-content">
        <div style={{ width: '100%' }}>
          {children}
        </div>
      </main>

      <CartDrawer
        onCheckout={() => {
          try {
            sessionStorage.removeItem('package_order_data');
            localStorage.removeItem('arot_active_package_order');
          } catch (e) {}
          router.push('/checkout');
        }}
      />

      {/* Floating Mini Cart Bar on Mobile when items are in cart and drawer is closed */}
      <AnimatePresence>
        {!isCartOpen && totalCount > 0 && (
          <motion.button
            key="mobile-floating-cart-bar"
            className="mobile-floating-cart-pill"
            onClick={() => setIsCartOpen(true)}
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.95 }}
            aria-label="কার্ট দেখুন"
          >
            <div className="mf-left">
              <span className="mf-icon-box">
                <ShoppingCart size={18} strokeWidth={2.5} />
                <span className="mf-count">{toBengaliNumber(totalCount)}</span>
              </span>
              <span className="mf-label">{toBengaliNumber(totalCount)}টি পণ্য</span>
            </div>
            <div className="mf-right">
              <span className="mf-total">৳{toBengaliNumber(subtotal)}</span>
              <span className="mf-view-cart">কার্ট দেখুন →</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AuthModal />
      <ToastContainer />
      <SocialButtons variant="fixed" />
      <DesktopFloatingCart />

      <Footer />
    </div>
  );
}
