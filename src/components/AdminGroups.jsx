"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderKanban,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Layers,
  Eye,
  EyeOff,
  FolderTree,
  Package,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';

export default function AdminGroups({
  groups = [],
  categories = [],
  adminToken,
  showToast,
  onGroupsUpdated
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    bn: '',
    en: '',
    key: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  // Cascade delete confirmation modal
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Calculate category & product counts for each group
  const groupStats = React.useMemo(() => {
    const stats = {};
    groups.forEach((g) => {
      const catsInGroup = categories.filter((c) => c.group === g.key);
      const productCount = catsInGroup.reduce((sum, c) => sum + (c.brands?.length || 0), 0);
      stats[g.key] = {
        categoryCount: catsInGroup.length,
        productCount
      };
    });
    return stats;
  }, [groups, categories]);

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingGroup(null);
    setGroupForm({
      bn: '',
      en: '',
      key: '',
      is_active: true
    });
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (g) => {
    setEditingGroup(g);
    setGroupForm({
      bn: g.bn || '',
      en: g.en || '',
      key: g.key || '',
      is_active: g.is_active !== false
    });
    setModalOpen(true);
  };

  // Save Group (Add or Edit)
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.bn.trim() || !groupForm.en.trim()) {
      showToast('গ্রুপের বাংলা ও ইংরেজি নাম অবশ্যই পূরণ করুন!', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingGroup) {
        // Update existing group
        const res = await fetch(`/api/groups/${editingGroup.key}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(groupForm)
        });
        if (res.ok) {
          showToast(`গ্রুপ "${groupForm.bn}" সফলভাবে আপডেট হয়েছে!`, 'success');
          setModalOpen(false);
          if (onGroupsUpdated) onGroupsUpdated();
        } else {
          const err = await res.json();
          showToast(err.error || 'গ্রুপ আপডেট করতে ব্যর্থ হয়েছে', 'error');
        }
      } else {
        // Create new group
        const res = await fetch('/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(groupForm)
        });
        if (res.ok) {
          showToast(`নতুন গ্রুপ "${groupForm.bn}" যুক্ত হয়েছে!`, 'success');
          setModalOpen(false);
          if (onGroupsUpdated) onGroupsUpdated();
        } else {
          const err = await res.json();
          showToast(err.error || 'গ্রুপ যুক্ত করতে ব্যর্থ হয়েছে', 'error');
        }
      }
    } catch (err) {
      showToast('সার্ভার এরর: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Group active/inactive
  const handleToggleGroup = async (group) => {
    const nextStatus = !group.is_active;
    try {
      const res = await fetch(`/api/groups/${group.key}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ is_active: nextStatus })
      });
      if (res.ok) {
        showToast(
          nextStatus
            ? `"${group.bn}" গ্রুপ ফ্রন্টএন্ডে প্রদর্শিত হচ্ছে (সক্রিয়)।`
            : `"${group.bn}" গ্রুপ ও এর সকল পণ্য ফ্রন্টএন্ডে লুকানো হয়েছে (নিষ্ক্রিয়)।`,
          'info'
        );
        if (onGroupsUpdated) onGroupsUpdated();
      }
    } catch (err) {
      showToast('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে', 'error');
    }
  };

  // Reorder Groups (Move Up / Move Down)
  const handleMoveGroup = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;

    const newGroups = [...groups];
    const [moved] = newGroups.splice(index, 1);
    newGroups.splice(targetIndex, 0, moved);

    const orderedKeys = newGroups.map((g) => g.key);

    try {
      const res = await fetch('/api/groups/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ orderedKeys })
      });
      if (res.ok) {
        showToast('গ্রুপের ক্রম সফলভাবে পরিবর্তন করা হয়েছে!', 'success');
        if (onGroupsUpdated) onGroupsUpdated();
      }
    } catch (err) {
      showToast('ক্রম পরিবর্তন ব্যর্থ হয়েছে', 'error');
    }
  };

  // Confirm Cascade Delete Group
  const handleExecuteDelete = async () => {
    if (!deleteConfirmGroup) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/groups/${deleteConfirmGroup.key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        showToast(
          `গ্রুপ "${deleteConfirmGroup.bn}" এবং এর সকল ক্যাটাগরি ও পণ্য সফলভাবে মুছে ফেলা হয়েছে!`,
          'success'
        );
        setDeleteConfirmGroup(null);
        if (onGroupsUpdated) onGroupsUpdated();
      } else {
        const err = await res.json();
        showToast(err.error || 'গ্রুপ মুছে ফেলতে সমস্যা হয়েছে', 'error');
      }
    } catch (err) {
      showToast('মুছে ফেলার সময় ত্রুটি ঘটেছে', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = groups.filter((g) => g.is_active !== false).length;
  const inactiveCount = groups.length - activeCount;

  return (
    <div className="admin-groups-page">
      {/* Top Banner with Stats & Add Button */}
      <div className="admin-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <FolderKanban size={20} color="var(--green)" />
              <span>গ্রুপ ব্যবস্থাপনা ও ক্যাটাগরি বিন্যাস</span>
            </h3>
            <p className="admin-sub" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
              ওয়েবসাইটের প্রধান গ্রুপগুলো যুক্ত করুন, নাম পরিবর্তন করুন, অন/অফ সুইচের মাধ্যমে ফ্রন্টএন্ডে প্রদর্শন নিয়ন্ত্রণ করুন এবং ক্রমানুসারে সাজান।
            </p>
          </div>

          <motion.button
            type="button"
            className="admin-btn primary"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>নতুন গ্রুপ যুক্ত করুন</span>
          </motion.button>
        </div>

        {/* Quick Summary Pill Bar */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div className="admin-pill-badge" style={{ background: 'rgba(31, 75, 63, 0.08)', color: 'var(--green-dark)', border: '1px solid rgba(31, 75, 63, 0.2)' }}>
            <Layers size={13} />
            <span>মোট গ্রুপ: <strong>{toBengaliNumber(groups.length)} টি</strong></span>
          </div>
          <div className="admin-pill-badge" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
            <Eye size={13} />
            <span>ফ্রন্টএন্ডে সক্রিয় (অন): <strong>{toBengaliNumber(activeCount)} টি</strong></span>
          </div>
          {inactiveCount > 0 && (
            <div className="admin-pill-badge" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
              <EyeOff size={13} />
              <span>লুকানো (অফ): <strong>{toBengaliNumber(inactiveCount)} টি</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Groups List Table / Cards */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
            সকল গ্রুপ তালিকা ({toBengaliNumber(groups.length)})
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            💡 উপরে/নিচে তীর চিহ্নিত বাটনে ক্লিক করে গ্রুপের ক্রম পরিবর্তন করুন।
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="admin-empty-state-box">
            <FolderTree size={36} />
            <h4>কোনো গ্রুপ পাওয়া যায়নি</h4>
            <p>নতুন একটি গ্রুপ তৈরি করতে ওপরের "নতুন গ্রুপ যুক্ত করুন" বাটনে ক্লিক করুন।</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table clean-orders-table">
              <thead>
                <tr>
                  <th style={{ width: '10%', textAlign: 'center' }}>ক্রম ও সাজানো</th>
                  <th style={{ width: '28%' }}>গ্রুপের নাম (বাংলা ও ইংরেজি)</th>
                  <th style={{ width: '14%' }}>গ্রুপ কী / স্লাগ</th>
                  <th style={{ width: '18%' }}>অন্তর্ভুক্ত ক্যাটাগরি ও পণ্য</th>
                  <th style={{ width: '16%', textAlign: 'center' }}>ফ্রন্টএন্ড ডিসপ্লে (অন/অফ)</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, idx) => {
                  const stat = groupStats[g.key] || { categoryCount: 0, productCount: 0 };
                  const isActive = g.is_active !== false;

                  return (
                    <tr key={g.key} style={{ opacity: isActive ? 1 : 0.75 }}>
                      {/* Column 1: Order Position & Up/Down Arrows */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span className="order-position-pill mono">
                            #{toBengaliNumber(idx + 1)}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button
                              type="button"
                              className="order-arrow-btn"
                              disabled={idx === 0}
                              onClick={() => handleMoveGroup(idx, 'up')}
                              title="উপরে নিন"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              className="order-arrow-btn"
                              disabled={idx === groups.length - 1}
                              onClick={() => handleMoveGroup(idx, 'down')}
                              title="নিচে নামান"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Group Names */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: isActive ? 'var(--paper)' : '#fee2e2',
                              border: '1px solid var(--rule)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              color: isActive ? 'var(--green-dark)' : '#b91c1c'
                            }}
                          >
                            {g.bn ? g.bn.charAt(0) : 'গ'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                              {g.bn}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {g.en}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Key */}
                      <td>
                        <span className="mono group-slug-pill">
                          {g.key}
                        </span>
                      </td>

                      {/* Column 4: Category & Product Count */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className="admin-group-count-badge">
                            <FolderTree size={12} />
                            <strong>{toBengaliNumber(stat.categoryCount)}</strong> টি ক্যাটাগরি
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Package size={11} /> {toBengaliNumber(stat.productCount)} টি মোট পণ্য
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Visibility Toggle Switch */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <label className="admin-toggle-switch">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() => handleToggleGroup(g)}
                            />
                            <span className="admin-toggle-slider" />
                          </label>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: isActive ? '#059669' : '#dc2626'
                            }}
                          >
                            {isActive ? 'সক্রিয় (অন)' : 'লুকানো (অফ)'}
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="admin-btn icon-btn"
                            onClick={() => handleOpenEdit(g)}
                            title="গ্রুপ সম্পাদনা / রিনেম করুন"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn icon-btn danger"
                            onClick={() => setDeleteConfirmGroup(g)}
                            title="গ্রুপ ও সকল ক্যাটাগরি-পণ্য মুছুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Group Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="admin-modal-overlay">
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '460px', width: '92%' }}
            >
              <div className="admin-modal-header">
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <FolderKanban size={18} color="var(--green)" />
                  <span>{editingGroup ? 'গ্রুপ সম্পাদনা / রিনেম' : 'নতুন গ্রুপ যুক্ত করুন'}</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveGroup} className="admin-modal-form">
                <div className="admin-modal-body">
                  <div className="field">
                    <label>
                      গ্রুপের বাংলা নাম <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: নিত্যপ্রয়োজনীয় বা দুগ্ধ ও নাস্তা"
                      value={groupForm.bn}
                      onChange={(e) => setGroupForm({ ...groupForm, bn: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label>
                      গ্রুপের ইংরেজি নাম <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: Pantry Staples বা Dairy & Breakfast"
                      value={groupForm.en}
                      onChange={(e) => {
                        const enVal = e.target.value;
                        const autoKey = enVal.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
                        setGroupForm({
                          ...groupForm,
                          en: enVal,
                          key: editingGroup ? groupForm.key : autoKey
                        });
                      }}
                    />
                  </div>

                  <div className="field">
                    <label>
                      গ্রুপ স্লাগ / কী (Key) <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: staples, breakfast, fresh_market"
                      value={groupForm.key}
                      onChange={(e) => setGroupForm({ ...groupForm, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_') })}
                    />
                    <small style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                      * এটি ডাটাবেজে গ্রুপের ইউনিক আইডেন্টিফায়ার হিসেবে সংরক্ষিত হবে।
                    </small>
                  </div>

                  <div className="field" style={{ marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={groupForm.is_active}
                        onChange={(e) => setGroupForm({ ...groupForm, is_active: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        ফ্রন্টএন্ডে ও হেডারে এই গ্রুপটি প্রদর্শন করুন (সক্রিয়)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="admin-btn primary"
                    disabled={saving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      editingGroup ? 'আপডেট করুন' : 'যুক্ত করুন'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cascading Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmGroup && (
          <div className="admin-modal-overlay">
            <motion.div
              className="admin-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ maxWidth: '440px', width: '92%', borderLeft: '5px solid #dc2626' }}
            >
              <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '16px' }}>
                  <AlertTriangle size={20} />
                  <span>গ্রুপ মুছে ফেলার নিশ্চিতকরণ</span>
                </h4>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setDeleteConfirmGroup(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ padding: '16px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', lineHeight: 1.5, color: 'var(--ink)' }}>
                  আপনি কি নিশ্চিত যে আপনি <strong>"{deleteConfirmGroup.bn}"</strong> গ্রুপটি মুছে ফেলতে চান?
                </p>

                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12.5px',
                    color: '#991b1b',
                    lineHeight: 1.5
                  }}
                >
                  ⚠️ <strong>ক্যাসকেডিং ডিলিট সতর্কতা:</strong>
                  <br />
                  এই গ্রুপটি মুছে ফেললে এই গ্রুপের অধীনে থাকা <strong>{toBengaliNumber(groupStats[deleteConfirmGroup.key]?.categoryCount || 0)}টি ক্যাটাগরি</strong> এবং <strong>{toBengaliNumber(groupStats[deleteConfirmGroup.key]?.productCount || 0)}টি পণ্য</strong> চিরতরে ডাটাবেজ থেকে মুছে যাবে!
                </div>

                <div className="admin-modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={() => setDeleteConfirmGroup(null)}
                    disabled={deleting}
                  >
                    না, বাতিল করুন
                  </button>
                  <button
                    type="button"
                    className="admin-btn danger"
                    onClick={handleExecuteDelete}
                    disabled={deleting}
                    style={{ background: '#dc2626', color: '#fff' }}
                  >
                    {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, সম্পূর্ণ মুছে ফেলুন'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
