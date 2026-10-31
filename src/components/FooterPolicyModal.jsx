"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  RotateCcw,
  Truck,
  HelpCircle,
  FileText,
  Lock,
  Building2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Wallet,
  Target
} from 'lucide-react';

export default function FooterPolicyModal({
  isOpen = false,
  activeTab = 'return',
  settings = {},
  footerSettings = {},
  onClose
}) {
  const [tab, setTab] = useState(activeTab || 'return');

  // Sync tab when prop changes
  React.useEffect(() => {
    if (activeTab) {
      setTab(activeTab);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'return', label: 'রিটার্ন ও রিফান্ড', icon: <RotateCcw size={15} /> },
    { id: 'delivery', label: 'ডেলিভারি তথ্য', icon: <Truck size={15} /> },
    { id: 'faq', label: 'সাধারণ জিজ্ঞাসা', icon: <HelpCircle size={15} /> },
    { id: 'terms', label: 'শর্তাবলী', icon: <FileText size={15} /> },
    { id: 'privacy', label: 'প্রাইভেসি পলিসি', icon: <Lock size={15} /> },
    { id: 'about', label: 'আমাদের সম্পর্কে', icon: <Building2 size={15} /> }
  ];

  const brandName = footerSettings?.brand_section?.title || settings?.site_name || 'আড়ৎ এক্সপ্রেস';
  const helpline = footerSettings?.brand_section?.helpline || settings?.site_helpline || '০১৭১২-৩৪৫৬৭৮';
  const email = footerSettings?.brand_section?.email || 'support@arotexpress.com';
  const address = footerSettings?.brand_section?.address || settings?.site_address || 'ঢাকা, বাংলাদেশ';

  return (
    <AnimatePresence>
      <motion.div
        key="footer-policy-modal-overlay"
        className="admin-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="admin-modal-box footer-policy-modal"
          style={{
            maxWidth: '720px',
            width: '100%',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '14px',
            overflow: 'hidden',
            background: 'var(--bg, #FAF8F5)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, var(--green, #006C4C) 0%, #004d36 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  {brandName} — গ্রাহক সেবা ও পলিসি
                </h3>
                <p style={{ margin: 0, fontSize: '11.5px', opacity: 0.85 }}>
                  স্বচ্ছতা ও বিশ্বস্ততার সাথে সেরা গ্রোসারি শপিং অভিজ্ঞতা
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              borderBottom: '1px solid var(--rule, #e5e0d8)',
              background: '#ffffff',
              padding: '4px 10px',
              gap: '4px'
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  border: 'none',
                  background: tab === t.id ? 'var(--green-mist, #e6f4ea)' : 'transparent',
                  color: tab === t.id ? 'var(--green, #006C4C)' : 'var(--muted, #666)',
                  fontWeight: tab === t.id ? '700' : '500',
                  fontSize: '12.5px',
                  borderRadius: '6px',
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

          {/* Modal Body */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, fontSize: '13.5px', lineHeight: '1.65', color: 'var(--ink, #1f2937)' }}>
            
            {/* RETURN & REFUND */}
            {tab === 'return' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--green, #006C4C)' }}>
                  <RotateCcw size={18} />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>রিটার্ন ও রিফান্ড পলিসি (Return & Refund Policy)</h4>
                </div>
                <p style={{ margin: '0 0 12px 0' }}>
                  <strong>{brandName}</strong> থেকে কেনা পণ্যের গুণগত মান নিয়ে আমরা শতভাগ সচেতন। ডেলিভারি নেওয়ার সময় কোনো পণ্য নষ্ট, ত্রুটিপূর্ণ বা ভুল হলে তাৎক্ষণিকভাবে তা রিটার্ন বা রিফান্ড পেতে পারেন।
                </p>
                <div style={{ background: '#ffffff', border: '1px solid var(--rule, #e5e0d8)', borderRadius: '8px', padding: '14px', margin: '12px 0' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: '700', color: 'var(--green, #006C4C)' }}>
                    রিটার্ন করার শর্তাবলী:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <li><strong>ডেলিভারির সময় চেক:</strong> পণ্য গ্রহণের সময় রাইডারের উপস্থিতিতে পণ্য দেখে নিন। কোনো সমস্যা থাকলে সাথে সাথে রাইডারকে ফেরত দিতে পারেন।</li>
                    <li><strong>পচনশীল পণ্য (শাকসবজি, ফল, মাছ-মাংস):</strong> ডেলিভারি পাওয়ার ২ ঘণ্টার মধ্যে কাস্টমার কেয়ারে ছবি বা বিবরণ সহ জানাতে হবে।</li>
                    <li><strong>প্যাকেটজাত পণ্য:</strong> প্যাকেট ইনট্যাক্ট ও সিল অক্ষত থাকলে ডেলিভারির ২৪ ঘণ্টার মধ্যে পরিবর্তনের সুযোগ রয়েছে।</li>
                    <li><strong>রিফান্ড পদ্ধতি:</strong> অগ্রিম পেমেন্ট করা থাকলে ২৪-৭২ ঘণ্টার মধ্যে মূল পেমেন্ট মেথডে রিফান্ড সম্পন্ন হয়।</li>
                  </ul>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted, #666)' }}>
                  যেকোনো প্রয়োজনে সরাসরি যোগাযোগ করুন আমাদের হটলাইনে: <strong>{helpline}</strong>
                </p>
              </div>
            )}

            {/* DELIVERY INFO */}
            {tab === 'delivery' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--green, #006C4C)' }}>
                  <Truck size={18} />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>ডেলিভারি এরিয়া, সময় ও চার্জ (Delivery Information)</h4>
                </div>
                <p style={{ margin: '0 0 12px 0' }}>
                  আমরা আপনার দোরগোড়ায় সম্পূর্ণ ফ্রেশ ও স্বাস্থ্যসম্মত উপায়ে পণ্য পৌঁছে দিই। আমাদের নিজস্ব দক্ষ ডেলিভারি টিম দ্রুত ডেলিভারি নিশ্চিত করে।
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', margin: '12px 0' }}>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--green, #006C4C)', marginBottom: '4px', fontSize: '13px' }}>
                      <Zap size={14} />
                      <span>এক্সপ্রেস ডেলিভারি</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted, #666)' }}>অর্ডার কনফার্ম করার পর দ্রুততম সময়ে ডেলিভারি।</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--green, #006C4C)', marginBottom: '4px', fontSize: '13px' }}>
                      <Clock size={14} />
                      <span>ডেলিভারি শিফট</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted, #666)' }}>সকাল ৮:০০ থেকে রাত ১০:০০ পর্যন্ত প্রতিদিন ডেলিভারি।</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--green, #006C4C)', marginBottom: '4px', fontSize: '13px' }}>
                      <Wallet size={14} />
                      <span>ক্যাশ অন ডেলিভারি</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted, #666)' }}>পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন।</div>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ */}
            {tab === 'faq' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--green, #006C4C)' }}>
                  <HelpCircle size={18} />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>সাধারণ জিজ্ঞাসা (FAQ)</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px' }}>প্রশ্ন: আমি কীভাবে অর্ডার করব?</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted, #666)' }}>
                      উত্তর: পছন্দের পণ্য কার্টে যোগ করে 'অর্ডার কনফার্ম করুন'-এ ক্লিক করে আপনার নাম, মোবাইল ও ঠিকানা সাবমিট করলেই অর্ডার প্লেস হবে।
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px' }}>প্রশ্ন: আমি কি পণ্য দেখে টাকা দিতে পারব?</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted, #666)' }}>
                      উত্তর: হ্যাঁ, সম্পূর্ণ ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। পণ্য চেক করে মূল্য পরিশোধ করতে পারবেন।
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '3px' }}>প্রশ্ন: আমার অর্ডার ট্র্যাক করব কীভাবে?</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted, #666)' }}>
                      উত্তর: ফুটারের 'অর্ডার ট্র্যাক করুন' বাটনে ক্লিক করে অর্ডার কোড দিয়ে লাইভ স্ট্যাটাস দেখতে পাবেন।
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TERMS */}
            {tab === 'terms' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--green, #006C4C)' }}>
                  <FileText size={18} />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>শর্তাবলী ও নিয়মাবলী (Terms & Conditions)</h4>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid var(--rule, #e5e0d8)', borderRadius: '8px', padding: '14px', margin: '8px 0' }}>
                  <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <li><strong>মূল্য নির্ধারণ:</strong> পণ্যের মূল্য বাজার ও আড়তের সাথে সমন্বয় করে নিয়মিত আপডেট করা হয়।</li>
                    <li><strong>অর্ডার যাচাই:</strong> ভুয়া অর্ডার প্রতিরোধে প্রয়োজনে কাস্টমার সাপোর্ট থেকে ফোন করে অর্ডার নিশ্চিত করা হতে পারে।</li>
                    <li><strong>ডেলিভারি নিশ্চয়তা:</strong> নির্ধারিত সময়ের মধ্যে পণ্য পৌঁছে দেওয়া আমাদের প্রধান লক্ষ্য।</li>
                  </ol>
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {tab === 'privacy' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--green, #006C4C)' }}>
                  <Lock size={18} />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>প্রাইভেসি পলিসি (Privacy Policy)</h4>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid var(--rule, #e5e0d8)', borderRadius: '8px', padding: '14px', margin: '8px 0' }}>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <li><strong>সংগৃহীত তথ্য:</strong> অর্ডার সম্পন্ন করার জন্য নাম, ফোন নম্বর ও ডেলিভারি ঠিকানা সংগ্রহ করা হয়।</li>
                    <li><strong>তথ্যের সুরক্ষা:</strong> আমরা কোনো তৃতীয় পক্ষের কাছে গ্রাহকের ব্যক্তিগত তথ্য শেয়ার করি না।</li>
                    <li><strong>নিরাপত্তা:</strong> আধুনিক এনক্রিপশনের মাধ্যমে সকল তথ্য সুরক্ষিত থাকে।</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ABOUT US */}
            {tab === 'about' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--green, #006C4C)' }}>
                  <Building2 size={18} />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>আমাদের সম্পর্কে (About {brandName})</h4>
                </div>
                <p style={{ margin: '0 0 12px 0' }}>
                  <strong>{brandName}</strong> হলো অনলাইন গ্রোসারি ডেলিভারি প্ল্যাটফর্ম। আমাদের লক্ষ্য হলো সরাসরি আড়ৎ ও উৎপাদনকারী থেকে খাঁটি ও তাজা মুদি পণ্য প্রতিটি পরিবারের ঘরে ঘরে সাশ্রয়ী মূল্যে পৌঁছে দেওয়া।
                </p>
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--rule, #e5e0d8)' }}>
                  <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '13px' }}>যোগাযোগের ঠিকানা ও হটলাইন:</div>
                  <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={13} color="var(--green, #006C4C)" /> <span>ঠিকানা: {address}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} color="var(--green, #006C4C)" /> <span>হটলাইন: {helpline}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={13} color="var(--green, #006C4C)" /> <span>ইমেইল: {email}</span></div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--rule, #e5e0d8)',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--muted, #666)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="var(--green, #006C4C)" />
              <span>নিরাপদ ও অনুমোদিত ই-কমার্স সেবা</span>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '7px 18px',
                background: 'var(--green, #006C4C)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              ঠিক আছে
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
