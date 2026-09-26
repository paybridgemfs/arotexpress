"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/src/components/Header.jsx';
import Footer from '@/src/components/Footer.jsx';
import CartDrawer from '@/src/components/CartDrawer.jsx';
import AuthModal from '@/src/components/AuthModal.jsx';
import ToastContainer from '@/src/components/ToastContainer.jsx';
import ScrollManager from '@/src/components/ScrollManager';
import SocialButtons from '@/src/components/SocialButtons.jsx';
import { useStoreData } from '@/src/context/StoreDataContext';

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

  // Hide header/footer on admin and delivery-man views
  const isAdminOrDelivery = pathname.startsWith('/admin') || pathname.startsWith('/delivery');

  if (isAdminOrDelivery) {
    return <>{children}</>;
  }

  return (
    <div>
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
        onScrollToGroup={handleScrollToGroup}
      />

      <main style={{ display: 'grid', gridTemplateColumns: '1fr', alignItems: 'start' }}>
        <div style={{ gridArea: '1 / 1', width: '100%' }}>
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
      <AuthModal />
      <ToastContainer />
      <SocialButtons variant="fixed" />

      <Footer />
    </div>
  );
}
