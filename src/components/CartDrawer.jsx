"use client";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Minus, Plus, ArrowRight, Trash2 } from 'lucide-react';
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

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          key="cart-drawer-overlay"
          id="overlay"
          className="open"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setIsCartOpen(false)}
        />
      )}
      {isCartOpen && (
        <motion.div
          key="cart-drawer-sidebar"
          id="cart-drawer"
          className="open"
          role="dialog"
          aria-label="কার্ট"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          <div className="cart-head">
            <h3>আপনার কার্ট ({toBengaliNumber(cartEntries.length)})</h3>
            <motion.button
              id="close-cart"
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsCartOpen(false)}
              aria-label="কার্ট বন্ধ করুন"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </motion.button>
          </div>

          <div id="cart-items">
            {cartEntries.length === 0 ? (
              <motion.div
                className="cart-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="big" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '10px' }}>
                  <ShoppingBag size={44} />
                </div>
                <div>কার্ট খালি — কিছু পণ্য যোগ করুন।</div>
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
                    <div>
                      <div className="ci-name">{it.brand}</div>
                      <div className="ci-meta">
                        {it.catBn} · {it.unit}
                      </div>
                      <div className="qty-stepper">
                        <motion.button
                          aria-label="কমান"
                          whileTap={{ scale: 0.85 }}
                          onClick={() => changeQty(key, -1)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={13} />
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
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: it.qty >= (it.stock ?? 100) ? 0.3 : 1, cursor: it.qty >= (it.stock ?? 100) ? 'not-allowed' : 'pointer' }}
                          disabled={it.qty >= (it.stock ?? 100)}
                        >
                          <Plus size={13} />
                        </motion.button>
                      </div>
                    </div>
                    <div>
                      <div className="row-price mono">৳{toBengaliNumber(it.price * it.qty)}</div>
                      <motion.button
                        className="remove"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeFromCart(key)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Trash2 size={12} /> <span>সরান</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {cartEntries.length > 0 && (
            <motion.div
              className="cart-foot"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="cart-total">
                <span>সর্বমোট মূল্য</span>
                <span id="cart-total-amt" className="mono">
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
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>চেকআউট করুন</span> <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

