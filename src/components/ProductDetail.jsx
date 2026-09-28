"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Minus, Plus, Package } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { toBengaliNumber, formatStockDisplay } from '../utils/bengali.js';
import CategoryIcon from './CategoryIcon.jsx';

export default function ProductDetail({ categoryId, category, isLoading, onBack }) {
  const { cart, changeQty } = useCart();
  const [headerHeight, setHeaderHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const headerEl = document.querySelector('.main-app-header');
      if (headerEl) {
        const h = headerEl.getBoundingClientRect().height;
        if (h > 0) return h;
      }
      const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--app-header-height');
      if (cssVar) {
        const parsed = parseFloat(cssVar);
        if (parsed > 0) return parsed;
      }
      return window.innerWidth <= 768 ? 154 : 110;
    }
    return 110;
  });
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Progressive lazy loading for products in category
  const [visibleProductCount, setVisibleProductCount] = useState(12);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const productSentinelRef = useRef(null);

  useEffect(() => {
    // Quick skeleton transition effect on category open
    const t = setTimeout(() => {
      setIsTransitioning(false);
    }, 180);
    return () => clearTimeout(t);
  }, [categoryId]);

  useEffect(() => {
    const prevPos = window.scrollY;
    document.body.style.overflow = 'hidden';
    
    const updateHeight = () => {
      const headerEl = document.querySelector('.main-app-header');
      if (headerEl) {
        const h = headerEl.getBoundingClientRect().height;
        if (h > 0) {
          setHeaderHeight(h);
          document.documentElement.style.setProperty('--app-header-height', `${h}px`);
        }
      }
    };
    
    updateHeight();
    const t1 = setTimeout(updateHeight, 50);
    const t2 = setTimeout(updateHeight, 200);

    const headerEl = document.querySelector('.main-app-header');
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && headerEl) {
      resizeObserver = new ResizeObserver(() => {
        updateHeight();
      });
      resizeObserver.observe(headerEl);
    }

    window.addEventListener('resize', updateHeight);
    
    return () => { 
      document.body.style.overflow = ''; 
      window.removeEventListener('resize', updateHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearTimeout(t1);
      clearTimeout(t2);
      if (prevPos > 0) {
        window.scrollTo({ top: prevPos, behavior: 'instant' });
      }
    };
  }, []);

  const brands = category?.brands || [];

  // Displayed products slice
  const displayedBrands = useMemo(() => {
    return brands.slice(0, visibleProductCount);
  }, [brands, visibleProductCount]);

  // Observer for progressive chunk loading of products
  useEffect(() => {
    if (visibleProductCount >= brands.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loadingMoreProducts) {
          setLoadingMoreProducts(true);
          setTimeout(() => {
            setVisibleProductCount((prev) => Math.min(prev + 12, brands.length));
            setLoadingMoreProducts(false);
          }, 200);
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    const currentSentinel = productSentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [visibleProductCount, brands.length, loadingMoreProducts]);

  // Skeleton loading state
  if ((isLoading || isTransitioning) && !category) {
    return (
      <motion.div
        id="product-view"
        style={{
          position: 'fixed',
          top: headerHeight > 0 ? `${headerHeight}px` : 'var(--app-header-height, 110px)',
          left: 0,
          width: '100%',
          height: headerHeight > 0 ? `calc(100dvh - ${headerHeight}px)` : 'calc(100dvh - var(--app-header-height, 110px))',
          backgroundColor: 'var(--paper)',
          zIndex: 35,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'var(--paper)',
            padding: '16px',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div className="section-wrap" style={{ padding: 0, width: '100%', display: 'flex' }}>
            <div className="skel-block skel-breadcrumb" style={{ margin: 0, padding: '16px', width: '200px' }}></div>
          </div>
        </div>
        <section className="section-wrap animate-pulse" style={{ paddingTop: '16px' }}>
          <div className="skel-pd-banner">
            <div
              className="skel-circle skel-pd-banner-icon"
              style={{ width: '48px', height: '48px' }}
            ></div>
            <div>
              <div className="skel-block skel-pd-banner-title"></div>
              <div className="skel-block skel-pd-banner-sub"></div>
            </div>
          </div>

          <div className="products-grid-view">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sk) => (
              <div
                className="product-card-modern"
                key={`sk-prod-${sk}`}
                style={{ padding: '14px', border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)', background: '#FFFFFF' }}
              >
                <div className="skel-block skel-pd-card-img"></div>
                <div className="product-card-content">
                  <div className="skel-block skel-pd-card-meta"></div>
                  <div className="skel-block skel-pd-card-title"></div>
                  <div className="skel-pd-card-bottom">
                    <div className="skel-block skel-pd-card-price"></div>
                    <div className="skel-block skel-pd-card-btn"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    );
  }

  if (!category) return null;

  return (
    <motion.div
      id="product-view"
      style={{
        position: 'fixed',
        top: headerHeight > 0 ? `${headerHeight}px` : 'var(--app-header-height, 110px)',
        left: 0,
        width: '100%',
        height: headerHeight > 0 ? `calc(100dvh - ${headerHeight}px)` : 'calc(100dvh - var(--app-header-height, 110px))',
        backgroundColor: 'var(--paper)',
        zIndex: 35,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--paper)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '16px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="section-wrap" style={{ padding: 0, width: '100%', display: 'flex' }}>
          <motion.button
            className="breadcrumb"
            onClick={onBack}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              margin: 0,
              padding: '8px 12px',
              background: 'var(--md-surface-container)',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={18} /> <span>সব ক্যাটাগরিতে ফিরে যান</span>
          </motion.button>
        </div>
      </div>

      <section className="section-wrap" style={{ paddingTop: '16px' }}>
        <motion.div
          className="pd-banner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div className="badge-num">{toBengaliNumber(category.id)}</div>
          <div
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '48px'
            }}
          >
            <CategoryIcon icon={category.icon} category={category} size={48} />
          </div>
          <div>
            <h2>{category.en}</h2>
            <div className="bn">{category.bn}</div>
          </div>
        </motion.div>

        <div className="products-grid-view">
          {displayedBrands.map((b, idx) => {
            const key = b.id ? `p-${b.id}` : `${category.id}-${b.name}`;
            const item = cart[key] || cart[`${category.id}-${b.name}`];
            const qty = item ? item.qty : 0;
            const stock = b.stock ?? 100;
            const isOutOfStock = b.force_stock_out || stock === 0;

            const itemMeta = {
              catId: category.id,
              catEn: category.en,
              catBn: category.bn,
              productId: b.id || null,
              brandId: b.id || null,
              brand: b.name,
              unit: b.unit,
              price: b.price,
              image: b.image || '',
              stock: stock
            };

            return (
              <motion.div
                className="product-card-modern"
                key={b.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2) }}
                whileHover={!isOutOfStock ? { y: -4, boxShadow: 'var(--shadow-md)' } : {}}
                style={{ opacity: isOutOfStock ? 0.7 : 1 }}
              >
                <div className="product-image-wrap">
                  {(() => {
                    const rawImg = b.image || (category?.icon && typeof category.icon === 'string' && (category.icon.startsWith('http') || category.icon.startsWith('/') || category.icon.startsWith('data:image')) ? category.icon : null);
                    if (!rawImg) {
                      return (
                        <div className="product-placeholder-icon">
                          <CategoryIcon icon={category.icon} category={category} size={48} />
                        </div>
                      );
                    }
                    const isBlobOrData = rawImg.startsWith('blob:') || rawImg.startsWith('data:image');
                    if (isBlobOrData) {
                      return <img src={rawImg} alt={b.name} className="product-thumb-img" />;
                    }
                    return (
                      <Image
                        src={rawImg}
                        alt={b.name}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 180px"
                        referrerPolicy="no-referrer"
                        className="product-thumb-img"
                        preload
                        style={{ objectFit: 'contain', padding: '6px' }}
                      />
                    );
                  })()}
                  <span className={`stock-badge-tag ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                    {isOutOfStock ? 'স্টক শেষ' : `মজুত: ${formatStockDisplay(stock, b.unit)}`}
                  </span>
                </div>

                <div className="product-card-content">
                  <div className="product-unit-text">{b.unit}</div>
                  <h3 className="product-name-title">{b.name}</h3>

                  <div className="product-card-bottom">
                    <div className="product-price-display">৳{toBengaliNumber(b.price)}</div>

                    <div className="product-action-container">
                      {qty > 0 ? (
                        <div className="qty-stepper">
                          <motion.button
                            aria-label="কমান"
                            whileTap={{ scale: 0.82 }}
                            onClick={() => changeQty(key, -1, itemMeta)}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Minus size={13} />
                          </motion.button>
                          <span>{toBengaliNumber(qty)}</span>
                          <motion.button
                            aria-label="বাড়ান"
                            whileTap={qty < stock ? { scale: 0.82 } : {}}
                            onClick={() => {
                              if (qty < stock) {
                                changeQty(key, 1, itemMeta);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: qty >= stock ? 0.3 : 1,
                              cursor: qty >= stock ? 'not-allowed' : 'pointer'
                            }}
                            disabled={qty >= stock}
                          >
                            <Plus size={13} />
                          </motion.button>
                        </div>
                      ) : (
                        <motion.button
                          className="add-btn"
                          whileHover={!isOutOfStock ? { scale: 1.04 } : {}}
                          whileTap={!isOutOfStock ? { scale: 0.94 } : {}}
                          onClick={() => {
                            if (!isOutOfStock) {
                              changeQty(key, 1, itemMeta);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: isOutOfStock ? 0.5 : 1,
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            background: isOutOfStock ? 'var(--muted)' : undefined,
                            borderColor: isOutOfStock ? 'var(--muted)' : undefined
                          }}
                          disabled={isOutOfStock}
                        >
                          <Plus size={14} /> <span>{isOutOfStock ? 'স্টক নেই' : 'যোগ করুন'}</span>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progressive Loading Skeleton Placeholder for Products */}
        {loadingMoreProducts && (
          <div className="products-grid-view animate-pulse" style={{ marginTop: '16px' }}>
            {[1, 2, 3, 4].map((sk) => (
              <div
                className="product-card-modern"
                key={`sk-lazy-prod-${sk}`}
                style={{ padding: '14px', border: '1px solid var(--rule)', borderRadius: 'var(--radius-lg)', background: '#FFFFFF' }}
              >
                <div className="skel-block skel-pd-card-img"></div>
                <div className="product-card-content">
                  <div className="skel-block skel-pd-card-meta"></div>
                  <div className="skel-block skel-pd-card-title"></div>
                  <div className="skel-pd-card-bottom">
                    <div className="skel-block skel-pd-card-price"></div>
                    <div className="skel-block skel-pd-card-btn"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sentinel element for infinite scroll */}
        {visibleProductCount < brands.length && (
          <div ref={productSentinelRef} style={{ height: '30px', width: '100%' }} />
        )}
      </section>
    </motion.div>
  );
}
