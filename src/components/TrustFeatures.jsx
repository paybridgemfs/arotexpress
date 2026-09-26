"use client";
import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Bike, HandCoins } from 'lucide-react';

export default function TrustFeatures() {
  const features = [
    {
      id: 'pay-after',
      icon: <Wallet size={22} strokeWidth={1.8} />,
      label: (
        <span>
          পণ্য <strong style={{ fontWeight: 800, color: 'var(--ink)' }}>হাতে পেয়ে</strong> মূল্য পরিশোধ
        </span>
      ),
      subtext: '১০০% নিশ্চিত ক্যাশ অন ডেলিভারি'
    },
    {
      id: 'fast-delivery',
      icon: <Bike size={24} strokeWidth={1.8} />,
      label: (
        <span>
          <strong className="mono" style={{ fontWeight: 800, color: 'var(--ink)' }}>১ ঘণ্টার মধ্যে</strong> দ্রুততম ডেলিভারি
        </span>
      ),
      subtext: 'সরাসরি আপনার ঠিকানায় পৌঁছাবে'
    },
    {
      id: 'save-money',
      icon: <HandCoins size={22} strokeWidth={1.8} />,
      label: (
        <span>
          সেরা অফার ও নিশ্চিত <strong style={{ fontWeight: 800, color: 'var(--ink)' }}>টাকা সাশ্রয়</strong>
        </span>
      ),
      subtext: 'আড়তের দরে আসল সাশ্রয়ী বাজার'
    }
  ];

  return (
    <section className="trust-features-section" aria-label="আমাদের সেবাসমূহ">
      <div className="trust-features-grid">
        {features.map((item, idx) => (
          <motion.div
            key={item.id}
            className="trust-feature-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            whileHover={{ y: -2 }}
          >
            <div className="trust-feature-icon-wrap" aria-hidden="true">
              {item.icon}
            </div>
            <div className="trust-feature-content">
              <div className="trust-feature-text">{item.label}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                {item.subtext}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
