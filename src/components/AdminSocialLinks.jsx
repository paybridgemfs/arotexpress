"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  Sliders,
  Sparkles,
  Info,
  Smartphone,
  Monitor,
  LayoutTemplate,
  Type,
  Maximize2
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';
import SocialLucideIcon from './SocialLucideIcon.jsx';
import { useStoreData } from '../context/StoreDataContext';
import { useCart } from '../context/CartContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

// Suggested popular brand presets using React-Icons
const POPULAR_SUGGESTIONS = [
  { name: 'Facebook', icon: 'FaFacebook', text: 'ফেসবুক', bg_color: '#1877F2', text_color: '#ffffff' },
  { name: 'WhatsApp', icon: 'FaWhatsapp', text: 'হোয়াটসঅ্যাপ', bg_color: '#25D366', text_color: '#ffffff' },
  { name: 'IMO', icon: 'SiImo', text: 'ইমো', bg_color: '#00A4E4', text_color: '#ffffff' },
  { name: 'Telegram', icon: 'FaTelegram', text: 'টেলিগ্রাম', bg_color: '#229ED9', text_color: '#ffffff' },
  { name: 'YouTube', icon: 'FaYoutube', text: 'ইউটিউব', bg_color: '#FF0000', text_color: '#ffffff' },
  { name: 'Instagram', icon: 'FaInstagram', text: 'ইনস্টাগ্রাম', bg_color: '#E4405F', text_color: '#ffffff' },
  { name: 'TikTok', icon: 'FaTiktok', text: 'টিকটক', bg_color: '#000000', text_color: '#ffffff' },
  { name: 'Messenger', icon: 'FaFacebookMessenger', text: 'মেসেঞ্জার', bg_color: '#00B2FF', text_color: '#ffffff' },
  { name: 'Hotline', icon: 'FaPhoneVolume', text: 'জরুরি হেল্পলাইন', bg_color: '#006C4C', text_color: '#ffffff' },
  { name: 'Email', icon: 'FaEnvelope', text: 'ইমেইল করুন', bg_color: '#EA4335', text_color: '#ffffff' },
  { name: 'Website', icon: 'FaGlobe', text: 'অফিসিয়াল ওয়েবসাইট', bg_color: '#0f766e', text_color: '#ffffff' },
  { name: 'LinkedIn', icon: 'FaLinkedin', text: 'লিঙ্কডইন', bg_color: '#0A66C2', text_color: '#ffffff' }
];

// Clickable React-Icons visual browser for the Add/Edit Modal
const REACT_ICON_PICKER_LIST = [
  { name: 'FaFacebook', label: 'Facebook' },
  { name: 'FaFacebookMessenger', label: 'Messenger' },
  { name: 'FaWhatsapp', label: 'WhatsApp' },
  { name: 'SiImo', label: 'IMO' },
  { name: 'FaTelegram', label: 'Telegram' },
  { name: 'FaYoutube', label: 'YouTube' },
  { name: 'FaInstagram', label: 'Instagram' },
  { name: 'FaTiktok', label: 'TikTok' },
  { name: 'FaPhoneVolume', label: 'Phone Call' },
  { name: 'FaPhone', label: 'Telephone' },
  { name: 'FaHeadset', label: 'Support / Help' },
  { name: 'FaComments', label: 'Live Chat' },
  { name: 'FaEnvelope', label: 'Email' },
  { name: 'SiGmail', label: 'Gmail' },
  { name: 'FaGlobe', label: 'Website' },
  { name: 'FaShopify', label: 'Shop / Store' },
  { name: 'FaXTwitter', label: 'X (Twitter)' },
  { name: 'FaLinkedin', label: 'LinkedIn' },
  { name: 'FaDiscord', label: 'Discord' },
  { name: 'FaViber', label: 'Viber' },
  { name: 'FaThreads', label: 'Threads' },
  { name: 'FaShareNodes', label: 'Share' },
  { name: 'FaLink', label: 'Link' },
  { name: 'FaEnvelopeOpenText', label: 'Newsletter' }
];

