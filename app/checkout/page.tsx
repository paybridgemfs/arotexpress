"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import CheckoutView from '@/src/components/CheckoutView.jsx';
import StoreLayout from '@/app/StoreLayout';
import { useStoreData } from '@/src/context/StoreDataContext';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    paymentMethods,
    deliveryAreas,
    defaultDeliveryFee,
    setLastOrder,
    settings
  } = useStoreData();

  React.useEffect(() => {
    const siteName = (settings && settings.site_name ? settings.site_name.trim() : '') || 'আড়ৎ এক্সপ্রেস (Arot Express)';
    const title = `চেকআউট — ${siteName}`;
    if (document.title !== title) {
      document.title = title;
    }
  }, [settings?.site_name]);

  return (
    <StoreLayout>
      <motion.div
        key="checkout-view"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        style={{ width: '100%' }}
      >
        <CheckoutView
          paymentMethods={paymentMethods}
          deliveryAreas={deliveryAreas}
          defaultDeliveryFee={defaultDeliveryFee}
          onBackToShop={() => router.push('/')}
          onOrderSuccess={(order: any) => {
            setLastOrder(order);
            router.push('/confirm');
          }}
        />
      </motion.div>
    </StoreLayout>
  );
}
