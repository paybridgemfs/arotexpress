"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal.jsx';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmData, setConfirmData] = useState({
    isOpen: false,
    title: 'আপনি কি নিশ্চিত?',
    message: '',
    confirmText: 'হ্যাঁ, নিশ্চিত',
    cancelText: 'বাতিল',
    type: 'danger',
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const config = typeof options === 'string' ? { message: options } : (options || {});
      setConfirmData({
        isOpen: true,
        title: config.title || 'আপনি কি নিশ্চিত?',
        message: config.message || '',
        confirmText: config.confirmText || 'হ্যাঁ, নিশ্চিত',
        cancelText: config.cancelText || 'বাতিল',
        type: config.type || 'danger',
        onConfirm: () => {
          setConfirmData((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmData((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
        cancelText={confirmData.cancelText}
        type={confirmData.type}
        onConfirm={confirmData.onConfirm}
        onCancel={confirmData.onCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Return a safe fallback if accessed outside provider just in case
    return {
      confirm: async (options) => {
        const msg = typeof options === 'string' ? options : (options?.message || options?.title || 'নিশ্চিত করুন');
        return window.confirm(msg);
      }
    };
  }
  return context;
}
