"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Tag,
  Layers,
  Sparkles,
  Info,
  X,
  Check,
  Search,
  ArrowRight
} from 'lucide-react';
import { toBengaliNumber } from '../utils/bengali.js';
import { useCart } from '../context/CartContext.jsx';
import { useStoreData } from '../context/StoreDataContext';
import { useConfirm } from '../context/ConfirmContext.jsx';

export default function AdminPackageManagement({
  packageProducts = [],
  categories = [],
  settings = {},
  adminToken,
  onRefresh
}) {
  const { showToast } = useCart();
  const { confirm } = useConfirm();
  const { fetchData } = useStoreData();

  // Minimum Package Items Configuration State
  const [minPackageItems, setMinPackageItems] = useState(
    settings?.package_min_items !== undefined ? Number(settings.package_min_items) : 1
  );
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (settings?.package_min_items !== undefined) {
      setMinPackageItems(Number(settings.package_min_items));
    }
  }, [settings?.package_min_items]);

  const handleSaveMinItems = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = parseInt(minPackageItems, 10);
    if (isNaN(val) || val < 1) {
      showToast('অনুগ্রহ করে কমপক্ষে ১ বা তার বেশি সংখ্যা দিন');
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          package_min_items: val
        })
      });

      if (!res.ok) {
        throw new Error('সেটিংস আপডেট করতে ব্যর্থ হয়েছে');
      }

      showToast(`প্যাকেজ অর্ডারের ন্যূনতম ভিন্ন পণ্য সফলভাবে ${toBengaliNumber(val)}টি নির্ধারণ করা হয়েছে`);
      if (typeof onRefresh === 'function') onRefresh();
      if (typeof fetchData === 'function') fetchData();
    } catch (err) {
      showToast(err.message || 'সেটিংস আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setSavingSettings(false);
    }
  };

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [slotNumber, setSlotNumber] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter existing store products for quick selection
  const allStoreProducts = useMemo(() => {
    const list = [];
    if (!Array.isArray(categories)) return list;
    categories.forEach((cat) => {
      if (Array.isArray(cat.brands)) {
        cat.brands.forEach((b) => {
          list.push({
            id: b.id,
            name: b.name,
            unit: b.unit || '১ একক',
            price: b.price || 0,
            cost_price: b.cost_price || 0,
            catId: cat.id,
            catName: cat.bn || cat.name || ''
          });
        });
      }
    });
    return list;
  }, [categories]);

  // Open modal for new or edit
  const handleOpenModal = (slot, existingItem = null) => {
    if (existingItem) {
      setEditingItem(existingItem);
      setSlotNumber(existingItem.slot_number || slot);
      setSelectedProductId(existingItem.product_id ? String(existingItem.product_id) : '');
      setSelectedCategoryId(existingItem.category_id ? String(existingItem.category_id) : '');
      setProductName(existingItem.product_name || '');
      setUnit(existingItem.unit || '');
      setCostPrice(existingItem.cost_price !== undefined ? String(existingItem.cost_price) : '');
      setRegularPrice(existingItem.regular_price !== undefined ? String(existingItem.regular_price) : '');
      setDiscountAmount(existingItem.discount_amount !== undefined ? String(existingItem.discount_amount) : '');
      setIsActive(existingItem.is_active !== false);
    } else {
      setEditingItem(null);
      setSlotNumber(slot);
      setSelectedProductId('');
      setSelectedCategoryId('');
      setProductName('');
      setUnit('১ কেজি');
      setCostPrice('');
      setRegularPrice('');
      setDiscountAmount('');
      setIsActive(true);
    }
    setModalOpen(true);
  };

  // Handle selecting a product from existing store inventory
  const handleSelectStoreProduct = (prodIdStr) => {
    setSelectedProductId(prodIdStr);
    if (!prodIdStr) return;
    const found = allStoreProducts.find((p) => String(p.id) === String(prodIdStr));
    if (found) {
      setProductName(found.name);
      setUnit(found.unit);
      setRegularPrice(String(found.price));
      setCostPrice(String(found.cost_price || 0));
      setSelectedCategoryId(String(found.catId));
      if (!discountAmount) {
        setDiscountAmount(String(Math.max(5, Math.round(found.price * 0)))); // default 10% discount suggestion
      }
    }
  };

  // Real-time Loss Prevention Math
  const numRegular = parseFloat(regularPrice) || 0;
  const numCost = parseFloat(costPrice) || 0;
  const numDiscount = parseFloat(discountAmount) || 0;
  const finalPrice = Math.max(0, numRegular - numDiscount);
  const profitMargin = finalPrice - numCost;
  const isLoss = numCost > 0 && finalPrice < numCost;

  // Save product (Add or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      showToast('পণ্যের নাম লিখুন');
      return;
    }
    if (numRegular <= 0) {
      showToast('নিয়মিত বিক্রয় মূল্য সঠিকভাবে দিন');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: editingItem ? editingItem.id : undefined,
        slot_number: Number(slotNumber),
        product_id: selectedProductId ? Number(selectedProductId) : null,
        category_id: selectedCategoryId ? Number(selectedCategoryId) : null,
        product_name: productName.trim(),
        unit: unit.trim() || '১ একক',
        cost_price: numCost,
        regular_price: numRegular,
        discount_amount: numDiscount,
        final_price: finalPrice,
        is_active: isActive
      };

      const res = await fetch('/api/package-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'প্যাকেজ পণ্য সংরক্ষণে সমস্যা হয়েছে');
      }

      showToast(`স্লট ${toBengaliNumber(slotNumber)} এ প্যাকেজ পণ্য সফলভাবে সংরক্ষিত হয়েছে`);
      setModalOpen(false);
      if (onRefresh) onRefresh();
      fetchData(true);
    } catch (err) {
      showToast(err.message || 'সংরক্ষণে ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete/Clear slot
  const handleDeleteProduct = async (id, slotNum) => {
    const ok = await confirm({
      title: 'প্যাকেজ পণ্য মুছুন',
      message: `আপনি কি স্লট ${toBengaliNumber(slotNum)} এর পণ্যটি মুছে ফেলতে চান?`,
      confirmText: 'মুছে ফেলুন',
      cancelText: 'বাতিল',
      type: 'danger'
    });
    if (!ok) {
      return;
    }

    try {
      const res = await fetch(`/api/package-products?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'মুছে ফেলতে সমস্যা হয়েছে');
      }

      showToast(`স্লট ${toBengaliNumber(slotNum)} এর পণ্য মুছে ফেলা হয়েছে`);
      if (onRefresh) onRefresh();
      fetchData(true);
    } catch (err) {
      showToast(err.message || 'মুছে ফেলতে ব্যর্থ');
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (item) => {
    try {
      const res = await fetch('/api/package-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...item,
          is_active: !item.is_active
        })
      });
      if (res.ok) {
        showToast(item.is_active ? 'পণ্যটি নিষ্ক্রিয় করা হয়েছে' : 'পণ্যটি সক্রিয় করা হয়েছে');
        if (onRefresh) onRefresh();
        fetchData(true);
      }
    } catch (err) {
      showToast('স্ট্যাটাস পরিবর্তন করা যায়নি');
    }
  };

  // Safely normalize package products list
  const safeProductsList = useMemo(() => {
    if (Array.isArray(packageProducts)) return packageProducts;
    if (packageProducts && Array.isArray(packageProducts.products)) return packageProducts.products;
    return [];
  }, [packageProducts]);

  // Group products by slot (1 to 10)
  const slotsMap = useMemo(() => {
    const map = {};
    for (let i = 1; i <= 10; i++) {
      map[i] = safeProductsList.find((p) => p && p.slot_number === i) || null;
    }
    return map;
  }, [safeProductsList]);

  return (
    <div className="admin-view" style={{ padding: '20px 0' }}>
      {/* Header with Title and Overview */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          background: 'var(--surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--rule)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Package size={22} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
              প্যাকেজ বক্স ম্যানেজমেন্ট (Hero Package Products)
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', maxWidth: '650px' }}>
            ওয়েবসাইটের হিরো সেকশনের ডান পাশের প্যাকেজ বক্সের ১০টি পণ্য এখানে পরিচালনা করুন। বাম পাশে ৫টি (স্লট ১-৫) এবং ডান পাশে ৫টি (স্লট ৬-১০) পণ্য গ্রাহক দেখতে পাবেন।
          </p>
        </div>

        <button
          onClick={() => handleOpenModal(1)}
          className="admin-btn primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontWeight: '600'
          }}
        >
          <Plus size={16} />
          <span>নতুন পণ্য যুক্ত করুন</span>
        </button>
      </div>

      {/* Package Order Requirement Setting (Minimum Items) */}
      <div
        style={{
          background: 'var(--surface)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--rule)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Layers size={18} style={{ color: 'var(--primary, #006C4C)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>
              প্যাকেজ অর্ডারে ন্যূনতম ভিন্ন পণ্যের বাধ্যবাধকতা (Minimum Distinct Products Rule)
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
            হিরো প্যাকেজ বক্স থেকে গ্রাহক অর্ডার করতে চাইলে তাকে কমপক্ষে কতটি ভিন্ন পণ্য (Different Products) নির্বাচন করতে হবে তা নির্ধারণ করুন। উদাহরণস্বরূপ: ২ সেট করলে অন্তত ২টি ভিন্ন পণ্য বাছাই করতে হবে (একটি পণ্যের পরিমাণ ২ বা তার বেশি হলেও অর্ডার করতে পারবে না)।
          </p>
        </div>

        <form
          onSubmit={handleSaveMinItems}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="min-package-items-input" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
              ন্যূনতম ভিন্ন পণ্য:
            </label>
            <input
              id="min-package-items-input"
              type="number"
              min="1"
              max="20"
              value={minPackageItems}
              onChange={(e) => setMinPackageItems(e.target.value)}
              style={{
                width: '75px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1.5px solid var(--rule)',
                fontSize: '14px',
                fontWeight: '700',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>টি</span>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="admin-btn primary"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: savingSettings ? 'not-allowed' : 'pointer'
            }}
          >
            {savingSettings ? <CheckCircle2 size={15} /> : <Check size={15} />}
            <span>{savingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}</span>
          </button>
        </form>
      </div>

      {/* Slots Layout - 2 Columns: Side A (Slots 1-5) and Side B (Slots 6-10) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Left Side: Slots 1 to 5 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'var(--surface)',
              borderRadius: '8px',
              border: '1px solid var(--rule)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                ক
              </span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>বাম পাশ (স্লট ১ - ৫)</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>হিরো বক্সের ১ম কলাম</span>
          </div>

          {[1, 2, 3, 4, 5].map((slot) => {
            const item = slotsMap[slot];
            return (
              <SlotCard
                key={slot}
                slot={slot}
                item={item}
                onEdit={() => handleOpenModal(slot, item)}
                onDelete={() => item && handleDeleteProduct(item.id, slot)}
                onToggleActive={() => item && handleToggleActive(item)}
              />
            );
          })}
        </div>

        {/* Right Side: Slots 6 to 10 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'var(--surface)',
              borderRadius: '8px',
              border: '1px solid var(--rule)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                খ
              </span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>ডান পাশ (স্লট ৬ - ১০)</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>হিরো বক্সের ২য় কলাম</span>
          </div>

          {[6, 7, 8, 9, 10].map((slot) => {
            const item = slotsMap[slot];
            return (
              <SlotCard
                key={slot}
                slot={slot}
                item={item}
                onEdit={() => handleOpenModal(slot, item)}
                onDelete={() => item && handleDeleteProduct(item.id, slot)}
                onToggleActive={() => item && handleToggleActive(item)}
              />
            );
          })}
        </div>
      </div>

      {/* Add / Edit Package Product Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backdropFilter: 'blur(3px)'
            }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--surface)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                border: '1px solid var(--rule)'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--rule)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>
                    {editingItem ? `স্লট ${toBengaliNumber(slotNumber)} সম্পাদনা` : `স্লট ${toBengaliNumber(slotNumber)} এ পণ্য যোগ`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: '4px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveProduct} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Slot Number & Quick Store Select */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        স্লট নম্বর
                      </label>
                      <select
                        value={slotNumber}
                        onChange={(e) => setSlotNumber(Number(e.target.value))}
                        className="admin-input"
                        style={{ width: '100%', padding: '9px 12px' }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num}>
                            স্লট {toBengaliNumber(num)} {num <= 5 ? '(বাম)' : '(ডান)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        দোকানের পণ্য থেকে অটো-ফিল করুন (ঐচ্ছিক)
                      </label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => handleSelectStoreProduct(e.target.value)}
                        className="admin-input"
                        style={{ width: '100%', padding: '9px 12px' }}
                      >
                        <option value="">-- তালিকা থেকে পছন্দ করুন --</option>
                        {allStoreProducts.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} ({prod.unit}) - নিয়মিত ৳{toBengaliNumber(prod.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Product Name & Unit */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        পণ্যের নাম <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: মিনিকেট চাউল"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="admin-input"
                        disabled
                        style={{ width: '100%', padding: '9px 12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        ইউনিট / ওজন <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="১ কেজি / ১ লিটার"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="admin-input"
                        style={{ width: '100%', padding: '9px 12px' }}
                      />
                    </div>
                  </div>

                  {/* Pricing Fields: Cost Price, Regular Price, Discount Amount */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        কেনা দাম (Cost)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="৳ কেনা দাম"
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                        className="admin-input"
                        disabled
                        style={{ width: '100%', padding: '9px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        নিয়মিত বিক্রয় মূল্য <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.5"
                        placeholder="৳ নিয়মিত দাম"
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                        className="admin-input"
                        disabled
                        style={{ width: '100%', padding: '9px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                        প্যাকেজ ছাড় (টাকায়)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="৳ ডিসকাউন্ট"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        className="admin-input"
                        style={{ width: '100%', padding: '9px 12px' }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Calculation & Real-Time Loss Warning */}
                  <div
                    style={{
                      background: isLoss ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                      border: `1px solid ${isLoss ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                      borderRadius: '10px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                        প্যাকেজ বিক্রয় মূল্য:
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: isLoss ? 'var(--danger)' : 'var(--primary)' }}>
                        ৳ {toBengaliNumber(finalPrice.toFixed(0))}
                        {numRegular > 0 && numDiscount > 0 && (
                          <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--muted)', marginLeft: '6px' }}>
                            ৳{toBengaliNumber(numRegular)}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Margin info */}
                    {numCost > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
                        <span>কেনা দাম: ৳{toBengaliNumber(numCost)}</span>
                        <span style={{ fontWeight: '600', color: profitMargin >= 0 ? '#10b981' : '#ef4444' }}>
                          {profitMargin >= 0 ? `লাভ: +৳${toBengaliNumber(profitMargin.toFixed(1))}` : `ক্ষতি: -৳${toBengaliNumber(Math.abs(profitMargin).toFixed(1))}`}
                        </span>
                      </div>
                    )}

                    {/* USER MANDATE: Loss Prevention Warning */}
                    {isLoss && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          marginTop: '8px',
                          padding: '10px 12px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          lineHeight: '1.4'
                        }}
                      >
                        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                          সতর্কতা: ডিসকাউন্ট দেওয়ার পর প্যাকেজ মূল্য (৳{toBengaliNumber(finalPrice)}) আপনার পণ্যের কেনা দাম (৳{toBengaliNumber(numCost)}) থেকে কম হয়ে যাচ্ছে! এতে প্রতি বিক্রিতে ৳{toBengaliNumber(Math.abs(profitMargin).toFixed(1))} লোকসান হবে।
                        </div>
                      </div>
                    )}

                    {!isLoss && numCost > 0 && numDiscount > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#065f46',
                          fontWeight: '500'
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>মূল্য নির্ধারণ উপযুক্ত এবং প্রতিটি বিক্রিতে লাভজনক।</span>
                      </div>
                    )}
                  </div>

                  {/* Active Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="packageProductActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <label htmlFor="packageProductActive" style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                      এই পণ্যটি হিরো প্যাকেজ বক্সে সক্রিয়ভাবে দেখাবে
                    </label>
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="admin-btn secondary"
                    style={{ padding: '9px 18px' }}
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="admin-btn primary"
                    style={{
                      padding: '9px 22px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600'
                    }}
                  >
                    {submitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual Slot Card Component
function SlotCard({ slot, item, onEdit, onDelete, onToggleActive }) {
  if (!item) {
    return (
      <div
        onClick={onEdit}
        style={{
          border: '1px dashed var(--rule)',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'rgba(0,0,0,0.01)',
          transition: 'all 0.2s ease'
        }}
        className="slot-empty-hover"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: '700',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'var(--surface-hover)',
              color: 'var(--muted)'
            }}
          >
            স্লট {toBengaliNumber(slot)}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>খালি স্লট (পণ্য যুক্ত করতে ক্লিক করুন)</span>
        </div>
        <Plus size={18} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  const isLoss = item.cost_price > 0 && item.final_price < item.cost_price;

  return (
    <div
      style={{
        border: `1px solid ${isLoss ? 'rgba(239, 68, 68, 0.4)' : 'var(--rule)'}`,
        borderRadius: '10px',
        padding: '16px',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        opacity: item.is_active ? 1 : 0.65
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: '700',
              padding: '3px 8px',
              borderRadius: '6px',
              background: item.is_active ? 'var(--primary)' : '#9ca3af',
              color: '#fff'
            }}
          >
            স্লট {toBengaliNumber(slot)}
          </span>

          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
              {item.product_name}
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>একক: {item.unit}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onEdit}
            title="সম্পাদনা করুন"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--primary)',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={onDelete}
            title="মুছে ফেলুন"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--danger)',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Price Information */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          background: 'var(--surface-hover)',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '13px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '12px' }}>
            নিয়মিত: ৳{toBengaliNumber(item.regular_price)}
          </span>
          <span style={{ fontWeight: '700', color: isLoss ? 'var(--danger)' : 'var(--primary)', fontSize: '15px' }}>
            প্যাকেজ: ৳{toBengaliNumber(item.final_price)}
          </span>
          {item.discount_amount > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                background: '#dcfce7',
                color: '#15803d',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              -৳{toBengaliNumber(item.discount_amount)} ছাড়
            </span>
          )}
        </div>

        {item.cost_price > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            কেনা: ৳{toBengaliNumber(item.cost_price)} | {item.final_price >= item.cost_price ? (
              <span style={{ color: '#10b981', fontWeight: '600' }}>
                লাভ +৳{toBengaliNumber((item.final_price - item.cost_price).toFixed(0))}
              </span>
            ) : (
              <span style={{ color: '#ef4444', fontWeight: '700' }}>
                লোকসান -৳{toBengaliNumber((item.cost_price - item.final_price).toFixed(0))}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Warning badge if loss */}
      {isLoss && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#b91c1c',
            fontWeight: '600'
          }}
        >
          <AlertTriangle size={14} />
          <span>সতর্কতা: বিক্রয় মূল্য কেনা দাম থেকে কম!</span>
        </div>
      )}
    </div>
  );
}
