"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import ConfirmationView from '@/src/components/ConfirmationView.jsx';
import StoreLayout from '@/app/StoreLayout';
import { useStoreData } from '@/src/context/StoreDataContext';

export default function ConfirmPage() {
  const router = useRouter();
  const { lastOrder, settings } = useStoreData();

  React.useEffect(() => {
    const siteName = (settings && settings.site_name ? settings.site_name.trim() : '') || 'আড়ৎ এক্সপ্রেস (Arot Express)';
    const title = `অর্ডার নিশ্চিতকরণ — ${siteName}`;
    if (document.title !== title) {
      document.title = title;
    }
  }, [settings?.site_name]);

  return (
    <StoreLayout>
      <motion.div
        key="confirm-view"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        style={{ width: '100%' }}
      >
        <ConfirmationView
          order={lastOrder}
          onContinueShopping={() => router.push('/')}
        />
      </motion.div>
    </StoreLayout>
  );
}
