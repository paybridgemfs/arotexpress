"use client";
import React, { useState, useEffect, useCallback } from 'react';

// Helper to load Google Translate script on demand
const loadGoogleTranslateScript = (callback) => {
  if (typeof window === 'undefined') return;

  if (window.google?.translate?.TranslateElement) {
    if (callback) callback();
    return;
  }

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
        if (callback) callback();
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
};

export default function LanguageToggle({ className = '', style = {} }) {
  const [currentLang, setCurrentLang] = useState('bn');
  const [mounted, setMounted] = useState(false);

  // Sync state across all desktop & mobile toggle components
  useEffect(() => {
    setMounted(true);

    const checkCurrentLang = () => {
      const match = document.cookie.match(new RegExp('(^| )googtrans=([^;]+)'));
      const cookieVal = match ? decodeURIComponent(match[2]) : null;
      const savedPref = localStorage.getItem('arot_preferred_lang');

      if (cookieVal?.includes('/en') || savedPref === 'en') {
        setCurrentLang('en');
        // If saved language is EN, load the translation script
        loadGoogleTranslateScript();
      } else {
        setCurrentLang('bn');
      }
    };

    checkCurrentLang();

    // Listen to custom cross-component sync event
    const handleSync = (e) => {
      if (e.detail) {
        setCurrentLang(e.detail);
      }
    };

    window.addEventListener('arot_language_synced', handleSync);
    window.addEventListener('storage', checkCurrentLang);

    // 1. Bulletproof runtime suppression of Google Translate top banner & skiptranslate popup
    const styleId = 'google-translate-suppress-styles';
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.innerHTML = `
        /* Hide all Google Translate banner frames, popups, and skiptranslate containers */
        body > .skiptranslate,
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.goog-te-banner-frame,
        iframe[id*=":1.container"],
        iframe[id*="goog-te-banner"],
        .VIpgJd-ZVi9od-ORHb-OEVmcd,
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
        .VIpgJd-ZVi9od-vH1Gmf,
        .goog-te-gadget,
        .goog-te-gadget-simple,
        .goog-te-gadget-icon,
        .goog-tooltip,
        .goog-tooltip:hover,
        .goog-text-highlight {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0px !important;
          max-height: 0px !important;
          width: 0px !important;
          overflow: hidden !important;
          pointer-events: none !important;
        }
        
        html, body {
          top: 0px !important;
          position: static !important;
          margin-top: 0px !important;
          padding-top: 0px !important;
        }
        
        #google_translate_element {
          display: none !important;
        }
      `;
      document.head.appendChild(styleTag);
    }

    // Force top to 0px and remove any skiptranslate banner injected after translation
    const suppressGoogleBanner = () => {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      if (document.documentElement.style.top && document.documentElement.style.top !== '0px') {
        document.documentElement.style.top = '0px';
      }

      // Hide all Google skiptranslate and banner frames
      const frames = document.querySelectorAll(
        'body > .skiptranslate, iframe.goog-te-banner-frame, iframe[id*=":1.container"], .VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf'
      );
      frames.forEach((frame) => {
        frame.style.setProperty('display', 'none', 'important');
        frame.style.setProperty('visibility', 'hidden', 'important');
        frame.style.setProperty('height', '0px', 'important');
        frame.style.setProperty('max-height', '0px', 'important');
      });
    };

    const interval = setInterval(suppressGoogleBanner, 100);
    const observer = new MutationObserver(suppressGoogleBanner);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], childList: true });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });

    return () => {
      clearInterval(interval);
      observer.disconnect();
      window.removeEventListener('arot_language_synced', handleSync);
      window.removeEventListener('storage', checkCurrentLang);
    };
  }, []);

  const changeLanguage = useCallback((targetLang) => {
    if (targetLang === currentLang && mounted) return;

    setCurrentLang(targetLang);
    localStorage.setItem('arot_preferred_lang', targetLang);

    // Sync all toggle buttons on desktop and mobile simultaneously
    window.dispatchEvent(new CustomEvent('arot_language_synced', { detail: targetLang }));

    const hostname = window.location.hostname;

    if (targetLang === 'en') {
      // Set translation cookies for Google Translate engine
      document.cookie = `googtrans=/bn/en; path=/;`;
      document.cookie = `googtrans=/bn/en; path=/; domain=${hostname};`;
      if (hostname.includes('.')) {
        const rootDomain = hostname.split('.').slice(-2).join('.');
        document.cookie = `googtrans=/bn/en; path=/; domain=.${rootDomain};`;
      }

      loadGoogleTranslateScript(() => {
        const selectElem = document.querySelector('.goog-te-combo');
        if (selectElem) {
          selectElem.value = 'en';
          selectElem.dispatchEvent(new Event('change'));
        } else {
          window.location.reload();
        }
      });
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

      {/* Pill Toggle Switch: [ বাং | EN ] (with notranslate so Google never alters "বাং") */}
      <div
        className={`lang-toggle-pill notranslate ${className}`}
        translate="no"
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
          className="notranslate"
          translate="no"
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
          <span className="notranslate" translate="no">বাং</span>
        </button>

        {/* English Option (Right) */}
        <button
          type="button"
          className="notranslate"
          translate="no"
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
          <span className="notranslate" translate="no">EN</span>
        </button>
      </div>
    </>
  );
}
