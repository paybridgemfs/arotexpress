"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchX, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { toBengaliNumber } from '../utils/bengali.js';
import CategoryIcon from './CategoryIcon.jsx';

export default function CategoryGrid({
  groups = [],
  categories = [],
  searchQuery = '',
  isLoading = false,
  onSelectCategory
}) {
  const { cart } = useCart();
  const query = searchQuery.trim().toLowerCase();
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroupExpand = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Calculate in-cart count for each category
  const getCatCartCount = (catId) => {
    return Object.values(cart)
      .filter((i) => i.catId === catId)
      .reduce((sum, i) => sum + i.qty, 0);
  };

  // Filter groups that have matching categories
  const filteredGroups = useMemo(() => {
    return groups.map((g) => {
      const groupCats = categories.filter((c) => {
        if (c.group !== g.key) return false;
        if (!query) return true;
        const searchHaystack = `${c.bn || ''} ${c.en || ''} ${(c.brands || []).map((b) => b.name).join(' ')}`.toLowerCase();
        return searchHaystack.includes(query);
      });
      return { ...g, groupCats };
    }).filter((g) => g.groupCats.length > 0);
  }, [groups, categories, query]);

  const displayedGroups = filteredGroups;

  // Initial Skeleton loading state
  if (isLoading && (!groups || groups.length === 0)) {
    return (
      <section className="section-wrap" id="groups-wrap">
        {[1, 2, 3].map((g) => (
          <section className="group-section skel-cat-section animate-pulse" key={`sk-g-${g}`}>
            <div className="section-head mb-4">
              <div className="skel-block section-head-skel"></div>
            </div>
            <div className="grid">
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <div key={`sk-c-${c}`} className="skel-cat-card">
                  <div className="skel-circle skel-cat-icon"></div>
                  <div className="skel-block skel-cat-text"></div>
                  <div className="skel-block skel-cat-text-sm"></div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </section>
    );
  }

  const totalVisibleCategories = displayedGroups.reduce(
    (sum, g) => sum + g.groupCats.length,
    0
  );

  return (
    <section className="section-wrap" id="groups-wrap">
      {displayedGroups.map((g, gIdx) => {
        const groupCats = g.groupCats;
        const isExpanded = query ? true : !!expandedGroups[g.key];
        const visibleCats = (isExpanded || groupCats.length <= 12) ? groupCats : groupCats.slice(0, 12);
        const hasMore = groupCats.length > 12 && !query;

        return (
          <motion.section
            className="group-section"
            id={`group-${g.key}`}
            key={g.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(gIdx * 0.05, 0.2) }}
          >
            <div className="section-head">
              <h2>{g.bn}</h2>
              <span className="tag mono">
                {g.en} · {toBengaliNumber(groupCats.length)} ক্যাটাগরি
              </span>
            </div>

            <div className="grid">
              {visibleCats.map((cat, cIdx) => {
                const inCartCount = getCatCartCount(cat.id);
                return (
                  <motion.button
                    key={cat.id}
                    className="cat-card"
                    onClick={() => onSelectCategory(cat.id)}
                    aria-label={`${cat.bn} (${cat.en}) বিস্তারিত দেখুন`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(cIdx * 0.015, 0.25) }}
                    whileHover={{ y: -5, boxShadow: 'var(--shadow-md)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="badge-num">{toBengaliNumber(cat.id)}</span>
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '4px auto 12px auto'
                      }}
                    >
                      <CategoryIcon icon={cat.icon} category={cat} size={80} />
                    </div>
                    <span className="en">{cat.en}</span>
                    <span className="bn">{cat.bn}</span>
                    <AnimatePresence>
                      {inCartCount > 0 && (
                        <motion.span
                          key={`in-cart-badge-${cat.id}`}
                          className="in-cart-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          {toBengaliNumber(inCartCount)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => toggleGroupExpand(g.key)}
                  className="admin-btn secondary"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    border: '1px solid var(--rule)'
                  }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={16} />
                      <span>কম দেখুন</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      <span>আরও {toBengaliNumber(groupCats.length - 12)}টি ক্যাটাগরি দেখুন</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.section>
        );
      })}

      {/* No Results Fallback */}
      {query && totalVisibleCategories === 0 && (
        <motion.div
          id="no-results"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="big" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '12px' }}>
            <SearchX size={44} />
          </div>
          <h3 style={{ margin: '0 0 6px' }}>কিছু পাওয়া যায়নি</h3>
          <p>অন্য বানানে বা ভিন্ন নামে খুঁজে দেখুন।</p>
        </motion.div>
      )}
    </section>
  );
}
