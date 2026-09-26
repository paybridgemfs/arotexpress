"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Hero from '@/src/components/Hero.jsx';
import TrustFeatures from '@/src/components/TrustFeatures.jsx';
import CategoryGrid from '@/src/components/CategoryGrid.jsx';
import StoreLayout from '@/app/StoreLayout';
import { useStoreData } from '@/src/context/StoreDataContext';

export default function HomeClientView() {
  const router = useRouter();
  const {
    settings,
    activeGroups,
    activeCategories,
    searchQuery,
    loading,
    handleScrollToGroup,
    setActiveGroupTab,
    fetchData
  } = useStoreData();

  // Revalidate on mount to catch any live updates from admin or database
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.group-section');
      let currentId = '';
      const header = document.querySelector('header');
      const headerOffset = (header ? header.offsetHeight : 110) + 40;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = window.scrollY + rect.top;
        if (window.scrollY >= sectionTop - headerOffset) {
          currentId = section.id.replace('group-', '');
        }
      });

      if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 10) {
        if (sections.length > 0) {
          currentId = sections[sections.length - 1].id.replace('group-', '');
        }
      }

      if (currentId) {
        setActiveGroupTab((prev) => (prev !== currentId ? currentId : prev));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setTimeout(handleScroll, 100);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeGroups, activeCategories, searchQuery, setActiveGroupTab]);

  return (
    <StoreLayout>
      <motion.div
        key="home-view"
        id="home-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        style={{ width: '100%' }}
      >
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
      </motion.div>
    </StoreLayout>
  );
}
