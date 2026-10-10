"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    register
  } = useAuth();
  const { showToast } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !password.trim()) {
      setError('মোবাইল নম্বর এবং পাসওয়ার্ড দিন');
      return;
    }

    if (authModalTab === 'register' && !name.trim()) {
      setError('আপনার নাম লিখুন');
      return;
    }

    setLoading(true);
    try {
      if (authModalTab === 'login') {
        await login(phone, password, rememberMe);
        showToast('সফলভাবে লগইন হয়েছে');
      } else {
        await register(name, phone, password, rememberMe);
        showToast('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে');
      }
      setName('');
      setPhone('');
      setPassword('');
      setRememberMe(true);
    } catch (err) {
      setError(err.message || 'একটি ত্রুটি ঘটেছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setAuthModalOpen(false)}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {authModalTab === 'login'
                  ? 'অ্যাকাউন্টে লগইন করুন'
                  : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
              </h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setAuthModalOpen(false)}
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${authModalTab === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthModalTab('login');
                    setError('');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <LogIn size={14} />
                  <span>লগইন</span>
                </button>
                <button
                  className={`auth-tab ${authModalTab === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthModalTab('register');
                    setError('');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <UserPlus size={14} />
                  <span>রেজিস্ট্রেশন</span>
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#ffeded',
                    border: '1px solid #FECDD3',
                    color: 'var(--danger)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    marginBottom: '14px',
                    fontWeight: 500
                  }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {authModalTab === 'register' && (
                    <motion.div
                      key="reg-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="field"
                    >
                      <label htmlFor="reg-name">আপনার পুরো নাম</label>
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="যেমন: মোঃ সাকিব হোসেন"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="field">
                  <label htmlFor="auth-phone">মোবাইল নম্বর</label>
                  <input
                    id="auth-phone"
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="auth-pass">পাসওয়ার্ড</label>
                  <input
                    id="auth-pass"
                    type="password"
                    placeholder="পাসওয়ার্ড লিখুন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {authModalTab === 'login' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--green)', cursor: 'pointer' }}
                    />
                    <label htmlFor="remember-me" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                      আমাকে মনে রাখুন
                    </label>
                  </div>
                )}

                <motion.button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading
                    ? 'অনুগ্রহ করে অপেক্ষা করুন...'
                    : authModalTab === 'login'
                    ? 'লগইন করুন'
                    : 'অ্যাকাউন্ট তৈরি করুন'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

