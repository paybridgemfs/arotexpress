"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Plus, Search, Edit2, Trash2, Phone, PhoneCall, Check, X, MapPin, User, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';

export default function AdminDeliveryRiders({ adminToken, orders = [], packageOrders = [], deliveryAreas: propAreas = [], showToast }) {
  const [riders, setRiders] = useState([]);
  const [areas, setAreas] = useState(propAreas);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [deleteTargetRider, setDeleteTargetRider] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: 'মোটরসাইকেল',
    area: '',
    address: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAreas = async () => {
    try {
      const res = await fetch('/api/delivery-areas');
      if (res.ok) {
        const data = await res.json();
        if (data.areas && Array.isArray(data.areas)) {
          setAreas(data.areas);
        }
      }
    } catch (err) {
      console.error('Failed to fetch delivery areas:', err);
    }
  };

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery-riders', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRiders(data);
      }
    } catch (err) {
      console.error('Failed to fetch delivery riders:', err);
      showToast('রাইডার তালিকা আনতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
    fetchAreas();
  }, [adminToken]);

  useEffect(() => {
    if (propAreas && propAreas.length > 0) {
      setAreas(propAreas);
    }
  }, [propAreas]);

  const handleOpenAddModal = () => {
    setEditingRider(null);
    setFormData({
      name: '',
      phone: '',
      password: '123456',
      vehicle: 'মোটরসাইকেল',
      area: '',
      address: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rider) => {
    setEditingRider(rider);
    setFormData({
      name: rider.name,
      phone: rider.phone,
      password: '',
      vehicle: rider.vehicle || 'মোটরসাইকেল',
      area: rider.area || '',
      address: rider.address || '',
      is_active: rider.is_active !== undefined ? rider.is_active : true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('রাইডারের নাম এবং মোবাইল নম্বর আবশ্যক');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRider) {
        const res = await fetch(`/api/delivery-riders/${editingRider.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const updated = await res.json();
          setRiders(riders.map((r) => (r.id === updated.id ? updated : r)));
          showToast(`রাইডার '${updated.name}' সফলভাবে আপডেট হয়েছে`);
          setIsModalOpen(false);
        } else {
          showToast('আপডেট করতে ব্যর্থ হয়েছে');
        }
      } else {
        const res = await fetch('/api/delivery-riders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const created = await res.json();
          setRiders([...riders, created]);
          showToast(`নতুন রাইডার '${created.name}' যুক্ত হয়েছে`);
          setIsModalOpen(false);
        } else {
          showToast('নতুন রাইডার যুক্ত করতে ব্যর্থ');
        }
      }
    } catch (err) {
      showToast('সার্ভারে ত্রুটি হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (rider) => {
    setDeleteTargetRider(rider);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetRider) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/delivery-riders/${deleteTargetRider.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setRiders((prev) => prev.filter((r) => String(r.id) !== String(deleteTargetRider.id)));
        showToast(`'${deleteTargetRider.name}' রাইডার মুছে ফেলা হয়েছে`);
        setDeleteTargetRider(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'রাইডার মুছে ফেলতে ব্যর্থ');
      }
    } catch (err) {
      showToast('সার্ভারে ত্রুটি হয়েছে');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (rider) => {
    try {
      const newStatus = !rider.is_active;
      const res = await fetch(`/api/delivery-riders/${rider.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setRiders(riders.map((r) => (r.id === updated.id ? updated : r)));
        showToast(`${rider.name} এখন ${newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'}`);
      }
    } catch (err) {
      showToast('স্ট্যাটাস পরিবর্তনে সমস্যা');
    }
  };

  // Filter riders
  const filteredRiders = riders.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.area?.toLowerCase().includes(q) ||
      r.vehicle?.toLowerCase().includes(q)
    );
  });

  // Calculate order stats per rider (combining regular and package orders)
  const getRiderStats = (riderId, riderPhone) => {
    const allOrders = [...(orders || []), ...(packageOrders || [])];
    const assignedOrders = allOrders.filter(
      (o) => (o.delivery_rider_id && o.delivery_rider_id === riderId) || (o.delivery_rider_phone && o.delivery_rider_phone === riderPhone)
    );
    const activeShipments = assignedOrders.filter(
      (o) => o.status === 'shipped' || o.status === 'পাঠানো হয়েছে' || o.status === 'অন-ওয়ে'
    ).length;
    const deliveredCount = assignedOrders.filter(
      (o) => o.status === 'delivered' || o.status === 'ডেলিভার্ড' || o.status === 'সম্পন্ন'
    ).length;

    return { total: assignedOrders.length, active: activeShipments, delivered: deliveredCount };
  };

  return (
    <div className="admin-section">
      {/* Header Bar */}
      <div className="admin-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={22} color="var(--green-dim)" />
            <span>ডেলিভারিম্যান ও রাইডার ম্যানেজমেন্ট</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
            অর্ডার ডেলিভারির জন্য নিজস্ব রাইডার যুক্ত করুন এবং ম্যানেজ করুন।
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/delivery-man"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', textDecoration: 'none', color: 'var(--ink)' }}
          >
            <span>🚴 রাইডার পোর্টাল দেখুন</span>
          </a>
          <motion.button
            type="button"
            className="admin-btn"
            onClick={handleOpenAddModal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
          >
            <Plus size={16} />
            <span>নতুন রাইডার যোগ করুন</span>
          </motion.button>
          <motion.button
            type="button"
            className="admin-btn secondary"
            onClick={fetchRiders}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ padding: '8px 12px' }}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {/* Search & Overview Cards */}
      <div className="admin-riders-metrics-grid" style={{ marginBottom: '20px' }}>
        <div style={{ background: 'var(--cream-card)', padding: '14px 16px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>মোট নিবন্ধিত রাইডার</div>
          <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>
            {toBengaliNumber(riders.length)} জন
          </div>
        </div>
        <div style={{ background: 'var(--cream-card)', padding: '14px 16px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>সক্রিয় রাইডার</div>
          <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--green-dim)', marginTop: '2px' }}>
            {toBengaliNumber(riders.filter((r) => r.is_active).length)} জন
          </div>
        </div>
        <div style={{ background: 'var(--cream-card)', padding: '14px 16px', borderRadius: '6px', border: '1px solid var(--rule)' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>চলমান ডেলিভারি (Shipped)</div>
          <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
            {toBengaliNumber(orders.filter((o) => (o.status === 'shipped' || o.status === 'পাঠানো হয়েছে') && o.delivery_rider_id).length)} টি
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '380px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          type="text"
          placeholder="নাম, মোবাইল বা এলাকা দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: '13.5px', borderRadius: '4px', border: '1px solid var(--rule)', background: 'var(--paper)' }}
        />
      </div>

      {/* Riders Grid */}
      {filteredRiders.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--cream-card)', borderRadius: '6px', border: '1px solid var(--rule)', color: 'var(--muted)' }}>
          <Truck size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '14px' }}>কোনো রাইডার পাওয়া যায়নি।</p>
        </div>
      ) : (
        <div className="admin-riders-grid">
          {filteredRiders.map((rider) => {
            const stats = getRiderStats(rider.id, rider.phone);
            return (
              <motion.div
                key={rider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--paper)',
                  border: '1.5px solid var(--rule)',
                  borderRadius: '6px',
                  padding: '16px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div>
                  {/* Top line with Active Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: rider.is_active ? '#dcfce7' : '#f3f4f6', color: rider.is_active ? '#16a34a' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--ink)' }}>
                          {rider.name}
                        </h4>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                          বাহন: <strong>{rider.vehicle}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(rider)}
                      style={{
                        background: rider.is_active ? '#dcfce7' : '#fee2e2',
                        color: rider.is_active ? '#166534' : '#991b1b',
                        border: 'none',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                    >
                      {rider.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </div>

                  {/* Rider Details */}
                  <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, background: 'var(--cream-card)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--rule)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="var(--muted)" />
                      <span className="mono font-bold">{rider.phone}</span>
                    </div>
                    {rider.area && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <MapPin size={13} color="var(--muted)" />
                        <span>কভারেজ: {rider.area}</span>
                      </div>
                    )}
                    {rider.address && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                        ঠিকানা: {rider.address}
                      </div>
                    )}
                  </div>

                  {/* Statistics */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <div style={{ flex: 1, background: '#f0fdf4', padding: '6px 8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '10.5px', color: '#166534' }}>সম্পন্ন ডেলিভারি</div>
                      <div className="mono font-bold" style={{ fontSize: '14px', color: '#15803d' }}>
                        {toBengaliNumber(stats.delivered)}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: '#eff6ff', padding: '6px 8px', borderRadius: '4px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '10.5px', color: '#1e40af' }}>অন-ওয়ে অর্ডার</div>
                      <div className="mono font-bold" style={{ fontSize: '14px', color: '#2563eb' }}>
                        {toBengaliNumber(stats.active)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--rule)', paddingTop: '12px' }}>
                  <a
                    href={`tel:${rider.phone}`}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      background: 'var(--ink)',
                      color: 'var(--paper)',
                      padding: '7px 10px',
                      borderRadius: '4px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    <PhoneCall size={13} />
                    <span>কল দিন</span>
                  </a>

                  <motion.button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => handleOpenEditModal(rider)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ padding: '7px 10px' }}
                    title="এডিট করুন"
                  >
                    <Edit2 size={13} />
                  </motion.button>

                  <motion.button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => handleOpenDeleteModal(rider)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ padding: '7px 10px', color: 'var(--danger)' }}
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={13} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="rider-modal-overlay"
            className="admin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                  <Truck size={18} color="var(--green-dim)" />
                  <span>{editingRider ? 'রাইডার তথ্য সম্পাদনা' : 'নতুন রাইডার নিবন্ধন'}</span>
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
                      রাইডারের পুরো নাম *
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: করিম আহমেদ"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)' }}
                    />
                  </div>

                  <div className="field">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      মোবাইল নম্বর (লগইন ইউজারনেম) *
                    </label>
                    <input
                      type="tel"
                      placeholder="017XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)' }}
                    />
                  </div>

                  <div className="field">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      {editingRider ? 'লগইন পাসওয়ার্ড (পরিবর্তন করতে চাইলে লিখুন)' : 'লগইন পাসওয়ার্ড *'}
                    </label>
                    <input
                      type="text"
                      placeholder={editingRider ? 'অপরিবর্তিত রাখতে ফাঁকা রাখুন' : 'ডিফল্ট: 123456'}
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)' }}
                    />
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px', display: 'block' }}>
                      রাইডার এই পাসওয়ার্ড ও মোবাইল নম্বর দিয়ে <strong>/delivery-man</strong> পোর্টালে লগইন করতে পারবে।
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="field">
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        বাহনের ধরন
                      </label>
                      <select
                        value={formData.vehicle}
                        onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)', background: 'var(--paper)' }}
                      >
                        <option value="মোটরসাইকেল">মোটরসাইকেল</option>
                        <option value="সাইকেল">সাইকেল</option>
                        <option value="ভ্যান / পিকআপ">ভ্যান / পিকআপ</option>
                        <option value="সিএনজি / অটো">সিএনজি / অটো</option>
                        <option value="পায়ে হেঁটে">পায়ে হেঁটে</option>
                      </select>
                    </div>

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                        ডেলিভারি এরিয়া / এলাকা (একাধিক নির্বাচন করা যাবে)
                      </label>
                      <div style={{ 
                        display: 'flex', flexWrap: 'wrap', gap: '8px', 
                        maxHeight: '140px', overflowY: 'auto', 
                        padding: '8px', background: 'var(--cream)', 
                        borderRadius: '6px', border: '1px solid var(--rule)'
                      }}>
                        {areas.map((area) => {
                          const selectedAreas = formData.area ? formData.area.split(',').map(a => a.trim()) : [];
                          const isSelected = selectedAreas.includes(area.name);
                          return (
                            <label key={area.id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              background: isSelected ? '#dcfce7' : '#ffffff',
                              border: `1px solid ${isSelected ? '#16a34a' : 'var(--rule)'}`,
                              padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                              fontSize: '13px', transition: 'all 0.2s', userSelect: 'none'
                            }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  let newAreas = [...selectedAreas];
                                  if (e.target.checked) {
                                    if (!newAreas.includes(area.name)) newAreas.push(area.name);
                                  } else {
                                    newAreas = newAreas.filter(a => a !== area.name);
                                  }
                                  setFormData({ ...formData, area: newAreas.join(', ') });
                                }}
                                style={{ margin: 0, cursor: 'pointer' }}
                              />
                              <span style={{ color: isSelected ? '#15803d' : 'var(--ink)' }}>
                                {area.name} {typeof area.charge === 'number' ? `(৳${toBengaliNumber(area.charge)})` : ''}
                              </span>
                            </label>
                          );
                        })}
                        {areas.length === 0 && (
                          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>কোনো ডেলিভারি এলাকা পাওয়া যায়নি। আগে এলাকা যুক্ত করুন।</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      রাইডারের বর্তমান ঠিকানা
                    </label>
                    <input
                      type="text"
                      placeholder="বাসা/রোড/এলাকা"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--rule)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                    <input
                      type="checkbox"
                      id="rider_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="rider_active" style={{ fontSize: '13.5px', cursor: 'pointer' }}>
                      রাইডার সক্রিয় থাকবে (অর্ডার অ্যাসাইন করার জন্য উপলব্ধ)
                    </label>
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
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : (editingRider ? 'আপডেট করুন' : 'নিবন্ধন সম্পন্ন করুন')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {/* Delete Rider Confirmation Modal */}
        {deleteTargetRider && (
          <motion.div
            key="delete-rider-modal-overlay"
            className="admin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setDeleteTargetRider(null);
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
                  <AlertCircle size={19} />
                  <span>রাইডার মুছে ফেলা নিশ্চিত করুন</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => !isDeleting && setDeleteTargetRider(null)}
                  disabled={isDeleting}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ padding: '16px 20px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: 'var(--ink)', lineHeight: 1.5 }}>
                  আপনি কি সত্যিই এই রাইডারের তথ্য মুছে ফেলতে চান?
                </p>

                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '4px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#7F1D1D' }}>রাইডারের নাম:</span>
                    <strong style={{ fontSize: '13.5px', color: '#991B1B' }}>{deleteTargetRider.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#7F1D1D' }}>ফোন নম্বর:</span>
                    <strong className="mono" style={{ fontSize: '13px', color: '#1E293B' }}>{deleteTargetRider.phone}</strong>
                  </div>
                  {deleteTargetRider.area && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#7F1D1D' }}>এলাকা:</span>
                      <span style={{ fontSize: '12px', color: '#4B5563' }}>{deleteTargetRider.area}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => setDeleteTargetRider(null)}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
