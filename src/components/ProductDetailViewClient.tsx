"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingBag, Minus, Plus, CheckCircle2, ShieldCheck, Truck, RefreshCw, Layers } from 'lucide-react';
import Header from '@/src/components/Header.jsx';
import Footer from '@/src/components/Footer.jsx';
import CartDrawer from '@/src/components/CartDrawer.jsx';
import ToastContainer from '@/src/components/ToastContainer.jsx';
import { useCart } from '@/src/context/CartContext.jsx';
import { useStoreData } from '@/src/context/StoreDataContext';
import { toBengaliNumber } from '@/src/utils/bengali.js';
import CategoryIcon from './CategoryIcon.jsx';

interface ProductDetailViewClientProps {
  categoryId: string;
  productId: string;
  initialCategory?: any;
  initialProduct?: any;
}

export default function ProductDetailViewClient({
  categoryId,
  productId,
  initialCategory,
  initialProduct
}: ProductDetailViewClientProps) {
  const router = useRouter();
  const {
    categories,
    settings,
    activeGroups,
    activeGroupTab,
    searchQuery,
    setSearchQuery,
    handleScrollToGroup
  } = useStoreData();

  const { cart, changeQty, setIsCartOpen, totalCount } = useCart();

  // Find category and product
  const category =
    initialCategory ||
    categories.find((c: any) => String(c.id) === String(categoryId) || c.en?.toLowerCase() === categoryId.toLowerCase()) ||
    {};

  const brands = category?.brands || [];
  const product =
    initialProduct ||
    brands.find((b: any) => String(b.id) === String(productId) || String(b.name) === decodeURIComponent(productId)) ||
    brands[0] || {
      id: productId,
      name: decodeURIComponent(productId),
      unit: 'প্রতি একক',
      price: 100,
      image: '',
      stock: 100
    };

  const prodKey = product.id ? `p-${product.id}` : `${category.id || 1}-${product.name}`;
  const cartItem = cart[prodKey] || cart[`${category.id || 1}-${product.name}`];
  const qty = cartItem ? cartItem.qty : 0;
  const stock = product.stock ?? 100;
  const isOutOfStock = product.force_stock_out || stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    changeQty(
      {
        catId: category.id || 1,
        catEn: category.en || 'General',
        catBn: category.bn || 'সাধারণ',
        productId: product.id || null,
        brandId: product.id || null,
        brand: product.name,
        unit: product.unit,
        price: product.price,
        image: product.image || '',
        stock: stock
      },
      1
    );
  };

  const handleIncrement = () => {
    if (isOutOfStock) return;
    changeQty(
      {
        catId: category.id || 1,
        catEn: category.en || 'General',
        catBn: category.bn || 'সাধারণ',
        productId: product.id || null,
        brandId: product.id || null,
        brand: product.name,
        unit: product.unit,
        price: product.price,
        image: product.image || '',
        stock: stock
      },
      qty + 1
    );
  };

  const handleDecrement = () => {
    if (qty > 0) {
      changeQty(
        {
          catId: category.id || 1,
          catEn: category.en || 'General',
          catBn: category.bn || 'সাধারণ',
          productId: product.id || null,
          brandId: product.id || null,
          brand: product.name,
          unit: product.unit,
          price: product.price,
          image: product.image || '',
          stock: stock
        },
        qty - 1
      );
    }
  };

  return (
    <div className="store-root-layout">
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

      <main className="store-main-content" style={{ paddingBottom: '60px' }}>
        <div className="section-wrap" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
          
          {/* Breadcrumb Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 600, padding: 0 }}
            >
              হোম
            </button>
            <span>/</span>
            <button
              onClick={() => router.push(`/category/${category.id || categoryId}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 600, padding: 0 }}
            >
              {category.bn || 'ক্যাটাগরি'}
            </button>
            <span>/</span>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>{product.name}</span>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '9999px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              marginBottom: '24px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <ArrowLeft size={16} /> পেছনে ফিরে যান
          </button>

          {/* Product Detail Two-Column Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 30px -5px rgba(0,0,0,0.04)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'clamp(24px, 4vw, 48px)',
              padding: 'clamp(24px, 5vw, 40px)',
              alignItems: 'center',
              marginBottom: '40px'
            }}
          >
            {/* Left Column: Product Image */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: '18px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {product.image && !product.image.includes('pngimg.com') ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  referrerPolicy="no-referrer"
                  style={{ objectFit: 'contain', padding: '24px' }}
                />
              ) : (
                <div style={{ transform: 'scale(2.2)' }}>
                  <CategoryIcon icon={category.icon} category={category} size={64} />
                </div>
              )}

              {isOutOfStock && (
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FECDD3',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 800
                  }}
                >
                  স্টক শেষ
                </div>
              )}
            </div>

            {/* Right Column: Details & Cart Action */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#F0FDF4',
                  color: '#15803D',
                  border: '1px solid #BBF7D0',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '14px'
                }}
              >
                <Layers size={13} /> {category.bn || 'মুদি পণ্য'} ({category.en || 'Grocery'})
              </div>

              <h1
                style={{
                  fontSize: 'clamp(22px, 3.5vw, 28px)',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: '0 0 10px',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.3
                }}
              >
                {product.name}
              </h1>

              <div style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 600, marginBottom: '20px' }}>
                একক / পরিমাণ: <strong style={{ color: '#0F172A' }}>{product.unit}</strong>
              </div>

              {/* Price Tag */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '24px'
                }}
              >
                <span style={{ fontSize: '32px', fontWeight: 900, color: '#006C4C', letterSpacing: '-0.5px' }}>
                  ৳ {toBengaliNumber(product.price)}
                </span>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                  ({product.unit} প্রতি)
                </span>
              </div>

              {/* Stock Status */}
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700 }}>
                {isOutOfStock ? (
                  <span style={{ color: '#DC2626' }}>❌ দুঃখিত, বর্তমানে এই পণ্যটির স্টক শেষ রয়েছে।</span>
                ) : (
                  <span style={{ color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={16} /> স্টকে উপলব্ধ রয়েছে (পাইকারি ও খুচরা অর্ডার গ্রহণযোগ্য)
                  </span>
                )}
              </div>

              {/* Add to Cart / Quantity Controller */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                {qty === 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    style={{
                      flex: 1,
                      backgroundColor: isOutOfStock ? '#E2E8F0' : '#006C4C',
                      color: isOutOfStock ? '#94A3B8' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '14px 24px',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isOutOfStock ? 'none' : '0 4px 14px rgba(0, 108, 76, 0.25)'
                    }}
                  >
                    <ShoppingBag size={18} /> কার্টে যোগ করুন ({product.unit})
                  </motion.button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      borderRadius: '14px',
                      padding: '8px 16px',
                      gap: '16px',
                      flex: 1,
                      justifyContent: 'space-between'
                    }}
                  >
                    <button
                      onClick={handleDecrement}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #BBF7D0',
                        color: '#15803D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={16} />
                    </button>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#15803D' }}>
                        {toBengaliNumber(qty)} {product.unit}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 700 }}>কার্টে যুক্ত আছে</div>
                    </div>

                    <button
                      onClick={handleIncrement}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#15803D',
                        border: 'none',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Trust Guarantees */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="#006C4C" />
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>১০০% খাঁটি ও তাজা পণ্য</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Truck size={20} color="#006C4C" />
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>দ্রুত হোম ডেলিভারি</div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products in Category */}
          {brands.length > 1 && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
                {category.bn} ক্যাটাগরির অন্যান্য পণ্য
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px'
                }}
              >
                {brands
                  .filter((b: any) => String(b.id || b.name) !== String(product.id || product.name))
                  .slice(0, 4)
                  .map((b: any) => (
                    <div
                      key={b.id || b.name}
                      onClick={() => router.push(`/category/${category.id}/product/${b.id || encodeURIComponent(b.name)}`)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ width: '1000px', height: '120px', position: 'relative', marginBottom: '10px' }}>
                        {/* Thumbnail */}
                        <div style={{ width: '100%', height: '120px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '10px' }}>
                          {b.image && !b.image.includes('pngimg.com') ? (
                            <Image src={b.image} alt={b.name} fill sizes="200px" referrerPolicy="no-referrer" style={{ objectFit: 'contain', padding: '8px' }} />
                          ) : (
                            <CategoryIcon icon={category.icon} category={category} size={36} />
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{b.unit}</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', margin: '2px 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#006C4C' }}>৳ {toBengaliNumber(b.price)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <CartDrawer
        onCheckout={() => {
          try {
            sessionStorage.removeItem('package_order_data');
            localStorage.removeItem('arot_active_package_order');
          } catch (e) {}
          router.push('/checkout');
        }}
      />
      <ToastContainer />
    </div>
  );
}
