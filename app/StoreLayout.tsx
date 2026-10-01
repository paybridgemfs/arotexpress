"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import Header from '@/src/components/Header.jsx';
import Footer from '@/src/components/Footer.jsx';
import CartDrawer from '@/src/components/CartDrawer.jsx';
import AuthModal from '@/src/components/AuthModal.jsx';
import ToastContainer from '@/src/components/ToastContainer.jsx';
import ScrollManager from '@/src/components/ScrollManager';
import SocialButtons from '@/src/components/SocialButtons.jsx';
import FrontendLoadingScreen from '@/src/components/FrontendLoadingScreen';
import DesktopFloatingCart from '@/src/components/DesktopFloatingCart';
import { useStoreData } from '@/src/context/StoreDataContext';
import { useCart } from '@/src/context/CartContext.jsx';
import { toBengaliNumber } from '@/src/utils/bengali.js';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    settings,
    activeGroups,
    activeGroupTab,
    searchQuery,
    setSearchQuery,
    handleScrollToGroup
  } = useStoreData();

  const { isCartOpen, setIsCartOpen, totalCount, subtotal } = useCart();

  // Hide header/footer on admin and delivery-man views
  const isAdminOrDelivery = pathname.startsWith('/admin') || pathname.startsWith('/delivery');

  if (isAdminOrDelivery) {
    return <>{children}</>;
  }

  return (
    <div className={`store-root-layout ${isCartOpen ? 'cart-drawer-active' : ''}`}>
      <FrontendLoadingScreen />
      <ScrollManager />
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
