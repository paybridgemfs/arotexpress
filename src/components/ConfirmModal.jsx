"use client";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'আপনি কি নিশ্চিত?',
  message = '',
  confirmText = 'হ্যাঁ, নিশ্চিত',
  cancelText = 'বাতিল',
  type = 'danger',
  onConfirm,
  onCancel,
}) {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          {/* Backdrop Overlay */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)'
            }}
          />

          {/* Modal Card */}
          <motion.div
            key="confirm-card"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '430px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              zIndex: 1
            }}
          >
            {/* Top decorative bar */}
            <div
              style={{
                height: '4px',
                width: '100%',
                background: isDanger
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : isWarning
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #10b981, #059669)'
              }}
            />

            <div style={{ padding: '24px 22px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Icon bubble */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: isDanger
                      ? '#fee2e2'
                      : isWarning
                      ? '#fef3c7'
                      : '#ecfdf5',
                    color: isDanger
                      ? '#dc2626'
                      : isWarning
                      ? '#d97706'
                      : '#059669'
                  }}
                >
                  {isDanger ? (
                    <AlertTriangle size={22} strokeWidth={2.2} />
                  ) : isWarning ? (
                    <AlertCircle size={22} strokeWidth={2.2} />
                  ) : (
                    <Info size={22} strokeWidth={2.2} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    id="confirm-modal-title"
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '17px',
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1.35
                    }}
                  >
                    {title}
                  </h3>
                  {message && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13.5px',
                        color: '#64748b',
                        lineHeight: 1.55,
                        wordBreak: 'break-word'
                      }}
                    >
                      {message}
                    </p>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onCancel}
                  aria-label="বন্ধ করুন"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#334155')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '22px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9'
                }}
              >
                <button
                  type="button"
                  onClick={onCancel}
                  style={{
                    padding: '9px 18px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  {cancelText}
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  style={{
                    padding: '9px 20px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isDanger ? '#dc2626' : isWarning ? '#d97706' : '#059669',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: isDanger
                      ? '0 4px 12px rgba(220, 38, 38, 0.25)'
                      : isWarning
                      ? '0 4px 12px rgba(217, 119, 6, 0.25)'
                      : '0 4px 12px rgba(5, 150, 105, 0.25)',
                    transition: 'transform 0.1s, opacity 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
