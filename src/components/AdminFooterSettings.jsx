"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  Save,
  RotateCcw,
  Eye,
  Plus,
  Trash2,
  ShieldCheck,
  Truck,
  Wallet,
  Headphones,
  Clock,
  Award,
  Sparkles,
  Package,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Users,
  Send,
  Lock,
  Layers,
  HelpCircle,
  FileText,
  RefreshCw,
  HeartHandshake,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStoreData } from '../context/StoreDataContext';
import { useCart } from '../context/CartContext';
import Footer from './Footer.jsx';

const TRUST_ICON_OPTIONS = [
  { value: 'Truck', label: 'দ্রুত ডেলিভারি (Truck)' },
  { value: 'ShieldCheck', label: 'খাঁটি পণ্য / নিরাপত্তা (ShieldCheck)' },
  { value: 'Wallet', label: 'ক্যাশ অন ডেলিভারি (Wallet)' },
  { value: 'RotateCcw', label: 'রিটার্ন ও রিফান্ড (RotateCcw)' },
  { value: 'Headphones', label: 'কাস্টমার সাপোর্ট (Headphones)' },
  { value: 'Clock', label: 'সময়নিষ্ঠতা (Clock)' },
  { value: 'Award', label: 'সেরা মান (Award)' },
  { value: 'Package', label: 'প্যাকেজ বক্স (Package)' },
  { value: 'HeartHandshake', label: 'বিশ্বস্ততা (HeartHandshake)' },
  { value: 'Lock', label: 'সিকিউর পেমেন্ট (Lock)' }
];

const LINK_ACTION_OPTIONS = [
  { value: 'track_order', label: 'অর্ডার ট্র্যাকিং মডাল খুলুন' },
  { value: 'policy_return', label: 'রিটার্ন ও রিফান্ড পলিসি' },
  { value: 'policy_delivery', label: 'ডেলিভারি তথ্য ও এরিয়া' },
  { value: 'policy_faq', label: 'সাধারণ জিজ্ঞাসা (FAQ)' },
  { value: 'policy_terms', label: 'শর্তাবলী ও নিয়মাবলী' },
  { value: 'policy_privacy', label: 'প্রাইভেসি পলিসি' },
  { value: 'policy_about', label: 'আমাদের সম্পর্কে' },
  { value: 'custom_url', label: 'কাস্টম লিঙ্ক / ইউআরএল' }
];

