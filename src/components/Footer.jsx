"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Truck,
  ShieldCheck,
  Wallet,
  RotateCcw,
  Headphones,
  Clock,
  Award,
  Sparkles,
  Package,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Send,
  CheckCircle2,
  Lock,
  ExternalLink,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { useStoreData } from '../context/StoreDataContext';
import { useCart } from '../context/CartContext';
import FooterPolicyModal from './FooterPolicyModal.jsx';
import OrderTrackingModal from './OrderTrackingModal.jsx';
import SocialButtons from './SocialButtons.jsx';

// Clean Lucide Icon mapper for dynamic trust strip icons
const getTrustIcon = (iconName, size = 18) => {
  switch (iconName) {
    case 'Truck': return <Truck size={size} />;
    case 'ShieldCheck': return <ShieldCheck size={size} />;
    case 'Wallet': return <Wallet size={size} />;
    case 'RotateCcw': return <RotateCcw size={size} />;
    case 'Headphones': return <Headphones size={size} />;
    case 'Clock': return <Clock size={size} />;
    case 'Award': return <Award size={size} />;
    case 'Package': return <Package size={size} />;
    case 'HeartHandshake': return <HeartHandshake size={size} />;
    case 'Lock': return <Lock size={size} />;
    default: return <Sparkles size={size} />;
  }
};

const DEFAULT_TOP_TRUST_ITEMS = [
  {
    id: 'fast_delivery',
    icon: 'Truck',
    title: 'দ্রুততম হোম ডেলিভারি',
    subtitle: 'নির্ধারিত সময়ে আপনার দোরগোড়ায় ফ্রেশ ডেলিভারি',
    enabled: true
  },
  {
    id: 'fresh_quality',
    icon: 'ShieldCheck',
    title: '১০০% তাজা ও খাঁটি পণ্য',
    subtitle: 'সরাসরি আড়ত ও কৃষক থেকে সংগ্রহকৃত',
    enabled: true
  },
  {
    id: 'cod_payment',
    icon: 'Wallet',
    title: 'ক্যাশ অন ডেলিভারি',
    subtitle: 'পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা',
    enabled: true
  },
  {
    id: 'easy_return',
    icon: 'RotateCcw',
    title: 'সহজ রিটার্ন ও রিফান্ড',
    subtitle: 'পণ্য অপছন্দ হলে তাৎক্ষণিক রিটার্ন পলিসি',
    enabled: true
  }
];

const DEFAULT_QUICK_LINKS = [
  { id: 'track', label: 'অর্ডার ট্র্যাক করুন', action: 'track_order', enabled: true },
  { id: 'return_pol', label: 'রিটার্ন ও রিফান্ড পলিসি', action: 'policy_return', enabled: true },
  { id: 'delivery_info', label: 'ডেলিভারি তথ্য ও চার্জ', action: 'policy_delivery', enabled: true },
  { id: 'faqs', label: 'সাধারণ জিজ্ঞাসা (FAQ)', action: 'policy_faq', enabled: true },
  { id: 'terms', label: 'শর্তাবলী ও নিয়মাবলী', action: 'policy_terms', enabled: true },
  { id: 'privacy', label: 'প্রাইভেসি পলিসি', action: 'policy_privacy', enabled: true },
  { id: 'about', label: 'আমাদের সম্পর্কে', action: 'policy_about', enabled: true }
];

const DEFAULT_PAYMENT_BADGES = [
  { id: 'bkash', name: 'বিকাশ (bKash)', color: '#D12053', enabled: true },
  { id: 'nagad', name: 'নগদ (Nagad)', color: '#F7921E', enabled: true },
  { id: 'rocket', name: 'রকেট (Rocket)', color: '#8C3494', enabled: true },
  { id: 'upay', name: 'উপায় (Upay)', color: '#0056B3', enabled: true },
  { id: 'cod', name: 'ক্যাশ অন ডেলিভারি', color: '#006C4C', enabled: true },
  { id: 'ssl', name: 'SSL সুরক্ষিত পেমেন্ট', color: '#1E293B', enabled: true }
];

