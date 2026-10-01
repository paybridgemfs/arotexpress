"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Banknote,
  Info,
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  X,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Package,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { toBengaliNumber } from '../utils/bengali.js';

export default function CheckoutView({
  onBackToShop,
  onOrderSuccess,
  paymentMethods,
  deliveryAreas: propDeliveryAreas,
  defaultDeliveryFee: propDefaultDeliveryFee
}) {
  const { user, token, openAuthModal } = useAuth();
  const { cart, subtotal: cartSubtotal, clearCart, showToast } = useCart();

  const [packageOrderData, setPackageOrderData] = useState(null);

  // Check for package order session on mount ONLY IF ?mode=package is present in URL
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const isPackageMode = urlParams.get('mode') === 'package';

        if (isPackageMode) {
          const stored = sessionStorage.getItem('package_order_data') || localStorage.getItem('arot_active_package_order');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
              setPackageOrderData(parsed);
              return;
            }
          }
        }

        // Standard cart checkout: ensure package order data is NEVER used
        setPackageOrderData(null);
        sessionStorage.removeItem('package_order_data');
        localStorage.removeItem('arot_active_package_order');
      }
    } catch (e) {
      console.error('Failed to load package order data:', e);
    }
  }, []);

  const isPackageOrder = Boolean(packageOrderData && packageOrderData.items && packageOrderData.items.length > 0);

  const [name, setName] = useState(user ? user.name : '');
  const [phone, setPhone] = useState(user ? user.phone : '');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [selectedPaymentCode, setSelectedPaymentCode] = useState('cod');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');

  const [deliveryAreas, setDeliveryAreas] = useState(propDeliveryAreas || []);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(propDefaultDeliveryFee || 60);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [verificationErrorModal, setVerificationErrorModal] = useState(null);

  // Fetch delivery areas if not passed or to keep up to date
  useEffect(() => {
    fetch('/api/delivery-areas')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.areas)) {
          setDeliveryAreas(data.areas);
        }
        if (data && typeof data.default_delivery_fee === 'number') {
          setDefaultDeliveryFee(data.default_delivery_fee);
        }
      })
      .catch((err) => console.error('Fetch delivery areas error:', err));
  }, []);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!phone) setPhone(user.phone);
    }
  }, [user]);

  const cartEntries = Object.entries(cart);

  // Determine active subtotal based on package order vs regular cart
  const subtotal = isPackageOrder
    ? (Number(packageOrderData.package_subtotal) || Number(packageOrderData.subtotal) || 0)
    : cartSubtotal;

  const packageRegularTotal = isPackageOrder
    ? (Number(packageOrderData.subtotal) || subtotal)
    : 0;

  const discountTotal = isPackageOrder
    ? (Number(packageOrderData.discount_total) || 0)
    : 0;

  // Calculate dynamic delivery fee based on selected area or default fee
  const selectedAreaObj = deliveryAreas.find((a) => a.name === area);
  const deliveryFee = subtotal > 0
    ? (selectedAreaObj && typeof selectedAreaObj.charge === 'number' && selectedAreaObj.charge >= 0
        ? selectedAreaObj.charge
        : defaultDeliveryFee)
    : 0;

  const totalAmount = subtotal + deliveryFee;

  const currentPaymentMethod = paymentMethods.find(
    (p) => p.code === selectedPaymentCode
  ) || paymentMethods[0];

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!user) {
      showToast('অর্ডার নিশ্চিত করতে প্রথমে আপনার অ্যাকাউন্ট খুলুন বা লগইন করুন');
      openAuthModal('register', () => {
        showToast('লগইন সম্পন্ন হয়েছে, এখন অর্ডার কনফার্ম করুন');
      });
      return;
    }

    const newErrors = {};
    if (!name.trim() || name.trim().length < 2) newErrors.name = 'নাম আবশ্যক';
    if (!phone.trim() || !/^01[0-9]{9}$/.test(phone.trim())) {
      newErrors.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)';
    }
    if (!address.trim() || address.trim().length < 4) {
      newErrors.address = 'পূর্ণ ঠিকানা আবশ্যক';
    }
    if (!area) newErrors.area = 'এলাকা বেছে নিন';

    if (selectedPaymentCode !== 'cod') {
      if (!senderNumber.trim()) {
        newErrors.senderNumber = 'যে নম্বর থেকে টাকা পাঠিয়েছেন তা দিন';
      }
      if (!trxId.trim()) {
        newErrors.trxId = 'TrxID ট্রানজেকশন কোড দিন';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন');
      return;
    }

    setSubmitting(true);
    try {
      // If this is a package order
      if (isPackageOrder) {
        const res = await fetch('/api/package-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            delivery_address: address.trim(),
            delivery_area: area,
            payment_method: selectedPaymentCode === 'cod' ? 'ক্যাশ অন ডেলিভারি' : (currentPaymentMethod ? currentPaymentMethod.name_bn : 'ক্যাশ অন ডেলিভারি'),
            sender_number: senderNumber.trim() || null,
            trx_id: trxId.trim() || null,
            items: packageOrderData.items,
            subtotal: packageRegularTotal,
            discount_total: discountTotal,
            delivery_fee: deliveryFee,
            total_amount: totalAmount
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'প্যাকেজ অর্ডার করতে সমস্যা হয়েছে');
        }

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('package_order_data');
          sessionStorage.setItem('arot_last_placed_order', JSON.stringify(data));
        }
        showToast('আপনার প্যাকেজ অর্ডার সফল হয়েছে!');
        onOrderSuccess(data);
        return;
      }

      // Standard Cart Order
      const items = cartEntries.map(([key, item]) => ({
        key,
        productId: item.productId || item.brandId || item.id || null,
        brandId: item.brandId || item.productId || item.id || null,
        catId: item.catId,
        catEn: item.catEn,
        catBn: item.catBn,
        brand: item.brand,
        unit: item.unit,
        price: item.price,
        qty: item.qty,
        total: item.price * item.qty
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          delivery_address: address.trim(),
          delivery_area: area,
          payment_method: currentPaymentMethod ? currentPaymentMethod.name_bn : 'ক্যাশ অন ডেলিভারি',
          sender_number: senderNumber.trim(),
          trx_id: trxId.trim(),
          items,
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: totalAmount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code || data.verified === false) {
          setVerificationErrorModal({
            code: data.code || 'VERIFICATION_FAILED',
            message: data.error || data.message || 'পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে',
            details: data.details || null,
            attemptsMade: data.attemptsMade || 3
          });
          return;
        }
        throw new Error(data.error || 'অর্ডার করতে সমস্যা হয়েছে');
      }

      try {
        sessionStorage.removeItem('package_order_data');
        localStorage.removeItem('arot_active_package_order');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('arot_last_placed_order', JSON.stringify(data));
        }
        if (isPackageOrder) {
          localStorage.removeItem('arot_package_box_quantities');
          window.dispatchEvent(new Event('arot_package_cleared'));
        }
      } catch (e) {}

      if (!isPackageOrder) {
        clearCart();
      }
      onOrderSuccess(data);
    } catch (err) {
      showToast(err.message || 'অর্ডার করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // Dedicated empty cart screen when cart has no items and user is not in package mode
  if (cartEntries.length === 0 && !isPackageOrder) {
    return (
      <motion.div
        id="checkout-view"
        style={{ display: 'block' }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28 }}
      >
        <section className="section-wrap" style={{ paddingTop: '26px' }}>
          <motion.button
            className="breadcrumb"
            onClick={onBackToShop}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.96 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> <span>দোকানে ফিরে যান</span>
          </motion.button>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-xl)',
              padding: '60px 24px',
              textAlign: 'center',
              maxWidth: '560px',
              margin: '30px auto',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: '#F1F5F3',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--green)',
                marginBottom: '18px'
              }}
            >
              <ShoppingCart size={38} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', margin: '0 0 10px 0' }}>
              আপনার কার্ট বর্তমানে খালি!
            </h2>

            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              চেকআউট করতে এবং অর্ডার সম্পন্ন করতে অনুগ্রহ করে প্রথমে আপনার প্রয়োজনীয় পণ্যগুলো কার্টে যোগ করুন।
            </p>

            <motion.button
              type="button"
              className="cta"
              onClick={onBackToShop}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 28px',
                fontSize: '14.5px',
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                border: none,
                background: var(--green),
                color: var(--surface)
              }}
            >
              <ShoppingCart size={18} />
              <span>পণ্য বাছাই করুন ও কেনাকাটা শুরু করুন</span>
            </motion.button>
          </div>
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div
      id="checkout-view"
      style={{ display: 'block' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28 }}
    >
      <section className="section-wrap" style={{ paddingTop: '26px' }}>
        <motion.button
          className="breadcrumb"
          onClick={onBackToShop}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.96 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} /> <span>কেনাকাটা চালিয়ে যান</span>
        </motion.button>

        <div className="steps">
          <div className="step done">
            <span className="dot" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={12} />
            </span>{' '}
            কার্ট
          </div>
          <div className="step-line"></div>
          <div className="step active">
            <span className="dot">২</span> ডেলিভারি তথ্য
          </div>
          <div className="step-line"></div>
          <div className="step">
            <span className="dot">৩</span> নিশ্চিতকরণ
          </div>
        </div>

        <div className="checkout-grid">
          <form id="checkout-form" onSubmit={handleFormSubmit} noValidate>
            <h2 style={{ fontSize: '22px', margin: '0 0 16px' }}>
              ডেলিভারি ও পেমেন্ট তথ্য
            </h2>

            {!user && (
              <div
                style={{
                  background: 'var(--md-tertiary-container)',
                  border: '1px solid #FCD34D',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '18px',
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#78350F'
                }}
              >
                <Info size={18} style={{ flexShrink: 0, color: 'var(--gold-dark)' }} />
                <div>
                  অর্ডার সম্পন্ন করতে আপনার একটি একাউন্ট প্রয়োজন হবে।{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    style={{
                      color: 'var(--green)',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    একাউন্ট তৈরি করুন
                  </button>{' '}
                  বা{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    style={{
                      color: 'var(--green)',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    লগইন করুন
                  </button>
                </div>
              </div>
            )}

            <div className="field-row">
              <div className={`field ${errors.name ? 'error' : ''}`}>
                <label htmlFor="in-name">পুরো নাম</label>
                <input
                  id="in-name"
                  type="text"
                  placeholder="যেমন: রহিম উদ্দিন"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                />
                {errors.name && <div className="err-msg">{errors.name}</div>}
              </div>

              <div className={`field ${errors.phone ? 'error' : ''}`}>
                <label htmlFor="in-phone">মোবাইল নম্বর</label>
                <input
                  id="in-phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                />
                {errors.phone && <div className="err-msg">{errors.phone}</div>}
              </div>
            </div>

            <div className={`field ${errors.address ? 'error' : ''}`}>
              <label htmlFor="in-address">ঠিকানা</label>
              <textarea
                id="in-address"
                rows="3"
                placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
              ></textarea>
              {errors.address && (
                <div className="err-msg">{errors.address}</div>
              )}
            </div>

            <div className={`field ${errors.area ? 'error' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="in-area">এলাকা নির্বাচন করুন</label>
                {selectedAreaObj && (
                  <span style={{ fontSize: '12px', color: 'var(--green-dim)', fontWeight: 600 }}>
                    ডেলিভারি চার্জ: ৳{deliveryFee}
                  </span>
                )}
              </div>
              <select
                id="in-area"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  if (errors.area) setErrors({ ...errors, area: '' });
                }}
              >
                <option value="">এলাকা বেছে নিন...</option>
                {deliveryAreas
                  .filter((a) => a.is_active !== false)
                  .map((a) => (
                    <option key={a.id || a.name} value={a.name}>
                      {a.name} {typeof a.charge === 'number' ? `(৳${a.charge})` : ''}
                    </option>
                  ))}
              </select>
              {errors.area && <div className="err-msg">{errors.area}</div>}
            </div>

            {/* Payment Methods Section */}
            <div className="payment-method-box">
              <label style={{ fontSize: '13px', fontWeight: 700 }}>
                পেমেন্ট পদ্ধতি বেছে নিন:
              </label>
              <div className="payment-method-grid">
                {paymentMethods
                  .filter((p) => p.is_active)
                  .map((method) => (
                    <div
                      key={method.id}
                      className={`payment-pill ${
                        selectedPaymentCode === method.code ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedPaymentCode(method.code)}
                    >
                      {method.name_bn}
                    </div>
                  ))}
              </div>

              {/* COD Instruction */}
              {selectedPaymentCode === 'cod' && (
                <div className="payment-instructions" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '13px', color: 'var(--ink)' }}>
                    <Banknote size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    <div>
                      <strong>ক্যাশ অন ডেলিভারি:</strong> পণ্য বুঝে পেয়ে ডেলিভারি ম্যানকে সর্বমোট <strong>৳{totalAmount}</strong> পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।
                    </div>
                  </div>
                </div>
              )}

              {/* Online/Mobile Payment Instructions & TrxID inputs */}
              {currentPaymentMethod && selectedPaymentCode !== 'cod' && (
                <div className="payment-instructions">
                  <p>
                    <strong>{currentPaymentMethod.name_bn}:</strong>{' '}
                    {currentPaymentMethod.instructions_bn}
                  </p>
                  {currentPaymentMethod.number && (
                    <p style={{ marginTop: '4px', fontWeight: 600 }}>
                      নম্বর:{' '}
                      <span className="mono" style={{ color: 'var(--green)' }}>
                        {currentPaymentMethod.number}
                      </span>
                    </p>
                  )}

                  <div className="field-row" style={{ marginTop: '10px' }}>
                    <div
                      className={`field ${errors.senderNumber ? 'error' : ''}`}
                    >
                      <label style={{ fontSize: '11.5px' }}>
                        আপনার যে নম্বর থেকে টাকা পাঠিয়েছেন:
                      </label>
                      <input
                        type="text"
                        placeholder="01XXXXXXXXX"
                        value={senderNumber}
                        onChange={(e) => {
                          setSenderNumber(e.target.value);
                          if (errors.senderNumber) setErrors({ ...errors, senderNumber: '' });
                        }}
                      />
                      {errors.senderNumber && (
                        <div className="err-msg">{errors.senderNumber}</div>
                      )}
                    </div>
                    <div className={`field ${errors.trxId ? 'error' : ''}`}>
                      <label style={{ fontSize: '11.5px' }}>
                        ট্রানজেকশন আইডি (TrxID):
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: 8N7A6D5E"
                        value={trxId}
                        onChange={(e) => {
                          setTrxId(e.target.value);
                          if (errors.trxId) setErrors({ ...errors, trxId: '' });
                        }}
                      />
                      {errors.trxId && (
                        <div className="err-msg">{errors.trxId}</div>
                      )}
                    </div>
                  </div>

                  {/* Automated Verification on Order Submit Note */}
                  <div
                    style={{
                      marginTop: '14px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '12.5px',
                      color: '#15803d'
                    }}
                  >
                    <ShieldCheck size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                    <span style={{ lineHeight: 1.4 }}>
                      সঠিক প্রেরক নম্বর ও TrxID লিখে নিচের <strong>"অর্ডার নিশ্চিত করুন"</strong> বাটনে চাপ দিন। সার্ভার স্বয়ংক্রিয়ভাবে পেমেন্ট যাচাই করে অর্ডার সম্পন্ন করবে।
                    </span>
                  </div>
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              className="place-order-btn"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{selectedPaymentCode !== 'cod' ? 'পেমেন্ট যাচাই ও অর্ডার সম্পন্ন হচ্ছে...' : 'অর্ডার জমা হচ্ছে...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>অর্ডার নিশ্চিত করুন</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="co-summary">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0 }}>অর্ডার সামারি</h3>
              {isPackageOrder && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  <Package size={12} /> প্যাকেজ অফার
                </span>
              )}
            </div>

            {isPackageOrder ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {packageOrderData.items.map((it, idx) => (
                  <div className="co-row" key={idx} style={{ alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)' }}>
                        {it.product_name || it.brand} ×{toBengaliNumber(it.qty)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        একক: {it.unit}
                        {it.regular_price > it.final_price && (
                          <span style={{ textDecoration: 'line-through', marginLeft: '6px' }}>
                            ৳{toBengaliNumber(it.regular_price * it.qty)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        ৳{toBengaliNumber((it.final_price || it.price) * it.qty)}
                      </span>
                      {it.discount_amount > 0 && (
                        <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                          -৳{toBengaliNumber(it.discount_amount * it.qty)} ছাড়
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {packageRegularTotal > subtotal && (
                  <div className="co-row" style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    <span>নিয়মিত মূল্য</span>
                    <span className="mono">৳{toBengaliNumber(packageRegularTotal)}</span>
                  </div>
                )}

                {discountTotal > 0 && (
                  <div className="co-row" style={{ color: '#15803d', fontWeight: 600 }}>
                    <span>প্যাকেজ বিশেষ ছাড়</span>
                    <span className="mono">-৳{toBengaliNumber(discountTotal)}</span>
                  </div>
                )}
              </div>
            ) : (
              cartEntries.map(([key, it]) => (
                <div className="co-row" key={key}>
                  <span>
                    {it.brand} ×{toBengaliNumber(it.qty)}
                  </span>
                  <span className="mono">৳{toBengaliNumber(it.price * it.qty)}</span>
                </div>
              ))
            )}

            <div className="co-row">
              <span>ডেলিভারি চার্জ</span>
              <span className="mono">৳{toBengaliNumber(deliveryFee)}</span>
            </div>
            <div className="co-row total">
              <span>সর্বমোট</span>
              <span>৳{toBengaliNumber(totalAmount)}</span>
            </div>

            {isPackageOrder && (
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--rule)', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('package_order_data');
                    }
                    setPackageOrderData(null);
                    onBackToShop();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: '12px',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  প্যাকেজ পরিবর্তন করতে মূল দোকানে ফিরে যান
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Payment Verification Failure Modal Popup */}
      <AnimatePresence>
        {verificationErrorModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setVerificationErrorModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                background: '#ffffff',
                border: '1.5px solid #ef4444',
                borderRadius: '16px',
                maxWidth: '520px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  background: '#fef2f2',
                  padding: '20px 24px',
                  borderBottom: '1px solid #fee2e2',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '10px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <ShieldAlert size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>
                      পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে
                    </h3>
                    <span
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {verificationErrorModal.code}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#b91c1c' }}>
                    সার্ভারে স্বয়ংক্রিয়ভাবে ৩ বার অনুসন্ধান করেও পেমেন্ট নিশ্চিত করা যায়নি।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationErrorModal(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#991b1b',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Specific Error Rendering */}
                {String(verificationErrorModal.code || '').toUpperCase() === 'AMOUNT_MISMATCH' ? (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '10px',
                      padding: '14px',
                      fontSize: '13.5px',
                      color: '#92400e'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: '#b45309' }}>
                      ⚠️ টাকার পরিমাণের অমিল পাওয়া গেছে!
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                      <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                        <div style={{ fontSize: '11px', color: '#78350f' }}>অর্ডারের মোট বিল</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>
                          ৳{toBengaliNumber(totalAmount)}
                        </div>
                      </div>
                      <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                        <div style={{ fontSize: '11px', color: '#78350f' }}>পেমেন্টে পাওয়া গেছে</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
                          ৳{toBengaliNumber(verificationErrorModal.details?.actualAmount ?? 0)}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: '12px' }}>
                      অনুগ্রহ করে অর্ডারের জন্য নির্ধারিত সম্পূর্ণ টাকা প্রদান করে সঠিক TrxID দিন।
                    </p>
                  </div>
                ) : String(verificationErrorModal.code || '').toUpperCase() === 'ALREADY_VERIFIED' ? (
                  <div
                    style={{
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '10px',
                      padding: '14px',
                      fontSize: '13.5px',
                      color: '#9f1239'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                      🚫 এই ট্রানজেকশন আইডি ইতিমধ্যে ব্যবহৃত!
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', lineHeight: 1.5 }}>
                      TrxID <strong>"{trxId}"</strong> পূর্বে অন্য কোনো অর্ডারে ভেরিফাই করা হয়ে গেছে। একটি ট্রানজেকশন আইডি কেবল একবারই ব্যবহারযোগ্য। দয়া করে নতুন লেনদেন সম্পন্ন করে নতুন TrxID দিন।
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px',
                      fontSize: '13.5px',
                      color: 'var(--ink)'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
                      {verificationErrorModal.message}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>অনুগ্রহ করে নিচের বিষয়গুলো নিশ্চিত করুন:</p>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>যে মোবাইল নম্বর থেকে টাকা পাঠিয়েছেন তা সঠিকভাবে টাইপ করেছেন (বর্তমানে: <strong>{senderNumber || 'দেওয়া হয়নি'}</strong>)।</li>
                        <li>বিকাশ/নগদ/রকেট অ্যাপের স্টেটমেন্ট থেকে TrxID হুবহু কপি করেছেন (বর্তমানে: <strong>{trxId || 'দেওয়া হয়নি'}</strong>)।</li>
                        <li>টাকা পাঠানোর সাথে সাথে ট্রাই করলে কখনো কখনো SMS আসতে ১ মিনিট সময় লাগতে পারে। একটু পর আবার চেষ্টা করুন।</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Footer action button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationErrorModal(null);
                    }}
                    style={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Check size={16} />
                    <span>তথ্য সংশোধন করব</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
