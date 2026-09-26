"use client";
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProtectedRoute from './ProtectedRoute.jsx';
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  User,
  KeyRound,
  LogOut,
  ExternalLink,
  Menu,
  X,
  RefreshCw,
  Bike,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  PhoneCall,
  Clock,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useStoreData } from '../context/StoreDataContext.tsx';
import { toBengaliNumber } from '../utils/bengali.js';
import DeliveryRiderDashboard from './DeliveryRiderDashboard.jsx';
import DeliveryRiderOrders from './DeliveryRiderOrders.jsx';
import DeliveryRiderReports from './DeliveryRiderReports.jsx';
import DeliveryRiderProfile from './DeliveryRiderProfile.jsx';
import PosReceiptModal from './PosReceiptModal.jsx';

const RIDER_TAB_TITLES = {
  dashboard: 'ডেলিভারি ম্যান প্যানেল',
  orders: 'অ্যাসাইন করা অর্ডার',
  reports: 'ডেলিভারি রিপোর্ট ও হিসাব',
  profile: 'প্রোফাইল ও পাসওয়ার্ড'
};

export default function DeliveryRiderPanel({ onNavigateHome }) {
  const { showToast } = useCart();
  const storeContext = useStoreData?.();
  const settings = storeContext?.settings;

  // Rider auth state (stored in localStorage for persistent session)
  const [riderToken, setRiderToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('rider_token') || null;
  });
  const [rider, setRider] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('rider_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Tab & Data states
  const pathname = usePathname() || '/delivery-man';
  const router = useRouter();
  const navigate = (path) => router.push(path);
  const parts = pathname.split("/");
  const activeTab = parts[2] && parts[2] !== '' ? parts[2] : 'dashboard';
  const setActiveTab = (tab) => { navigate(`/delivery-man/${tab}`); }; // 'dashboard' | 'orders' | 'reports' | 'profile'
  const [orderFilterTab, setOrderFilterTab] = useState('active');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Synchronize document title reactively for Rider panel and each sidebar item
  useEffect(() => {
    const siteName = (settings && settings.site_name ? settings.site_name.trim() : '') || 'আড়ৎ এক্সপ্রেস (Arot Express)';

    if (!riderToken) {
      const loginTitle = `ডেলিভারি ম্যান লগইন — ${siteName}`;
      if (document.title !== loginTitle) {
        document.title = loginTitle;
      }
      return;
    }

    const itemTitle = RIDER_TAB_TITLES[activeTab] || 'ডেলিভারি ম্যান প্যানেল';
    const fullTitle = `${itemTitle} — ${siteName}`;
    if (document.title !== fullTitle) {
      document.title = fullTitle;
    }
  }, [activeTab, riderToken, settings?.site_name]);

  // Receipt Modal state
  const [receiptOrder, setReceiptOrder] = useState(null);

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginPhone.trim() || !loginPassword.trim()) {
      setLoginError('মোবাইল নম্বর এবং পাসওয়ার্ড উভয়ই আবশ্যক');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/rider/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone.trim(), password: loginPassword.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'লগইন ব্যর্থ হয়েছে');
      }

      setRiderToken(data.token);
      setRider(data.rider);
      localStorage.setItem('rider_token', data.token);
      localStorage.setItem('rider_data', JSON.stringify(data.rider));
      showToast?.(`স্বাগতম, ${data.rider.name}!`);
    } catch (err) {
      setLoginError(err.message || 'লগইন করতে সমস্যা হয়েছে');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setRiderToken(null);
    setRider(null);
    localStorage.removeItem('rider_token');
    localStorage.removeItem('rider_data');
    showToast?.('সফলভাবে লগআউট হয়েছে');
  };

  // Fetch Rider Orders & Stats
  const fetchRiderData = async () => {
    if (!riderToken) return;
    setLoadingOrders(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/rider/orders', {
          headers: { Authorization: `Bearer ${riderToken}` }
        }),
        fetch('/api/rider/stats', {
          headers: { Authorization: `Bearer ${riderToken}` }
        })
      ]);

      if (ordersRes.status === 401 || ordersRes.status === 403) {
        handleLogout();
        return;
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Rider data fetch error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (riderToken) {
      fetchRiderData();
    }
  }, [riderToken]);

  // Update order status handler
  const handleUpdateOrderStatus = async (orderId, status, note, isPackage) => {
    try {
      const res = await fetch(`/api/rider/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${riderToken}`
        },
        body: JSON.stringify({ status, note, is_package: isPackage })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
      }

      showToast?.(
        status === 'delivered'
          ? `অর্ডার #${orderId} সফলভাবে ডেলিভার্ড করা হয়েছে!`
          : `অর্ডার #${orderId} স্ট্যাটাস পরিবর্তিত হয়েছে`
      );
      // Refresh local list
      await fetchRiderData();
    } catch (err) {
      showToast?.(err.message || 'ত্রুটি হয়েছে');
      throw err;
    }
  };

  // Quick mark delivered
  const handleQuickMarkDelivered = async (order) => {
    const isCOD = !order.payment_method || order.payment_method.toLowerCase().includes('cash') || order.payment_method.includes('ক্যাশ');
    const note = isCOD ? `নগদ ৳${toBengaliNumber(order.total_amount)} গ্রহণ করা হয়েছে।` : 'পণ্য হস্তান্তর সম্পন্ন।';
    await handleUpdateOrderStatus(order.id, 'delivered', note, order.is_package || order.is_package_order);
  };

  // Update Profile
  const handleUpdateProfile = async (profileData) => {
    const res = await fetch('/api/rider/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'আপডেট ব্যর্থ');
    setRider(data);
    localStorage.setItem('rider_data', JSON.stringify(data));
  };

  // Change Password
  const handleChangePassword = async (currentPassword, newPassword) => {
    const res = await fetch('/api/rider/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${riderToken}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ');
  };

  // =========================================================================
  // VIEW 1: LOGIN FORM (If not authenticated as rider)
  // =========================================================================
  if (!riderToken || !rider) {
    return (
      <ProtectedRoute isAllowed={!!riderToken} redirectPath="/delivery-man">
      <div
        className="admin-login-wrap"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--cream)'
        }}
      >
        <motion.div
          className="admin-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ maxWidth: '440px', width: '100%', margin: 'auto' }}
        >
          <div className="modal-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bike size={20} color="#16a34a" />
              <span>ডেলিভারি ম্যান পোর্টাল</span>
            </h3>
            <button
              type="button"
              className="close-modal-btn"
              onClick={onNavigateHome}
              aria-label="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
              আপনার নিবন্ধিত মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন।
            </p>

            {loginError && (
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
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{loginError}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin}>
              <div className="field">
                <label>মোবাইল নম্বর</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label>পাসওয়ার্ড</label>
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড লিখুন"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                disabled={loginLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: '8px', background: '#16a34a' }}
              >
                {loginLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
              </motion.button>
            </form>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="admin-btn"
              style={{ border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: '13px', textDecoration: 'underline' }}
              onClick={onNavigateHome}
            >
              মূল ওয়েবসাইটে ফিরে যান
            </button>
          </div>
        </motion.div>
      </div>
      </ProtectedRoute>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED DELIVERY RIDER PORTAL (Consistent Admin Sidebar Design)
  // =========================================================================
  return (
    <div className="admin-layout">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          id="mobile-overlay"
          className="open"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="admin-brand">
          <div
            className="stamp"
            style={{
              width: '40px',
              height: '40px',
              fontSize: '14px',
              background: '#16a34a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}
          >
            <Bike size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
              রাইডার পোর্টাল
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--green-dim)' }}>
              {rider?.name || 'ডেলিভারি ড্যাশবোর্ড'}
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="admin-nav" style={{ flex: 1 }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <LayoutDashboard size={16} />
            <span>ড্যাশবোর্ড</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <ShoppingBag size={16} />
            <span>অ্যাসাইন করা অর্ডার ({toBengaliNumber(orders.length)})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <FileText size={16} />
            <span>ডেলিভারি রিপোর্ট ও হিসাব</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveTab('profile'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <User size={16} />
            <span>প্রোফাইল ও পাসওয়ার্ড</span>
          </motion.button>
        </nav>

        {/* Sidebar Footer */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '14px', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="admin-btn danger"
            style={{ width: '100%', padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={handleLogout}
          >
            <LogOut size={15} />
            <span>লগআউট</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="admin-btn"
            style={{ width: '100%', padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={onNavigateHome}
          >
            <ExternalLink size={14} />
            <span>মূল শপে ফিরে যান</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        {/* Mobile menu trigger bar */}
        <div className="admin-mobile-bar no-print">
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="মেনু খুলুন"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Menu size={18} />
            <span>রাইডার মেনু</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              {rider?.name}
            </span>
            <button
              type="button"
              className="admin-btn"
              style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              onClick={fetchRiderData}
              title="তথ্য রিফ্রেশ করুন"
            >
              <RefreshCw size={13} className={loadingOrders ? 'spin' : ''} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="rider-content-wrap">
          {activeTab === 'dashboard' && (
            <DeliveryRiderDashboard
              rider={rider}
              orders={orders}
              stats={stats}
              onNavigateTab={(tab, filter) => {
                if (filter) setOrderFilterTab(filter);
                setActiveTab(tab);
                window.scrollTo(0, 0);
              }}
              onOpenOrderModal={(order) => { setActiveTab('orders'); }}
              onQuickMarkDelivered={handleQuickMarkDelivered}
            />
          )}

          {activeTab === 'orders' && (
            <DeliveryRiderOrders
              orders={orders}
              initialTab={orderFilterTab}
              onTabChange={(t) => setOrderFilterTab(t)}
              onUpdateStatus={handleUpdateOrderStatus}
              onOpenReceipt={(order) => setReceiptOrder(order)}
              loading={loadingOrders}
            />
          )}

          {activeTab === 'reports' && (
            <DeliveryRiderReports
              rider={rider}
              orders={orders}
            />
          )}

          {activeTab === 'profile' && (
            <DeliveryRiderProfile
              rider={rider}
              onUpdateProfile={handleUpdateProfile}
              onChangePassword={handleChangePassword}
              showToast={showToast}
            />
          )}
        </div>

      </main>

      {/* Mobile Sticky Bottom Navigation Bar for Rider */}
      <nav className="rider-bottom-nav no-print" aria-label="রাইডার মোবাইল নেভিগেশন">
        <button
          type="button"
          className={`rider-bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dashboard'); window.scrollTo(0, 0); }}
        >
          <LayoutDashboard size={20} />
          <span>ড্যাশবোর্ড</span>
        </button>

        <button
          type="button"
          className={`rider-bottom-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => { setActiveTab('orders'); window.scrollTo(0, 0); }}
          style={{ position: 'relative' }}
        >
          <ShoppingBag size={20} />
          <span>অর্ডার</span>
          {orders.filter(o => o.status !== 'delivered' && o.status !== 'ডেলিভার্ড' && o.status !== 'cancelled' && o.status !== 'বাতিল').length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: 'calc(50% - 16px)',
                background: '#eab308',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {toBengaliNumber(orders.filter(o => o.status !== 'delivered' && o.status !== 'ডেলিভার্ড' && o.status !== 'cancelled' && o.status !== 'বাতিল').length)}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`rider-bottom-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => { setActiveTab('reports'); window.scrollTo(0, 0); }}
        >
          <FileText size={20} />
          <span>হিসাব</span>
        </button>

        <button
          type="button"
          className={`rider-bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => { setActiveTab('profile'); window.scrollTo(0, 0); }}
        >
          <User size={20} />
          <span>প্রোফাইল</span>
        </button>
      </nav>

      {/* POS Receipt Modal for Rider Print / View */}
      {receiptOrder && (
        <PosReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

    </div>
  );
}