export default function AdminFooterSettings() {
  const { adminToken } = useAuth();
  const { footerSettings: initialFooterSettings, setFooterSettings: setContextFooterSettings, settings, activeGroups } = useStoreData();
  const { showToast } = useCart();

  const [activeTab, setActiveTab] = useState('trust');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [addingTestEmail, setAddingTestEmail] = useState(false);

  // Fetch footer settings from DB
  const loadFooterSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/footer-settings');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Error loading footer settings:', err);
      if (showToast) showToast('ফুটার সেটিংস লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch newsletter subscribers
  const loadSubscribers = async () => {
    if (!adminToken) return;
    setLoadingSubscribers(true);
    try {
      const res = await fetch('/api/newsletter', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    loadFooterSettings();
    loadSubscribers();
  }, [adminToken]);

  // Save changes to DB
  const handleSave = async () => {
    if (!config || !adminToken) return;
    setSaving(true);
    try {
      const res = await fetch('/api/footer-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setContextFooterSettings(updated);
        if (showToast) showToast('ফুটার সেটিংস সফলভাবে সংরক্ষিত হয়েছে', 'success');
      } else {
        if (showToast) showToast('সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
      }
    } catch (err) {
      if (showToast) showToast('সার্ভার এরর, পুনরায় চেষ্টা করুন', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleReset = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে ফুটার সেটিংস ডিফল্ট মানে রিসেট করতে চান?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/footer-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        const defaultData = await res.json();
        setConfig(defaultData);
        setContextFooterSettings(defaultData);
        if (showToast) showToast('ফুটার সেটিংস ডিফল্টে রিসেট করা হয়েছে', 'success');
      }
    } catch (err) {
      if (showToast) showToast('রিসেট ব্যর্থ হয়েছে', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete subscriber
  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm('এই সাবস্ক্রাইবার মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/newsletter?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        if (showToast) showToast('সাবস্ক্রাইবার মুছে ফেলা হয়েছে', 'success');
      }
    } catch (err) {
      if (showToast) showToast('মুছে ফেলা সম্ভব হয়নি', 'error');
    }
  };

  // Copy all subscriber emails
  const handleCopyAllEmails = () => {
    if (!subscribers.length) return;
    const emailList = subscribers.map((s) => s.contact).join(', ');
    navigator.clipboard.writeText(emailList);
    setCopiedEmails(true);
    if (showToast) showToast('সকল সাবস্ক্রাইবার ইমেইল ক্লিপবোর্ডে কপি করা হয়েছে', 'success');
    setTimeout(() => setCopiedEmails(false), 2500);
  };

  // Add manual subscriber for testing
  const handleAddManualEmail = async (e) => {
    e.preventDefault();
    if (!testEmailInput.trim()) return;
    setAddingTestEmail(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: testEmailInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailInput('');
        loadSubscribers();
        if (showToast) showToast('ইমেইল সফলভাবে ডাটাবেজে যুক্ত হয়েছে', 'success');
      } else {
        if (showToast) showToast(data.error || 'যুক্ত করা যায়নি', 'error');
      }
    } catch (e) {
      if (showToast) showToast('এরর হয়েছে', 'error');
    } finally {
      setAddingTestEmail(false);
    }
  };

  if (loading || !config) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted, #666)' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
        <p style={{ fontSize: '13px' }}>ফুটার সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  // Helpers for deep updating config
  const updateTopTrust = (updater) => {
    setConfig((prev) => ({ ...prev, top_trust_strip: updater(prev.top_trust_strip || {}) }));
  };

  const updateBrandSection = (updater) => {
    setConfig((prev) => ({ ...prev, brand_section: updater(prev.brand_section || {}) }));
  };

  const updateQuickLinks = (updater) => {
    setConfig((prev) => ({ ...prev, quick_links: updater(prev.quick_links || {}) }));
  };

  const updateCategoryLinks = (updater) => {
    setConfig((prev) => ({ ...prev, category_links: updater(prev.category_links || {}) }));
  };

  const updateNewsletter = (updater) => {
    setConfig((prev) => ({ ...prev, newsletter_section: updater(prev.newsletter_section || {}) }));
  };

  const updatePaymentBadges = (updater) => {
    setConfig((prev) => ({ ...prev, payment_badges: updater(prev.payment_badges || {}) }));
  };

  const updateCopyright = (updater) => {
    setConfig((prev) => ({ ...prev, copyright_bar: updater(prev.copyright_bar || {}) }));
  };

  const tabsList = [
    { id: 'trust', label: 'টপ ট্রাস্ট বার', icon: <Truck size={15} /> },
    { id: 'brand', label: 'ব্র্যান্ড ও হেল্পলাইন', icon: <Phone size={15} /> },
    { id: 'links', label: 'গ্রাহক সেবা লিংক', icon: <ExternalLink size={15} /> },
    { id: 'categories', label: 'জনপ্রিয় ক্যাটাগরি', icon: <Layers size={15} /> },
    { id: 'newsletter', label: `অফার ও সাবস্ক্রাইবার (${subscribers.length})`, icon: <Send size={15} /> },
    { id: 'payments', label: 'পেমেন্ট পার্টনার', icon: <Wallet size={15} /> },
    { id: 'copyright', label: 'কপিরাইট বার', icon: <ShieldCheck size={15} /> },
    { id: 'preview', label: 'লাইভ প্রিভিউ', icon: <Eye size={15} /> }
  ];

  return (
    <div className="admin-footer-settings-container" style={{ padding: '16px 0 50px' }}>
      
      {/* Top Header & Save Actions Bar */}
      <div
        className="admin-card"
        style={{
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--rule, #e5e0d8)'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--ink, #1f2937)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} color="var(--green, #006C4C)" />
            <span>ফুটার সেটিংস ও কাস্টমাইজেশন</span>
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--muted, #666)' }}>
            ফুটারের প্রতিটি সেকশন, টেক্সট, লিংক, সাবস্ক্রাইবার ও পেমেন্ট পার্টনার সম্পূর্ণ নিয়ন্ত্রণ করুন
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            style={{
              padding: '8px 14px',
              borderRadius: '7px',
              border: '1px solid var(--rule, #e5e0d8)',
              background: '#ffffff',
              color: 'var(--muted, #666)',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <RotateCcw size={14} />
            <span>ডিফল্ট রিসেট</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 18px',
              borderRadius: '7px',
              border: 'none',
              background: 'var(--green, #006C4C)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {saving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          background: '#ffffff',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '16px',
          border: '1px solid var(--rule, #e5e0d8)',
          gap: '3px'
        }}
      >
        {tabsList.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              background: activeTab === t.id ? 'var(--green, #006C4C)' : 'transparent',
              color: activeTab === t.id ? '#ffffff' : 'var(--ink, #333)',
              fontWeight: activeTab === t.id ? '700' : '500',
              fontSize: '12.5px',
              borderRadius: '7px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: TOP TRUST BADGES STRIP */}
      {activeTab === 'trust' && (
        <div className="admin-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '700' }}>টপ ট্রাস্ট সুবিধা বার (Top Value Badges)</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--muted, #666)' }}>
                ফুটারের ঠিক উপরে ৪টি সুবিধা ও আস্থা ব্যাজ
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={config.top_trust_strip?.enabled !== false}
                onChange={(e) => updateTopTrust((prev) => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
              />
              <span>{config.top_trust_strip?.enabled !== false ? 'সক্রিয় (Visible)' : 'নিষ্ক্রিয় (Hidden)'}</span>
            </label>
          </div>

          {config.top_trust_strip?.enabled !== false && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(config.top_trust_strip?.items || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--rule, #e5e0d8)',
                    background: item.enabled !== false ? '#fcfbf9' : '#f3f4f6',
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr 1.3fr auto auto',
                    gap: '10px',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>আইকন</label>
                    <select
                      value={item.icon || 'Sparkles'}
                      onChange={(e) => {
                        const newItems = [...config.top_trust_strip.items];
                        newItems[idx] = { ...newItems[idx], icon: e.target.value };
                        updateTopTrust((prev) => ({ ...prev, items: newItems }));
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12px' }}
                    >
                      {TRUST_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>শিরোনাম</label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => {
                        const newItems = [...config.top_trust_strip.items];
                        newItems[idx] = { ...newItems[idx], title: e.target.value };
                        updateTopTrust((prev) => ({ ...prev, items: newItems }));
                      }}
                      placeholder="যেমন: দ্রুততম ডেলিভারি"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>উপ-শিরোনাম / বিবরণ</label>
                    <input
                      type="text"
                      value={item.subtitle || ''}
                      onChange={(e) => {
                        const newItems = [...config.top_trust_strip.items];
                        newItems[idx] = { ...newItems[idx], subtitle: e.target.value };
                        updateTopTrust((prev) => ({ ...prev, items: newItems }));
                      }}
                      placeholder="যেমন: নির্ধারিত সময়ে আপনার দোরগোড়ায়"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12.5px' }}
                    />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>প্রদর্শন</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...config.top_trust_strip.items];
                        newItems[idx] = { ...newItems[idx], enabled: newItems[idx].enabled === false ? true : false };
                        updateTopTrust((prev) => ({ ...prev, items: newItems }));
                      }}
                      style={{
                        background: item.enabled !== false ? '#e6f4ea' : '#fee2e2',
                        color: item.enabled !== false ? '#006C4C' : '#dc2626',
                        border: 'none',
                        padding: '5px 9px',
                        borderRadius: '5px',
                        fontSize: '11.5px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {item.enabled !== false ? 'সক্রিয়' : 'হাইড'}
                    </button>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = config.top_trust_strip.items.filter((_, i) => i !== idx);
                        updateTopTrust((prev) => ({ ...prev, items: newItems }));
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const newItems = [
                    ...(config.top_trust_strip?.items || []),
                    {
                      id: `trust_${Date.now()}`,
                      icon: 'ShieldCheck',
                      title: 'নতুন সুবিধা',
                      subtitle: 'সংক্ষিপ্ত বিবরণ লিখুন',
                      enabled: true
                    }
                  ];
                  updateTopTrust((prev) => ({ ...prev, items: newItems }));
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '7px',
                  border: '1px dashed var(--green, #006C4C)',
                  background: 'var(--green-mist, #f0f9f5)',
                  color: 'var(--green, #006C4C)',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  marginTop: '6px'
                }}
              >
                <Plus size={15} />
                <span>নতুন ট্রাস্ট ফিচার ব্যাজ যোগ করুন</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BRAND & HELPLINE */}
      {activeTab === 'brand' && (
        <div className="admin-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '700' }}>ব্র্যান্ড পরিচিতি ও হেল্পলাইন (কলাম ১)</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--muted, #666)' }}>
                ব্র্যান্ড নাম, স্লোগান, হটলাইন নম্বর, ইমেইল ও ঠিকানা
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={config.brand_section?.enabled !== false}
                onChange={(e) => updateBrandSection((prev) => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
              />
              <span>{config.brand_section?.enabled !== false ? 'সক্রিয় (Visible)' : 'নিষ্ক্রিয় (Hidden)'}</span>
            </label>
          </div>

          {config.brand_section?.enabled !== false && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  ব্র্যান্ড নাম (Brand Title)
                </label>
                <input
                  type="text"
                  value={config.brand_section?.title || ''}
                  onChange={(e) => updateBrandSection((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="যেমন: আড়ৎ এক্সপ্রেস"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  ট্যাগলাইন / স্লোগান
                </label>
                <input
                  type="text"
                  value={config.brand_section?.subtitle || ''}
                  onChange={(e) => updateBrandSection((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="যেমন: আপনার আড়ৎ, এক ক্লিকে।"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  সংক্ষিপ্ত বিবরণ (Description)
                </label>
                <textarea
                  rows={2}
                  value={config.brand_section?.description || ''}
                  onChange={(e) => updateBrandSection((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="কোম্পানির সংক্ষিপ্ত মূল বার্তা লিখুন..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  হটলাইন / হেল্পলাইন নম্বর
                </label>
                <input
                  type="text"
                  value={config.brand_section?.helpline || ''}
                  onChange={(e) => updateBrandSection((prev) => ({ ...prev, helpline: e.target.value }))}
                  placeholder="০১৭১২-৩৪৫৬৭৮"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  হেল্পলাইন লেবেল
                </label>
                <input
                  type="text"
                  value={config.brand_section?.helpline_label || ''}
                  onChange={(e) => updateBrandSection((prev) => ({ ...prev, helpline_label: e.target.value }))}
                  placeholder="হটলাইন ও অর্ডার সহায়তা (সকাল ৮টা - রাত ১০টা)"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  সাপোর্ট ইমেইল
                </label>
                <input
                  type="email"
                  value={config.brand_section?.email || ''}
                  onChange={(e) => updateBrandSection((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="support@arotexpress.com"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  কাজের সময়সূচী
                </label>
                <input
                  type="text"
                  value={config.brand_section?.working_hours || ''}
                  onChange={(e) => updateBrandSection((prev) => ({ ...prev, working_hours: e.target.value }))}
                  placeholder="সকাল ৮:০০ - রাত ১০:০০"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  অফিস ও আড়তের ঠিকানা
                </label>
                <input
                  type="text"
                  value={config.brand_section?.address || ''}
                  onChange={(e) => updateBrandSection((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="বাড়ি #১২, রোড #০৪, ধানমন্ডি, ঢাকা"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={config.brand_section?.show_socials !== false}
                    onChange={(e) => updateBrandSection((prev) => ({ ...prev, show_socials: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
                  />
                  <span>সোশ্যাল মিডিয়া আইকনসমূহ ব্র্যান্ড কলামের নিচে প্রদর্শন করুন</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUICK LINKS & CUSTOMER CARE */}
      {activeTab === 'links' && (
        <div className="admin-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '700' }}>গ্রাহক সেবা ও লিংকসমূহ (কলাম ২)</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--muted, #666)' }}>
                অর্ডার ট্র্যাক, পলিসি মডাল ও কাস্টম অ্যাকশন লিংক
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={config.quick_links?.enabled !== false}
                onChange={(e) => updateQuickLinks((prev) => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
              />
              <span>{config.quick_links?.enabled !== false ? 'সক্রিয় (Visible)' : 'নিষ্ক্রিয় (Hidden)'}</span>
            </label>
          </div>

          {config.quick_links?.enabled !== false && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  কলামের শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.quick_links?.title || ''}
                  onChange={(e) => updateQuickLinks((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="গ্রাহক সেবা ও লিংক"
                  style={{ maxWidth: '320px', width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(config.quick_links?.links || []).map((link, idx) => (
                  <div
                    key={link.id || idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--rule, #e5e0d8)',
                      background: link.enabled !== false ? '#fcfbf9' : '#f3f4f6',
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1.4fr 1fr auto auto',
                      gap: '10px',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>লিংক লেবেল</label>
                      <input
                        type="text"
                        value={link.label || ''}
                        onChange={(e) => {
                          const newLinks = [...config.quick_links.links];
                          newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                          updateQuickLinks((prev) => ({ ...prev, links: newLinks }));
                        }}
                        placeholder="যেমন: অর্ডার ট্র্যাক করুন"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>অ্যাকশন / মডাল টাইপ</label>
                      <select
                        value={link.action || 'track_order'}
                        onChange={(e) => {
                          const newLinks = [...config.quick_links.links];
                          newLinks[idx] = { ...newLinks[idx], action: e.target.value };
                          updateQuickLinks((prev) => ({ ...prev, links: newLinks }));
                        }}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12px' }}
                      >
                        {LINK_ACTION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>কাস্টম URL (যদি থাকে)</label>
                      <input
                        type="text"
                        value={link.url || ''}
                        onChange={(e) => {
                          const newLinks = [...config.quick_links.links];
                          newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                          updateQuickLinks((prev) => ({ ...prev, links: newLinks }));
                        }}
                        placeholder="/profile বা https://..."
                        disabled={link.action !== 'custom_url'}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--rule, #e5e0d8)',
                          fontSize: '12.5px',
                          background: link.action !== 'custom_url' ? '#f3f4f6' : '#ffffff'
                        }}
                      />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>স্ট্যাটাস</label>
                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = [...config.quick_links.links];
                          newLinks[idx] = { ...newLinks[idx], enabled: newLinks[idx].enabled === false ? true : false };
                          updateQuickLinks((prev) => ({ ...prev, links: newLinks }));
                        }}
                        style={{
                          background: link.enabled !== false ? '#e6f4ea' : '#fee2e2',
                          color: link.enabled !== false ? '#006C4C' : '#dc2626',
                          border: 'none',
                          padding: '5px 9px',
                          borderRadius: '5px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {link.enabled !== false ? 'সক্রিয়' : 'হাইড'}
                      </button>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = config.quick_links.links.filter((_, i) => i !== idx);
                          updateQuickLinks((prev) => ({ ...prev, links: newLinks }));
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newLinks = [
                      ...(config.quick_links?.links || []),
                      {
                        id: `link_${Date.now()}`,
                        label: 'নতুন লিংক',
                        action: 'policy_return',
                        url: '',
                        enabled: true
                      }
                    ];
                    updateQuickLinks((prev) => ({ ...prev, links: newLinks }));
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '7px',
                    border: '1px dashed var(--green, #006C4C)',
                    background: 'var(--green-mist, #f0f9f5)',
                    color: 'var(--green, #006C4C)',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    marginTop: '6px'
                  }}
                >
                  <Plus size={15} />
                  <span>নতুন লিংক যোগ করুন</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: POPULAR CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="admin-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '700' }}>জনপ্রিয় ক্যাটাগরি কলাম (কলাম ৩)</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--muted, #666)' }}>
                স্বয়ংক্রিয় ক্যাটাগরি সিঙ্ক মোড অথবা ম্যানুয়াল কাস্টম লিংক
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={config.category_links?.enabled !== false}
                onChange={(e) => updateCategoryLinks((prev) => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
              />
              <span>{config.category_links?.enabled !== false ? 'সক্রিয় (Visible)' : 'নিষ্ক্রিয় (Hidden)'}</span>
            </label>
          </div>

          {config.category_links?.enabled !== false && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    কলাম শিরোনাম
                  </label>
                  <input
                    type="text"
                    value={config.category_links?.title || ''}
                    onChange={(e) => updateCategoryLinks((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="জনপ্রিয় ক্যাটাগরি"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    ক্যাটাগরি মোড
                  </label>
                  <select
                    value={config.category_links?.auto_categories !== false ? 'auto' : 'custom'}
                    onChange={(e) => updateCategoryLinks((prev) => ({ ...prev, auto_categories: e.target.value === 'auto' }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                  >
                    <option value="auto">স্বয়ংক্রিয় সক্রিয় ক্যাটাগরি সমূহ (অটো-সিঙ্ক)</option>
                    <option value="custom">ম্যানুয়াল কাস্টম ক্যাটাগরি লিংক</option>
                  </select>
                </div>
              </div>

              {config.category_links?.auto_categories !== false ? (
                <div style={{ background: '#f0f9f5', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green, #006C4C)', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                    <CheckCircle2 size={16} />
                    <span>অটো-ক্যাটাগরি মোড সক্রিয়</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#1f2937' }}>
                    ওয়েবসাইটে সক্রিয় থাকা গ্রুপ ও ক্যাটাগরিগুলো ({activeGroups.map((g) => g.bn || g.en).join(', ')}) স্বয়ংক্রিয়ভাবে ফুটারে প্রদর্শিত হবে।
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(config.category_links?.custom_links || []).map((link, idx) => (
                    <div
                      key={link.id || idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--rule, #e5e0d8)',
                        background: '#fcfbf9',
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1.5fr auto auto',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>লেবেল</label>
                        <input
                          type="text"
                          value={link.label || ''}
                          onChange={(e) => {
                            const newLinks = [...config.category_links.custom_links];
                            newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                            updateCategoryLinks((prev) => ({ ...prev, custom_links: newLinks }));
                          }}
                          placeholder="যেমন: চাল, ডাল ও তেল"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12.5px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--muted, #666)', display: 'block', marginBottom: '3px' }}>টার্গেট গ্রুপ / প্যাকেজ বক্স</label>
                        <select
                          value={link.target || ''}
                          onChange={(e) => {
                            const newLinks = [...config.category_links.custom_links];
                            newLinks[idx] = { ...newLinks[idx], target: e.target.value };
                            updateCategoryLinks((prev) => ({ ...prev, custom_links: newLinks }));
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12px' }}
                        >
                          <option value="package_box">মাসিক বাজার প্যাকেজ বক্স</option>
                          {activeGroups.map((g) => (
                            <option key={g.key} value={g.key}>{g.bn || g.en} ({g.key})</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = [...config.category_links.custom_links];
                          newLinks[idx] = { ...newLinks[idx], enabled: newLinks[idx].enabled === false ? true : false };
                          updateCategoryLinks((prev) => ({ ...prev, custom_links: newLinks }));
                        }}
                        style={{
                          background: link.enabled !== false ? '#e6f4ea' : '#fee2e2',
                          color: link.enabled !== false ? '#006C4C' : '#dc2626',
                          border: 'none',
                          padding: '5px 9px',
                          borderRadius: '5px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {link.enabled !== false ? 'সক্রিয়' : 'হাইড'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = config.category_links.custom_links.filter((_, i) => i !== idx);
                          updateCategoryLinks((prev) => ({ ...prev, custom_links: newLinks }));
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: NEWSLETTER & SUBSCRIBER DATABASE */}
      {activeTab === 'newsletter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Newsletter Box Customization */}
          <div className="admin-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '700' }}>অফার অ্যালার্ট ও ইমেইল সাবস্ক্রিপশন সেটিংস</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--muted, #666)' }}>
                  ফুটারের অফার অ্যালার্ট বক্সের টেক্সট ও সেটিংস কনফিগার করুন
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={config.newsletter_section?.enabled !== false}
                  onChange={(e) => updateNewsletter((prev) => ({ ...prev, enabled: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
                />
                <span>{config.newsletter_section?.enabled !== false ? 'সক্রিয় (Visible)' : 'নিষ্ক্রিয় (Hidden)'}</span>
              </label>
            </div>

            {config.newsletter_section?.enabled !== false && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    শিরোনাম (Title)
                  </label>
                  <input
                    type="text"
                    value={config.newsletter_section?.title || ''}
                    onChange={(e) => updateNewsletter((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="অফার অ্যালার্ট ও ডিসকাউন্ট"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    ইনপুট প্লেসহোল্ডার
                  </label>
                  <input
                    type="text"
                    value={config.newsletter_section?.placeholder || ''}
                    onChange={(e) => updateNewsletter((prev) => ({ ...prev, placeholder: e.target.value }))}
                    placeholder="আপনার ইমেইল অ্যাড্রেস লিখুন..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    উপ-শিরোনাম / বিবরণ (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={config.newsletter_section?.subtitle || ''}
                    onChange={(e) => updateNewsletter((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="আপনার ইমেইল অ্যাড্রেস দিয়ে সাপ্তাহিক সেরা অফার এবং স্পেশাল ডিসকাউন্টের নোটিফিকেশন পান।"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    বাটন টেক্সট
                  </label>
                  <input
                    type="text"
                    value={config.newsletter_section?.button_text || ''}
                    onChange={(e) => updateNewsletter((prev) => ({ ...prev, button_text: e.target.value }))}
                    placeholder="যুক্ত হোন"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    সাকসেস মেসেজ
                  </label>
                  <input
                    type="text"
                    value={config.newsletter_section?.success_msg || ''}
                    onChange={(e) => updateNewsletter((prev) => ({ ...prev, success_msg: e.target.value }))}
                    placeholder="ধন্যবাদ! আপনি সফলভাবে আমাদের স্পেশাল অফার আপডেটে যুক্ত হয়েছেন।"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Database Subscribers List */}
          <div className="admin-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--ink, #1f2937)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--green, #006C4C)" />
                  <span>সাবস্ক্রাইবার তালিকা (PostgreSQL Database: newsletter_subscribers)</span>
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--muted, #666)' }}>
                  ওয়েবসাইটের অফার বক্সে গ্রাহকদের দেওয়া ইমেইল সরাসরি ডাটাবেজে স্থায়ীভাবে জমা হয়। মোট সাবস্ক্রাইবার: <strong>{subscribers.length} জন</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={loadSubscribers}
                  disabled={loadingSubscribers}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--rule, #e5e0d8)',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={13} className={loadingSubscribers ? 'spin' : ''} />
                  <span>রিফ্রেশ</span>
                </button>

                {subscribers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyAllEmails}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--green, #006C4C)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {copiedEmails ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedEmails ? 'কপি হয়েছে!' : 'সব ইমেইল কপি করুন'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Add Form for Admin Testing */}
            <form onSubmit={handleAddManualEmail} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="email"
                required
                value={testEmailInput}
                onChange={(e) => setTestEmailInput(e.target.value)}
                placeholder="নতুন ইমেইল অ্যাড করুন (যেমন: customer@gmail.com)..."
                style={{ flex: 1, padding: '7px 12px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12.5px' }}
              />
              <button
                type="submit"
                disabled={addingTestEmail}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--green-mist, #e6f4ea)',
                  color: 'var(--green, #006C4C)',
                  fontWeight: '700',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} />
                <span>যুক্ত করুন</span>
              </button>
            </form>

            {/* Subscribers Table */}
            {subscribers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', background: '#FAF8F5', borderRadius: '8px', border: '1px dashed var(--rule, #e5e0d8)' }}>
                <Mail size={24} color="var(--muted, #999)" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted, #666)' }}>
                  এখনো কোনো গ্রাহক ইমেইল দিয়ে সাবস্ক্রাইব করেননি।
                </p>
                <span style={{ fontSize: '11.5px', color: 'var(--muted, #999)', display: 'block', marginTop: '4px' }}>
                  গ্রাহক ওয়েবসাইটের ফুটারে ইমেইল সাবমিট করলে সরাসরি এই তালিকায় প্রদর্শিত হবে।
                </span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--rule, #e5e0d8)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--rule, #e5e0d8)' }}>
                      <th style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--ink, #333)', width: '60px' }}>#</th>
                      <th style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--ink, #333)' }}>গ্রাহকের ইমেইল অ্যাড্রেস</th>
                      <th style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--ink, #333)', width: '180px' }}>সাবস্ক্রিপশনের সময়</th>
                      <th style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--ink, #333)', width: '90px', textAlign: 'center' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub, idx) => (
                      <tr key={sub.id || idx} style={{ borderBottom: '1px solid var(--rule, #f1f5f9)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--muted, #666)' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '600', color: 'var(--ink, #1f2937)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={14} color="var(--green, #006C4C)" />
                            <span>{sub.contact}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--muted, #666)', fontSize: '12px' }}>
                          {sub.created_at ? new Date(sub.created_at).toLocaleString('bn-BD') : 'সম্প্রতি'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubscriber(sub.id)}
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              padding: '5px 9px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              fontWeight: '600'
                            }}
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                            <span>ডিলিট</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: PAYMENT BADGES */}
      {activeTab === 'payments' && (
        <div className="admin-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '700' }}>পেমেন্ট পার্টনার ব্যাজসমূহ</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--muted, #666)' }}>
                বিকাশ, নগদ, রকেট, উপায়, ক্যাশ অন ডেলিভারি এবং সিকিউরিটি ব্যাজ
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={config.payment_badges?.enabled !== false}
                onChange={(e) => updatePaymentBadges((prev) => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
              />
              <span>{config.payment_badges?.enabled !== false ? 'সক্রিয় (Visible)' : 'নিষ্ক্রিয় (Hidden)'}</span>
            </label>
          </div>

          {config.payment_badges?.enabled !== false && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  সেকশন শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.payment_badges?.title || ''}
                  onChange={(e) => updatePaymentBadges((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="১০০% নিরাপদ ও সুরক্ষিত পেমেন্ট পার্টনার"
                  style={{ maxWidth: '360px', width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                {(config.payment_badges?.items || []).map((badge, idx) => (
                  <div
                    key={badge.id || idx}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--rule, #e5e0d8)',
                      background: badge.enabled !== false ? '#fcfbf9' : '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: badge.color || '#006C4C',
                          display: 'inline-block'
                        }}
                      />
                      <input
                        type="text"
                        value={badge.name || ''}
                        onChange={(e) => {
                          const newItems = [...config.payment_badges.items];
                          newItems[idx] = { ...newItems[idx], name: e.target.value };
                          updatePaymentBadges((prev) => ({ ...prev, items: newItems }));
                        }}
                        style={{ padding: '5px 8px', borderRadius: '5px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '12.5px', fontWeight: '600' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...config.payment_badges.items];
                        newItems[idx] = { ...newItems[idx], enabled: newItems[idx].enabled === false ? true : false };
                        updatePaymentBadges((prev) => ({ ...prev, items: newItems }));
                      }}
                      style={{
                        background: badge.enabled !== false ? '#e6f4ea' : '#fee2e2',
                        color: badge.enabled !== false ? '#006C4C' : '#dc2626',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {badge.enabled !== false ? 'সক্রিয়' : 'হাইড'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: COPYRIGHT BAR */}
      {activeTab === 'copyright' && (
        <div className="admin-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: '700' }}>বটম কপিরাইট বার (Bottom Bar)</h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--muted, #666)' }}>
                কপিরাইট নোটিশ ও সিকিউরিটি স্ট্যাম্প
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={config.copyright_bar?.enabled !== false}
                onChange={(e) => updateCopyright((prev) => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
              />
              <span>{config.copyright_bar?.enabled !== false ? 'সক্রিয় (Visible)' : 'নিষ্ক্রিয় (Hidden)'}</span>
            </label>
          </div>

          {config.copyright_bar?.enabled !== false && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  কপিরাইট লেখা
                </label>
                <input
                  type="text"
                  value={config.copyright_bar?.copyright_text || ''}
                  onChange={(e) => updateCopyright((prev) => ({ ...prev, copyright_text: e.target.value }))}
                  placeholder="© ২০২৬ আড়ৎ এক্সপ্রেস — সর্বস্বত্ব সংরক্ষিত।"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  সাব-টেক্সট / সিকিউরিটি স্ট্যাম্প
                </label>
                <input
                  type="text"
                  value={config.copyright_bar?.sub_text || ''}
                  onChange={(e) => updateCopyright((prev) => ({ ...prev, sub_text: e.target.value }))}
                  placeholder="উন্নত প্রযুক্তিতে তৈরি বাংলাদেশের বিশ্বস্ত অনলাইন গ্রোসারি প্ল্যাটফর্ম।"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--rule, #e5e0d8)', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={config.copyright_bar?.show_secure_badge !== false}
                    onChange={(e) => updateCopyright((prev) => ({ ...prev, show_secure_badge: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--green, #006C4C)' }}
                  />
                  <span>সিকিউরিটি শিল্ড আইকন প্রদর্শন করুন</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: LIVE PREVIEW */}
      {activeTab === 'preview' && (
        <div className="admin-card" style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid var(--rule, #e5e0d8)' }}>
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>লাইভ ফুটার প্রিভিউ (Website Live Preview)</h3>
            <span style={{ fontSize: '12px', color: 'var(--green, #006C4C)', fontWeight: '600' }}>
              ওয়েবসাইটে যেমন দেখাবে:
            </span>
          </div>
          <div style={{ border: '1px solid var(--rule, #e5e0d8)', borderRadius: '10px', overflow: 'hidden' }}>
            <Footer />
          </div>
        </div>
      )}

    </div>
  );
}
