"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingBag, Minus, Plus, CheckCircle2, ShieldCheck, Truck, Layers, Eye, Sparkles } from 'lucide-react';
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
  const { categories } = useStoreData();
  const { cart, changeQty } = useCart();

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

  const prodKey = product.id ? `p-${product.id}` : `${category.id || categoryId}-${product.name}`;
  const cartItem = cart[prodKey] || cart[`${category.id || categoryId}-${product.name}`];
  const qty = cartItem ? cartItem.qty : 0;
  const stock = product.stock ?? 100;
  const isOutOfStock = product.force_stock_out || stock === 0;

  const itemMeta = {
    catId: category.id || categoryId,
    catEn: category.en || 'General',
    catBn: category.bn || 'সাধারণ',
    productId: product.id || null,
    brandId: product.id || null,
    brand: product.name,
    unit: product.unit,
    price: product.price,
    image: product.image || '',
    stock: stock
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    changeQty(prodKey, 1, itemMeta);
  };

  const handleIncrement = () => {
    if (isOutOfStock || qty >= stock) return;
    changeQty(prodKey, 1, itemMeta);
  };

  const handleDecrement = () => {
    if (qty > 0) {
      changeQty(prodKey, -1, itemMeta);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '80vh', backgroundColor: '#F8FAFC', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        
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
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(`/category/${category.id || categoryId}`);
            }
          }}
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(24px, 4vw, 48px)',
            padding: 'clamp(20px, 4vw, 40px)',
            alignItems: 'center',
            marginBottom: '40px'
          }}
        >
          {/* Left Column: Product Image (Balanced, Professional Size) */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '340px',
                aspectRatio: '1 / 1',
                borderRadius: '20px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.01)'
              }}
            >
              {product.image && !product.image.includes('pngimg.com') ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
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
                    disabled={qty >= stock}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: qty >= stock ? '#CBD5E1' : '#15803D',
                      border: 'none',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: qty >= stock ? 'not-allowed' : 'pointer',
                      opacity: qty >= stock ? 0.6 : 1
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Trust Guarantees */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
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
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#006C4C" /> {category.bn} ক্যাটাগরির অন্যান্য পণ্য
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px'
              }}
            >
              {brands
                .filter((b: any) => String(b.id || b.name) !== String(product.id || product.name))
                .slice(0, 6)
                .map((b: any) => {
                  const bKey = b.id ? `p-${b.id}` : `${category.id || categoryId}-${b.name}`;
                  const bCartItem = cart[bKey];
                  const bQty = bCartItem ? bCartItem.qty : 0;
                  const bStock = b.stock ?? 100;
                  const bOutOfStock = b.force_stock_out || bStock === 0;

                  const bItemMeta = {
                    catId: category.id || categoryId,
                    catEn: category.en || 'General',
                    catBn: category.bn || 'সাধারণ',
                    productId: b.id || null,
                    brandId: b.id || null,
                    brand: b.name,
                    unit: b.unit,
                    price: b.price,
                    image: b.image || '',
                    stock: bStock
                  };

                  return (
                    <div
                      key={b.id || b.name}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div
                        onClick={() => router.push(`/category/${category.id || categoryId}/product/${b.id || encodeURIComponent(b.name)}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '130px',
                            position: 'relative',
                            backgroundColor: '#F8FAFC',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px',
                            overflow: 'hidden'
                          }}
                        >
                          {b.image && !b.image.includes('pngimg.com') ? (
                            <Image
                              src={b.image}
                              alt={b.name}
                              fill
                              sizes="200px"
                              referrerPolicy="no-referrer"
                              style={{ objectFit: 'contain', padding: '10px' }}
                            />
                          ) : (
                            <CategoryIcon icon={category.icon} category={category} size={42} />
                          )}
                          {bOutOfStock && (
                            <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#FEE2E2', color: '#DC2626', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                              স্টক শেষ
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{b.unit}</div>
                        <div
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: '#0F172A',
                            margin: '2px 0 6px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: '36px'
                          }}
                        >
                          {b.name}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginTop: '8px', gap: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#006C4C', flex: 1 }}>
                          ৳ {toBengaliNumber(b.price)}
                        </div>

                        {bQty > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '2px 6px', gap: '6px' }}>
                            <button
                              onClick={() => changeQty(bKey, -1, bItemMeta)}
                              style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: '4px', width: '22px', height: '22px', color: '#15803D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803D' }}>{toBengaliNumber(bQty)}</span>
                            <button
                              onClick={() => {
                                if (bQty < bStock) changeQty(bKey, 1, bItemMeta);
                              }}
                              disabled={bQty >= bStock}
                              style={{ background: '#15803D', border: 'none', borderRadius: '4px', width: '22px', height: '22px', color: '#FFFFFF', cursor: bQty >= bStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: bQty >= bStock ? 0.5 : 1 }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={!bOutOfStock ? { scale: 1.05 } : {}}
                            whileTap={!bOutOfStock ? { scale: 0.95 } : {}}
                            onClick={() => {
                              if (!bOutOfStock) changeQty(bKey, 1, bItemMeta);
                            }}
                            disabled={bOutOfStock}
                            style={{
                              backgroundColor: bOutOfStock ? '#E2E8F0' : '#006C4C',
                              color: bOutOfStock ? '#94A3B8' : '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: bOutOfStock ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <ShoppingBag size={12} /> <span>যোগ</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
