"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Folder,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  ExternalLink,
  Lock,
  Trash2,
  Check,
  Server
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminGDrive({ showToast }) {
  const { adminToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModal, setDisconnectModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/gdrive/status', {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'গুগল ড্রাইভ স্ট্যাটাস লোড করা সম্ভব হয়নি');
      }
    } catch (e) {
      setErrorMsg('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchStats();

    // Check URL parameters for status
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('connected') === '1') {
        setSuccessMsg('অভিনন্দন! আপনার গুগল ড্রাইভ একাউন্ট সফলভাবে কানেক্ট হয়েছে।');
        if (showToast) showToast('গুগল ড্রাইভ সফলভাবে কানেক্ট হয়েছে');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
      const err = urlParams.get('error');
      if (err) {
        setErrorMsg(decodeURIComponent(err));
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [fetchStats, showToast]);

  const handleConnect = async () => {
    setConnecting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/gdrive/auth-url', {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(data.error || 'গুগল লগইন লিঙ্ক তৈরি করতে ব্যর্থ হয়েছে');
        setConnecting(false);
      }
    } catch (e) {
      setErrorMsg('লগইন প্রক্রিয়ায় ত্রুটি হয়েছে');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch('/api/gdrive/disconnect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (res.ok) {
        setDisconnectModal(false);
        setSuccessMsg('গুগল ড্রাইভ একাউন্ট ডিসকানেক্ট করা হয়েছে');
        if (showToast) showToast('গুগল ড্রাইভ ডিসকানেক্ট করা হয়েছে');
        await fetchStats();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'ডিসকানেক্ট করতে সমস্যা হয়েছে');
      }
    } catch (e) {
      setErrorMsg('সার্ভারে সমস্যা হয়েছে');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="admin-tab-content">
      {/* Top Header */}
      <div className="section-head" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#E6F4EA', color: '#137333', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>গুগল ড্রাইভ স্টোরেজ</h2>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                ArotExpress-এর সব প্রোডাক্ট ও ব্যানার ছবি অ্যাডমিনের নিজস্ব গুগল ড্রাইভে সংরক্ষণ
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="admin-btn secondary"
            onClick={() => fetchStats()}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: '#E6F4EA',
              border: '1px solid #CEEAD6',
              color: '#137333',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 500
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#137333', fontWeight: 700 }}
            >
              ✕
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: '#FCE8E6',
              border: '1px solid #FAD2CF',
              color: '#C5221F',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 500
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5221F', fontWeight: 700 }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      {loading && !stats ? (
        <div style={{ background: '#fff', padding: '40px', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--rule)' }}>
          <RefreshCw size={28} className="spin-icon" style={{ color: 'var(--green)', margin: '0 auto 12px auto' }} />
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>গুগল ড্রাইভের তথ্য লোড হচ্ছে...</p>
        </div>
      ) : stats?.is_connected ? (
        /* CONNECTED STATE */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Account Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              border: '1px solid var(--rule)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  {stats.account_picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stats.account_picture}
                      alt={stats.account_name || 'Google Profile'}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        border: '3px solid #E6F4EA',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'var(--green-light)',
                        color: 'var(--green)',
                        fontSize: '24px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid #E6F4EA'
                      }}
                    >
                      {stats.account_name ? stats.account_name.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#137333',
                      border: '2px solid #fff'
                    }}
                    title="কানেক্টেড"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                      {stats.account_name || 'সংযুক্ত গুগল একাউন্ট'}
                    </h3>
                    <span
                      style={{
                        background: '#E6F4EA',
                        color: '#137333',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckCircle2 size={12} />
                      সক্রিয় ও সংযুক্ত
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '4px' }}>
                    {stats.account_email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--green)', marginTop: '6px' }}>
                    <Folder size={14} />
                    <span>আপলোড ফোল্ডার: <strong>{stats.folder_name}</strong></span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="admin-btn danger"
                  onClick={() => setDisconnectModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    padding: '9px 16px',
                    borderRadius: '8px'
                  }}
                >
                  <LogOut size={15} />
                  <span>লগআউট / ডিসকানেক্ট</span>
                </button>
              </div>
            </div>
          </div>

          {/* Storage & Usage Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Metric 1: Total Images */}
            <div
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--rule)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>মোট আপলোডকৃত ছবি</span>
                <div style={{ background: '#E8F0FE', color: '#1A73E8', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)' }}>
                {toBengaliNumber(stats.folder_image_count)} <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--muted)' }}>টি</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--green-dim)', marginTop: '6px' }}>
                ফোল্ডার: {stats.folder_name}
              </div>
            </div>

            {/* Metric 2: Storage Used */}
            <div
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--rule)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>ব্যবহৃত স্টোরেজ</span>
                <div style={{ background: '#FEF7E0', color: '#B06000', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HardDrive size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)' }}>
                {stats.storage_used_formatted}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                মোট স্টোরেজের {toBengaliNumber(stats.storage_percentage)}% ব্যবহৃত
              </div>
            </div>

            {/* Metric 3: Storage Free */}
            <div
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--rule)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>খালি স্টোরেজ</span>
                <div style={{ background: '#E6F4EA', color: '#137333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#137333' }}>
                {stats.storage_free_formatted}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                সর্বমোট সীমা: {stats.storage_total_formatted}
              </div>
            </div>
          </div>

          {/* Visual Progress Bar Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              border: '1px solid var(--rule)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                ড্রাইভ স্টোরেজ স্পেস ব্যবহার
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}>
                {stats.storage_used_formatted} / {stats.storage_total_formatted}
              </div>
            </div>

            {/* Progress Track */}
            <div style={{ width: '100%', height: '14px', background: '#F1F3F4', borderRadius: '8px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, stats.storage_percentage)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: stats.storage_percentage > 90 ? 'linear-gradient(90deg, #EA4335, #D93025)' : 'linear-gradient(90deg, #34A853, #1E8E3E)',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
              <span>০ GB</span>
              <span>{stats.storage_total_formatted}</span>
            </div>
          </div>

          {/* Features / Safeguards Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-lg)',
              padding: '20px'
            }}
          >
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#166534', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} />
              <span>স্বয়ংক্রিয় গুগল ড্রাইভ ফিচারসমূহ:</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#14532D' }}>
                <Check size={16} style={{ color: '#16A34A', marginTop: '2px', flexShrink: 0 }} />
                <span><strong>হাই-স্পিড সিডিএন:</strong> গুগলের নিজস্ব CDN লিংক দিয়ে যেকোনো ছবি সুপার ফাস্ট লোড হবে।</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#14532D' }}>
                <Check size={16} style={{ color: '#16A34A', marginTop: '2px', flexShrink: 0 }} />
                <span><strong>অটো ডিলিট:</strong> প্রোডাক্ট বা ছবি আপডেট/ডিলিট করলে ড্রাইভ থেকে পুরনো ছবি স্বয়ংক্রিয় মুছে যাবে।</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#14532D' }}>
                <Check size={16} style={{ color: '#16A34A', marginTop: '2px', flexShrink: 0 }} />
                <span><strong>আজীবন স্থায়ী:</strong> আপনার পার্সোনাল গুগল ড্রাইভে ছবি আজীবন ব্যাকআপ হিসেবে সংরক্ষিত থাকবে।</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DISCONNECTED / NOT YET CONNECTED STATE */
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 24px',
            border: '1px solid var(--rule)',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            maxWidth: '680px',
            margin: '0 auto'
          }}
        >
          {/* Google Drive Logo Badge */}
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '20px',
              background: '#F0F9F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              border: '2px solid #D1FAE5'
            }}
          >
            <svg width="44" height="44" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 10px 0' }}>
            অ্যাডমিন গুগল ড্রাইভ কানেক্ট করুন
          </h3>
          <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 auto 28px auto', maxWidth: '520px' }}>
            ArotExpress-এর যাবতীয় পণ্যের ছবি, ক্যাটাগরি আইকন ও ব্যানার সরাসরি আপনার গুগল ড্রাইভের <strong>ArotExpress Photos</strong> ফোল্ডারে আজীবন সুরক্ষিত থাকবে।
          </p>

          {/* Benefits Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={15} style={{ color: 'var(--green)' }} />
                <span>১৫ GB ফ্রি ক্লাউড স্পেস</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                কোনো ইমেজ হোস্টিং খরচ ছাড়াই আনলিমিটেড ছবি আপলোড
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} style={{ color: '#D97706' }} />
                <span>সুপার ফাস্ট লোডিং</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                গুগলের নিজস্ব হাই-স্পিড সিডিএন দিয়ে দ্রুত প্রদর্শিত হয়
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={15} style={{ color: '#DC2626' }} />
                <span>অটো ড্রাইভ ক্লিনআপ</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                পণ্য ডিলিট করলে ড্রাইভ থেকে অটো রিমুভ হয়ে যাবে
              </div>
            </div>
          </div>

          {/* Sign in with Google Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            disabled={connecting}
            style={{
              background: '#ffffff',
              border: '1px solid #DADCE0',
              borderRadius: '8px',
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#3C4043',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            {connecting ? (
              <>
                <RefreshCw size={18} className="spin-icon" style={{ color: 'var(--green)' }} />
                <span>গুগল অথরাইজেশন প্রস্তুত হচ্ছে...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google (গুগল ড্রাইভ যুক্ত করুন)</span>
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {disconnectModal && (
          <div className="modal-backdrop" onClick={() => setDisconnectModal(false)}>
            <motion.div
              className="admin-modal"
              style={{ maxWidth: '440px' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626' }}>
                  <LogOut size={18} />
                  <span>গুগল ড্রাইভ ডিসকানেক্ট নিশ্চিতকরণ</span>
                </h3>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setDisconnectModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  আপনি কি নিশ্চিত যে আপনি আপনার গুগল ড্রাইভ একাউন্ট (<strong>{stats?.account_email}</strong>) ডিসকানেক্ট করতে চান?
                </p>
                <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', padding: '12px', fontSize: '12.5px', color: '#991B1B', marginBottom: '20px' }}>
                  ⚠️ ডিসকানেক্ট করলে নতুন কোনো ছবি গুগল ড্রাইভে আপলোড হবে না যতক্ষণ না আপনি পুনরায় লগইন করছেন। তবে ড্রাইভে আগের থাকা ছবিগুলো সংরক্ষিত থাকবে।
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setDisconnectModal(false)}
                    disabled={disconnecting}
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    className="admin-btn danger"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {disconnecting ? <RefreshCw size={14} className="spin-icon" /> : <LogOut size={14} />}
                    <span>{disconnecting ? 'ডিসকানেক্ট হচ্ছে...' : 'হ্যাঁ, ডিসকানেক্ট করুন'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
