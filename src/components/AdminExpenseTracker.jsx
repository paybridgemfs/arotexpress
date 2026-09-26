"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, Plus, Search, Calendar, Filter, Trash2, Edit2, Download, Printer, TrendingUp, TrendingDown, DollarSign, Wallet, FileText, Check, X, RefreshCw, Layers, AlertTriangle } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';
import { printElement } from '../utils/printHelper.js';
import { useStoreData } from '../context/StoreDataContext';

export default function AdminExpenseTracker({ adminToken, orders = [], categories = [], showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('month'); // today, yesterday, week, month, all, custom
  const [filterCategory, setFilterCategory] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
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
      showToast('খরচের তালিকা লোড করতে সমস্যা হয়েছে');
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
      showToast('সকল প্রয়োজনীয় তথ্য দিন');
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
          showToast('খরচের তথ্য আপডেট হয়েছে');
          setIsModalOpen(false);
        } else {
          showToast('আপডেট ব্যর্থ হয়েছে');
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
          showToast('নতুন খরচ সফলভাবে যোগ হয়েছে');
          setIsModalOpen(false);
        } else {
          showToast('খরচ যোগ করতে ব্যর্থ');
        }
      }
    } catch (err) {
      showToast('সার্ভারে ত্রুটি হয়েছে');
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
        showToast(`'${deleteTargetExpense.title}' খরচ মুছে ফেলা হয়েছে`);
        setDeleteTargetExpense(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'খরচ মুছতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showToast('সার্ভারে ত্রুটি হয়েছে');
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

  const filteredExpenses = expenses.filter((exp) => {
    const expDate = exp.expense_date ? exp.expense_date.split('T')[0] : '';
    
    // Category match
    if (filterCategory !== 'all' && exp.category !== filterCategory) {
      return false;
    }

    // Period match
    if (filterPeriod === 'today') {
      return expDate === todayStr;
    }
    if (filterPeriod === 'yesterday') {
      return expDate === yesterdayStr;
    }
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

  // Calculate Financial Analytics
  const totalFilteredExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Delivered Orders Sales & COGS in the same period
  const deliveredOrders = orders.filter((o) => {
    const isDelivered = o.status === 'delivered' || o.status === 'ডেলিভার্ড' || o.status === 'সম্পন্ন';
    if (!isDelivered) return false;

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

  let totalSales = 0;
  let totalCOGS = 0;

  deliveredOrders.forEach((o) => {
    totalSales += (Number(o.total_amount) || 0);
    const items = Array.isArray(o.items_json) ? o.items_json : (typeof o.items_json === 'string' ? JSON.parse(o.items_json) : []);
    items.forEach((it) => {
      const cost = Number(it.cost_price) > 0 ? Number(it.cost_price) : Math.round((Number(it.price) || 0) * 0.85); // fallback integer estimate if not set
      totalCOGS += cost * (Number(it.qty) || 1);
    });
  });

  const grossProfit = Number((totalSales - totalCOGS).toFixed(2));
  const netProfit = Number((grossProfit - totalFilteredExpenses).toFixed(2));

  const storeData = useStoreData() || {};
  const settings = storeData.settings || {};
  const logoImageUrl = settings.logo_image_url || '';
  const siteName = settings.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteTagline = settings.site_tagline || 'Arot Express — তাজা পাইকারি ও খুচরা মুদি বাজার';

  const handlePrint = () => {
    printElement('printable-expense-tracker', {
      type: 'a4',
      title: `Expense-Report-${new Date().toISOString().slice(0, 10)}`
    });
  };

  return (
    <div className="admin-section">
      {/* Header Bar */}
      <div className="admin-header-actions no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={22} color="var(--green-dim)" />
            <span>দৈনিক খরচ ও ব্যয়ের হিসাব (Expense Tracker)</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
            ব্যবসার নিয়মিত খরচসমূহ লিপিবদ্ধ করুন এবং প্রকৃত নিট লাভ হিসাব করুন।
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
            <span>নতুন খরচ যোগ করুন</span>
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
            <span>প্রিন্ট রিপোর্ট</span>
          </motion.button>
        </div>
      </div>

      <div id="printable-expense-tracker">
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
                দৈনিক খরচ ও ব্যয় বিবরণী রিপোর্ট
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>
                প্রিন্ট তারিখ: <span className="mono">{new Date().toLocaleString('bn-BD')}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Financial Analytics Overview */}
      <div className="admin-expense-metrics-grid" style={{ marginBottom: '22px' }}>
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#991b1b', fontSize: '12px', fontWeight: 700 }}>
            <span>মোট খরচ (Expenses)</span>
            <Wallet size={16} />
          </div>
          <div className="mono font-bold" style={{ fontSize: '22px', color: '#dc2626', marginTop: '6px' }}>
            ৳{toBengaliNumber(totalFilteredExpenses)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#7f1d1d', marginTop: '4px' }}>
            {filteredExpenses.length} টি ভাউচার / এন্ট্রি
          </div>
        </div>

        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#166534', fontSize: '12px', fontWeight: 700 }}>
            <span>বিক্রি আয় (Delivered Sales)</span>
            <TrendingUp size={16} />
          </div>
          <div className="mono font-bold" style={{ fontSize: '22px', color: '#15803d', marginTop: '6px' }}>
            ৳{toBengaliNumber(totalSales)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#14532d', marginTop: '4px' }}>
            {deliveredOrders.length} টি সফল অর্ডার থেকে
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e40af', fontSize: '12px', fontWeight: 700 }}>
            <span>গ্রস লাভ (Gross Profit)</span>
            <DollarSign size={16} />
          </div>
          <div className="mono font-bold" style={{ fontSize: '22px', color: '#2563eb', marginTop: '6px' }}>
            ৳{toBengaliNumber(grossProfit)}
          </div>
          <div style={{ fontSize: '11.5px', color: '#1e3a8a', marginTop: '4px' }}>
            পণ্য বিক্রয় মাইনাস ক্র‍য়মূল্য
          </div>
        </div>

        <div style={{ background: netProfit >= 0 ? 'var(--cream-card)' : '#fff1f2', border: `2px solid ${netProfit >= 0 ? 'var(--ink)' : '#e11d48'}`, padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ink)', fontSize: '12px', fontWeight: 800 }}>
            <span>💎 চূড়ান্ত নিট লাভ (Net Profit)</span>
            {netProfit >= 0 ? <TrendingUp size={16} color="var(--green-dim)" /> : <TrendingDown size={16} color="#e11d48" />}
          </div>
          <div className="mono font-bold" style={{ fontSize: '24px', color: netProfit >= 0 ? 'var(--green-dim)' : '#e11d48', marginTop: '6px' }}>
            ৳{toBengaliNumber(netProfit)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
            গ্রস লাভ থেকে সকল খরচ বাদ দিয়ে
          </div>
        </div>
      </div>

      {/* Filter Toolbar (No Print) */}
      <div className="no-print" style={{ background: 'var(--paper)', padding: '14px', borderRadius: '6px', border: '1px solid var(--rule)', marginBottom: '18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            <Calendar size={15} color="var(--muted)" />
            <span>সময়সীমা:</span>
          </div>

          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--rule)', background: 'var(--cream-card)' }}
          >
            <option value="today">আজকে</option>
            <option value="yesterday">গতকাল</option>
            <option value="week">চলতি সপ্তাহ (গত ৭ দিন)</option>
            <option value="month">চলতি মাস</option>
            <option value="all">সব রেকর্ড</option>
            <option value="custom">নির্দিষ্ট তারিখ পরিসীমা</option>
          </select>

          {filterPeriod === 'custom' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ padding: '5px 8px', fontSize: '12.5px', borderRadius: '4px', border: '1px solid var(--rule)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>হতে</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ padding: '5px 8px', fontSize: '12.5px', borderRadius: '4px', border: '1px solid var(--rule)' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginLeft: '8px' }}>
            <Filter size={15} color="var(--muted)" />
            <span>ক্যাটাগরি:</span>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--rule)', background: 'var(--cream-card)' }}
          >
            <option value="all">সকল ক্যাটাগরি</option>
            {categoriesList.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          ফিল্টারকৃত মোট খরচ: <strong className="mono" style={{ color: 'var(--danger)', fontSize: '15px' }}>৳{toBengaliNumber(totalFilteredExpenses)}</strong>
        </div>
      </div>

      {/* Expenses Table */}
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
                    <span style={{ display: 'inline-block', background: 'var(--cream-card)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--rule)' }}>
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
                        style={{ padding: '4px 8px', fontSize: '12px' }}
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
                        style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}
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
              <tr style={{ background: 'var(--cream-card)', borderTop: '2px solid var(--ink)', fontWeight: 800 }}>
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
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)' }}
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
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)', background: 'var(--paper)' }}
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
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)' }}
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
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)' }}
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
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)' }}
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
                  আপনি কি সত্যিই এই খরচের রেকর্ডটি মুছে ফেলতে চান? এটি মুছে ফেললে সার্বিক খরচের হিসাব থেকে স্বয়ংক্রিয়ভাবে বাদ হয়ে যাবে।
                </p>

                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '4px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
