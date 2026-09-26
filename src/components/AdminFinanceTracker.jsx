"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Receipt,
  Plus,
  Calendar,
  Filter,
  Trash2,
  Edit2,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Activity,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  X,
  RefreshCw,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';
import { printElement } from '../utils/printHelper.js';
import { useStoreData } from '../context/StoreDataContext';

export default function AdminFinanceTracker({
  adminToken,
  orders = [],
  packageOrders = [],
  categories = [],
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('expenses'); // 'overview' | 'expenses' | 'analytics'
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('all'); // today, yesterday, week, month, all, custom
  const [orderSourceFilter, setOrderSourceFilter] = useState('all'); // 'all' | 'regular' | 'package'
  const [filterCategory, setFilterCategory] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Combined orders list with source flag
  const combinedOrdersList = useMemo(() => {
    const list = [];
    (orders || []).forEach((o) => {
      list.push({ ...o, is_package_order: false });
    });
    (packageOrders || []).forEach((po) => {
      list.push({ ...po, is_package_order: true });
    });
    return list;
  }, [orders, packageOrders]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteTargetExpense, setDeleteTargetExpense] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'দোকান ভাড়া',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const categoriesList = [
    'দোকান ভাড়া',
    'বিদ্যুৎ ও ইউটিলিটি বিল',
    'কর্মচারী বেতন',
    'প্যাকেজিং সামগ্রী',
    'ডেলিভারি খরচ',
    'রাইডার জ্বালানি বিল',
    'মেরামত ও রক্ষণাবেক্ষণ',
    'চা-নাস্তা ও আপ্যায়ন',
    'মার্কেটিং ও বিজ্ঞাপন',
    'বিবিধ খরচ'
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      if (showToast) showToast('খরচের তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [adminToken]);

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      category: 'দোকান ভাড়া',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp) => {
    setEditingExpense(exp);
    setFormData({
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      expense_date: exp.expense_date ? exp.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: exp.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category || !formData.amount) {
      if (showToast) showToast('সকল প্রয়োজনীয় তথ্য দিন');
      return;
    }

    setSubmitting(true);
    try {
      if (editingExpense) {
        const res = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const updated = await res.json();
          setExpenses(expenses.map((e) => (e.id === updated.id ? updated : e)));
          if (showToast) showToast('খরচের তথ্য আপডেট হয়েছে');
          setIsModalOpen(false);
        } else {
          if (showToast) showToast('আপডেট ব্যর্থ হয়েছে');
        }
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const created = await res.json();
          setExpenses([created, ...expenses]);
          if (showToast) showToast('নতুন খরচ সফলভাবে যোগ হয়েছে');
          setIsModalOpen(false);
        } else {
          if (showToast) showToast('খরচ যোগ করতে ব্যর্থ');
        }
      }
    } catch (err) {
      if (showToast) showToast('সার্ভারে ত্রুটি হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (exp) => {
    setDeleteTargetExpense(exp);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetExpense) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteTargetExpense.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => String(e.id) !== String(deleteTargetExpense.id)));
        if (showToast) showToast(`'${deleteTargetExpense.title}' খরচ সফলভাবে মুছে ফেলা হয়েছে`);
        setDeleteTargetExpense(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (showToast) showToast(errData.error || 'খরচ মুছতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
      if (showToast) showToast('সার্ভারে ত্রুটি হয়েছে');
    } finally {
      setIsDeleting(false);
    }
  };

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const expDate = exp.expense_date ? exp.expense_date.split('T')[0] : '';
      
      // Category match
      if (filterCategory !== 'all' && exp.category !== filterCategory) {
        return false;
      }

      // Period match
      if (filterPeriod === 'today') return expDate === todayStr;
      if (filterPeriod === 'yesterday') return expDate === yesterdayStr;
      if (filterPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(expDate) >= weekAgo;
      }
      if (filterPeriod === 'month') {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const d = new Date(expDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }
      if (filterPeriod === 'custom' && customStartDate && customEndDate) {
        return expDate >= customStartDate && expDate <= customEndDate;
      }
      return true;
    });
  }, [expenses, filterCategory, filterPeriod, customStartDate, customEndDate, todayStr, yesterdayStr]);

  const totalFilteredExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Filtered Orders (Delivered only for accurate P&L)
  const deliveredOrders = useMemo(() => {
    return combinedOrdersList.filter((o) => {
      const isDelivered = o.status === 'delivered' || o.status === 'ডেলিভার্ড' || o.status === 'সম্পন্ন';
      if (!isDelivered) return false;

      // Source filter
      if (orderSourceFilter === 'regular' && o.is_package_order) return false;
      if (orderSourceFilter === 'package' && !o.is_package_order) return false;

      const ordDate = o.created_at ? o.created_at.split('T')[0] : '';
      if (filterPeriod === 'today') return ordDate === todayStr;
      if (filterPeriod === 'yesterday') return ordDate === yesterdayStr;
      if (filterPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(ordDate) >= weekAgo;
      }
      if (filterPeriod === 'month') {
        const d = new Date(ordDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (filterPeriod === 'custom' && customStartDate && customEndDate) {
        return ordDate >= customStartDate && ordDate <= customEndDate;
      }
      return true;
    });
  }, [combinedOrdersList, orderSourceFilter, filterPeriod, customStartDate, customEndDate, todayStr, yesterdayStr]);

  let totalSales = 0;
  let regularSales = 0;
  let packageSales = 0;
  let totalCOGS = 0;
  let regularOrderCount = 0;
  let packageOrderCount = 0;

  deliveredOrders.forEach((o) => {
    const amt = Number(o.total_amount) || 0;
    totalSales += amt;
    if (o.is_package_order) {
      packageSales += amt;
      packageOrderCount++;
    } else {
      regularSales += amt;
      regularOrderCount++;
    }

    const items = Array.isArray(o.items_json) ? o.items_json : (typeof o.items_json === 'string' ? JSON.parse(o.items_json) : []);
    items.forEach((it) => {
      const cost = Number(it.cost_price) > 0 ? Number(it.cost_price) : Math.round((Number(it.price) || 0) * 0.85);
      totalCOGS += cost * (Number(it.qty) || 1);
    });
  });

  const grossProfit = Number((totalSales - totalCOGS).toFixed(2));
  const netProfit = Number((grossProfit - totalFilteredExpenses).toFixed(2));

  // Process Daily Aggregates for Charting
  const chartData = useMemo(() => {
    const dayMap = {};

    // 1. Accumulate Sales and COGS per day
    deliveredOrders.forEach((order) => {
      if (!order.created_at) return;
      const date = order.created_at.split('T')[0];
      if (!dayMap[date]) {
        dayMap[date] = { date, revenue: 0, cogs: 0, expense: 0, ordersCount: 0 };
      }
      let orderCost = 0;
      const items = Array.isArray(order.items_json) ? order.items_json : (typeof order.items_json === 'string' ? JSON.parse(order.items_json) : []);
      items.forEach((it) => {
        const cost = Number(it.cost_price) > 0 ? Number(it.cost_price) : Math.round((Number(it.price) || 0) * 0.85);
        orderCost += cost * (Number(it.qty) || 1);
      });

      dayMap[date].revenue += Number(order.total_amount) || 0;
      dayMap[date].cogs += orderCost;
      dayMap[date].ordersCount += 1;
    });

    // 2. Accumulate Expenses per day
    filteredExpenses.forEach((exp) => {
      if (!exp.expense_date) return;
      const date = exp.expense_date.split('T')[0];
      if (!dayMap[date]) {
        dayMap[date] = { date, revenue: 0, cogs: 0, expense: 0, ordersCount: 0 };
      }
      dayMap[date].expense += Number(exp.amount) || 0;
    });

    const list = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    return list.map((d) => {
      const gross = d.revenue - d.cogs;
      const net = gross - d.expense;
      const parts = d.date.split('-');
      return {
        ...d,
        grossProfit: Number(gross.toFixed(2)),
        netProfit: Number(net.toFixed(2)),
        displayDate: parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date
      };
    });
  }, [deliveredOrders, filteredExpenses]);

  // Expense Category Breakdown for Pie Chart
  const expenseCategoryBreakdown = useMemo(() => {
    const catMap = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'বিবিধ খরচ';
      catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num < 0) {
      return `- ৳ ${toBengaliNumber(Math.abs(num))}`;
    }
    return `৳ ${toBengaliNumber(num)}`;
  };

  const storeData = useStoreData() || {};
  const settings = storeData.settings || {};
  const logoImageUrl = settings.logo_image_url || '';
  const siteName = settings.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteTagline = settings.site_tagline || 'Arot Express — তাজা পাইকারি ও খুচরা মুদি বাজার';

  const handlePrint = () => {
    printElement('printable-finance-tracker', {
      type: 'a4',
      title: `Finance-Report-${new Date().toISOString().slice(0, 10)}`
    });
  };

  return (
    <div className="admin-section">
      {/* Header Bar */}
      <div
        className="admin-header-actions no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BarChart3 size={22} color="var(--green-dim)" />
            <span>আয়-ব্যয় ও লাভ-ক্ষতি হিসাব (Finance & P&L)</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
            বিক্রি, ক্রয়মূল্য, দোকানের দৈনন্দিন খরচ ও প্রকৃত নিট মুনাফার সমন্বিত হিসাব
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            type="button"
            className="admin-btn"
            onClick={handleOpenAddModal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
          >
            <Plus size={16} />
            <span>নতুন খরচ ভাউচার</span>
          </motion.button>

          <motion.button
            type="button"
            className="admin-btn secondary"
            onClick={handlePrint}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
          >
            <Printer size={15} />
            <span>রিপোর্ট প্রিন্ট</span>
          </motion.button>
        </div>
      </div>

      <div id="printable-finance-tracker">
        {/* Printable Letterhead */}
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              {logoImageUrl ? (
                <div style={{ marginBottom: '4px' }}>
                  <img
                    src={logoImageUrl}
                    alt={siteName}
                    style={{
                      maxHeight: '44px',
                      maxWidth: '200px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{siteTagline}</div>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 2px' }}>{siteName}</h2>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '2px' }}>{siteTagline}</div>
                </>
              )}
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginTop: '2px' }}>
                আর্থিক লাভ-ক্ষতি ও ব্যয় বিবরণী রিপোর্ট
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>
                প্রিন্ট তারিখ: <span className="mono">{new Date().toLocaleString('bn-BD')}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Top 5 Financial Metric Cards */}
      <div className="admin-expense-metrics-grid" style={{ marginBottom: '22px' }}>
        {/* 1. Total Revenue */}
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#166534', fontSize: '12px', fontWeight: 700 }}>
            <span>মোট বিক্রি আয় (Revenue)</span>
            <ShoppingBag size={16} />
          </div>
          <div className="mono font-bold" style={{ fontSize: '22px', color: '#15803d', marginTop: '6px' }}>
            ৳{toBengaliNumber(totalSales)}
          </div>
          <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontWeight: 600 }}>
              {toBengaliNumber(deliveredOrders.length)} টি ডেলিভার্ড অর্ডার
            </div>
            {(regularSales > 0 || packageSales > 0) && (
              <div style={{ fontSize: '10.5px', opacity: 0.9, marginTop: '2px' }}>
                সাধারণ: ৳{toBengaliNumber(regularSales)} ({toBengaliNumber(regularOrderCount)}) · প্যাকেজ: ৳{toBengaliNumber(packageSales)} ({toBengaliNumber(packageOrderCount)})
              </div>
            )}
          </div>
        </div>

        {/* 2. Total COGS */}
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#991b1b', fontSize: '12px', fontWeight: 700 }}>
            <span>পণ্যের ক্রয়মূল্য (COGS)</span>
            <Activity size={16} />
          </div>
          <div className="mono font-bold" style={{ fontSize: '22px', color: '#dc2626', marginTop: '6px' }}>
            ৳{toBengaliNumber(totalCOGS)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#7f1d1d', marginTop: '4px' }}>
            বিক্রিকৃত পণ্যের কেনা দাম
          </div>
        </div>

        {/* 3. Gross Profit */}
        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e40af', fontSize: '12px', fontWeight: 700 }}>
            <span>গ্রস প্রফিট (Gross Profit)</span>
            <DollarSign size={16} />
          </div>
          <div className="mono font-bold" style={{ fontSize: '22px', color: '#2563eb', marginTop: '6px' }}>
            ৳{toBengaliNumber(grossProfit)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#1e3a8a', marginTop: '4px' }}>
            মোট বিক্রি − পণ্যের ক্রয়মূল্য
          </div>
        </div>

        {/* 4. Operating Expenses */}
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#92400e', fontSize: '12px', fontWeight: 700 }}>
            <span>দোকান খরচ (Expenses)</span>
            <Wallet size={16} />
          </div>
          <div className="mono font-bold" style={{ fontSize: '22px', color: '#d97706', marginTop: '6px' }}>
            ৳{toBengaliNumber(totalFilteredExpenses)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#78350f', marginTop: '4px' }}>
            {toBengaliNumber(filteredExpenses.length)} টি ভাউচার এন্ট্রি
          </div>
        </div>

        {/* 5. Final Net Profit */}
        <div
          style={{
            background: netProfit >= 0 ? '#ecfdf5' : '#fff1f2',
            border: `2px solid ${netProfit >= 0 ? '#059669' : '#e11d48'}`,
            padding: '16px',
            borderRadius: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ink)', fontSize: '12px', fontWeight: 800 }}>
            <span>💎 চূড়ান্ত নিট লাভ (Net Profit)</span>
            {netProfit >= 0 ? <TrendingUp size={16} color="#059669" /> : <TrendingDown size={16} color="#e11d48" />}
          </div>
          <div
            className="mono font-bold"
            style={{
              fontSize: '24px',
              color: netProfit >= 0 ? '#059669' : '#e11d48',
              marginTop: '6px'
            }}
          >
            ৳{toBengaliNumber(netProfit)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
            গ্রস লাভ − যাবতীয় দোকান খরচ
          </div>
        </div>
      </div>

      {/* Filter & View Mode Sub-tabs (No Print) */}
      <div
        className="no-print"
        style={{
          background: 'var(--paper)',
          padding: '12px 14px',
          borderRadius: '6px',
          border: '1px solid var(--rule)',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Navigation Sub-Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`admin-btn ${activeSubTab === 'overview' ? 'primary' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart3 size={15} />
            <span>সমন্বিত গ্রাফ ও চিত্র</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`admin-btn ${activeSubTab === 'expenses' ? 'primary' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Receipt size={15} />
            <span>দৈনিক খরচ তালিকা ({toBengaliNumber(filteredExpenses.length)})</span>
          </button>
        </div>

        {/* Date & Source Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* Order Source Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>উৎস:</span>
            <select
              value={orderSourceFilter}
              onChange={(e) => setOrderSourceFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12.5px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--rule)',
                background: '#ffffff',
                outline: 'none',
                fontWeight: 600
              }}
            >
              <option value="all">সব বিক্রয় (সাধারণ + প্যাকেজ)</option>
              <option value="regular">শুধুমাত্র সাধারণ অর্ডার</option>
              <option value="package">শুধুমাত্র প্যাকেজ অর্ডার</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <Calendar size={15} color="var(--muted)" />
            <span>সময়:</span>
          </div>

          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            style={{
              padding: '7px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--rule)',
              background: '#F8FAF9',
              fontWeight: 600,
              color: 'var(--ink)'
            }}
          >
            <option value="today">আজকে</option>
            <option value="yesterday">গতকাল</option>
            <option value="week">চলতি সপ্তাহ (৭ দিন)</option>
            <option value="month">চলতি মাস</option>
            <option value="all">সব রেকর্ড</option>
            <option value="custom">নির্দিষ্ট তারিখ</option>
          </select>

          {filterPeriod === 'custom' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--rule)', background: '#F8FAF9' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>হতে</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--rule)', background: '#F8FAF9' }}
              />
            </div>
          )}

          {activeSubTab === 'expenses' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginLeft: '6px' }}>
                <Filter size={15} color="var(--muted)" />
                <span>ক্যাটাগরি:</span>
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '7px 12px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--rule)',
                  background: '#F8FAF9',
                  fontWeight: 600,
                  color: 'var(--ink)'
                }}
              >
                <option value="all">সকল ক্যাটাগরি</option>
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: OVERVIEW CHARTS */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Main Integrated P&L Trend Chart */}
          <div
            style={{
              background: '#FFFFFF',
              padding: '22px',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--rule)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: 'var(--ink)' }}>
                দৈনিক আয়, বিক্রয় খরচ, পরিচালন ব্যয় ও নিট লাভ ট্রেন্ড
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                (সব মান টাকায় প্রদর্শিত)
              </span>
            </div>

            {chartData.length > 0 ? (
              <div style={{ height: '340px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--rule)" />
                    <XAxis dataKey="displayDate" tick={{ fill: 'var(--muted)', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
                    <Tooltip
                      formatter={(val, name) => [`৳${toBengaliNumber(Number(val) || 0)}`, name]}
                      labelFormatter={(label) => `তারিখ: ${label}`}
                      contentStyle={{ background: '#fff', border: '1px solid var(--rule)', borderRadius: 'var(--radius-md)', fontSize: '13px', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px' }} />
                    <Area type="monotone" dataKey="revenue" name="বিক্রি আয়" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                    <Area type="monotone" dataKey="cogs" name="পণ্যের ক্রয়মূল্য" stroke="#EF4444" strokeWidth={2} fillOpacity={0.05} fill="transparent" />
                    <Area type="monotone" dataKey="expense" name="দোকানের পরিচালন খরচ" stroke="#F59E0B" strokeWidth={2} fillOpacity={0.05} fill="transparent" />
                    <Area type="monotone" dataKey="netProfit" name="চূড়ান্ত নিট লাভ" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                নির্বাচিত সময়সীমায় কোনো আয় বা ব্যয়ের তথ্য পাওয়া যায়নি।
              </div>
            )}
          </div>

          {/* Bottom Two Analytical Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {/* Expense Breakdown Pie */}
            <div style={{ background: 'var(--paper)', padding: '18px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PieIcon size={16} color="var(--green-dim)" />
                <span>খরচের খাতভিত্তিক বণ্টন (Expense Breakdown)</span>
              </h4>

              {expenseCategoryBreakdown.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ height: '200px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseCategoryBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {expenseCategoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => `৳${toBengaliNumber(Number(val) || 0)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', marginTop: '6px' }}>
                    {expenseCategoryBreakdown.map((cat, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dotted var(--rule)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }}></span>
                          {cat.name}
                        </span>
                        <strong className="mono">৳{toBengaliNumber(cat.value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  কোনো খরচের ভাউচার নেই।
                </div>
              )}
            </div>

            {/* Quick Financial Summary Table */}
            <div style={{ background: 'var(--paper)', padding: '18px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={16} color="var(--green-dim)" />
                <span>আয় ও ব্যয়ের বিবরণী সারসংক্ষেপ (P&L Summary)</span>
              </h4>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={{ padding: '8px 4px', color: 'var(--ink)' }}>মোট বিক্রয় আয় (+)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }} className="mono">
                      ৳{toBengaliNumber(totalSales)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={{ padding: '8px 4px', color: 'var(--muted)' }}>পণ্য ক্রয় খরচ (COGS) (−)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }} className="mono">
                      ৳{toBengaliNumber(totalCOGS)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1.5px solid var(--rule)', background: '#f8fafc' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 700 }}>গ্রস লাভ (Gross Profit)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 800, color: '#2563eb' }} className="mono">
                      ৳{toBengaliNumber(grossProfit)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--rule)' }}>
                    <td style={{ padding: '8px 4px', color: 'var(--muted)' }}>দোকানের সকল পরিচালন ব্যয় (−)</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#d97706' }} className="mono">
                      ৳{toBengaliNumber(totalFilteredExpenses)}
                    </td>
                  </tr>
                  <tr style={{ background: netProfit >= 0 ? '#f0fdf4' : '#fef2f2', fontWeight: 800 }}>
                    <td style={{ padding: '10px 4px', fontSize: '14.5px', color: netProfit >= 0 ? '#166534' : '#991b1b' }}>
                      {netProfit >= 0 ? '💎 প্রকৃত নিট মুনাফা (Net Profit)' : '⚠️ প্রকৃত নিট ক্ষতি (Net Loss)'}
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'right', fontSize: '17px', color: netProfit >= 0 ? '#15803d' : '#dc2626' }} className="mono">
                      ৳{toBengaliNumber(netProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '14px', textAlign: 'right' }}>
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => setActiveSubTab('expenses')}
                  style={{ fontSize: '12.5px', padding: '6px 12px' }}
                >
                  খরচের তালিকা দেখুন →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES LIST & MANAGEMENT */}
      {activeSubTab === 'expenses' && (
        <div>
          <div style={{ background: 'var(--paper)', borderRadius: '6px', border: '1px solid var(--rule)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: 'var(--cream-card)', borderBottom: '1.5px solid var(--rule)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', width: '14%' }}>তারিখ</th>
                  <th style={{ padding: '10px 12px', width: '30%' }}>খরচের বিবরণ (Title)</th>
                  <th style={{ padding: '10px 12px', width: '20%' }}>ক্যাটাগরি</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', width: '16%' }}>পরিমাণ (টাকা)</th>
                  <th className="no-print" style={{ padding: '10px 12px', textAlign: 'center', width: '20%' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                      এই সময়সীমায় কোনো খরচের রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td className="mono" style={{ padding: '10px 12px', color: 'var(--muted)' }}>
                        {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('bn-BD') : '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{exp.title}</div>
                        {exp.notes && (
                          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                            নোট: {exp.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-block', background: '#F8FAF9', padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', border: '1px solid var(--rule)', fontWeight: 600 }}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="mono font-bold" style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--danger)', fontSize: '15px' }}>
                        ৳{toBengaliNumber(exp.amount)}
                      </td>
                      <td className="no-print" style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <motion.button
                            type="button"
                            className="admin-btn secondary"
                            onClick={() => handleOpenEditModal(exp)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ padding: '5px 10px', fontSize: '12px', borderRadius: 'var(--radius-pill)' }}
                            title="এডিট করুন"
                          >
                            <Edit2 size={12} />
                          </motion.button>
                          <motion.button
                            type="button"
                            className="admin-btn secondary"
                            onClick={() => handleOpenDeleteModal(exp)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ padding: '5px 10px', fontSize: '12px', color: 'var(--danger)', borderRadius: 'var(--radius-pill)' }}
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={12} />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#F8FAF9', borderTop: '1px solid var(--rule)', fontWeight: 800 }}>
                    <td colSpan="3" style={{ padding: '12px', textAlign: 'right' }}>
                      সর্বমোট খরচ:
                    </td>
                    <td className="mono" style={{ padding: '12px', textAlign: 'right', color: 'var(--danger)', fontSize: '16px' }}>
                      ৳{toBengaliNumber(totalFilteredExpenses)}
                    </td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Add / Edit Expense Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '480px', width: '95%' }}
            >
              <div className="admin-modal-header">
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="var(--green-dim)" />
                  <span>{editingExpense ? 'খরচ ভাউচার সম্পাদনা' : 'নতুন খরচ এন্ট্রি'}</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="admin-modal-form">
                <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="field">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      খরচের শিরোনাম / বিবরণ *
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: দোকান ভাড়া বা প্যাকেজিং কার্টন ক্রয়"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--rule)', background: '#F8FAF9' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="field">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        ক্যাটাগরি *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--rule)', background: '#F8FAF9' }}
                      >
                        {categoriesList.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        টাকার পরিমাণ (৳) *
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        min="0"
                        step="any"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--rule)', background: '#F8FAF9' }}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      খরচের তারিখ *
                    </label>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--rule)', background: '#F8FAF9' }}
                    />
                  </div>

                  <div className="field">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      অতিরিক্ত নোট / বিবরণ (ঐচ্ছিক)
                    </label>
                    <textarea
                      placeholder="রসিদ নম্বর বা অন্যান্য তথ্য..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--rule)', background: '#F8FAF9' }}
                    />
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    বাতিল
                  </button>
                  <motion.button
                    type="submit"
                    className="admin-btn"
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : (editingExpense ? 'আপডেট করুন' : 'খরচ যুক্ত করুন')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Delete Expense Confirmation Modal */}
        {deleteTargetExpense && (
          <div
            className="admin-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setDeleteTargetExpense(null);
            }}
          >
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '420px', width: '92%', borderTop: '4px solid var(--danger)' }}
            >
              <div className="admin-modal-header">
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                  <AlertTriangle size={19} />
                  <span>খরচ মুছে ফেলা নিশ্চিত করুন</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => !isDeleting && setDeleteTargetExpense(null)}
                  disabled={isDeleting}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ padding: '16px 20px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: 'var(--ink)', lineHeight: 1.5 }}>
                  আপনি কি সত্যিই নিচের খরচের রেকর্ডটি মুছে ফেলতে চান? এটি মুছে ফেললে সার্বিক লাভ-ক্ষতি ও খরচের হিসাব থেকে স্বয়ংক্রিয়ভাবে বাদ হয়ে যাবে।
                </p>

                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#7F1D1D' }}>খরচের বিবরণ:</span>
                    <strong style={{ fontSize: '13.5px', color: '#991B1B' }}>{deleteTargetExpense.title}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#7F1D1D' }}>ক্যাটাগরি:</span>
                    <span style={{ fontSize: '12px', background: '#FFFFFF', padding: '2px 8px', borderRadius: '12px', border: '1px solid #FECACA', fontWeight: 600 }}>
                      {deleteTargetExpense.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#7F1D1D' }}>টাকার পরিমাণ:</span>
                    <strong className="mono" style={{ fontSize: '15px', color: 'var(--danger)' }}>
                      ৳{toBengaliNumber(deleteTargetExpense.amount)}
                    </strong>
                  </div>
                  {deleteTargetExpense.expense_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#7F1D1D' }}>তারিখ:</span>
                      <span className="mono" style={{ fontSize: '12px', color: '#4B5563' }}>
                        {new Date(deleteTargetExpense.expense_date).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => setDeleteTargetExpense(null)}
                  disabled={isDeleting}
                >
                  বাতিল
                </button>
                <motion.button
                  type="button"
                  className="admin-btn"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} />
                  <span>{isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
