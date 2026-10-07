"use client";
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingBag, Minus, Plus, CheckCircle2, ShieldCheck, Truck, Layers, Sparkles } from 'lucide-react';
import { useCart } from '@/src/context/CartContext.jsx';
import { useStoreData } from '@/src/context/StoreDataContext';
import { toBengaliNumber } from '@/src/utils/bengali.js';
import CategoryIcon from './CategoryIcon.jsx';

function ProductItemImage({ image, category, alt, isOutOfStock }) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  let rawImg = image || (category?.icon && typeof category.icon === 'string' && (category.icon.startsWith('http') || category.icon.startsWith('/') || category.icon.startsWith('data:image')) ? category.icon : null);
  if (rawImg && typeof rawImg === 'string' && rawImg.includes('pngimg.com')) {
    rawImg = null;
  }

  return (
    <div className="product-image-wrap">
      {rawImg && !error ? (
        <>
          {!loaded && (
            <div className="product-image-skeleton skeleton-shimmer" />
          )}
          {rawImg.startsWith('blob:') || rawImg.startsWith('data:image') ? (
            <img
              src={rawImg}
              alt={alt}
              className={`product-thumb-img ${loaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ objectFit: 'contain', padding: '6px' }}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
            />
          ) : (
            <Image
              src={rawImg}
              alt={alt}
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 180px"
              referrerPolicy="no-referrer"
              className={`product-thumb-img ${loaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ objectFit: 'contain', padding: '6px' }}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
            />
          )}
        </>
      ) : (
        <div className="product-placeholder-icon">
          <CategoryIcon icon={category?.icon} category={category} size={48} />
        </div>
      )}

      {isOutOfStock && (
        <span className="stock-badge-tag out-of-stock">
          স্টক শেষ
        </span>
      )}
    </div>
  );
}

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
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--surface)', paddingBottom: '80px' }}>
      <div className="section-wrap" style={{ paddingTop: '24px', maxWidth: '1140px', margin: '0 auto' }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 600, padding: 0 }}
          >
            হোম
          </button>
          <span>/</span>
          <button
            onClick={() => router.push(`/category/${category.id || categoryId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 600, padding: 0 }}
          >
            {category.bn || 'ক্যাটাগরি'}
          </button>
          <span>/</span>
          <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{product.name}</span>
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
            backgroundColor: 'var(--surface-bright, #FFFFFF)',
            border: '1px solid var(--rule)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--ink-secondary)',
            cursor: 'pointer',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <ArrowLeft size={16} /> পেছনে ফিরে যান
        </button>

        {/* Main Product Detail Card (Matches Site M3 Card Design) */}
        <div
          style={{
            backgroundColor: 'var(--surface-bright, #FFFFFF)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--rule)',
            boxShadow: 'var(--shadow-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(24px, 4vw, 40px)',
            padding: 'clamp(20px, 4vw, 36px)',
            alignItems: 'center',
            marginBottom: '40px'
          }}
        >
          {/* Left Column: Product Image (Balanced, Professional Size) */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '320px',
                aspectRatio: '1 / 1',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--rule)',
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
                  sizes="(max-width: 768px) 100vw, 320px"
                  referrerPolicy="no-referrer"
                  style={{ objectFit: 'contain', padding: '20px' }}
                />
              ) : (
                <div style={{ transform: 'scale(2.2)' }}>
                  <CategoryIcon icon={category.icon} category={category} size={60} />
                </div>
              )}

              {isOutOfStock && (
                <span className="stock-badge-tag out-of-stock" style={{ top: '12px', right: '12px', left: 'auto', fontSize: '11px', padding: '4px 10px' }}>
                  স্টক শেষ
                </span>
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
                backgroundColor: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
                border: '1px solid #BBF7D0',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
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
                color: 'var(--ink)',
                margin: '0 0 8px',
                letterSpacing: '-0.3px',
                lineHeight: 1.3
              }}
            >
              {product.name}
            </h1>

            <div style={{ fontSize: '13.5px', color: 'var(--muted)', fontWeight: 600, marginBottom: '20px' }}>
              একক / পরিমাণ: <strong style={{ color: 'var(--ink)' }}>{product.unit}</strong>
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
              <span className="product-price-display" style={{ fontSize: '32px' }}>
                ৳ {toBengaliNumber(product.price)}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>
                ({product.unit} প্রতি)
              </span>
            </div>

            {/* Stock Status */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700 }}>
              {isOutOfStock ? (
                <span style={{ color: 'var(--danger)' }}>❌ দুঃখিত, বর্তমানে এই পণ্যটির স্টক শেষ রয়েছে।</span>
              ) : (
                <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
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
                    backgroundColor: isOutOfStock ? 'var(--rule)' : 'var(--green)',
                    color: isOutOfStock ? 'var(--muted)' : '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    padding: '14px 24px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: isOutOfStock ? 'none' : 'var(--shadow-green)'
                  }}
                >
                  <ShoppingBag size={18} /> কার্টে যোগ করুন ({product.unit})
                </motion.button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--md-primary-container)',
                    border: '1.5px solid #86EFAC',
                    borderRadius: 'var(--radius)',
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
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #BBF7D0',
                      color: 'var(--green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={16} />
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--green)' }}>
                      {toBengaliNumber(qty)} {product.unit}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--green-dark)', fontWeight: 700 }}>কার্টে যুক্ত আছে</div>
                  </div>

                  <button
                    onClick={handleIncrement}
                    disabled={qty >= stock}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: qty >= stock ? 'var(--muted)' : 'var(--green)',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', borderTop: '1px solid var(--rule)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="var(--green)" />
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-secondary)' }}>১০০% খাঁটি ও তাজা পণ্য</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={20} color="var(--green)" />
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-secondary)' }}>দ্রুত হোম ডেলিভারি</div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products in Category (Uses exact same product-card-modern & products-grid-view component structure as main website) */}
        {brands.length > 1 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--green)" /> {category.bn} ক্যাটাগরির অন্যান্য পণ্য
            </h2>

            <div className="products-grid-view">
              {brands
                .filter((b: any) => String(b.id || b.name) !== String(product.id || product.name))
                .slice(0, 12)
                .map((b: any, idx: number) => {
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
                    <motion.div
                      className="product-card-modern"
                      key={b.id || b.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                      whileHover={!bOutOfStock ? { y: -3, boxShadow: 'var(--shadow-md)' } : {}}
                      style={{ opacity: bOutOfStock ? 0.75 : 1 }}
                    >
                      <div
                        onClick={() => router.push(`/category/${category.id || categoryId}/product/${b.id || encodeURIComponent(b.name)}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <ProductItemImage
                          image={b.image}
                          category={category}
                          alt={b.name}
                          isOutOfStock={bOutOfStock}
                        />
                      </div>

                      <div className="product-card-content">
                        <div className="product-unit-text">{b.unit}</div>
                        <h3
                          className="product-name-title"
                          onClick={() => router.push(`/category/${category.id || categoryId}/product/${b.id || encodeURIComponent(b.name)}`)}
                          style={{ cursor: 'pointer' }}
                          title="বিস্তারিত দেখতে ক্লিক করুন"
                        >
                          {b.name}
                        </h3>

                        <div className="product-card-bottom">
                          <div className="product-price-display">৳{toBengaliNumber(b.price)}</div>

                          <div className="product-action-container">
                            {bQty > 0 ? (
                              <div className="qty-stepper">
                                <motion.button
                                  aria-label="কমান"
                                  whileTap={{ scale: 0.82 }}
                                  onClick={() => changeQty(bKey, -1, bItemMeta)}
                                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Minus size={13} />
                                </motion.button>
                                <span>{toBengaliNumber(bQty)}</span>
                                <motion.button
                                  aria-label="বাড়ান"
                                  whileTap={bQty < bStock ? { scale: 0.82 } : {}}
                                  onClick={() => {
                                    if (bQty < bStock) {
                                      changeQty(bKey, 1, bItemMeta);
                                    }
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: bQty >= bStock ? 0.3 : 1,
                                    cursor: bQty >= bStock ? 'not-allowed' : 'pointer'
                                  }}
                                  disabled={bQty >= bStock}
                                >
                                  <Plus size={13} />
                                </motion.button>
                              </div>
                            ) : (
                              <motion.button
                                className="add-btn"
                                whileHover={!bOutOfStock ? { scale: 1.04 } : {}}
                                whileTap={!bOutOfStock ? { scale: 0.94 } : {}}
                                onClick={() => {
                                  if (!bOutOfStock) {
                                    changeQty(bKey, 1, bItemMeta);
                                  }
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  opacity: bOutOfStock ? 0.5 : 1,
                                  cursor: bOutOfStock ? 'not-allowed' : 'pointer',
                                  background: bOutOfStock ? 'var(--muted)' : undefined,
                                  borderColor: bOutOfStock ? 'var(--muted)' : undefined
                                }}
                                disabled={bOutOfStock}
                              >
                                <Plus size={14} /> <span>{bOutOfStock ? 'স্টক নেই' : 'যোগ'}</span>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
