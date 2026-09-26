"use client";
import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  Banknote,
  CheckCircle2,
  Package,
  Layers,
  Bike,
  User,
  PhoneCall,
  CalendarDays,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useStoreData } from '../context/StoreDataContext';
import { toBengaliNumber } from '../utils/bengali.js';

export default function DeliveryRiderReports({ rider, orders = [] }) {
  const storeData = useStoreData() || {};
  const settings = storeData.settings || {};
  const logoImageUrl = settings.logo_image_url || '';
  const siteName = settings.site_name || 'আড়ৎ এক্সপ্রেস';

  // Date filter mode: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'single_date' | 'date_range' | 'all'
  const [filterMode, setFilterMode] = useState('today');
  
  // Custom date states
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedSingleDate, setSelectedSingleDate] = useState(todayStr);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const filteredOrders = orders.filter((o) => {
    if (filterMode === 'all') return true;

    const rawDateStr = o.delivered_at || o.created_at || '';
    if (!rawDateStr) return false;

    const orderDate = new Date(rawDateStr);
    const orderDateStr = orderDate.toISOString().split('T')[0];
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    if (filterMode === 'today') {
      return orderDateStr === todayFormatted;
    }

    if (filterMode === 'yesterday') {
      const yest = new Date();
      yest.setDate(today.getDate() - 1);
      const yestFormatted = yest.toISOString().split('T')[0];
      return orderDateStr === yestFormatted;
    }

    if (filterMode === 'this_week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      return orderDate >= oneWeekAgo && orderDate <= today;
    }

    if (filterMode === 'this_month') {
      return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
    }

    if (filterMode === 'single_date') {
      return orderDateStr === selectedSingleDate;
    }

    if (filterMode === 'date_range') {
      if (!startDate && !endDate) return true;
      if (startDate && !endDate) return orderDateStr >= startDate;
      if (!startDate && endDate) return orderDateStr <= endDate;
      return orderDateStr >= startDate && orderDateStr <= endDate;
    }

    return true;
  });

  const deliveredOrders = filteredOrders.filter(
    (o) => o.status === 'delivered' || o.status === 'ডেলিভার্ড'
  );
  const activeOrders = filteredOrders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'ডেলিভার্ড' && o.status !== 'cancelled' && o.status !== 'বাতিল'
  );

  const totalDeliveredAmount = deliveredOrders.reduce(
    (sum, o) => sum + (Number(o.total_amount) || 0),
    0
  );
  const totalCashCollected = deliveredOrders.reduce((sum, o) => {
    const isCOD =
      !o.payment_method ||
      o.payment_method.toLowerCase().includes('cash') ||
      o.payment_method.includes('ক্যাশ');
    return isCOD ? sum + (Number(o.total_amount) || 0) : sum;
  }, 0);

  const totalDigitalPaid = totalDeliveredAmount - totalCashCollected;

  const handlePrint = () => {
    window.print();
  };

  // Helper for human-readable filter description
  const getFilterPeriodLabel = () => {
    if (filterMode === 'today') return `আজকের রিপোর্ট (${new Date().toLocaleDateString('bn-BD')})`;
    if (filterMode === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return `গতকালের রিপোর্ট (${y.toLocaleDateString('bn-BD')})`;
    }
    if (filterMode === 'this_week') return 'বিগত ৭ দিনের ডেলিভারি রিপোর্ট';
    if (filterMode === 'this_month') return 'চলতি মাসের ডেলিভারি রিপোর্ট';
    if (filterMode === 'single_date') {
      return `নির্দিষ্ট তারিখ: ${new Date(selectedSingleDate).toLocaleDateString('bn-BD')}`;
    }
    if (filterMode === 'date_range') {
      return `কাস্টম তারিখ রেঞ্জ: ${new Date(startDate).toLocaleDateString('bn-BD')} থেকে ${new Date(endDate).toLocaleDateString('bn-BD')}`;
    }
    return 'সর্বমোট (সব তারিখের)';
  };

  return (
    <div className="rider-reports-view" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Filter & Print Action */}
      <div className="admin-card no-print" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={18} color="var(--green)" />
              <span>ডেলিভারি রিপোর্ট ও হিসাব (তারিখ অনুযায়ী ফিল্টার)</span>
            </h3>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
              তারিখ বা সময়কাল নির্বাচন করে ডেলিভারি ও সংগৃহীত টাকার সঠিক হিসাব দেখুন
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="admin-btn primary"
              style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={handlePrint}
            >
              <Printer size={15} />
              <span>প্রিন্ট / শিট ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--rule)', paddingTop: '12px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <Filter size={14} />
            <span>ফিল্টার:</span>
          </span>

          <button
            type="button"
            className={`chip ${filterMode === 'today' ? 'active' : ''}`}
            onClick={() => setFilterMode('today')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            আজকের ({new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })})
          </button>

          <button
            type="button"
            className={`chip ${filterMode === 'yesterday' ? 'active' : ''}`}
            onClick={() => setFilterMode('yesterday')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            গতকাল
          </button>

          <button
            type="button"
            className={`chip ${filterMode === 'this_week' ? 'active' : ''}`}
            onClick={() => setFilterMode('this_week')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            বিগত ৭ দিন
          </button>

          <button
            type="button"
            className={`chip ${filterMode === 'this_month' ? 'active' : ''}`}
            onClick={() => setFilterMode('this_month')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            চলতি মাস
          </button>

          <button
            type="button"
            className={`chip ${filterMode === 'single_date' ? 'active' : ''}`}
            onClick={() => setFilterMode('single_date')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            নির্দিষ্ট তারিখ 📅
          </button>

          <button
            type="button"
            className={`chip ${filterMode === 'date_range' ? 'active' : ''}`}
            onClick={() => setFilterMode('date_range')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            কাস্টম তারিখ রেঞ্জ 🗓️
          </button>

          <button
            type="button"
            className={`chip ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            সর্বমোট
          </button>
        </div>

        {/* Dynamic Date Inputs when specific date or range is selected */}
        {filterMode === 'single_date' && (
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Calendar size={16} color="var(--green)" />
            <label style={{ fontSize: '13px', fontWeight: 600 }}>তারিখ নির্বাচন করুন:</label>
            <input
              type="date"
              value={selectedSingleDate}
              onChange={(e) => setSelectedSingleDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--rule)', fontSize: '13px', background: '#ffffff' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              নির্বাচিত: {new Date(selectedSingleDate).toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        )}

        {filterMode === 'date_range' && (
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <CalendarDays size={16} color="var(--green)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600 }}>হতে:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--rule)', fontSize: '13px', background: '#ffffff' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600 }}>পর্যন্ত:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--rule)', fontSize: '13px', background: '#ffffff' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="admin-card" style={{ padding: '16px', borderRadius: '10px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>মোট ডেলিভার্ড অর্ডার</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
            {toBengaliNumber(deliveredOrders.length)} টি
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            মোট অর্ডার: {toBengaliNumber(filteredOrders.length)} টি
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px', borderRadius: '10px', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>মোট সংগৃহীত ক্যাশ (COD)</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            ৳{toBengaliNumber(totalCashCollected)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            অফিসে জমাযোগ্য ক্যাশ টাকা
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>অনলাইন / পেইড ডেলিভারি</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>
            ৳{toBengaliNumber(totalDigitalPaid)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            বিকাশ / নগদ / অগ্রিম পরিশোধিত
          </div>
        </div>

        <div className="admin-card" style={{ padding: '16px', borderRadius: '10px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>মোট ডেলিভারি মূল্য</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
            ৳{toBengaliNumber(totalDeliveredAmount)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            সর্বমোট পণ্য ও ডেলিভারি ফি
          </div>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="admin-card print-section" style={{ padding: '20px', borderRadius: '10px', background: '#ffffff' }}>
        
        {/* Printable Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--ink)', paddingBottom: '14px', marginBottom: '16px' }}>
          {logoImageUrl ? (
            <img
              src={logoImageUrl}
              alt={siteName}
              style={{
                maxHeight: '44px',
                maxWidth: '180px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                margin: '0 auto 6px',
                display: 'block'
              }}
            />
          ) : (
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0' }}>{siteName}</h2>
          )}
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
            রাইডার ডেলিভারি ও কালেকশন রিপোর্ট
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
            <strong>রাইডার:</strong> {rider?.name} ({rider?.phone}) | <strong>বাহন:</strong> {rider?.vehicle} | <strong>এলাকা:</strong> {rider?.area}
          </div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--green)', marginTop: '6px' }}>
            {getFilterPeriodLabel()}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
            রিপোর্ট তৈরির সময়: {new Date().toLocaleString('bn-BD')}
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                <th>অর্ডার কোড</th>
                <th>তারিখ ও সময়</th>
                <th>কাস্টমারের নাম ও মোবাইল</th>
                <th>ডেলিভারি ঠিকানা</th>
                <th>পেমেন্ট মেথড</th>
                <th style={{ textAlign: 'right' }}>টাকার পরিমাণ</th>
                <th style={{ textAlign: 'center' }}>স্ট্যাটাস</th>
                <th>মন্তব্য / নোট</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                    নির্বাচিত তারিখ বা সময়সীমার মধ্যে কোনো ডেলিভারি রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isDelivered = order.status === 'delivered' || order.status === 'ডেলিভার্ড';
                  const isCOD = !order.payment_method || order.payment_method.toLowerCase().includes('cash') || order.payment_method.includes('ক্যাশ');
                  const orderDate = order.delivered_at || order.created_at || '';
                  const formattedDate = orderDate ? new Date(orderDate).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' }) : '—';

                  return (
                    <tr key={order.id || idx} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{toBengaliNumber(idx + 1)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--green)' }}>
                        #{order.order_code || order.id}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {formattedDate}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customer_name || '—'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{order.customer_phone || ''}</div>
                      </td>
                      <td style={{ maxWidth: '180px', fontSize: '12px' }}>
                        {order.delivery_address || order.shipping_address || '—'}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            background: isCOD ? '#fef3c7' : '#e0e7ff',
                            color: isCOD ? '#92400e' : '#3730a3'
                          }}
                        >
                          {order.payment_method || 'ক্যাশ অন ডেলিভারি'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '13.5px' }}>
                        ৳{toBengaliNumber(order.total_amount || 0)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '50px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isDelivered ? '#dcfce7' : '#f1f5f9',
                            color: isDelivered ? '#16a34a' : 'var(--muted)'
                          }}
                        >
                          {isDelivered ? <CheckCircle2 size={12} /> : null}
                          <span>{isDelivered ? 'ডেলিভার্ড' : order.status}</span>
                        </span>
                      </td>
                      <td style={{ fontSize: '11.5px', color: 'var(--muted)', maxWidth: '140px' }}>
                        {order.delivery_note || order.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid var(--ink)' }}>
                  <td colSpan={6} style={{ textAlign: 'right', padding: '10px' }}>
                    মোট সংগৃহীত ক্যাশ (COD) / সর্বমোট হিসাব:
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px', color: '#059669', fontSize: '14px' }}>
                    ৳{toBengaliNumber(totalCashCollected)}
                  </td>
                  <td colSpan={2} style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    (মোট বিল: ৳{toBengaliNumber(totalDeliveredAmount)})
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Rider & Authority Signatures for Print */}
        <div className="print-signatures" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '160px', borderTop: '1px solid #000', margin: '0 auto 4px auto' }}></div>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>রাইডারের স্বাক্ষর ও তারিখ</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '160px', borderTop: '1px solid #000', margin: '0 auto 4px auto' }}></div>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>ক্যাশিয়ার / অফিস ম্যানেজারের স্বাক্ষর</span>
          </div>
        </div>

      </div>

    </div>
  );
}
