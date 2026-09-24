"use client";
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Package,
  Plus,
  Minus,
  ArrowRight,
  Info
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';
import { useStoreData } from '../context/StoreDataContext';
import { useCart } from '../context/CartContext.jsx';
import { usePackageBox } from '../context/PackageBoxContext.jsx';

export default function HeroPackageBox() {
  const router = useRouter();
  const { packageProducts = [], settings = {} } = useStoreData();
  const { showToast } = useCart();
  const {
    packageQuantities,
    isHydrated,
    getQty,
    increment,
    decrement
  } = usePackageBox();

  // Minimum distinct package products required as configured by admin
  const minItems = Math.max(1, parseInt(settings?.package_min_items || 1, 10));

  // Active package products sorted by slot_number (1 to 10)
  const activeProducts = useMemo(() => {
    const list = Array.isArray(packageProducts) ? packageProducts : [];
    return list
      .filter((p) => p.is_active !== false)
      .sort((a, b) => (a.slot_number || 0) - (b.slot_number || 0));
  }, [packageProducts]);

  // Divide into 2 parts: Part 1 (first 5 items) and Part 2 (next 5 items)
  const sideAProducts = useMemo(() => {
    return activeProducts.slice(0, 5);
  }, [activeProducts]);

  const sideBProducts = useMemo(() => {
    return activeProducts.slice(5, 10);
  }, [activeProducts]);

  // Calculations for selected package (using persisted packageQuantities)
  const selectedItems = useMemo(() => {
    const items = [];
    activeProducts.forEach((p) => {
      const qty = packageQuantities[p.id] || 0;
      if (qty > 0) {
        const regPrice = Number(p.regular_price) || 0;
        const fnlPrice = Number(p.final_price) || Math.max(0, regPrice - (Number(p.discount_amount) || 0));
        const discountEach = Math.max(0, regPrice - fnlPrice);

        items.push({
          productId: p.product_id || p.id,
          packageProductId: p.id,
          slot_number: p.slot_number,
          product_name: p.product_name,
          brand: p.product_name,
          unit: p.unit,
          qty,
          regular_price: regPrice,
          final_price: fnlPrice,
          price: fnlPrice,
          discount_amount: discountEach,
          total: fnlPrice * qty,
          savings: discountEach * qty
        });
      }
    });
    return items;
  }, [activeProducts, packageQuantities]);

  // Distinct products count: how many distinct package products are selected (regardless of quantity)
  const distinctProductsCount = selectedItems.length;
  // Total quantity of all units across selected products
  const totalQuantity = selectedItems.reduce((sum, it) => sum + it.qty, 0);

  const subtotal = selectedItems.reduce((sum, it) => sum + (it.regular_price * it.qty), 0);
  const totalSavings = selectedItems.reduce((sum, it) => sum + it.savings, 0);
  const packageTotal = selectedItems.reduce((sum, it) => sum + it.total, 0);

  // Must select at least minItems DIFFERENT products to proceed
  const canOrder = distinctProductsCount >= minItems;

  // Handle Proceed to Order Checkout
  const handleOrderNow = () => {
    if (distinctProductsCount < minItems) {
      showToast(`প্যাকেজ অর্ডার করতে কমপক্ষে ${toBengaliNumber(minItems)}টি ভিন্ন পণ্য নির্বাচন করুন (বর্তমানে ${toBengaliNumber(distinctProductsCount)}টি নেওয়া হয়েছে)`);
      return;
    }

    try {
      const packageOrderPayload = {
        items: selectedItems,
        subtotal: subtotal,
        discount_total: totalSavings,
        package_subtotal: packageTotal,
        total_amount: packageTotal
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('package_order_data', JSON.stringify(packageOrderPayload));
        localStorage.setItem('arot_active_package_order', JSON.stringify(packageOrderPayload));
      }

      router.push('/checkout?mode=package');
    } catch (e) {
      console.error('Package order navigation error:', e);
      router.push('/checkout?mode=package');
    }
  };

  if (activeProducts.length === 0) {
    return null;
  }

  return (
    <motion.div
      id="hero-package-box"
      className="hero-package-box"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--rule)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '520px',
        fontSize: '14px'
      }}
    >
      {/* Minimalist Box Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--rule)',
          background: '#fafafa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Package size={14} style={{ color: '#006C4C', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>
            আড়ৎ মুল্য পেতে প্রি-অর্ডার করুন
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: '600',
              color: minItems > 1 ? '#006C4C' : 'var(--muted)',
              background: minItems > 1 ? '#e8f5ee' : '#f1f5f9',
              padding: '1px 6px',
              borderRadius: '4px'
            }}
          >
            কমপক্ষে {toBengaliNumber(minItems)}টি ভিন্ন পণ্য
          </span>
        </div>

        {(
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: '700',
              color: '#006C4C',
              background: 'rgba(0, 108, 76, 0.08)',
              padding: '2px 8px',
              borderRadius: '12px'
            }}
          >
            সাশ্রয়: ৳{toBengaliNumber(totalSavings)}
          </span>
        )}
      </div>

      {/* 2-Part (2 Columns) Compact Grid: Side 1 (5 items) & Side 2 (5 items) */}
      <div
        className="package-columns-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          padding: '8px 10px',
          alignItems: 'start'
        }}
      >
        {/* Side 1: Products 1 to 5 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          {sideAProducts.map((prod) => (
            <PackageProductRow
              key={`pkg-sideA-${prod.slot_number || prod.id}`}
              product={prod}
              qty={getQty(prod.id)}
              onInc={() => increment(prod.id)}
              onDec={() => decrement(prod.id)}
            />
          ))}
        </div>

        {/* Side 2: Products 6 to 10 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: 0,
          }}
        >
          {sideBProducts.map((prod) => (
            <PackageProductRow
              key={`pkg-sideB-${prod.slot_number || prod.id}`}
              product={prod}
              qty={getQty(prod.id)}
              onInc={() => increment(prod.id)}
              onDec={() => decrement(prod.id)}
            />
          ))}
        </div>
      </div>

      {/* Minimal Box Footer */}
      <div
        style={{
          borderTop: '1px solid var(--rule)',
          background: '#fafafa',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>মোট:</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)' }}>
              ৳{toBengaliNumber(packageTotal)}
            </span>
            {distinctProductsCount > 0 && (
              <span
                style={{
                  fontSize: '11.5px',
                  color: canOrder ? '#006C4C' : '#dc2626',
                  fontWeight: '600'
                }}
              >
                ({toBengaliNumber(distinctProductsCount)}/{toBengaliNumber(minItems)}টি ভিন্ন পণ্য{totalQuantity > distinctProductsCount ? ` • মোট ${toBengaliNumber(totalQuantity)}টি` : ''})
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOrderNow}
          disabled={!canOrder}
          title={!canOrder ? `কমপক্ষে ${toBengaliNumber(minItems)}টি ভিন্ন পণ্য নির্বাচন করুন` : 'প্যাকেজ অর্ডার সম্পন্ন করতে চেকআউট করুন'}
          style={{
            padding: '6px 14px',
            background: canOrder ? '#006C4C' : '#e2e8f0',
            color: canOrder ? '#ffffff' : '#64748B',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: canOrder ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.18s ease',
            boxShadow: canOrder ? '0 2px 6px rgba(0, 108, 76, 0.25)' : 'none'
          }}
        >
          <span>
            {canOrder
              ? `অর্ডার করুন (${toBengaliNumber(distinctProductsCount)}টি পণ্য)`
              : distinctProductsCount === 0
              ? 'পণ্য সিলেক্ট করুন'
              : `কমপক্ষে ${toBengaliNumber(minItems)}টি ভিন্ন পণ্য নিন`}
          </span>
          <ArrowRight size={13} color={canOrder ? '#ffffff' : '#64748B'} />
        </button>
      </div>
    </motion.div>
  );
}