export default function Footer() {
  const router = useRouter();
  const { settings = {}, footerSettings = {}, activeGroups = [], handleScrollToGroup } = useStoreData();
  const { showToast } = useCart();

  // Modals state
  const [policyModal, setPolicyModal] = useState({ isOpen: false, tab: 'return' });
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);

  // Newsletter state
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  // Merge default settings if not yet populated (guarantees 100% identical SSR and Client rendering)
  const topTrust = footerSettings?.top_trust_strip || { enabled: true, items: DEFAULT_TOP_TRUST_ITEMS };
  const brandSection = footerSettings?.brand_section || { enabled: true };
  const quickLinksSection = footerSettings?.quick_links || { enabled: true, links: DEFAULT_QUICK_LINKS, title: 'গ্রাহক সেবা ও লিংক' };
  const categoryLinksSection = footerSettings?.category_links || { enabled: true, title: 'জনপ্রিয় ক্যাটাগরি', auto_categories: true };
  const newsletterSection = footerSettings?.newsletter_section || {
    enabled: true,
    title: 'অফার অ্যালার্ট ও ডিসকাউন্ট',
    subtitle: 'আপনার ইমেইল অ্যাড্রেস দিয়ে সাপ্তাহিক সেরা অফার এবং স্পেশাল ডিসকাউন্টের নোটিফিকেশন পান।',
    placeholder: 'আপনার ইমেইল অ্যাড্রেস লিখুন...',
    button_text: 'যুক্ত হোন',
    success_msg: 'ধন্যবাদ! আপনি সফলভাবে আমাদের স্পেশাল অফার আপডেটে যুক্ত হয়েছেন।'
  };
  const paymentBadges = footerSettings?.payment_badges || {
    enabled: true,
    title: '১০০% নিরাপদ ও সুরক্ষিত পেমেন্ট পার্টনার',
    items: DEFAULT_PAYMENT_BADGES
  };
  const copyrightBar = footerSettings?.copyright_bar || {
    enabled: true,
    copyright_text: '© ২০২৬ আড়ৎ এক্সপ্রেস — সর্বস্বত্ব সংরক্ষিত।',
    sub_text: 'উন্নত প্রযুক্তিতে তৈরি বাংলাদেশের বিশ্বস্ত অনলাইন গ্রোসারি প্ল্যাটফর্ম।',
    show_secure_badge: true
  };

  // Handle Quick Link Click
  const handleQuickLinkClick = (link) => {
    if (!link) return;
    if (link.action === 'track_order') {
      setIsOrderTrackingOpen(true);
    } else if (link.action?.startsWith('policy_')) {
      const tabName = link.action.replace('policy_', '');
      setPolicyModal({ isOpen: true, tab: tabName });
    } else if (link.url) {
      if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
        window.open(link.url, '_blank', 'noopener,noreferrer');
      } else if (link.url.startsWith('#group-')) {
        const groupKey = link.url.replace('#group-', '');
        handleScrollToGroup(groupKey);
      } else {
        router.push(link.url);
      }
    }
  };

  // Handle Category Click
  const handleCategoryClick = (target) => {
    if (!target) return;
    if (target === 'package_box') {
      const el = document.getElementById('hero-package-box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/#hero-package-box');
      }
      return;
    }

    // Scroll to group
    handleScrollToGroup(target);
  };

  // Handle Newsletter Submit
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = subscriberEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      if (showToast) showToast('সঠিক ইমেইল অ্যাড্রেস লিখুন (যেমন: name@example.com)', 'error');
      return;
    }

    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: cleanEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribedSuccess(true);
        setSubscriberEmail('');
        if (showToast) showToast(data.message || 'ধন্যবাদ! অফার আপডেটে যুক্ত হয়েছেন', 'success');
      } else {
        if (showToast) showToast(data.error || 'যুক্ত হতে সমস্যা হয়েছে, পরে চেষ্টা করুন', 'error');
      }
    } catch (err) {
      if (showToast) showToast('সার্ভার রেসপন্স করছে না, পরে চেষ্টা করুন', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const helpline = brandSection.helpline || settings?.site_helpline || '০১৭১২-৩৪৫৬৭৮';
  const helplineClean = helpline.replace(/[^0-9+]/g, '');
  const supportEmail = brandSection.email || 'support@arotexpress.com';
  const siteAddress = brandSection.address || settings?.site_address || settings?.footer_address || 'ঢাকা, বাংলাদেশ';
  const siteBrandTitle = brandSection.title || settings?.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteBrandSubtitle = brandSection.subtitle || settings?.site_tagline || 'Arot Express — আপনার আড়ৎ, এক ক্লিকে।';

  return (
    <>
      <footer className="arot-master-footer">
        
        {/* 1. TOP TRUST FEATURES STRIP */}
        {topTrust.enabled !== false && Array.isArray(topTrust.items) && topTrust.items.length > 0 && (
          <div className="footer-trust-strip-wrap">
            <div className="footer-trust-strip-inner">
              <div className="footer-trust-grid">
                {topTrust.items
                  .filter((item) => item.enabled !== false)
                  .map((item, idx) => (
                    <div key={item.id || idx} className="footer-trust-card">
                      <div className="footer-trust-icon-box">
                        {getTrustIcon(item.icon, 18)}
                      </div>
                      <div className="footer-trust-text-box">
                        <h4 className="footer-trust-title">{item.title}</h4>
                        <p className="footer-trust-subtitle">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. MAIN 4-COLUMN FOOTER CONTAINER */}
        <div className="footer-main-container">
          <div className="footer-columns-grid">

            {/* COLUMN 1: BRAND & CONTACT */}
            {brandSection.enabled !== false && (
              <div className="footer-col footer-col-brand">
                <div className="footer-brand-header">
                  <h3 className="footer-brand-title">{siteBrandTitle}</h3>
                  <span className="footer-brand-tagline">{siteBrandSubtitle}</span>
                </div>
                
                {brandSection.description && (
                  <p className="footer-brand-desc">
                    {brandSection.description}
                  </p>
                )}

                <div className="footer-contact-list">
                  {helpline && (
                    <a href={`tel:${helplineClean}`} className="footer-contact-item footer-contact-phone">
                      <div className="footer-contact-icon">
                        <Phone size={13} />
                      </div>
                      <div>
                        <span className="footer-contact-label">{brandSection.helpline_label || 'হটলাইন / হেল্পলাইন'}</span>
                        <strong className="footer-contact-value">{helpline}</strong>
                      </div>
                    </a>
                  )}

                  {supportEmail && (
                    <a href={`mailto:${supportEmail}`} className="footer-contact-item">
                      <div className="footer-contact-icon">
                        <Mail size={13} />
                      </div>
                      <div>
                        <span className="footer-contact-label">ইমেইল সাপোর্ট</span>
                        <span className="footer-contact-value">{supportEmail}</span>
                      </div>
                    </a>
                  )}

                  {siteAddress && (
                    <div className="footer-contact-item">
                      <div className="footer-contact-icon">
                        <MapPin size={13} />
                      </div>
                      <div>
                        <span className="footer-contact-label">অফিস ও আড়তের ঠিকানা</span>
                        <span className="footer-contact-value">{siteAddress}</span>
                      </div>
                    </div>
                  )}

                  {brandSection.working_hours && (
                    <div className="footer-contact-item">
                      <div className="footer-contact-icon">
                        <Clock size={13} />
                      </div>
                      <div>
                        <span className="footer-contact-label">কাজের সময়সূচী</span>
                        <span className="footer-contact-value">{brandSection.working_hours}</span>
                      </div>
                    </div>
                  )}
                </div>

                {brandSection.show_socials !== false && (
                  <div className="footer-social-wrapper" style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--ink, #333)', display: 'block', marginBottom: '6px' }}>
                      আমাদের সাথে যুক্ত থাকুন:
                    </span>
                    <SocialButtons variant="inline" />
                  </div>
                )}
              </div>
            )}

            {/* COLUMN 2: QUICK LINKS & CUSTOMER CARE */}
            {quickLinksSection.enabled !== false && (
              <div className="footer-col footer-col-links">
                <h4 className="footer-col-title">
                  {quickLinksSection.title || 'গ্রাহক সেবা ও লিংক'}
                </h4>
                <ul className="footer-links-list">
                  {Array.isArray(quickLinksSection.links) &&
                    quickLinksSection.links
                      .filter((l) => l.enabled !== false)
                      .map((link, idx) => (
                        <li key={link.id || idx}>
                          <button
                            type="button"
                            className="footer-link-btn"
                            onClick={() => handleQuickLinkClick(link)}
                          >
                            <ChevronRight size={12} className="footer-link-arrow" />
                            <span>{link.label}</span>
                          </button>
                        </li>
                      ))}
                </ul>
              </div>
            )}

            {/* COLUMN 3: POPULAR CATEGORIES */}
            {categoryLinksSection.enabled !== false && (
              <div className="footer-col footer-col-categories">
                <h4 className="footer-col-title">
                  {categoryLinksSection.title || 'জনপ্রিয় ক্যাটাগরি'}
                </h4>
                <ul className="footer-links-list">
                  {categoryLinksSection.auto_categories !== false ? (
                    // Display dynamic active groups from DB without emoji
                    <>
                      {activeGroups.slice(0, 6).map((group) => (
                        <li key={group.key || group.id}>
                          <button
                            type="button"
                            className="footer-link-btn"
                            onClick={() => handleCategoryClick(group.key)}
                          >
                            <ChevronRight size={12} className="footer-link-arrow" />
                            <span>{group.bn || group.en}</span>
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          type="button"
                          className="footer-link-btn footer-link-highlight"
                          onClick={() => handleCategoryClick('package_box')}
                        >
                          <Package size={13} className="footer-link-icon" style={{ color: 'var(--green, #006C4C)' }} />
                          <span>মাসিক বাজার প্যাকেজ বক্স</span>
                        </button>
                      </li>
                    </>
                  ) : (
                    // Display custom category links configured by admin
                    Array.isArray(categoryLinksSection.custom_links) &&
                    categoryLinksSection.custom_links
                      .filter((l) => l.enabled !== false)
                      .map((link, idx) => (
                        <li key={link.id || idx}>
                          <button
                            type="button"
                            className="footer-link-btn"
                            onClick={() => handleCategoryClick(link.target)}
                          >
                            <ChevronRight size={12} className="footer-link-arrow" />
                            <span>{link.label}</span>
                          </button>
                        </li>
                      ))
                  )}
                </ul>
              </div>
            )}

            {/* COLUMN 4: NEWSLETTER & SPECIAL OFFERS */}
            {newsletterSection.enabled !== false && (
              <div className="footer-col footer-col-newsletter">
                <h4 className="footer-col-title">
                  {newsletterSection.title || 'অফার অ্যালার্ট ও ডিসকাউন্ট'}
                </h4>
                <p className="footer-newsletter-sub">
                  {newsletterSection.subtitle ||
                    'আপনার ইমেইল অ্যাড্রেস দিয়ে সাপ্তাহিক সেরা অফার ও বিশেষ ছাড়ের আপডেট পান।'}
                </p>

                <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
                  <div className="footer-input-group">
                    <input
                      type="email"
                      required
                      value={subscriberEmail}
                      onChange={(e) => setSubscriberEmail(e.target.value)}
                      placeholder={newsletterSection.placeholder || 'আপনার ইমেইল লিখুন...'}
                      className="footer-input-field"
                      disabled={subscribing}
                    />
                    <button
                      type="submit"
                      disabled={subscribing}
                      className="footer-subscribe-btn"
                      title={newsletterSection.button_text || 'যুক্ত হোন'}
                    >
                      {subscribing ? (
                        <div className="footer-spinner" />
                      ) : (
                        <>
                          <Send size={13} />
                          <span>{newsletterSection.button_text || 'যুক্ত হোন'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {subscribedSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="footer-newsletter-success"
                  >
                    <CheckCircle2 size={13} />
                    <span>{newsletterSection.success_msg || 'ধন্যবাদ! আপনি সফলভাবে যুক্ত হয়েছেন।'}</span>
                  </motion.div>
                )}

                <div className="footer-security-note">
                  <Lock size={11} />
                  <span>আপনার ব্যক্তিগত তথ্যের গোপনীয়তা শতভাগ সুরক্ষিত।</span>
                </div>
              </div>
            )}

          </div>

          {/* 3. PAYMENT BADGES & PARTNERS STRIP */}
          {paymentBadges.enabled !== false && Array.isArray(paymentBadges.items) && (
            <div className="footer-payment-strip">
              <div className="footer-payment-header">
                <span className="footer-payment-title">
                  {paymentBadges.title || '১০০% নিরাপদ ও সুরক্ষিত পেমেন্ট পার্টনার'}
                </span>
              </div>
              <div className="footer-payment-badges-row">
                {paymentBadges.items
                  .filter((b) => b.enabled !== false)
                  .map((badge, idx) => (
                    <div
                      key={badge.id || idx}
                      className="footer-pay-badge"
                      style={{
                        borderColor: badge.color ? `${badge.color}33` : 'var(--rule, #e5e0d8)',
                        background: badge.bg || '#ffffff'
                      }}
                    >
                      <span
                        className="footer-pay-dot"
                        style={{ backgroundColor: badge.color || 'var(--green, #006C4C)' }}
                      />
                      <span className="footer-pay-name" style={{ color: badge.color || 'var(--ink, #333)' }}>
                        {badge.name || badge.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. BOTTOM COPYRIGHT & COMPLIANCE BAR */}
        {copyrightBar.enabled !== false && (
          <div className="footer-bottom-bar">
            <div className="footer-bottom-inner">
              <div className="footer-copyright-text">
                {copyrightBar.copyright_text || settings?.footer_text || '© ২০২৬ আড়ৎ এক্সপ্রেস — সর্বস্বত্ব সংরক্ষিত।'}
              </div>
              {copyrightBar.sub_text && (
                <div className="footer-security-stamp">
                  {copyrightBar.show_secure_badge !== false && <ShieldCheck size={13} color="var(--green, #006C4C)" />}
                  <span>{copyrightBar.sub_text}</span>
                </div>
              )}
            </div>
          </div>
        )}

      </footer>

      {/* Interactive Policy & Customer Care Modal */}
      {policyModal.isOpen && (
        <FooterPolicyModal
          isOpen={true}
          activeTab={policyModal.tab}
          settings={settings}
          footerSettings={footerSettings}
          onClose={() => setPolicyModal({ isOpen: false, tab: 'return' })}
        />
      )}

      {/* Interactive Order Tracking Modal */}
      {isOrderTrackingOpen && (
        <OrderTrackingModal
          isOpen={true}
          settings={settings}
          onClose={() => setIsOrderTrackingOpen(false)}
        />
      )}
    </>
  );
}
