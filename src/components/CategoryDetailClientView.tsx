"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import Hero from '@/src/components/Hero.jsx';
import TrustFeatures from '@/src/components/TrustFeatures.jsx';
import CategoryGrid from '@/src/components/CategoryGrid.jsx';
import ProductDetail from '@/src/components/ProductDetail.jsx';
import StoreLayout from '@/app/StoreLayout';
import { useStoreData } from '@/src/context/StoreDataContext';

export default function CategoryDetailClientView({ categoryIdParam }: { categoryIdParam: string }) {
  const router = useRouter();
  const selectedCategoryId = parseInt(categoryIdParam, 10) || categoryIdParam;

  const {
    settings,
    activeGroups,
    activeCategories,
    searchQuery,
    loading,
    handleScrollToGroup,
    fetchData
  } = useStoreData();

  React.useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const selectedCategory = activeCategories.find(
    (c: any) => c.id === selectedCategoryId || String(c.id) === String(categoryIdParam)
  );

  // Synchronize category document title immediately
  React.useEffect(() => {
    const siteName = (settings && settings.site_name ? settings.site_name.trim() : '') || 'আড়ৎ এক্সপ্রেস (Arot Express)';
    if (selectedCategory) {
      const enSuffix = selectedCategory.en ? ` (${selectedCategory.en})` : '';
      const title = `${selectedCategory.bn}${enSuffix} — ${siteName}`;
      if (document.title !== title) {
        document.title = title;
      }
    } else {
      const title = `ক্যাটাগরি বিস্তারিত — ${siteName}`;
      if (document.title !== title) {
        document.title = title;
      }
    }
  }, [selectedCategory, settings?.site_name]);

  return (
    <StoreLayout>
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Background Grid View */}
        <Hero
          settings={settings}
          categories={activeCategories}
          onExploreClick={() => {
            const firstGroup = activeGroups[0];
            if (firstGroup) handleScrollToGroup(firstGroup.key);
          }}
        />
        <TrustFeatures />
        <CategoryGrid
          groups={activeGroups}
          categories={activeCategories}
          searchQuery={searchQuery}
          isLoading={loading}
          onSelectCategory={(id: any) => {
            router.push(`/category/${id}`);
          }}
        />

        {/* Product Detail Modal / Sheet */}
        <AnimatePresence>
          <ProductDetail
            key={`product-detail-modal-${selectedCategoryId}`}
            categoryId={selectedCategoryId}
            category={selectedCategory}
            isLoading={loading}
            onBack={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
          />
        </AnimatePresence>
      </div>
    </StoreLayout>
  );
}