// Compact, Minimal Product Row with Guaranteed High-Contrast Stepper
function PackageProductRow({ product, qty, onInc, onDec }) {
  const regPrice = Number(product.regular_price) || 0;
  const fnlPrice = Number(product.final_price) || Math.max(0, regPrice - (Number(product.discount_amount) || 0));
  const isSelected = qty > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 5px',
        borderRadius: '5px',
        background: isSelected ? 'rgba(0, 108, 76, 0.05)' : 'transparent',
        border: `1px solid ${isSelected ? 'rgba(0, 108, 76, 0.25)' : 'transparent'}`,
        transition: 'all 0.12s ease',
        minWidth: 0,
        gap: '4px'
      }}
    >
      {/* Product Name & Pricing */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: isSelected ? '600' : '500',
            color: 'var(--text)',
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={`${product.product_name} (${product.unit})`}
        >
          {product.product_name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {regPrice > fnlPrice && (
            <span style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--muted)' }}>
              ৳{toBengaliNumber(regPrice)}
            </span>
          )}
          <span
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: isSelected ? '#006C4C' : 'var(--text)'
            }}
          >
            ৳{toBengaliNumber(fnlPrice)}
          </span>
          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--muted)' }}>
            /{product.unit}
          </span>
        </div>
      </div>

      {/* Stepper Controls (- / +) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: '#f8fafc',
          borderRadius: '4px',
          padding: '1px',
          border: '1px solid #e2e8f0',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={onDec}
          disabled={qty === 0}
          title="পরিমাণ কমান"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '3px',
            border: qty > 0 ? '1px solid #cbd5e1' : 'none',
            background: qty > 0 ? '#ffffff' : 'transparent',
            cursor: qty > 0 ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          <Minus size={11} color={qty > 0 ? '#191C1B' : '#cbd5e1'} strokeWidth={2.2} />
        </button>

        <span
          style={{
            minWidth: '16px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: '700',
            color: isSelected ? '#006C4C' : 'var(--muted)'
          }}
        >
          {toBengaliNumber(qty)}
        </span>

        <button
          type="button"
          onClick={onInc}
          title="পরিমাণ বাড়ান"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '3px',
            border: 'none',
            background: isSelected ? '#006C4C' : '#e8f5ee',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'background 0.15s ease'
          }}
        >
          <Plus size={11} color={isSelected ? '#ffffff' : '#006C4C'} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
