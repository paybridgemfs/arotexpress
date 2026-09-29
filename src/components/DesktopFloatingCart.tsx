"use client";
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { toBengaliNumber } from '../utils/bengali.js';

export default function DesktopFloatingCart() {
  const { isCartOpen, setIsCartOpen, totalCount, subtotal, cartCountBump } = useCart();

  return (
    <div className="desktop-floating-cart-wrapper">
      <AnimatePresence>
        {!isCartOpen && (
          <motion.button
            key="desktop-floating-cart-btn"
            id="desktop-floating-cart-btn"
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
	    whileHover={{x: -2}}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsCartOpen(true)}
          >
            {/* Top row: Shopping Cart Icon + Count */}
            <div className="floating-cart-top-row">
              <ShoppingCart size={18} color="#FFFFFF" strokeWidth={2.4} />
              <span
                className={`floating-cart-count ${cartCountBump ? 'bump' : ''}`}
                suppressHydrationWarning
              >
                {toBengaliNumber(totalCount)}
              </span>
            </div>

            {/* Bottom box: Taka symbol + Total Amount */}
            <div className="floating-cart-price-box">
              <span className="floating-cart-currency">৳</span>
              <span className="floating-cart-amount" suppressHydrationWarning>
                {toBengaliNumber(subtotal)}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
