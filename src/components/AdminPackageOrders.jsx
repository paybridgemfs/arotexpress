"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardList,
  Clock,
  Settings,
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  X,
  Calendar,
  User,
  Phone,
  MapPin,
  Building2,
  Printer,
  Banknote,
  CreditCard,
  Package,
  ArrowUpDown,
  Copy,
  Check,
  PhoneCall,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  ChevronDown,
  Bike,
  Plus,
  UserCheck,
  Tag,
  Lock
} from 'lucide-react';
import { toBengaliNumber, formatStockDisplay } from '../utils/bengali.js';
import { copyToClipboard } from '../utils/clipboard.js';
import Pagination from './Pagination.jsx';

export default function AdminPackageOrders({
  packageOrders = [],
  orders = [],
  deliveryRiders = [],
  onUpdateStatus,
  onAssignRider,
  onOpenReceipt,
  onOpenInvoice,
  onRefresh
}) {
  const ordersList = useMemo(() => {
    return (packageOrders && packageOrders.length > 0) ? packageOrders : (orders || []);
  }, [packageOrders, orders]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest'); // 'newest' | 'oldest' | 'highest' | 'lowest'
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, sortOption]);

  // Modal States
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');
  const [assignRiderModalOrder, setAssignRiderModalOrder] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [riderDetailsModal, setRiderDetailsModal] = useState(null);
  const [viewItemsModal, setViewItemsModal] = useState(null);
  const [viewBillModal, setViewBillModal] = useState(null);
  const [viewAddressModal, setViewAddressModal] = useState(null);
  const [viewFullOrderModal, setViewFullOrderModal] = useState(null);

  // Status normalizer helper (supports English and Bengali)
  const normalizeStatus = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'pending' || s === 'পেন্ডিং') return 'pending';
    if (s === 'processing' || s === 'প্রসেসিং') return 'processing';
    if (s === 'shipped' || s === 'পাঠানো হয়েছে' || s === 'ডেলিভারিতে আছে' || s === 'অন-ডেলিভারি' || s === 'অন-ওয়ে') return 'shipped';
    if (s === 'delivered' || s === 'ডেলিভার্ড' || s === 'সম্পন্ন') return 'delivered';
    if (s === 'cancelled' || s === 'বাতিল') return 'cancelled';
    return s || 'pending';
  };

  const getStatusLabel = (st) => {
    const norm = normalizeStatus(st);
    switch (norm) {
      case 'pending': return 'পেন্ডিং';
      case 'processing': return 'প্রসেসিং';
      case 'shipped': return 'পাঠানো হয়েছে';
      case 'delivered': return 'ডেলিভার্ড';
      case 'cancelled': return 'বাতিল';
      default: return st;
    }
  };

  // Copy phone helper
  const handleCopyPhone = async (orderId, phone, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const success = await copyToClipboard(phone);
    if (success) {
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId(null), 2000);
    }
  };

  // Status metrics & revenue calculation
  const stats = useMemo(() => {
    const counts = {
      all: ordersList.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    let totalRevenue = 0;
    let pendingRevenue = 0;

    ordersList.forEach((o) => {
      const amount = Number(o.total_amount) || 0;
      const norm = normalizeStatus(o.status);

      if (norm === 'pending') {
        counts.pending++;
        pendingRevenue += amount;
      } else if (norm === 'processing') {
        counts.processing++;
      } else if (norm === 'shipped') {
        counts.shipped++;
      } else if (norm === 'delivered') {
        counts.delivered++;
        totalRevenue += amount;
      } else if (norm === 'cancelled') {
        counts.cancelled++;
      }
    });

    return { counts, totalRevenue, pendingRevenue };
  }, [ordersList]);

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    let list = [...ordersList];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((o) => normalizeStatus(o.status) === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((o) => {
        const idStr = String(o.id || '').toLowerCase();
        const codeStr = String(o.order_code || '').toLowerCase();
        const nameStr = String(o.customer_name || '').toLowerCase();
        const phoneStr = String(o.customer_phone || '').toLowerCase();
        const areaStr = String(o.delivery_area || '').toLowerCase();
        const addrStr = String(o.delivery_address || '').toLowerCase();
        const trxStr = String(o.trx_id || '').toLowerCase();
        const methodStr = String(o.payment_method || '').toLowerCase();
        return (
          idStr.includes(q) ||
          codeStr.includes(q) ||
          nameStr.includes(q) ||
          phoneStr.includes(q) ||
          areaStr.includes(q) ||
          addrStr.includes(q) ||
          trxStr.includes(q) ||
          methodStr.includes(q)
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortOption === 'highest') {
        return (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0);
      }
      if (sortOption === 'lowest') {
        return (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
      }
      return 0;
    });

    return list;
  }, [ordersList, statusFilter, searchTerm, sortOption]);

  // Paginated Orders slice
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Handle status update confirmation
  const handleConfirmStatusChange = () => {
    if (!statusModalOrder) return;
    if (onUpdateStatus) {
      onUpdateStatus(statusModalOrder.id, pendingStatus);
    }
    setStatusModalOrder(null);
  };

  return (
    <div className="admin-orders-page">
      {/* Top Metrics Row */}
      <div className="admin-orders-metrics-grid">
        <div className="metric-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(31, 75, 63, 0.1)', color: 'var(--green)' }}>
            <ShoppingBag size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">মোট প্যাকেজ অর্ডার</div>
            <div className="stat-value mono">{toBengaliNumber(stats.counts.all)} টি</div>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">পেন্ডিং অর্ডার</div>
            <div className="stat-value mono" style={{ color: '#d97706' }}>
              {toBengaliNumber(stats.counts.pending)} টি
            </div>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
            <Settings size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">প্রসেসিং হচ্ছে</div>
            <div className="stat-value mono" style={{ color: '#2563eb' }}>
              {toBengaliNumber(stats.counts.processing)} টি
            </div>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">সফল ডেলিভারি</div>
            <div className="stat-value mono" style={{ color: '#059669' }}>
              {toBengaliNumber(stats.counts.delivered)} টি
            </div>
          </div>
        </div>

        <div className="metric-stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(201, 146, 42, 0.15)', color: 'var(--gold-dark)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">সম্পন্ন ডেলিভারি আয়</div>
            <div className="stat-value mono" style={{ color: 'var(--gold-dark)' }}>
              ৳{toBengaliNumber(stats.totalRevenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Filter and Controls Bar */}
      <div className="admin-orders-controls">
        {/* Status Filter Chips */}
        <div className="admin-status-filters">
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <ClipboardList size={14} />
            <span>সমস্ত অর্ডার ({toBengaliNumber(stats.counts.all)})</span>
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <Clock size={14} />
            <span>পেন্ডিং ({toBengaliNumber(stats.counts.pending)})</span>
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === 'processing' ? 'active' : ''}`}
            onClick={() => setStatusFilter('processing')}
          >
            <Settings size={14} />
            <span>প্রসেসিং ({toBengaliNumber(stats.counts.processing)})</span>
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === 'shipped' ? 'active' : ''}`}
            onClick={() => setStatusFilter('shipped')}
          >
            <Truck size={14} />
            <span>পাঠানো হয়েছে ({toBengaliNumber(stats.counts.shipped)})</span>
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => setStatusFilter('delivered')}
          >
            <CheckCircle2 size={14} />
            <span>ডেলিভার্ড ({toBengaliNumber(stats.counts.delivered)})</span>
          </button>
          <button
            type="button"
            className={`admin-filter-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            <XCircle size={14} />
            <span>বাতিল ({toBengaliNumber(stats.counts.cancelled)})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="admin-search-sort-row">
          <div className="admin-order-search">
            <Search size={16} className="search-icon-svg" />
            <input
              type="text"
              placeholder="প্যাকেজ অর্ডার কোড (PK-...), গ্রাহকের নাম, মোবাইল নম্বর, এলাকা বা TrxID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="মুছে ফেলুন"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="admin-order-sort">
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)', fontSize: '13px', fontWeight: 600 }}>
              <ArrowUpDown size={14} />
              <span>সাজানোর ক্রম:</span>
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">সর্বশেষ অর্ডার আগে</option>
              <option value="oldest">পুরাতন অর্ডার আগে</option>
              <option value="highest">সর্বোচ্চ বিল আগে</option>
              <option value="lowest">সর্বনিম্ন বিল আগে</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="admin-empty-state-box">
          <div className="empty-icon-circle">
            <Package size={36} />
          </div>
          <h4>কোনো প্যাকেজ অর্ডার পাওয়া যায়নি</h4>
          <p>
            {searchTerm || statusFilter !== 'all'
              ? 'আপনার অনুসন্ধান বা নির্বাচিত ফিল্টারের সাথে মিল থাকা কোনো প্যাকেজ অর্ডার নেই।'
              : 'এখনও পর্যন্ত কোনো প্যাকেজ অর্ডার তালিকায় জমা পড়েনি।'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Orders Card View (Visible only on mobile screens <=900px) */}
          <div className="admin-orders-mobile-container">
            {paginatedOrders.map((o) => {
              const normStatus = normalizeStatus(o.status);
              const itemsCount = Array.isArray(o.items_json)
                ? o.items_json.length
                : (typeof o.items_json === 'string' ? (JSON.parse(o.items_json) || []).length : 0);

              return (
                <div key={o.id} className={`admin-order-card-mobile order-card-status-${normStatus}`}>
                  {/* Header: Order Code, Date & Status */}
                  <div className="card-top-header">
                    <div>
                      <button
                        type="button"
                        className="admin-btn secondary"
                        style={{ padding: '5px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--rule)', background: '#F8FAF9', borderRadius: 'var(--radius-pill)' }}
                        onClick={() => setViewFullOrderModal(o)}
                      >
                        <span className="mono font-bold">{o.order_code || `#PK-${o.id}`}</span>
                        <Package size={12} />
                      </button>
                      <div className="order-time-label">
                        <Calendar size={12} />
                        <span>{new Date(o.created_at || Date.now()).toLocaleDateString('bn-BD')}</span>
                        <Clock size={12} style={{ marginLeft: '6px' }} />
                        <span className="mono">{new Date(o.created_at || Date.now()).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="card-status-select-wrap">
                      <button
                        type="button"
                        className={`status-badge status-${normStatus}`}
                        style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          setStatusModalOrder(o);
                          setPendingStatus(normStatus);
                        }}
                      >
                        <span>{getStatusLabel(o.status)}</span>
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Customer Details Box */}
                  <div className="card-customer-section">
                    <div className="customer-row">
                      <User size={14} className="info-icon" />
                      <strong>{o.customer_name}</strong>
                    </div>
                    <div className="customer-row" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} className="info-icon" />
                        <a href={`tel:${o.customer_phone}`} className="mono phone-link">
                          {o.customer_phone}
                        </a>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="quick-icon-btn"
                          onClick={(e) => handleCopyPhone(o.id, o.customer_phone, e)}
                          title="নম্বর কপি করুন"
                        >
                          {copiedOrderId === o.id ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={`tel:${o.customer_phone}`}
                          className="quick-icon-btn call-action"
                          title="সরাসরি কল দিন"
                        >
                          <PhoneCall size={13} />
                        </a>
                      </div>
                    </div>
                    <div className="customer-row">
                      <MapPin size={14} className="info-icon" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '13px', lineHeight: 1.4 }}>{o.delivery_address}</span>
                    </div>
                    {o.delivery_area && (
                      <div className="customer-row" style={{ marginTop: '2px' }}>
                        <Building2 size={13} className="info-icon" />
                        <span className="order-area-badge">{o.delivery_area}</span>
                      </div>
                    )}
                  </div>

                  {/* Delivery Rider Section (Mobile) */}
                  <div style={{ padding: '8px 12px', background: 'var(--cream-card)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
                      <Bike size={14} color="var(--green-dim)" />
                      <span>রাইডার:</span>
                      <strong>{o.delivery_rider_name || 'অ্যাসাইন হয়নি'}</strong>
                    </div>
                    {o.delivery_rider_name ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {o.delivery_rider_phone && (
                          <a href={`tel:${o.delivery_rider_phone}`} className="quick-icon-btn call-action" title="কল দিন">
                            <PhoneCall size={12} />
                          </a>
                        )}
                        <button
                          type="button"
                          className="admin-btn secondary"
                          style={{ padding: '2px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => setRiderDetailsModal(o)}
                        >
                          {normalizeStatus(o.status) === 'delivered' && <Lock size={10} color="#64748b" />}
                          <span>বিস্তারিত</span>
                        </button>
                      </div>
                    ) : normalizeStatus(o.status) === 'delivered' ? (
                      <span
                        style={{
                          padding: '2px 7px',
                          fontSize: '11px',
                          color: '#64748b',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="প্যাকেজ অর্ডারটি ইতিমধ্যে ডেলিভার্ড হয়েছে, তাই রাইডার অ্যাসাইন বন্ধ"
                      >
                        <Lock size={11} color="#94a3b8" />
                        <span>অ্যাসাইন বন্ধ</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn secondary"
                        style={{ padding: '2px 8px', fontSize: '11px' }}
                        onClick={() => {
                          setAssignRiderModalOrder(o);
                          setSelectedRiderId(o.delivery_rider_id || '');
                          setDeliveryNote(o.delivery_note || '');
                        }}
                      >
                        + অ্যাসাইন
                      </button>
                    )}
                  </div>

                  {/* Items Breakdown */}
                  <div className="card-items-section">
                    <div className="items-header-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={13} />
                        <span>প্যাকেজ পণ্য ({toBengaliNumber(itemsCount)} টি)</span>
                      </div>
                      <button
                        type="button"
                        className="admin-btn secondary"
                        style={{ padding: '4px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => setViewItemsModal(o)}
                      >
                        বিস্তারিত দেখুন
                      </button>
                    </div>
                  </div>

                  {/* Payment & Bill Summary */}
                  <div className="card-bill-footer">
                    <div>
                      <div className="mono font-bold total-price-text">
                        ৳{toBengaliNumber(o.total_amount)}
                      </div>
                      <div className="bill-sub-breakdown">
                        {o.discount_total > 0 ? (
                          <span>(উপমোট ৳{toBengaliNumber(o.subtotal || o.total_amount)} - ছাড় ৳{toBengaliNumber(o.discount_total)} + চার্জ ৳{toBengaliNumber(o.delivery_fee || 0)})</span>
                        ) : (
                          <span>(পণ্য ৳{toBengaliNumber(o.subtotal || o.total_amount)} + চার্জ ৳{toBengaliNumber(o.delivery_fee || 0)})</span>
                        )}
                      </div>
                      <div className="payment-method-tag">
                        {o.payment_method === 'cod' || !o.payment_method || o.payment_method.includes('ক্যাশ') ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Banknote size={12} /> ক্যাশ অন ডেলিভারি
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CreditCard size={12} /> {o.payment_method}
                          </span>
                        )}
                        {o.trx_id && <span className="mono trx-tag">Trx: {o.trx_id}</span>}
                      </div>
                    </div>

                    {/* Receipt Print Button */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <motion.button
                        type="button"
                        className="admin-pos-print-btn"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onOpenReceipt(o)}
                        title="POS রসিদ প্রিন্ট করুন"
                      >
                        <Printer size={14} />
                        <span>রসিদ</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Structured Table View (Identical to AdminOrders) */}
          <div className="admin-table-wrap admin-orders-desktop-table">
            <table className="admin-table clean-orders-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>অর্ডার নম্বর</th>
                  <th style={{ textAlign: 'center' }}>গ্রাহক</th>
                  <th style={{ textAlign: 'center' }}>ডেলিভারি ঠিকানা</th>
                  <th style={{ textAlign: 'center' }}>পন্যের তালিকা</th>
                  <th style={{ textAlign: 'center' }}>বিল</th>
                  <th style={{ textAlign: 'center' }}>ডেলিভারিম্যান</th>
                  <th style={{ textAlign: 'center' }}>স্ট্যাটাস</th>
                  <th style={{ textAlign: 'center' }}>রসিদ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o) => {
                  const normStatus = normalizeStatus(o.status);
                  const itemsList = Array.isArray(o.items_json)
                    ? o.items_json
                    : (typeof o.items_json === 'string' ? (JSON.parse(o.items_json) || []) : []);

                  return (
                    <tr key={o.id} className={`order-row-status-${normStatus}`} style={{ textAlign: 'center' }}>
                      {/* Column 1: Order Code */}
                      <td>
                        <button
                          type="button"
                          className="admin-btn secondary"
                          style={{
                            padding: '5px 12px',
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            border: '1px solid var(--rule)',
                            background: '#F8FAF9',
                            borderRadius: 'var(--radius-pill)',
                            fontWeight: 700
                          }}
                          onClick={() => setViewFullOrderModal(o)}
                        >
                          <span className="mono font-bold">{o.order_code || `#PK-${o.id}`}</span>
                        </button>
                      </td>

                      {/* Column 2: Customer Details */}
                      <td>
                        <div className="customer-name-box">
                          <User size={14} />
                          <strong>{o.customer_name}</strong>
                        </div>
                        <div className="customer-phone-box">
                          <Phone size={12} />
                          <a href={`tel:${o.customer_phone}`} className="mono phone-link">
                            {o.customer_phone}
                          </a>
                          <button
                            type="button"
                            className="quick-icon-btn small"
                            onClick={(e) => handleCopyPhone(o.id, o.customer_phone, e)}
                            title="নম্বর কপি করুন"
                          >
                            {copiedOrderId === o.id ? <Check size={11} color="var(--green)" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>

                      {/* Column 3: Address & Area */}
                      <td>
                        <button
                          type="button"
                          className="admin-btn secondary"
                          style={{
                            padding: '5px 12px',
                            fontSize: '12.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid var(--rule)',
                            background: '#fff',
                            borderRadius: 'var(--radius-pill)',
                            fontWeight: 600
                          }}
                          onClick={() => setViewAddressModal(o)}
                        >
                          <MapPin size={14} />
                          <span>{o.delivery_area || 'ঠিকানা বিস্তারিত'}</span>
                        </button>
                      </td>

                      {/* Column 4: Ordered Items List */}
                      <td>
                        <button
                          type="button"
                          className="admin-btn secondary"
                          style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                          onClick={() => setViewItemsModal(o)}
                        >
                          <Package size={14} />
                          <span>{toBengaliNumber(itemsList.length)} টি পণ্য</span>
                        </button>
                      </td>

                      {/* Column 5: Bill & Payment */}
                      <td>
                        <button
                          type="button"
                          className="admin-btn secondary"
                          style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                          onClick={() => setViewBillModal(o)}
                        >
                          <CreditCard size={14} />
                          <span className="mono font-bold">৳{toBengaliNumber(o.total_amount)}</span>
                        </button>
                      </td>

                      {/* Column 6: Delivery Rider Assignment */}
                      <td>
                        {o.delivery_rider_name ? (
                          <button
                            type="button"
                            className="admin-btn secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              border: '1.5px solid #16a34a',
                              background: '#f0fdf4',
                              color: '#166534',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}
                            onClick={() => setRiderDetailsModal(o)}
                            title={normalizeStatus(o.status) === 'delivered' ? 'ডেলিভারিম্যান তথ্য (লকড - ডেলিভার্ড সম্পন্ন)' : 'ডেলিভারিম্যান বিস্তারিত ও পরিবর্তন'}
                          >
                            <Bike size={13} color="#15803d" />
                            <span>{o.delivery_rider_name}</span>
                            {normalizeStatus(o.status) === 'delivered' && (
                              <Lock size={11} color="#166534" style={{ marginLeft: '2px' }} />
                            )}
                          </button>
                        ) : normalizeStatus(o.status) === 'delivered' ? (
                          <span
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#64748b',
                              borderRadius: '4px',
                              fontWeight: 600,
                              cursor: 'not-allowed'
                            }}
                            title="প্যাকেজ অর্ডারটি ইতিমধ্যে ডেলিভার্ড হয়েছে, তাই রাইডার অ্যাসাইন করা যাবে না"
                          >
                            <Lock size={12} color="#94a3b8" />
                            <span>রাইডার ছাড়া ডেলিভার্ড</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px dashed var(--rule)',
                              background: 'var(--paper)',
                              color: 'var(--muted)',
                              borderRadius: '4px'
                            }}
                            onClick={() => {
                              setAssignRiderModalOrder(o);
                              setSelectedRiderId(o.delivery_rider_id || '');
                              setDeliveryNote(o.delivery_note || '');
                            }}
                          >
                            <Plus size={12} />
                            <span>রাইডার অ্যাসাইন</span>
                          </button>
                        )}
                      </td>

                      {/* Column 7: Status Update Dropdown */}
                      <td>
                        <button
                          type="button"
                          className={`status-badge status-${normStatus}`}
                          style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '4px' }}
                          onClick={() => {
                            setStatusModalOrder(o);
                            setPendingStatus(normStatus);
                          }}
                        >
                          <span style={{ flex: 1, textAlign: 'left' }}>
                            {getStatusLabel(o.status)}
                          </span>
                          <ChevronDown size={14} />
                        </button>
                      </td>

                      {/* Column 8: Print Receipt Button */}
                      <td style={{ textAlign: 'center' }}>
                        <motion.button
                          type="button"
                          className="admin-pos-print-btn"
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => onOpenReceipt(o)}
                          title="ক্যাশ মেমো / রসিদ প্রিন্ট করুন"
                        >
                          <Printer size={13} />
                          <span>রসিদ</span>
                        </motion.button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredOrders.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* 1. Status Update Modal */}
      <AnimatePresence>
        {statusModalOrder && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setStatusModalOrder(null);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '380px', width: '90%' }}
            >
              <div className="admin-modal-header">
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <Settings size={18} color="var(--ink)" />
                  <span>প্যাকেজ অর্ডার স্ট্যাটাস পরিবর্তন</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setStatusModalOrder(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body">
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--muted)' }}>
                  অর্ডার <strong>{statusModalOrder.order_code || `#PK-${statusModalOrder.id}`}</strong> এর বর্তমান স্ট্যাটাস নির্ধারণ করুন:
                </p>
                <div className="field">
                  <select
                    value={pendingStatus}
                    onChange={(e) => setPendingStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid var(--rule)' }}
                  >
                    <option value="pending">পেন্ডিং</option>
                    <option value="processing">প্রসেসিং</option>
                    <option value="shipped">পাঠানো হয়েছে (Shipped / অন-ডেলিভারি)</option>
                    <option value="delivered">ডেলিভার্ড</option>
                    <option value="cancelled">বাতিল</option>
                  </select>
                </div>
                {pendingStatus === 'shipped' && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#15803d', background: '#f0fdf4', padding: '8px', borderRadius: '4px', border: '1px solid #86efac' }}>
                    রাইডার অ্যাসাইন করে থাকলে রাইডারের কাছে এই প্যাকেজ ডেলিভারির জন্য চলে যাবে।
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => setStatusModalOrder(null)}
                >
                  বাতিল
                </button>
                <motion.button
                  type="button"
                  className="admin-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmStatusChange}
                >
                  পরিবর্তন করুন
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. Assign Rider Modal */}
        {assignRiderModalOrder && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAssignRiderModalOrder(null);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '440px', width: '92%' }}
            >
              <div className="admin-modal-header" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#166534' }}>
                  <Bike size={20} color="#15803d" />
                  <span>ডেলিভারিম্যান অ্যাসাইন করুন</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setAssignRiderModalOrder(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--paper)', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--rule)', fontSize: '13px' }}>
                  অর্ডার কোড: <strong className="mono">{assignRiderModalOrder.order_code || `#PK-${assignRiderModalOrder.id}`}</strong>
                  <br />
                  গ্রাহক: <strong>{assignRiderModalOrder.customer_name}</strong> ({assignRiderModalOrder.delivery_area})
                </div>

                <div className="field">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    ডেলিভারি রাইডার নির্বাচন করুন:
                  </label>
                  {deliveryRiders.length === 0 ? (
                    <div style={{ padding: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '12.5px', color: '#92400e' }}>
                      কোনো ডেলিভারিম্যান যুক্ত করা নেই। অ্যাডমিন প্যানেলের 'ডেলিভারিম্যান' ট্যাব থেকে রাইডার যোগ করুন।
                    </div>
                  ) : (
                    <select
                      value={selectedRiderId}
                      onChange={(e) => setSelectedRiderId(e.target.value)}
                      style={{ width: '100%', padding: '10px', fontSize: '13.5px', borderRadius: '4px', border: '1px solid var(--rule)', background: 'var(--paper)' }}
                    >
                      <option value="">— কোনো রাইডার নয় —</option>
                      {deliveryRiders.map((rider) => (
                        <option key={rider.id} value={rider.id}>
                          {rider.name} ({rider.phone}) - {rider.vehicle || 'বাইক'}{rider.area ? ` [এলাকা: ${rider.area}]` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="field">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    ডেলিভারি নোট / রাইডারের জন্য নির্দেশনা (ঐচ্ছিক):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="যেমন: দ্রুত ডেলিভারি দিন বা ক্যাশ টাকা বুঝে নিন"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--rule)' }}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => {
                    if (onUpdateStatus) {
                      onUpdateStatus(assignRiderModalOrder.id, 'shipped');
                    }
                    setAssignRiderModalOrder(null);
                  }}
                >
                  রাইডার ছাড়া Shipped
                </button>

                <motion.button
                  type="button"
                  className="admin-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const rider = deliveryRiders.find((r) => String(r.id) === String(selectedRiderId));
                    if (onAssignRider && rider) {
                      onAssignRider(assignRiderModalOrder.id, rider.id);
                    } else if (onUpdateStatus) {
                      const riderInfo = rider ? {
                        delivery_rider_id: rider.id,
                        delivery_rider_name: rider.name,
                        delivery_rider_phone: rider.phone,
                        delivery_rider_vehicle: rider.vehicle,
                        delivery_note: deliveryNote
                      } : {
                        delivery_rider_id: null,
                        delivery_rider_name: null,
                        delivery_rider_phone: null,
                        delivery_rider_vehicle: null,
                        delivery_note: deliveryNote
                      };
                      onUpdateStatus(assignRiderModalOrder.id, 'shipped', riderInfo);
                    }
                    setAssignRiderModalOrder(null);
                  }}
                >
                  সংরক্ষণ করুন
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 3. View Assigned Rider Details Modal */}
        {riderDetailsModal && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setRiderDetailsModal(null);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '420px', width: '90%' }}
            >
              <div className="admin-modal-header" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#166534' }}>
                  <Bike size={18} color="#15803d" />
                  <span>অ্যাসাইনকৃত ডেলিভারিম্যান তথ্য</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setRiderDetailsModal(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    {riderDetailsModal.delivery_rider_name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <Phone size={13} />
                    <span className="mono font-bold" style={{ color: 'var(--ink)' }}>{riderDetailsModal.delivery_rider_phone}</span>
                    {riderDetailsModal.delivery_rider_phone && (
                      <a href={`tel:${riderDetailsModal.delivery_rider_phone}`} className="quick-icon-btn call-action small" title="কল দিন">
                        <PhoneCall size={12} />
                      </a>
                    )}
                  </div>
                  {riderDetailsModal.delivery_rider_vehicle && (
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '6px' }}>
                      বাহন: <strong>{riderDetailsModal.delivery_rider_vehicle}</strong>
                    </div>
                  )}
                  {riderDetailsModal.delivery_note && (
                    <div style={{ marginTop: '10px', padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '12px', color: '#92400e' }}>
                      নোট: {riderDetailsModal.delivery_note}
                    </div>
                  )}

                  {normalizeStatus(riderDetailsModal.status) === 'delivered' && (
                    <div style={{ marginTop: '12px', padding: '8px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} color="#64748b" />
                      <span>প্যাকেজ অর্ডারটি ইতিমধ্যে <strong>ডেলিভার্ড</strong> সম্পন্ন হয়েছে। তাই রাইডার পরিবর্তন করা যাবে না।</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-modal-footer">
                {normalizeStatus(riderDetailsModal.status) !== 'delivered' && (
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => {
                      const ord = riderDetailsModal;
                      setRiderDetailsModal(null);
                      setAssignRiderModalOrder(ord);
                      setSelectedRiderId(ord.delivery_rider_id || '');
                      setDeliveryNote(ord.delivery_note || '');
                    }}
                  >
                    রাইডার পরিবর্তন
                  </button>
                )}
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setRiderDetailsModal(null)}
                >
                  ঠিক আছে
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. Address Modal */}
        {viewAddressModal && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewAddressModal(null);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '400px', width: '90%' }}
            >
              <div className="admin-modal-header">
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <MapPin size={18} color="var(--ink)" />
                  <span>ডেলিভারি ঠিকানা</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setViewAddressModal(null)}
                  aria-label="বন্ধ করুন"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>এলাকা</span>
                    <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>{viewAddressModal.delivery_area || 'উল্লেখ নেই'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>সম্পূর্ণ ঠিকানা</span>
                    <p style={{ fontSize: '14px', color: 'var(--ink)', margin: 0, lineHeight: 1.5 }}>
                      {viewAddressModal.delivery_address || 'উল্লেখ নেই'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setViewAddressModal(null)}
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 5. Full Order Info Modal */}
        {viewFullOrderModal && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewFullOrderModal(null);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '650px', width: '95%' }}
            >
              <div className="admin-modal-header">
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <Package size={18} color="var(--ink)" />
                  <span>প্যাকেজ অর্ডার বিস্তারিত</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setViewFullOrderModal(null)}
                  aria-label="বন্ধ করুন"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. Header Row (Order ID & Status) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px dashed var(--rule)', paddingBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Package Order Code</div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: '2px 0' }}>
                      {viewFullOrderModal.order_code || `#PK-${viewFullOrderModal.id}`}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13}/> {new Date(viewFullOrderModal.created_at || Date.now()).toLocaleDateString('bn-BD')}
                      <Clock size={13}/> {new Date(viewFullOrderModal.created_at || Date.now()).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>বর্তমান স্ট্যাটাস</div>
                    <span className={`status-badge status-${normalizeStatus(viewFullOrderModal.status)}`} style={{ fontSize: '13px', padding: '6px 12px' }}>
                      {getStatusLabel(viewFullOrderModal.status)}
                    </span>
                  </div>
                </div>

                {/* 2. Customer Info (Grid) */}
                <div>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14.5px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15}/> কাস্টমার তথ্য
                  </h5>
                  <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '6px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>নাম</div>
                      <div style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--ink)' }}>{viewFullOrderModal.customer_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>ফোন নম্বর</div>
                      <div className="mono" style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--ink)' }}>{viewFullOrderModal.customer_phone}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>ডেলিভারি ঠিকানা</div>
                      <div style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700 }}>{viewFullOrderModal.delivery_area}</span> — {viewFullOrderModal.delivery_address}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Items List */}
                <div>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14.5px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={15}/> প্যাকেজের পণ্যসমূহ ({toBengaliNumber((Array.isArray(viewFullOrderModal.items_json) ? viewFullOrderModal.items_json : JSON.parse(viewFullOrderModal.items_json || '[]')).length)} টি)
                  </h5>
                  <div style={{ border: '1px solid var(--rule)', borderRadius: '6px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '13.5px', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--paper)' }}>
                        <tr style={{ color: 'var(--muted)', fontSize: '12.5px' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--rule)' }}>পণ্য ও পরিমাণ</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid var(--rule)' }}>মোট দাম</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(viewFullOrderModal.items_json) ? viewFullOrderModal.items_json : JSON.parse(viewFullOrderModal.items_json || '[]')).map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--rule)' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                {it.brand || it.product_name || it.name}{' '}
                                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '12px' }}>
                                  ({it.catBn || it.category_name || it.unit})
                                </span>
                              </div>
                              <div className="mono" style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px' }}>
                                {formatStockDisplay(it.qty, it.unit)} × ৳{toBengaliNumber(it.price)}
                              </div>
                            </td>
                            <td className="mono" style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--ink)' }}>
                              ৳{toBengaliNumber(it.price * it.qty)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Payment & Summary */}
                <div>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14.5px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={15}/> পেমেন্ট ও বিলিং
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {/* Payment Details */}
                    <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>পেমেন্ট মাধ্যম</div>
                      <div className="payment-type-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px' }}>
                        {viewFullOrderModal.payment_method === 'cod' || !viewFullOrderModal.payment_method || viewFullOrderModal.payment_method.includes('ক্যাশ') ? (
                          <><Banknote size={14}/> ক্যাশ অন ডেলিভারি</>
                        ) : (
                          <><CreditCard size={14}/> {viewFullOrderModal.payment_method}</>
                        )}
                      </div>
                      
                      {viewFullOrderModal.payment_method !== 'cod' && (
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {viewFullOrderModal.trx_id && (
                            <div>
                              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>TrxID</div>
                              <div className="mono trx-code-tag" style={{ fontSize: '13px', display: 'inline-block' }}>{viewFullOrderModal.trx_id}</div>
                            </div>
                          )}
                          {viewFullOrderModal.sender_number && (
                            <div>
                              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>প্রেরক নম্বর</div>
                              <div className="mono" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>{viewFullOrderModal.sender_number}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bill Summary */}
                    <div style={{ background: '#F8FAF9', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                        <span style={{ color: 'var(--muted)' }}>পণ্যের মূল্য:</span>
                        <span className="mono font-bold">৳{toBengaliNumber(viewFullOrderModal.subtotal || (viewFullOrderModal.total_amount - (viewFullOrderModal.delivery_fee || 0)))}</span>
                      </div>
                      {viewFullOrderModal.discount_total > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#16a34a' }}>
                          <span>প্যাকেজ ছাড়:</span>
                          <span className="mono font-bold">-৳{toBengaliNumber(viewFullOrderModal.discount_total)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                        <span style={{ color: 'var(--muted)' }}>ডেলিভারি ফি:</span>
                        <span className="mono font-bold">৳{toBengaliNumber(viewFullOrderModal.delivery_fee || 0)}</span>
                      </div>
                      <div style={{ borderTop: '1px dashed var(--rule)', margin: '4px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, alignItems: 'center' }}>
                        <span>মোট বিল:</span>
                        <span className="mono" style={{ fontSize: '20px', color: 'var(--chili)' }}>৳{toBengaliNumber(viewFullOrderModal.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="admin-modal-footer" style={{ position: 'sticky', bottom: 0, background: 'var(--cream-card)', borderTop: '1px solid var(--rule)', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => {
                    onOpenReceipt(viewFullOrderModal);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={14} />
                  <span>রসিদ প্রিন্ট</span>
                </button>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setViewFullOrderModal(null)}
                  style={{ flex: 1 }}
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 6. View Bill Modal */}
        {viewBillModal && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewBillModal(null);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '400px', width: '90%' }}
            >
              <div className="admin-modal-header">
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <CreditCard size={18} color="var(--ink)" />
                  <span>বিল ও পেমেন্ট বিস্তারিত</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setViewBillModal(null)}
                  aria-label="বন্ধ করুন"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--muted)' }}>পণ্যের মূল্য:</span>
                    <span className="mono font-bold" style={{ color: 'var(--ink)' }}>
                      ৳{toBengaliNumber(viewBillModal.subtotal || (viewBillModal.total_amount - (viewBillModal.delivery_fee || 0)))}
                    </span>
                  </div>
                  {viewBillModal.discount_total > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#16a34a' }}>
                      <span>প্যাকেজ ছাড়:</span>
                      <span className="mono font-bold">-৳{toBengaliNumber(viewBillModal.discount_total)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--muted)' }}>ডেলিভারি ফি:</span>
                    <span className="mono font-bold" style={{ color: 'var(--ink)' }}>৳{toBengaliNumber(viewBillModal.delivery_fee || 0)}</span>
                  </div>
                  <div style={{ borderTop: '1px dashed var(--rule)', margin: '8px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>মোট বিল:</span>
                    <span className="mono font-bold total-amount-highlight">৳{toBengaliNumber(viewBillModal.total_amount)}</span>
                  </div>
                </div>

                <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>পেমেন্ট মাধ্যম</div>
                  <div>
                    <span className="payment-type-pill" style={{ display: 'inline-flex', fontSize: '13px', padding: '6px 12px' }}>
                      {viewBillModal.payment_method === 'cod' || !viewBillModal.payment_method || viewBillModal.payment_method.includes('ক্যাশ') ? (
                        <>
                          <Banknote size={14} style={{ marginRight: '6px' }} /> ক্যাশ অন ডেলিভারি
                        </>
                      ) : (
                        <>
                          <CreditCard size={14} style={{ marginRight: '6px' }} /> {viewBillModal.payment_method}
                        </>
                      )}
                    </span>
                  </div>

                  {viewBillModal.payment_method !== 'cod' && viewBillModal.trx_id && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>TrxID (ট্রানজ্যাকশন আইডি)</div>
                      <div className="mono trx-code-tag" style={{ display: 'inline-block', fontSize: '13px', padding: '6px 12px' }}>
                        {viewBillModal.trx_id}
                      </div>
                    </div>
                  )}
                  {viewBillModal.payment_method !== 'cod' && viewBillModal.sender_number && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>প্রেরক (Sender Number)</div>
                      <div className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        {viewBillModal.sender_number}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setViewBillModal(null)}
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 7. View Items Modal */}
        {viewItemsModal && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewItemsModal(null);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '450px', width: '90%' }}
            >
              <div className="admin-modal-header">
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <Package size={18} color="var(--ink)" />
                  <span>প্যাকেজ পণ্য তালিকা</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setViewItemsModal(null)}
                  aria-label="বন্ধ করুন"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body">
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--muted)' }}>
                  অর্ডার কোড: <strong>{viewItemsModal.order_code || `#PK-${viewItemsModal.id}`}</strong>
                </p>
                <div style={{ background: 'var(--paper)', borderRadius: '6px', border: '1px solid var(--rule)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                    <tbody>
                      {(Array.isArray(viewItemsModal.items_json) ? viewItemsModal.items_json : JSON.parse(viewItemsModal.items_json || '[]')).map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--rule)' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                              {it.brand || it.product_name || it.name}
                            </div>
                            <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>
                              ({it.catBn || it.category_name || it.unit})
                            </div>
                          </td>
                          <td className="mono" style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--muted)' }}>{formatStockDisplay(it.qty, it.unit)} × ৳{toBengaliNumber(it.price)}</span>
                          </td>
                          <td className="mono" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--ink)' }}>
                            ৳{toBengaliNumber(it.price * it.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <div style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
                  মোট বিল: <span className="mono">৳{toBengaliNumber(viewItemsModal.total_amount)}</span>
                </div>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setViewItemsModal(null)}
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
