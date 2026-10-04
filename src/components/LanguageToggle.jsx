"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';

export default function LanguageToggle({ className = '', style = {} }) {
  const [currentLang, setCurrentLang] = useState('bn');
  const [mounted, setMounted] = useState(false);

  // Initialize and check current active language
  useEffect(() => {
    setMounted(true);
    
    // Check saved preference or existing googtrans cookie
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };

    const cookieVal = getCookie('googtrans');
    const savedPref = localStorage.getItem('arot_preferred_lang');

    if (cookieVal?.includes('/en') || savedPref === 'en') {
      setCurrentLang('en');
    } else {
      setCurrentLang('bn');
    }

    // Load Google Translate script dynamically if not present
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        try {
          if (window.google?.translate?.TranslateElement) {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'bn',
                includedLanguages: 'en,bn',
                autoDisplay: false
              },
              'google_translate_element'
            );
          }
        } catch (err) {
          console.warn('Google Translate Init error:', err);
        }
      };

      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.type = 'text/javascript';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  const changeLanguage = useCallback((targetLang) => {
    if (targetLang === currentLang && mounted) return;

    setCurrentLang(targetLang);
    localStorage.setItem('arot_preferred_lang', targetLang);

    const hostname = window.location.hostname;

    if (targetLang === 'en') {
      // Set translation cookies for Google Translate engine
      document.cookie = `googtrans=/bn/en; path=/;`;
      document.cookie = `googtrans=/bn/en; path=/; domain=${hostname};`;
      if (hostname.includes('.')) {
        const rootDomain = hostname.split('.').slice(-2).join('.');
        document.cookie = `googtrans=/bn/en; path=/; domain=.${rootDomain};`;
      }

      // Trigger translate combo if already rendered in DOM
      const selectElem = document.querySelector('.goog-te-combo');
      if (selectElem) {
        selectElem.value = 'en';
        selectElem.dispatchEvent(new Event('change'));
      } else {
        // Smooth reload to apply translation across the page
        window.location.reload();
      }
    } else {
      // Revert back to original Bangla
      document.cookie = `googtrans=/bn/bn; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
      if (hostname.includes('.')) {
        const rootDomain = hostname.split('.').slice(-2).join('.');
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`;
      }

      const selectElem = document.querySelector('.goog-te-combo');
      if (selectElem) {
        selectElem.value = 'bn';
        selectElem.dispatchEvent(new Event('change'));
        setTimeout(() => {
          window.location.reload();
        }, 150);
      } else {
        window.location.reload();
      }
    }
  }, [currentLang, mounted]);

  return (
    <>
      {/* Hidden container for Google Translate Engine */}
      <div id="google_translate_element" style={{ display: 'none' }} aria-hidden="true" />

      {/* Pill Toggle Switch: [ বাং | EN ] */}
      <div
        className={`lang-toggle-pill ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'var(--md-surface-container-high, #EEF2F6)',
          border: '1px solid var(--md-outline-variant, #CBD5E1)',
          borderRadius: '9999px',
          padding: '2px',
          cursor: 'pointer',
          position: 'relative',
          userSelect: 'none',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
          flexShrink: 0,
          ...style
        }}
        role="group"
        aria-label="ভাষা পরিবর্তন (Language Switcher)"
      >
        {/* Bangla Option (Left) */}
        <button
          type="button"
          onClick={() => changeLanguage('bn')}
          style={{
            position: 'relative',
            zIndex: 2,
            border: 'none',
            background: currentLang === 'bn' ? 'var(--green, #006C4C)' : 'transparent',
            color: currentLang === 'bn' ? '#FFFFFF' : 'var(--text, #334155)',
            fontWeight: currentLang === 'bn' ? 700 : 600,
            fontSize: '11.5px',
            padding: '3px 9px',
            borderRadius: '9999px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            lineHeight: 1.3,
            boxShadow: currentLang === 'bn' ? '0 1px 4px rgba(0, 108, 76, 0.35)' : 'none',
            fontFamily: 'var(--font-bn, serif)'
          }}
          title="বাংলা ভাষায় দেখুন"
          aria-pressed={currentLang === 'bn'}
        >
          বাং
        </button>

        {/* English Option (Right) */}
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          style={{
            position: 'relative',
            zIndex: 2,
            border: 'none',
            background: currentLang === 'en' ? 'var(--green, #006C4C)' : 'transparent',
            color: currentLang === 'en' ? '#FFFFFF' : 'var(--text, #334155)',
            fontWeight: currentLang === 'en' ? 700 : 600,
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '9999px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            lineHeight: 1.3,
            boxShadow: currentLang === 'en' ? '0 1px 4px rgba(0, 108, 76, 0.35)' : 'none',
            letterSpacing: '0.3px',
            fontFamily: 'var(--font-en, sans-serif)'
          }}
          title="View in English"
          aria-pressed={currentLang === 'en'}
        >
          EN
        </button>
      </div>
    </>
  );
}
