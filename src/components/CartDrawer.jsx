"use client";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Minus, Plus, ArrowRight, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { toBengaliNumber } from '../utils/bengali.js';

export default function CartDrawer({ onCheckout }) {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    changeQty,
    removeFromCart,
    subtotal
  } = useCart();

  const cartEntries = Object.entries(cart);
  const totalItemsCount = cartEntries.reduce((sum, [, it]) => sum + (it.qty || 1), 0);

  return (
    <AnimatePresence>
      {/* Mobile-only backdrop overlay to close drawer by tapping outside */}
      {isCartOpen && (
        <motion.div
          key="cart-drawer-mobile-overlay"
          id="overlay"
          className="cart-mobile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {isCartOpen && (
        <motion.div
          key="cart-drawer-sidebar"
          id="cart-drawer"
          role="dialog"
          aria-label="কার্ট ড্রয়ার"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        >
          {/* Cart Header */}
          <div className="cart-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--md-primary-container)',
                  color: 'var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShoppingCart size={17} strokeWidth={2.4} />
              </div>
              <div>
                <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.2 }}>
                  আপনার কার্ট
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                  {toBengaliNumber(totalItemsCount)}টি পণ্য যোগ করা হয়েছে
                </span>
              </div>
            </div>

            <motion.button
              id="close-cart"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsCartOpen(false)}
              aria-label="কার্ট বন্ধ করুন"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--md-surface-container-high)',
                border: 'none',
                color: 'var(--ink)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </motion.button>
          </div>

          {/* Cart Items List */}
          <div id="cart-items">
            {cartEntries.length === 0 ? (
              <motion.div
                className="cart-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--md-surface-container-high)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted)',
                    marginBottom: '12px'
                  }}
                >
                  <ShoppingBag size={32} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)', marginBottom: '4px' }}>
                  কার্ট খালি রয়েছে
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  বাজারের তালিকা থেকে পণ্য নির্বাচন করে কার্টে যোগ করুন।
                </div>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {cartEntries.map(([key, it]) => (
                  <motion.div
                    className="cart-item"
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ci-name" title={it.brand}>
                        {it.brand}
                      </div>
                      <div className="ci-meta">
                        {it.catBn} · {it.unit}
                      </div>
                      <div className="qty-stepper" style={{ marginTop: '6px' }}>
                        <motion.button
                          aria-label="কমান"
                          whileTap={{ scale: 0.85 }}
                          onClick={() => changeQty(key, -1)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={12} />
                        </motion.button>
                        <span>{toBengaliNumber(it.qty)}</span>
                        <motion.button
                          aria-label="বাড়ান"
                          whileTap={it.qty < (it.stock ?? 100) ? { scale: 0.85 } : {}}
                          onClick={() => {
                            if (it.qty < (it.stock ?? 100)) {
                              changeQty(key, 1);
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: it.qty >= (it.stock ?? 100) ? 0.3 : 1,
                            cursor: it.qty >= (it.stock ?? 100) ? 'not-allowed' : 'pointer'
                          }}
                          disabled={it.qty >= (it.stock ?? 100)}
                        >
                          <Plus size={12} />
                        </motion.button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div className="row-price mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--green)' }}>
                        ৳{toBengaliNumber(it.price * it.qty)}
                      </div>
                      <motion.button
                        className="remove"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeFromCart(key)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          border: 'none',
                          background: 'none',
                          color: 'var(--danger)',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={12} /> <span>সরান</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Cart Footer */}
          {cartEntries.length > 0 && (
            <motion.div
              className="cart-foot"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="cart-total" style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>সর্বমোট মূল্য</span>
                <span id="cart-total-amt" className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green)' }}>
                  ৳{toBengaliNumber(subtotal)}
                </span>
              </div>

              <motion.button
                className="checkout-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsCartOpen(false);
                  try {
                    sessionStorage.removeItem('package_order_data');
                    localStorage.removeItem('arot_active_package_order');
                  } catch (e) {}
                  onCheckout();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14.5px',
                  fontWeight: 700
                }}
              >
                <span>চেকআউট করুন</span> <ArrowRight size={16} />
              </motion.button>

              {/* Mobile Shopping continuation button */}
              <button
                type="button"
                className="continue-shopping-mobile-btn"
                onClick={() => setIsCartOpen(false)}
                style={{
                  display: 'none',
                  width: '100%',
                  marginTop: '8px',
                  padding: '9px 12px',
                  background: 'var(--md-surface-container-high)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                আরও কেনাকাটা করুন
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