export default function AdminSocialLinks({ adminToken }) {
  const { settings = {}, fetchData } = useStoreData();
  const { showToast } = useCart();
  const { confirm } = useConfirm();

  // Social links configuration state
  const [socialLinks, setSocialLinks] = useState([]);
  const [socialsPosition, setSocialsPosition] = useState('inline'); // 'inline' | 'fixed'
  const [socialsEnabled, setSocialsEnabled] = useState(true);
  const [socialsDisplayMode, setSocialsDisplayMode] = useState('both'); // 'both' | 'icon_only' | 'text_only'
  const [socialsMobileBehavior, setSocialsMobileBehavior] = useState('auto_floating'); // 'auto_floating' | 'follow_position' | 'hidden'
  const [socialsShape, setSocialsShape] = useState('pill'); // 'pill' | 'rounded' | 'square'
  const [socialsSize, setSocialsSize] = useState('md'); // 'sm' | 'md' | 'lg'

  // Live preview device tab
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

  // Form State for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    url: '',
    icon: 'FaShareNodes',
    bg_color: '#006C4C',
    text_color: '#FFFFFF',
    is_active: true
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Hydrate from settings
  useEffect(() => {
    if (settings) {
      if (Array.isArray(settings.social_links)) {
        setSocialLinks(settings.social_links);
      } else {
        setSocialLinks([
          { id: 'soc-1', name: 'Facebook', text: 'ফেসবুক পেজ', url: 'https://facebook.com', icon: 'FaFacebook', bg_color: '#1877F2', text_color: '#FFFFFF', is_active: true },
          { id: 'soc-2', name: 'WhatsApp', text: 'হোয়াটসঅ্যাপ', url: 'https://wa.me/8801712345678', icon: 'FaWhatsapp', bg_color: '#25D366', text_color: '#FFFFFF', is_active: true }
        ]);
      }
      setSocialsPosition(settings.socials_position || 'inline');
      setSocialsEnabled(settings.socials_enabled !== false);
      setSocialsDisplayMode(settings.socials_display_mode || 'both');
      setSocialsMobileBehavior(settings.socials_mobile_behavior || 'auto_floating');
      setSocialsShape(settings.socials_shape || 'pill');
      setSocialsSize(settings.socials_size || 'md');
    }
  }, [settings]);

  // Open Form for Adding New Link
  const handleOpenAdd = () => {
    if (socialLinks.length >= 5) {
      showToast?.('সর্বোচ্চ ৫টি সোশ্যাল লিংক যুক্ত করা যাবে');
      return;
    }
    setEditingId(null);
    setFormData({
      name: '',
      text: '',
      url: '',
      icon: 'FaShareNodes',
      bg_color: '#006C4C',
      text_color: '#FFFFFF',
      is_active: true
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Link
  const handleOpenEdit = (link) => {
    setEditingId(link.id);
    setFormData({
      name: link.name || '',
      text: link.text || '',
      url: link.url || '',
      icon: link.icon || 'FaShareNodes',
      bg_color: link.bg_color || '#006C4C',
      text_color: link.text_color || '#FFFFFF',
      is_active: link.is_active !== false
    });
    setIsFormOpen(true);
  };

  // Apply Quick Preset
  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      text: preset.text,
      icon: preset.icon,
      bg_color: preset.bg_color,
      text_color: preset.text_color
    }));
  };

  // Save Item to list (in memory)
  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.text.trim() || !formData.url.trim()) {
      showToast?.('অনুগ্রহ করে নাম, বাটন টেক্সট ও লিংক পূরণ করুন');
      return;
    }

    if (editingId) {
      // Update
      setSocialLinks((prev) =>
        prev.map((item) => (item.id === editingId ? { ...formData, id: editingId } : item))
      );
    } else {
      // Add
      if (socialLinks.length >= 5) {
        showToast?.('সর্বোচ্চ ৫টি লিংক যোগ করা সম্ভব');
        return;
      }
      const newId = `soc-${Date.now()}`;
      setSocialLinks((prev) => [...prev, { ...formData, id: newId }]);
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  // Delete Link
  const handleDeleteLink = async (id) => {
    const ok = await confirm({
      title: 'সোশ্যাল লিংক মুছুন',
      message: 'আপনি কি এই সোশ্যাল লিংকটি মুছে ফেলতে চান?',
      confirmText: 'মুছে ফেলুন',
      cancelText: 'বাতিল',
      type: 'danger'
    });
    if (ok) {
      setSocialLinks((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = (id) => {
    setSocialLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_active: !item.is_active } : item))
    );
  };

  // Move Up/Down
  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= socialLinks.length) return;
    const updated = [...socialLinks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSocialLinks(updated);
  };

  // Save All Settings to Backend API
  const handleSaveToBackend = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        social_links: socialLinks,
        socials_position: socialsPosition,
        socials_enabled: socialsEnabled,
        socials_display_mode: socialsDisplayMode,
        socials_mobile_behavior: socialsMobileBehavior,
        socials_shape: socialsShape,
        socials_size: socialsSize
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'সেভ করতে সমস্যা হয়েছে');
      }

      setSaveSuccess(true);
      showToast?.('সোশ্যাল লিংক ও বাটন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
      fetchData(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      showToast?.(err.message || 'সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const activeLinks = socialLinks.filter((l) => l.is_active !== false);

  return (
    <div className="admin-content-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header Card */}
      <div className="admin-card" style={{ padding: '18px 20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={20} color="var(--green)" />
              <span>সোশ্যাল লিংক ও যোগাযোগ বাটন কাস্টমাইজেশন</span>
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0 0' }}>
              ওয়েবসাইটের সোশ্যাল মিডিয়া, হোয়াটসঅ্যাপ, ইমো, টেলিগ্রাম বা কল বাটন এবং তাদের অবস্থান, টেক্সট, আইকন ও আকার কাস্টমাইজ করুন।
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="admin-btn primary"
              onClick={handleOpenAdd}
              disabled={socialLinks.length >= 5}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: socialLinks.length >= 5 ? 0.6 : 1,
                cursor: socialLinks.length >= 5 ? 'not-allowed' : 'pointer'
              }}
            >
              <Plus size={16} />
              <span>নতুন লিংক যোগ করুন ({toBengaliNumber(socialLinks.length)}/৫)</span>
            </button>

            <button
              type="button"
              className="admin-btn primary"
              onClick={handleSaveToBackend}
              disabled={saving}
              style={{
                background: saveSuccess ? '#16a34a' : '#006C4C',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : saveSuccess ? '✓ সংরক্ষিত হয়েছে' : 'পরিবর্তন সংরক্ষণ করুন'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Full Customization Settings (Left) + Interactive Live Preview (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* LEFT COLUMN: Customization Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Main Display & Positioning Controls */}
          <div className="admin-card" style={{ padding: '16px 18px', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} color="var(--green)" />
              <span>বাটন ডিসপ্লে ও লেআউট সেটিংস</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* 1. Master Enable Switch */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, display: 'block' }}>সোশ্যাল বাটন চালু রাখুন</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>ওয়েবসাইটে বাটনসমূহ সক্রিয় করতে টিক দিন</span>
                </div>
                <input
                  type="checkbox"
                  checked={socialsEnabled}
                  onChange={(e) => setSocialsEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--green)', cursor: 'pointer' }}
                />
              </label>

              {/* 2. Position Selection */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
                  বাটন প্রদর্শনের ধরন (পজিশন):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSocialsPosition('inline')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${socialsPosition === 'inline' ? 'var(--green)' : 'var(--rule)'}`,
                      background: socialsPosition === 'inline' ? 'rgba(0, 108, 76, 0.08)' : '#ffffff',
                      color: socialsPosition === 'inline' ? 'var(--green)' : 'var(--text)',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <LayoutTemplate size={16} />
                    <span>হিরো বক্সের পাশে ইনলাইন</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 500, opacity: 0.8 }}>প্যাকেজ বক্সের পাশে স্বাভাবিকভাবে</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSocialsPosition('fixed')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${socialsPosition === 'fixed' ? 'var(--green)' : 'var(--rule)'}`,
                      background: socialsPosition === 'fixed' ? 'rgba(0, 108, 76, 0.08)' : '#ffffff',
                      color: socialsPosition === 'fixed' ? 'var(--green)' : 'var(--text)',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sliders size={16} />
                    <span>স্ক্রিনের পাশে ফ্লোটিং</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 500, opacity: 0.8 }}>স্ক্রিনের ডানে স্থির ভিউ</span>
                  </button>
                </div>
              </div>

              {/* 3. Display Mode (Icon + Text vs Icon Only vs Text Only) */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
                  বাটন কনটেন্ট প্রদর্শন (ডিসপ্লে মোড):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'both', label: 'আইকন + টেক্সট', sub: 'উভয়ই থাকবে' },
                    { id: 'icon_only', label: 'শুধুমাত্র আইকন', sub: 'টেক্সট ছাড়া' },
                    { id: 'text_only', label: 'শুধুমাত্র টেক্সট', sub: 'আইকন ছাড়া' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSocialsDisplayMode(mode.id)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '6px',
                        border: `2px solid ${socialsDisplayMode === mode.id ? 'var(--green)' : 'var(--rule)'}`,
                        background: socialsDisplayMode === mode.id ? 'rgba(0, 108, 76, 0.08)' : '#ffffff',
                        color: socialsDisplayMode === mode.id ? 'var(--green)' : 'var(--text)',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div>{mode.label}</div>
                      <div style={{ fontSize: '10px', fontWeight: 500, opacity: 0.75 }}>{mode.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Mobile Device Behavior */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
                  মোবাইল ডিভাইসে আচরণ (Mobile Screen):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'auto_floating', label: 'অটো ফ্লোটিং', sub: 'শুধু আইকন ফ্লোটিং' },
                    { id: 'follow_position', label: 'স্বাভাবিক পজিশন', sub: 'বক্সের নিচে / ফিক্সড' },
                    { id: 'hidden', label: 'লুকিয়ে রাখুন', sub: 'মোবাইলে বন্ধ' }
                  ].map((mb) => (
                    <button
                      key={mb.id}
                      type="button"
                      onClick={() => setSocialsMobileBehavior(mb.id)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '6px',
                        border: `2px solid ${socialsMobileBehavior === mb.id ? 'var(--green)' : 'var(--rule)'}`,
                        background: socialsMobileBehavior === mb.id ? 'rgba(0, 108, 76, 0.08)' : '#ffffff',
                        color: socialsMobileBehavior === mb.id ? 'var(--green)' : 'var(--text)',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div>{mb.label}</div>
                      <div style={{ fontSize: '10px', fontWeight: 500, opacity: 0.75 }}>{mb.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Button Shape & Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '4px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                    বাটনের আকৃতি (Shape):
                  </label>
                  <select
                    value={socialsShape}
                    onChange={(e) => setSocialsShape(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--rule)', fontSize: '12.5px', background: '#fff' }}
                  >
                    <option value="pill">পিল / গোল (Pill - 50px)</option>
                    <option value="rounded">রাউন্ডেড (Rounded - 8px)</option>
                    <option value="square">স্কয়ার (Square - 4px)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                    বাটনের আকার (Size):
                  </label>
                  <select
                    value={socialsSize}
                    onChange={(e) => setSocialsSize(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--rule)', fontSize: '12.5px', background: '#fff' }}
                  >
                    <option value="sm">ছোট (Compact / Small)</option>
                    <option value="md">মাঝারি (Standard / Medium)</option>
                    <option value="lg">বড় (Prominent / Large)</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Social Links Manager List */}
          <div className="admin-card" style={{ padding: '16px 18px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                সংযুক্ত লিংকসমূহ ({toBengaliNumber(socialLinks.length)}/৫)
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                তীর চিহ্ন দিয়ে ক্রম ঠিক করুন
              </span>
            </div>

            {socialLinks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--muted)', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px' }}>এখনো কোনো সোশ্যাল লিংক যুক্ত করা হয়নি।</p>
                <button
                  type="button"
                  className="admin-btn primary"
                  onClick={handleOpenAdd}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  প্রথম লিংক যোগ করুন
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {socialLinks.map((link, idx) => (
                  <div
                    key={link.id || `admin-soc-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: link.is_active !== false ? '#ffffff' : '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid var(--rule)',
                      gap: '10px',
                      opacity: link.is_active !== false ? 1 : 0.6
                    }}
                  >
                    {/* Visual Pill & Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: socialsShape === 'pill' ? '50%' : socialsShape === 'rounded' ? '6px' : '3px',
                          background: link.bg_color || '#006C4C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: link.text_color || '#ffffff',
                          flexShrink: 0,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                      >
                        <SocialLucideIcon name={link.icon} size={16} color={link.text_color || '#ffffff'} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{link.text || link.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>({link.icon || link.name})</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {link.url}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        title="উপরে নিন"
                        style={{ background: 'none', border: 'none', padding: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 0.8 }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === socialLinks.length - 1}
                        title="নিচে নিন"
                        style={{ background: 'none', border: 'none', padding: '4px', cursor: idx === socialLinks.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === socialLinks.length - 1 ? 0.3 : 0.8 }}
                      >
                        <ArrowDown size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(link.id)}
                        title={link.is_active !== false ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          background: link.is_active !== false ? '#dcfce7' : '#fee2e2',
                          color: link.is_active !== false ? '#15803d' : '#b91c1c'
                        }}
                      >
                        {link.is_active !== false ? 'সক্রিয়' : 'বন্ধ'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(link)}
                        title="সম্পাদনা"
                        style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer', color: 'var(--ink)' }}
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLink(link.id)}
                        title="মুছুন"
                        style={{ background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '5px', cursor: 'pointer', color: '#b91c1c' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Live Interactive Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="admin-card" style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', position: 'sticky', top: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} color="var(--green)" />
                <span>লাইভ প্রিভিউ</span>
              </h3>

              {/* Device Selector Tabs */}
              <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: previewDevice === 'desktop' ? '#ffffff' : 'transparent',
                    color: previewDevice === 'desktop' ? 'var(--green)' : 'var(--muted)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: previewDevice === 'desktop' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Monitor size={13} />
                  <span>ডেস্কটপ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: previewDevice === 'mobile' ? '#ffffff' : 'transparent',
                    color: previewDevice === 'mobile' ? 'var(--green)' : 'var(--muted)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: previewDevice === 'mobile' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Smartphone size={13} />
                  <span>মোবাইল</span>
                </button>
              </div>
            </div>

            {/* Simulated Frame */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--rule)',
                borderRadius: '12px',
                padding: previewDevice === 'mobile' ? '18px 12px' : '24px 18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                position: 'relative',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)',
                maxWidth: previewDevice === 'mobile' ? '300px' : '100%',
                margin: '0 auto',
                width: '100%'
              }}
            >
              {!socialsEnabled ? (
                <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>
                  সোশ্যাল বাটন বর্তমানে বন্ধ রয়েছে।
                </div>
              ) : activeLinks.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>
                  কোনো সক্রিয় সোশ্যাল লিংক নেই।
                </div>
              ) : previewDevice === 'mobile' && socialsMobileBehavior === 'hidden' ? (
                <div style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center' }}>
                  🚫 মোবাইল ডিভাইসে বাটন লুকানো (Hidden on Mobile) হিসেবে সেট করা রয়েছে।
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: previewDevice === 'mobile' ? 'flex-end' : socialsPosition === 'fixed' ? 'flex-end' : 'flex-start', gap: '8px' }}>
                  <div style={{ width: '100%', fontSize: '10.5px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '6px' }}>
                    {previewDevice === 'mobile'
                      ? (socialsMobileBehavior === 'auto_floating' ? 'মোবাইল: অটো ফ্লোটিং শুধু আইকন' : 'মোবাইল ভিউ')
                      : (socialsPosition === 'inline' ? 'হিরো বক্সের পাশে ইনলাইন' : 'স্ক্রিনের ডানে ফ্লোটিং')}
                  </div>

                  {activeLinks.map((link, idx) => {
                    const isMobileAutoFloating = previewDevice === 'mobile' && socialsMobileBehavior === 'auto_floating';
                    const showIcon = socialsDisplayMode !== 'text_only' || isMobileAutoFloating;
                    const showText = !isMobileAutoFloating && socialsDisplayMode !== 'icon_only';

                    const radius = isMobileAutoFloating
                      ? '50%'
                      : socialsShape === 'pill'
                      ? '50px'
                      : socialsShape === 'rounded'
                      ? '8px'
                      : '4px';

                    return (
                      <div
                        key={`prev-${idx}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: isMobileAutoFloating || !showText ? 'center' : 'flex-start',
                          gap: showIcon && showText ? '8px' : '0',
                          padding: isMobileAutoFloating
                            ? '0'
                            : !showText
                            ? '10px'
                            : socialsSize === 'sm'
                            ? '5px 12px'
                            : socialsSize === 'lg'
                            ? '9px 18px'
                            : '7px 14px',
                          width: isMobileAutoFloating ? '40px' : !showText ? (socialsSize === 'lg' ? '44px' : '38px') : 'max-content',
                          height: isMobileAutoFloating ? '40px' : !showText ? (socialsSize === 'lg' ? '44px' : '38px') : 'auto',
                          borderRadius: radius,
                          background: link.bg_color || '#006C4C',
                          color: link.text_color || '#ffffff',
                          fontWeight: '700',
                          fontSize: socialsSize === 'sm' ? '11px' : socialsSize === 'lg' ? '13.5px' : '12px',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.14)',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                          alignSelf: previewDevice === 'mobile' || socialsPosition === 'fixed' ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {showIcon && (
                          <SocialLucideIcon
                            name={link.icon}
                            size={socialsSize === 'sm' ? 14 : socialsSize === 'lg' ? 18 : 16}
                            color={link.text_color || '#ffffff'}
                          />
                        )}
                        {showText && (
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.text || link.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} color="var(--green)" />
              <span>টেক্সট বা আইকন যতটুকুই হোক, বাটনের প্রস্থ (width) স্বয়ংক্রিয়ভাবে নিখুঁত মানিয়ে নিবে।</span>
            </div>
          </div>
        </div>

      </div>

      {/* POPUP MODAL: Add & Edit Social Link (100% React Icons Based) */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            className="admin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsFormOpen(false)}
          >
            <motion.div
              className="admin-modal-card"
              style={{ maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingId ? (
                    <>
                      <Edit3 size={18} />
                      <span>সোশ্যাল লিংক এডিট করুন</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>নতুন সোশ্যাল লিংক যোগ করুন</span>
                    </>
                  )}
                </h3>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setIsFormOpen(false)}
                  aria-label="বন্ধ করুন"
                >
                  <X size={18} />
                </button>
              </div>

              <form className="admin-modal-form" onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div className="admin-modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 130px)', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    {/* 1. Quick Presets */}
                    <div style={{ background: '#F8FAF9', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--rule)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={13} color="#f59e0b" />
                        <span>জনপ্রিয় ব্র্যান্ড প্রিসেট (১-ক্লিকে নির্বাচন করুন):</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {POPULAR_SUGGESTIONS.map((preset, idx) => (
                          <button
                            key={`preset-${idx}`}
                            type="button"
                            onClick={() => handleApplyPreset(preset)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              border: '1px solid var(--rule)',
                              background: '#FFFFFF',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = preset.bg_color; e.currentTarget.style.background = '#F1F5F3'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--rule)'; e.currentTarget.style.background = '#FFFFFF'; }}
                          >
                            <SocialLucideIcon name={preset.icon} size={14} color={preset.bg_color} />
                            <span>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Platform / Link Name */}
                    <div className="field" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, fontSize: '13px' }}>প্ল্যাটফর্মের নাম (Platform Name) *</label>
                      <input
                        type="text"
                        placeholder="যেমন: Facebook, WhatsApp, IMO, Telegram, Hotline"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoFocus
                        style={{ padding: '9px 12px' }}
                      />
                    </div>

                    {/* 3. Button Text */}
                    <div className="field" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, fontSize: '13px' }}>বাটন টেক্সট (Button Text / Label) *</label>
                      <input
                        type="text"
                        placeholder="যেমন: ফেসবুক পেজ, হোয়াটসঅ্যাপে অর্ডার, কল করুন"
                        value={formData.text}
                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                        required
                        style={{ padding: '9px 12px' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', display: 'block' }}>
                        বাটনের দৈর্ঘ্য টেক্সট অনুযায়ী সম্পূর্ণ ডাইনামিক হবে (কোনো ফিক্সড উইডথ নেই)।
                      </span>
                    </div>

                    {/* 4. URL */}
                    <div className="field" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, fontSize: '13px' }}>লিংক URL (Target Link / Action) *</label>
                      <input
                        type="text"
                        placeholder="যেমন: https://facebook.com/..., https://wa.me/88017..., tel:01712345678"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        required
                        style={{ padding: '9px 12px' }}
                      />
                    </div>

                    {/* 5. React Icons Picker & Input */}
                    <div className="field" style={{ margin: 0 }}>
                      <label style={{ fontWeight: 600, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>React Icon নির্বাচন করুন *</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>নিচের আইকনে ক্লিক করুন বা নাম লিখুন</span>
                      </label>

                      {/* Visual Click-to-Select React Icons Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                          gap: '6px',
                          maxHeight: '130px',
                          overflowY: 'auto',
                          padding: '8px',
                          background: '#f8fafc',
                          border: '1px solid var(--rule)',
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}
                      >
                        {REACT_ICON_PICKER_LIST.map((ic) => {
                          const isSelected = formData.icon === ic.name || formData.icon.toLowerCase() === ic.label.toLowerCase();
                          return (
                            <button
                              key={ic.name}
                              type="button"
                              onClick={() => setFormData({ ...formData, icon: ic.name })}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 4px',
                                borderRadius: '6px',
                                border: `1.5px solid ${isSelected ? 'var(--green)' : 'var(--rule)'}`,
                                background: isSelected ? 'rgba(0, 108, 76, 0.1)' : '#ffffff',
                                color: isSelected ? 'var(--green)' : 'var(--text)',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: isSelected ? 700 : 500,
                                transition: 'all 0.1s ease'
                              }}
                            >
                              <SocialLucideIcon name={ic.name} size={16} color={isSelected ? 'var(--green)' : undefined} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>
                                {ic.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Manual input + Live swatch */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="যেমন: FaFacebook, FaWhatsapp, SiImo, FaPhoneVolume, FaTelegram"
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          required
                          style={{ flex: 1, padding: '9px 12px' }}
                        />
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            border: '1px solid var(--rule)',
                            borderRadius: socialsShape === 'pill' ? '50%' : '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: formData.bg_color || '#006C4C',
                            color: formData.text_color || '#ffffff',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)'
                          }}
                          title="আইকন লাইভ প্রিভিউ"
                        >
                          <SocialLucideIcon name={formData.icon} size={20} color={formData.text_color || '#ffffff'} />
                        </div>
                      </div>
                    </div>

                    {/* 6. Color Selectors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 600, fontSize: '13px' }}>ব্যাকগ্রাউন্ড কালার</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="color"
                            value={formData.bg_color}
                            onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                            style={{ width: '38px', height: '38px', border: '1px solid var(--rule)', borderRadius: '6px', cursor: 'pointer', padding: '2px', background: '#FFFFFF' }}
                          />
                          <input
                            type="text"
                            value={formData.bg_color}
                            onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                            style={{ flex: 1, padding: '8px 10px', fontSize: '12.5px', fontFamily: 'monospace' }}
                          />
                        </div>
                      </div>

                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 600, fontSize: '13px' }}>টেক্সট ও আইকন কালার</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="color"
                            value={formData.text_color}
                            onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                            style={{ width: '38px', height: '38px', border: '1px solid var(--rule)', borderRadius: '6px', cursor: 'pointer', padding: '2px', background: '#FFFFFF' }}
                          />
                          <input
                            type="text"
                            value={formData.text_color}
                            onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                            style={{ flex: 1, padding: '8px 10px', fontSize: '12.5px', fontFamily: 'monospace' }}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="admin-modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--rule)', background: '#ffffff' }}>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setIsFormOpen(false)}
                  >
                    বাতিল
                  </button>
                  <motion.button
                    type="submit"
                    className="admin-btn primary"
                    style={{ padding: '8px 22px', fontWeight: 700 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
