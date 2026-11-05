"use client";
import React, { useState, useEffect, useRef } from 'react';
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
  ShoppingCart,
  Copy,
  Clock,
  RefreshCw,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { toBengaliNumber } from '../utils/bengali.js';
import { getPaymentMethodLogo, COD_SVG } from '../utils/paymentLogos.js';

export default function CheckoutView({
  onBackToShop,
  onOrderSuccess,
  paymentMethods = [],
  deliveryAreas: propDeliveryAreas,
  defaultDeliveryFee: propDefaultDeliveryFee,
  settings: propSettings
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

  // Customer Form Fields
  const [name, setName] = useState(user ? user.name : '');
  const [phone, setPhone] = useState(user ? user.phone : '');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');

  // 1. COD vs Online Payment choice (default to cod if active, otherwise online)
  const [paymentChoice, setPaymentChoice] = useState(() => {
    const cod = paymentMethods.find((p) => p.code === 'cod');
    return (!cod || cod.is_active === false) ? 'online' : 'cod';
  });

  useEffect(() => {
    const codMethod = paymentMethods.find((p) => p.code === 'cod');
    const showCod = codMethod && codMethod.is_active !== false;
    if (!showCod && paymentChoice === 'cod') {
      setPaymentChoice('online');
    }
  }, [paymentMethods]);

  // Online Payment selection modal & countdown session states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOnlineMethod, setSelectedOnlineMethod] = useState(null);
  const [customerSenderNumber, setCustomerSenderNumber] = useState('');
  const [senderNumberError, setSenderNumberError] = useState('');

  // 5-Minute Countdown Session State
  const [isCountdownSessionOpen, setIsCountdownSessionOpen] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(300); // 5 minutes
  const [sessionReferenceId, setSessionReferenceId] = useState('');
  const [sessionOptionalTrx, setSessionOptionalTrx] = useState('');
  const [pollingStatusText, setPollingStatusText] = useState('পেমেন্ট অপেক্ষা করছে...');
  const [sessionErrorMsg, setSessionErrorMsg] = useState(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isVerifyingOrder, setIsVerifyingOrder] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

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

  // Active online payment methods (excluding COD)
  const onlinePaymentMethods = paymentMethods.filter(
    (p) => p.is_active !== false && p.code !== 'cod'
  );

  // Pre-select first online method if none selected
  useEffect(() => {
    if (!selectedOnlineMethod && onlinePaymentMethods.length > 0) {
      setSelectedOnlineMethod(onlinePaymentMethods[0]);
    }
  }, [paymentMethods]);

  // Validation function for shipping form
  const validateForm = () => {
    const newErrors = {};
    if (!name.trim() || name.trim().length < 2) newErrors.name = 'নাম আবশ্যক';
    if (!phone.trim() || !/^01[0-9]{9}$/.test(phone.trim())) {
      newErrors.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)';
    }
    if (!address.trim() || address.trim().length < 4) {
      newErrors.address = 'পূর্ণ ঠিকানা আবশ্যক';
    }
    if (!area) newErrors.area = 'এলাকা বেছে নিন';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন');
      return false;
    }
    return true;
  };

  // -------------------------------------------------------------
  // 1. CASH ON DELIVERY ORDER HANDLER (Directly Confirm Order)
  // -------------------------------------------------------------
  const handleCashOnDeliverySubmit = async () => {
    if (!user) {
      showToast('অর্ডার নিশ্চিত করতে প্রথমে আপনার অ্যাকাউন্ট খুলুন বা লগইন করুন');
      openAuthModal('register', () => {
        showToast('লগইন সম্পন্ন হয়েছে, এখন অর্ডার কনফার্ম করুন');
      });
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);
    try {
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
            payment_method: 'ক্যাশ অন ডেলিভারি',
            sender_number: null,
            trx_id: null,
            items: packageOrderData.items,
            subtotal: packageRegularTotal,
            discount_total: discountTotal,
            delivery_fee: deliveryFee,
            total_amount: totalAmount
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'প্যাকেজ অর্ডার করতে সমস্যা হয়েছে');

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
          payment_method: 'ক্যাশ অন ডেলিভারি',
          sender_number: '',
          trx_id: '',
          items,
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: totalAmount
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'অর্ডার করতে সমস্যা হয়েছে');

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
      showToast('আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে!');
      onOrderSuccess(data);
    } catch (err) {
      showToast(err.message || 'অর্ডার করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 2. ONLINE PAYMENT BUTTON CLICK (Open Payment Modal)
  // -------------------------------------------------------------
  const handleOnlinePaymentClick = () => {
    if (!user) {
      showToast('পেমেন্ট শুরু করতে প্রথমে আপনার অ্যাকাউন্ট খুলুন বা লগইন করুন');
      openAuthModal('register', () => {
        showToast('লগইন সম্পন্ন হয়েছে, এখন পেমেন্ট করুন');
      });
      return;
    }

    if (!validateForm()) return;

    setSenderNumberError('');
    setIsPaymentModalOpen(true);
  };

  // -------------------------------------------------------------
  // 3. START 5-MINUTE COUNTDOWN SESSION
  // -------------------------------------------------------------
  const handleStartCountdownSession = () => {
    const cleanNum = (customerSenderNumber || '').trim().replace(/[^0-9]/g, '');
    if (!cleanNum || !/^01[0-9]{9}$/.test(cleanNum)) {
      setSenderNumberError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    const refCode = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const endTime = Date.now() + 5 * 60 * 1000; // Exact 5 minutes

    setSessionReferenceId(refCode);
    setSessionEndTime(endTime);
    setTimeLeftSeconds(300);
    setIsSessionExpired(false);
    setSessionErrorMsg(null);
    setPollingStatusText('পেমেন্ট অনুসন্ধান করা হচ্ছে...');
    setIsPaymentModalOpen(false);
    setIsCountdownSessionOpen(true);
  };

  // -------------------------------------------------------------
  // 4. REAL COUNTDOWN TIMER (Based on Date.now())
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isCountdownSessionOpen || !sessionEndTime) return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((sessionEndTime - now) / 1000));
      setTimeLeftSeconds(diff);

      if (diff <= 0) {
        setIsSessionExpired(true);
        setPollingStatusText('৫ মিনিটের সময়সীমা শেষ হয়েছে।');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isCountdownSessionOpen, sessionEndTime]);

  // -------------------------------------------------------------
  // 5. 3-SECOND AUTOMATIC BACKEND POLLING FOR VERIFIED PAYMENT
  // -------------------------------------------------------------
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!isCountdownSessionOpen || isSessionExpired || isVerifyingOrder) return;

    const pollVerification = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const methodCode = selectedOnlineMethod?.code || 'bkash';
        const numAmount = totalAmount;
        const sNumber = customerSenderNumber.trim();
        const tId = sessionOptionalTrx.trim() || undefined;

        console.log(`[AutoVerify Poll] Checking payment via ${methodCode} for ৳${numAmount}, number: ${sNumber}`);

        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            payment_method: methodCode,
            sender_number: sNumber,
            amount: numAmount,
            trx_id: tId
          })
        });

        const data = await res.json();

        // 1. SUCCESS: 200 VERIFIED_SUCCESS -> Complete Order Atomically!
        if (res.ok && data.verified === true && data.code === 'VERIFIED_SUCCESS') {
          console.log('[AutoVerify Poll] 🎉 Payment matched and claimed atomically! Finalizing order...', data);
          setIsVerifyingOrder(true);
          setPollingStatusText('পেমেন্ট সফলভাবে যাচাই হয়েছে! অর্ডার সম্পন্ন হচ্ছে...');
          await finalizeVerifiedOrder(data);
          return;
        }

        // 2. Fatal Error: ALREADY_VERIFIED or AMOUNT_MISMATCH
        if (data.code === 'ALREADY_VERIFIED' || data.code === 'AMOUNT_MISMATCH') {
          setSessionErrorMsg(data.message || 'পেমেন্ট যাচাইয়ের সময় অসঙ্গতি পাওয়া গেছে');
        } else {
          setSessionErrorMsg(null);
          setPollingStatusText('স্বয়ংক্রিয় অনুসন্ধান চলছে (প্রতি ৩ সেকেন্ডে)...');
        }
      } catch (err) {
        console.warn('[AutoVerify Poll] Transient check notice:', err.message);
      } finally {
        isPollingRef.current = false;
      }
    };

    // Immediate first check
    pollVerification();

    // Repeat every 3 seconds
    const pollInterval = setInterval(pollVerification, 3000);
    return () => clearInterval(pollInterval);
  }, [
    isCountdownSessionOpen,
    isSessionExpired,
    isVerifyingOrder,
    selectedOnlineMethod,
    customerSenderNumber,
    sessionOptionalTrx,
    totalAmount,
    token
  ]);

  // -------------------------------------------------------------
  // 6. FINALIZE VERIFIED ORDER (Database Insertion)
  // -------------------------------------------------------------
  const finalizeVerifiedOrder = async (verifiedResponse) => {
    try {
      const verifiedData = verifiedResponse.data || {};
      const verifiedTrxId = verifiedData.trxId || verifiedResponse.data?.trx_id || sessionOptionalTrx.trim() || `VER-${Date.now()}`;
      const methodName = selectedOnlineMethod ? selectedOnlineMethod.name_bn : 'অনলাইন পেমেন্ট';

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
            payment_method: methodName,
            sender_number: customerSenderNumber.trim(),
            trx_id: verifiedTrxId,
            payment_verified: true,
            verified_payment_data: verifiedData,
            items: packageOrderData.items,
            subtotal: packageRegularTotal,
            discount_total: discountTotal,
            delivery_fee: deliveryFee,
            total_amount: totalAmount
          })
        });

        const orderData = await res.json();
        if (!res.ok) throw new Error(orderData.error || 'প্যাকেজ অর্ডার কনফার্মেশনে সমস্যা হয়েছে');

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('package_order_data');
          sessionStorage.setItem('arot_last_placed_order', JSON.stringify(orderData));
        }

        setIsCountdownSessionOpen(false);
        showToast('পেমেন্ট ও প্যাকেজ অর্ডার সফলভাবে সম্পন্ন হয়েছে!');
        onOrderSuccess(orderData);
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
          payment_method: methodName,
          sender_number: customerSenderNumber.trim(),
          trx_id: verifiedTrxId,
          payment_verified: true,
          verified_payment_data: verifiedData,
          items,
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: totalAmount
        })
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'অর্ডার কনফার্মেশনে সমস্যা হয়েছে');

      try {
        sessionStorage.removeItem('package_order_data');
        localStorage.removeItem('arot_active_package_order');
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('arot_last_placed_order', JSON.stringify(orderData));
        }
      } catch (e) {}

      clearCart();
      setIsCountdownSessionOpen(false);
      showToast('পেমেন্ট যাচাই সফল! আপনার অর্ডার নিশ্চিত করা হয়েছে।');
      onOrderSuccess(orderData);
    } catch (err) {
      console.error('Finalize order error:', err);
      showToast(err.message || 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে');
      setIsVerifyingOrder(false);
    }
  };

  // -------------------------------------------------------------
  // 7. CANCEL COUNTDOWN SESSION (No Order Placed)
  // -------------------------------------------------------------
  const handleCancelCountdownSession = () => {
    setIsCountdownSessionOpen(false);
    setSessionEndTime(null);
    setIsVerifyingOrder(false);
    setSessionErrorMsg(null);
    showToast('পেমেন্ট সেশন বাতিল করা হয়েছে। কোনো অর্ডার প্লেস করা হয়নি।');
  };

  // Format seconds into MM:SS with Bengali digits
  const formatCountdown = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${toBengaliNumber(pad(mins))}:${toBengaliNumber(pad(secs))}`;
  };

  const handleCopyReceiverNumber = (num) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    showToast(`নম্বর কপি করা হয়েছে: ${num}`);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  // Order Summary renderer placed below Payment Method and above Payment/Order Button
  const renderOrderSummary = () => (
    <div
      className="co-summary"
      style={{
        background: '#ffffff',
        border: '1px solid var(--rule)',
        borderRadius: '16px',
        padding: '22px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>অর্ডার সামারি</h3>
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
        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>৳{toBengaliNumber(totalAmount)}</span>
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
  );

  // Empty cart screen
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
            className="empty-cart-view"
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid var(--rule)',
              marginTop: '20px',
              maxWidth: '480px',
              margin: '20px auto'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--muted)'
              }}
            >
              <ShoppingCart size={36} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              আপনার ব্যাগ খালি
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
              চেকআউট করতে প্রথমে কিছু তাজা পণ্য ব্যাগে যোগ করুন।
            </p>
            <button
              onClick={onBackToShop}
              className="place-order-btn"
              style={{ maxWidth: '220px', margin: '0 auto', padding: '12px 24px' }}
            >
              কেনাকাটা শুরু করুন
            </button>
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
          <ArrowLeft size={16} /> <span>দোকানে ফিরে যান</span>
        </motion.button>

        <div className="co-grid">
          {/* Customer Info, Payment Options, Order Summary & Submit Button */}
          <form
            className="co-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (paymentChoice === 'cod') {
                handleCashOnDeliverySubmit();
              } else {
                handleOnlinePaymentClick();
              }
            }}
          >
            <h2>ডেলিভারি ও পেমেন্ট তথ্য</h2>

            <div className="field-row">
              <div className={`field ${errors.name ? 'error' : ''}`}>
                <label htmlFor="in-name">আপনার নাম</label>
                <input
                  id="in-name"
                  type="text"
                  placeholder="আপনার নাম লিখুন"
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
              <label htmlFor="in-addr">ডেলিভারির পূর্ণ ঠিকানা</label>
              <textarea
                id="in-addr"
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

            {/* -------------------------------------------------------- */}
            {/* Payment Choice Section: 1. COD | 2. Online Payments       */}
            {/* -------------------------------------------------------- */}
            <div className="payment-method-box" style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', marginBottom: '10px', display: 'block' }}>
                পেমেন্ট অপশন নির্বাচন করুন:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {/* 1. Cash On Delivery Card */}
                {(() => {
                  const codMethod = paymentMethods.find((p) => p.code === 'cod');
                  const showCod = codMethod && codMethod.is_active !== false;
                  if (!showCod) return null;
                  const codLogo = (codMethod && codMethod.logo_url) ? codMethod.logo_url : COD_SVG;
                  return (
                    <div
                      onClick={() => setPaymentChoice('cod')}
                      style={{
                        border: paymentChoice === 'cod' ? '2px solid var(--primary)' : '1px solid var(--rule)',
                        background: paymentChoice === 'cod' ? 'var(--primary-dim)' : '#ffffff',
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div
                          style={{
                            width: '64px',
                            height: '36px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#006C4C',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <img
                            src={codLogo}
                            alt="ক্যাশ অন ডেলিভারি"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--ink)' }}>
                            {codMethod?.name_bn || 'ক্যাশ অন ডেলিভারি'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                            Cash On Delivery
                          </div>
                        </div>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                        {codMethod?.instructions || 'পণ্য হাতে পেয়ে ডেলিভারি ম্যানকে মূল্য পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।'}
                      </p>
                      {paymentChoice === 'cod' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'var(--primary)',
                            color: '#ffffff',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. Online Payments Card */}
                <div
                  onClick={() => setPaymentChoice('online')}
                  style={{
                    border: paymentChoice === 'online' ? '2px solid var(--primary)' : '1px solid var(--rule)',
                    background: paymentChoice === 'online' ? 'var(--primary-dim)' : '#ffffff',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: paymentChoice === 'online' ? 'var(--primary)' : '#f1f5f9',
                        color: paymentChoice === 'online' ? '#ffffff' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--ink)' }}>
                        অনলাইন পেমেন্ট
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                        বিকাশ, নগদ, রকেট ইত্যাদি
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                    মোবাইল ব্যাংকিংয়ের মাধ্যমে ৫ মিনিটের স্বয়ংক্রিয় ভেরিফিকেশন সেশনে তাৎক্ষণিক নিরাপদ পেমেন্ট।
                  </p>
                  {paymentChoice === 'online' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Note based on selected choice */}
              {paymentChoice === 'cod' ? (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12.5px',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>
                    নিচের <strong>"অর্ডার নিশ্চিত করুন"</strong> বাটনে চাপ দিলে সরাসরি অর্ডার কনফার্ম হবে।
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: '#ecfdf5',
                    borderRadius: '8px',
                    border: '1px solid #a7f3d0',
                    fontSize: '12.5px',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>
                    নিচের <strong>"পেমেন্ট করুন"</strong> বাটনে চাপ দিলে বিকাশ, নগদ, রকেট লোগো সহ পেমেন্ট উইন্ডো খুলবে।
                  </span>
                </div>
              )}
            </div>

            {/* Order Summary Section: Directly below Payment Method Section and above Submit Button */}
            <div style={{ marginTop: '22px' }}>
              {renderOrderSummary()}
            </div>

            {/* Bottom Dynamic Submit Button */}
            <motion.button
              type="submit"
              className="place-order-btn"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.01 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              style={{
                marginTop: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'var(--primary)',
                opacity: submitting ? 0.75 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>অর্ডার প্রসেসিং হচ্ছে...</span>
                </>
              ) : paymentChoice === 'cod' ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>অর্ডার নিশ্চিত করুন</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>পেমেন্ট করুন</span>
                </>
              )}
            </motion.button>
          </form>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MODAL 1: ONLINE PAYMENT METHOD SELECTION MODAL (COMPACT) */}
      {/* Responsive minimum 3-column grid showing ONLY logos      */}
      {/* Sized cleanly & compactly with reduced margin/padding    */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px'
            }}
            onClick={() => setIsPaymentModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                maxWidth: '430px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.22)',
                border: '1px solid var(--rule)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--rule)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: 'var(--ink)' }}>
                    পেমেন্ট মেথড নির্বাচন করুন
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                    পরিশোধযোগ্য টাকা: <strong style={{ color: 'var(--primary)' }}>৳{toBengaliNumber(totalAmount)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                    যেকোনো একটি পেমেন্ট গেটওয়ে বেছে নিন:
                  </label>

                  {/* Responsive Min 3 Grid Layout - ONLY Logos */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '8px',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {onlinePaymentMethods.map((method) => {
                      const isSelected = selectedOnlineMethod?.id === method.id || selectedOnlineMethod?.code === method.code;
                      const logoSrc = getPaymentMethodLogo(method);

                      return (
                        <div
                          key={method.id || method.code}
                          onClick={() => {
                            setSelectedOnlineMethod(method);
                            setSenderNumberError('');
                          }}
                          style={{
                            border: isSelected ? '2px solid var(--primary)' : '1.5px solid #e2e8f0',
                            borderRadius: '10px',
                            background: isSelected ? '#f0fdf4' : '#ffffff',
                            padding: '6px 4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 3px 8px rgba(0, 108, 76, 0.14)' : 'none',
                            transform: isSelected ? 'translateY(-1px)' : 'none'
                          }}
                        >
                          {/* Image container compact within max width 100px and height 52px */}
                          <div
                            style={{
                              width: '100%',
                              maxWidth: '100px',
                              height: '52px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}
                          >
                            <img
                              src={logoSrc}
                              alt={method.name_bn || method.name_en || 'Payment Logo'}
                              style={{
                                maxWidth: '100px',
                                maxHeight: '52px',
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>

                          {/* Selected Check Badge */}
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: 'var(--primary)',
                                color: '#ffffff',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                              }}
                            >
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sender Number Input Section (Reveals for selected method) */}
                {selectedOnlineMethod && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      marginTop: '12px'
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      <label
                        htmlFor="sender-num-input"
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: 'var(--ink)',
                          display: 'block',
                          marginBottom: '4px'
                        }}
                      >
                        আপনার {selectedOnlineMethod.name_bn} নম্বর দিন:
                      </label>
                      <input
                        id="sender-num-input"
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={customerSenderNumber}
                        onChange={(e) => {
                          setCustomerSenderNumber(e.target.value);
                          if (senderNumberError) setSenderNumberError('');
                        }}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: senderNumberError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px'
                        }}
                      />
                      {senderNumberError && (
                        <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px' }}>
                          {senderNumberError}
                        </div>
                      )}
                    </div>

                    {/* Store Receiver Number info */}
                    {selectedOnlineMethod.number && (
                      <div
                        style={{
                          background: '#ffffff',
                          borderRadius: '8px',
                          padding: '7px 10px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginBottom: '8px'
                        }}
                      >
                        <div style={{ fontSize: '11.5px', color: '#475569' }}>
                          সেন্ড মানি নম্বর:{' '}
                          <span className="mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '13px' }}>
                            {selectedOnlineMethod.number}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyReceiverNumber(selectedOnlineMethod.number)}
                          style={{
                            background: copiedNumber ? '#dcfce7' : '#f1f5f9',
                            color: copiedNumber ? '#15803d' : '#334155',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          {copiedNumber ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি'}</span>
                        </button>
                      </div>
                    )}

                    {/* Payment Instruction */}
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.35 }}>
                      {selectedOnlineMethod.instructions || selectedOnlineMethod.instructions_bn || 'টাকা পাঠিয়ে পেমেন্ট সেশন শুরু করুন।'}
                    </p>
                  </motion.div>
                )}

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    বন্ধ করুন
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCountdownSession}
                    disabled={!selectedOnlineMethod || !customerSenderNumber || !/^01[0-9]{9}$/.test((customerSenderNumber || '').trim().replace(/[^0-9]/g, ''))}
                    style={{
                      flex: 2,
                      padding: '9px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '13.5px',
                      cursor: (!selectedOnlineMethod || !customerSenderNumber || !/^01[0-9]{9}$/.test((customerSenderNumber || '').trim().replace(/[^0-9]/g, ''))) ? 'not-allowed' : 'pointer',
                      opacity: (!selectedOnlineMethod || !customerSenderNumber || !/^01[0-9]{9}$/.test((customerSenderNumber || '').trim().replace(/[^0-9]/g, ''))) ? 0.6 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Clock size={15} />
                    <span>পেমেন্ট সেশন শুরু করুন</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 2: 5-MINUTE COUNTDOWN & REAL-TIME POLLING SESSION  */}
      {/* Real timestamp countdown with 3-sec backend verify poll  */}
      {/* Displays order id, site name, logo, payment logo, etc.   */}
      {/* Includes cancel button to halt polling without placing   */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* MODAL 2: 5-MINUTE COUNTDOWN & REAL-TIME POLLING (COMPACT)*/}
      {/* Real timestamp countdown with 3-sec backend verify poll  */}
      {/* Compact layout with reduced margins and padding          */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isCountdownSessionOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                maxWidth: '410px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.3)',
                border: '1px solid #cbd5e1'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Website Name & Logo */}
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {propSettings?.logo_image_url ? (
                    <img
                      src={propSettings.logo_image_url}
                      alt={propSettings?.site_name || 'Logo'}
                      style={{ height: '22px', maxWidth: '80px', objectFit: 'contain' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Sparkles size={13} />
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                      {propSettings?.site_name || propSettings?.logo_text_bn || 'আড়ৎ এক্সপ্রেস'}
                    </h4>
                    <span style={{ fontSize: '10px', opacity: 0.9 }}>নিরাপদ পেমেন্ট সেশন</span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 700
                  }}
                >
                  {sessionReferenceId}
                </div>
              </div>

              {/* Main Session Content */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {/* Payment Method Logo */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '96px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '6px'
                  }}
                >
                  <img
                    src={getPaymentMethodLogo(selectedOnlineMethod)}
                    alt={selectedOnlineMethod?.name_bn || 'Payment Method'}
                    style={{
                      maxWidth: '96px',
                      maxHeight: '46px',
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>

                {/* Amount to Pay */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                    পরিশোধযোগ্য টাকা
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace', lineHeight: 1.1 }}>
                    ৳{toBengaliNumber(totalAmount)}
                  </div>
                </div>

                {/* Countdown Dial / Progress */}
                <div
                  style={{
                    width: '100%',
                    background: isSessionExpired ? '#fef2f2' : '#f0fdf4',
                    border: isSessionExpired ? '1px solid #fecaca' : '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Clock size={15} style={{ color: isSessionExpired ? '#dc2626' : 'var(--primary)' }} />
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: isSessionExpired ? '#dc2626' : '#166534' }}>
                      {isSessionExpired ? 'সময় শেষ হয়েছে' : 'পেমেন্ট যাচাইয়ের অবশিষ্ট সময়'}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      color: isSessionExpired ? '#dc2626' : 'var(--primary)',
                      fontFamily: 'monospace',
                      letterSpacing: '1px',
                      lineHeight: 1.1
                    }}
                  >
                    {formatCountdown(timeLeftSeconds)}
                  </div>

                  {/* Visual Progress Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      background: isSessionExpired ? '#fee2e2' : '#dcfce7',
                      borderRadius: '999px',
                      marginTop: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(100, (timeLeftSeconds / 300) * 100))}%`,
                        background: isSessionExpired ? '#dc2626' : 'var(--primary)',
                        transition: 'width 1s linear',
                        borderRadius: '999px'
                      }}
                    ></div>
                  </div>

                  {/* 3-Second Real-time Polling Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '6px',
                      fontSize: '11px',
                      color: isSessionExpired ? '#991b1b' : '#15803d',
                      fontWeight: 600
                    }}
                  >
                    {!isSessionExpired && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#22c55e',
                          display: 'inline-block',
                          animation: 'pulse 1.5s infinite'
                        }}
                      ></span>
                    )}
                    <span>{pollingStatusText}</span>
                  </div>
                </div>

                {/* Receiver Info & Payment Details Card */}
                <div
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'left',
                    fontSize: '12px',
                    marginBottom: '10px'
                  }}
                >
                  {/* Receiver Number with 1-Click Copy */}
                  {selectedOnlineMethod?.number && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '8px',
                        borderBottom: '1px dashed #cbd5e1',
                        marginBottom: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {selectedOnlineMethod.name_bn} প্রাপক নম্বর:
                        </div>
                        <div className="mono" style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ink)' }}>
                          {selectedOnlineMethod.number}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyReceiverNumber(selectedOnlineMethod.number)}
                        style={{
                          background: copiedNumber ? '#dcfce7' : 'var(--primary)',
                          color: copiedNumber ? '#15803d' : '#ffffff',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        {copiedNumber ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedNumber ? 'কপি হয়েছে' : 'নম্বর কপি'}</span>
                      </button>
                    </div>
                  )}

                  {/* Customer Sender Number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--muted)' }}>আপনার প্রেরক নম্বর:</span>
                    <strong className="mono" style={{ color: 'var(--ink)' }}>{customerSenderNumber}</strong>
                  </div>

                  {/* Instructions */}
                  <div style={{ marginTop: '6px', color: '#475569', fontSize: '11px', lineHeight: 1.35 }}>
                    <strong>নির্দেশনা:</strong> {selectedOnlineMethod?.instructions || selectedOnlineMethod?.instructions_bn || 'আপনার মোবাইল ব্যাংকিং অ্যাপ বা USSD ডায়াল করে টাকা পাঠান।'}
                  </div>
                </div>

                {/* Optional TrxID Input for faster matching */}
                <div style={{ width: '100%', marginBottom: '10px', textAlign: 'left' }}>
                  <label htmlFor="session-trx-input" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>
                    TrxID (ঐচ্ছিক):
                  </label>
                  <input
                    id="session-trx-input"
                    type="text"
                    placeholder="যেমন: 8N7A6D5E (যদি পেয়ে থাকেন)"
                    value={sessionOptionalTrx}
                    onChange={(e) => setSessionOptionalTrx(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                {/* Error Banner inside modal */}
                {sessionErrorMsg && (
                  <div
                    style={{
                      width: '100%',
                      background: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '11.5px',
                      color: '#b91c1c',
                      marginBottom: '10px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>{sessionErrorMsg}</span>
                  </div>
                )}

                {/* Cancel Button */}
                <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCancelCountdownSession}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #ef4444',
                      background: '#fff5f5',
                      color: '#dc2626',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <X size={15} />
                    <span>পেমেন্ট বাতিল করুন</span>
                  </button>

                  {isSessionExpired && (
                    <button
                      type="button"
                      onClick={handleStartCountdownSession}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'var(--primary)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <RefreshCw size={15} />
                      <span>আবার চেষ্টা করুন</span>
                    </button>
                  )}
                </div>

                {/* Note */}
                <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#64748b' }}>
                  পেমেন্ট বাতিল করলে কোনো অর্ডার প্লেস হবে না। সফল ভেরিফিকেশন পাওয়ার পরই কেবল অর্ডার নিশ্চিত হবে।
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verification Failure Details Modal */}
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
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#b91c1c' }}>
                    {verificationErrorModal.message}
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

              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setVerificationErrorModal(null)}
                  style={{
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ঠিক আছে
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
