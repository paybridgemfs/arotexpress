"use client";
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProtectedRoute from './ProtectedRoute.jsx';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  CreditCard,
  MapPin,
  Sliders,
  Users,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
  RefreshCw,
  Search,
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  Check,
  Truck,
  Lock,
  Package,
  FolderKanban,
  Building2,
  FileText,
  Bike,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Share2,
  PanelBottom
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { toBengaliNumber, formatStockDisplay } from '../utils/bengali.js';
import AdminDashboard from './AdminDashboard.jsx';
import AdminOrders from './AdminOrders.jsx';
import AdminGroups from './AdminGroups.jsx';
import AdminReports from './AdminReports.jsx';
import AdminReportsHub from './AdminReportsHub.jsx';
import AdminDeliveryRiders from './AdminDeliveryRiders.jsx';
import AdminFinanceTracker from './AdminFinanceTracker.jsx';
import AdminBulkProducts from './AdminBulkProducts.jsx';
import AdminPackageOrders from './AdminPackageOrders.jsx';
import AdminPackageManagement from './AdminPackageManagement.jsx';
import AdminSocialLinks from './AdminSocialLinks.jsx';
import AdminFooterSettings from './AdminFooterSettings.jsx';
import LowStockBanner from './LowStockBanner.jsx';
import CustomerInvoiceModal from './CustomerInvoiceModal.jsx';
import PosReceiptModal from './PosReceiptModal.jsx';
import CategoryIcon from './CategoryIcon.jsx';
import ImageUploadInput from './ImageUploadInput.jsx';
import { uploadImage } from '../utils/upload.js';
import { updateAppMeta } from '../utils/meta.js';

// Low stock threshold constant (< 5)
const LOW_STOCK_THRESHOLD = 5;

export default function AdminPanel({ onNavigateHome }) {
  const { adminUser, adminToken, adminLogin, adminLogout, updateAdminProfile, loading: authLoading, isAuthHydrated } = useAuth();
  const { showToast } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Admin Tab Navigation (State-based to prevent page unmounts and re-fetching)
  const pathname = usePathname() || '/admin';
  const getTabFromPath = (path) => {
    if (!path) return 'dashboard';
    const clean = path.split('?')[0];
    const parts = clean.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'admin') {
      return parts[1];
    }
    return 'dashboard';
  };

  const [adminTab, setAdminTabState] = useState(() => getTabFromPath(pathname));

  // Keep adminTab in sync if URL changes externally
  useEffect(() => {
    const tabFromUrl = getTabFromPath(pathname);
    if (tabFromUrl && tabFromUrl !== adminTab) {
      setAdminTabState(tabFromUrl);
    }
  }, [pathname]);

  // Support browser Back/Forward navigation without page reload
  useEffect(() => {
    const handlePopState = () => {
      const tabFromUrl = getTabFromPath(window.location.pathname);
      setAdminTabState(tabFromUrl);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setAdminTab = (tab) => {
    setAdminTabState(tab);
    const newPath = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    if (typeof window !== 'undefined' && window.location.pathname !== newPath) {
      window.history.pushState({ tab }, '', newPath);
    }
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Login form state (if not authenticated as admin)
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data states
  const [orders, setOrders] = useState([]);
  const [deliveryRiders, setDeliveryRiders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [deliveryAreas, setDeliveryAreas] = useState([]);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(60);
  const [settings, setSettings] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [packageProducts, setPackageProducts] = useState([]);
  const [packageOrders, setPackageOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modals / Edit states for Categories & Brands
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCatData, setNewCatData] = useState({ en: '', bn: '', icon: '', group: 'staples' });
  const [catImageFile, setCatImageFile] = useState(null);
  const [catImagePreview, setCatImagePreview] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);
  
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedCatForBrand, setSelectedCatForBrand] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandForm, setBrandForm] = useState({ name: '', unit: 'প্রতি কেজি', price: '', cost_price: '', image: '', stock: 100, force_stock_out: false });
  const [brandImageFile, setBrandImageFile] = useState(null);
  const [brandImagePreview, setBrandImagePreview] = useState(null);
  const [savingBrand, setSavingBrand] = useState(false);

  // Settings image upload states
  const [settingsFaviconFile, setSettingsFaviconFile] = useState(null);
  const [settingsFaviconPreview, setSettingsFaviconPreview] = useState(null);
  const [settingsLogoFile, setSettingsLogoFile] = useState(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState(null);
  const [settingsBannerFile, setSettingsBannerFile] = useState(null);
  const [settingsBannerPreview, setSettingsBannerPreview] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [adminGroupFilter, setAdminGroupFilter] = useState('all');
  const [adminStockFilter, setAdminStockFilter] = useState('all'); // 'all' | 'low' | 'out' | 'in'

  // Low stock and out-of-stock counts across all products
  const lowStockCount = useMemo(() => {
    let count = 0;
    categories.forEach((c) => {
      c.brands?.forEach((b) => {
        if (!b.force_stock_out && b.stock !== undefined && b.stock > 0 && b.stock < LOW_STOCK_THRESHOLD) {
          count++;
        }
      });
    });
    return count;
  }, [categories]);

  const outOfStockCount = useMemo(() => {
    let count = 0;
    categories.forEach((c) => {
      c.brands?.forEach((b) => {
        if (b.force_stock_out || b.stock === 0) {
          count++;
        }
      });
    });
    return count;
  }, [categories]);

  // Stock Modal
  const [stockModal, setStockModal] = useState(null); // { catId, brand, stock, force_stock_out }
  const [savingStock, setSavingStock] = useState(false);

  // Payments / Delivery state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [newPayment, setNewPayment] = useState({ code: '', name_bn: '', name_en: '', number: '', instructions_bn: '', is_active: true });

  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaForm, setAreaForm] = useState({ name: '', charge: '', is_active: true });
  const [savingFee, setSavingFee] = useState(false);

  // Payment Verification Gateway state
  const [paymentVerifyConfig, setPaymentVerifyConfig] = useState({
    enabled: false,
    api_url: '',
    api_key: ''
  });
  const [isTestingVerifyApi, setIsTestingVerifyApi] = useState(false);
  const [testVerifyResult, setTestVerifyResult] = useState(null);
  const [isSavingVerifyConfig, setIsSavingVerifyConfig] = useState(false);
  const [showVerifyApiKey, setShowVerifyApiKey] = useState(false);
  const [verifySaveMessage, setVerifySaveMessage] = useState(null);

  // Admin Profile Update
  const [newAdminPhone, setNewAdminPhone] = useState(adminUser ? (adminUser.username || adminUser.phone || 'admin') : 'admin');
  const [newAdminName, setNewAdminName] = useState(adminUser ? (adminUser.name || 'সুপার অ্যাডমিন') : 'সুপার অ্যাডমিন');
  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminPassMsg, setAdminPassMsg] = useState({ text: '', type: '' });
  const [savingAdminProfile, setSavingAdminProfile] = useState(false);

  // Keep credentials form in sync if adminUser changes
  useEffect(() => {
    if (adminUser) {
      if (adminUser.name) setNewAdminName(adminUser.name);
      if (adminUser.username || adminUser.phone) setNewAdminPhone(adminUser.username || adminUser.phone);
    }
  }, [adminUser]);

  const isAdmin = !!adminUser && adminUser.role === 'admin' && !!adminToken;

  // Fetch all admin data when logged in as admin
  const fetchAllData = async () => {
    if (!adminToken) return;
    setLoadingData(true);
    try {
      const [ordRes, catRes, payRes, areaRes, setRes, usrRes, riderRes, verifyRes, pkgProdRes, pkgOrdRes] = await Promise.all([
        fetch('/api/orders', { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch('/api/categories'),
        fetch('/api/payment-methods'),
        fetch('/api/delivery-areas'),
        fetch('/api/settings'),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch('/api/delivery-riders', { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch('/api/admin/payment-verify', { headers: { Authorization: `Bearer ${adminToken}` } }),
        fetch('/api/package-products?all=1'),
        fetch('/api/package-orders', { headers: { Authorization: `Bearer ${adminToken}` } })
      ]);

      if (ordRes.ok) setOrders(await ordRes.json());
      if (pkgOrdRes && pkgOrdRes.ok) setPackageOrders(await pkgOrdRes.json());
      if (pkgProdRes && pkgProdRes.ok) {
        const pkgData = await pkgProdRes.json();
        const list = Array.isArray(pkgData)
          ? pkgData
          : Array.isArray(pkgData?.products)
          ? pkgData.products
          : [];
        setPackageProducts(list);
      }
      if (riderRes && riderRes.ok) setDeliveryRiders(await riderRes.json());
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
        setGroups(catData.groups || []);
      }
      if (payRes.ok) setPaymentMethods(await payRes.json());
      if (areaRes.ok) {
        const areaData = await areaRes.json();
        setDeliveryAreas(areaData.areas || []);
        if (typeof areaData.default_delivery_fee === 'number') {
          setDefaultDeliveryFee(areaData.default_delivery_fee);
        }
      }
      if (setRes.ok) {
        const setData = await setRes.json();
        setSettings(setData);
        if (typeof setData.default_delivery_fee === 'number') {
          setDefaultDeliveryFee(setData.default_delivery_fee);
        }
      }
      if (usrRes.ok) setUsersList(await usrRes.json());
      if (verifyRes && verifyRes.ok) {
        const verifyData = await verifyRes.json();
        setPaymentVerifyConfig({
          enabled: !!verifyData.enabled,
          api_url: verifyData.api_url || '',
          api_key: verifyData.api_key || ''
        });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin, adminToken]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const loggedUser = await adminLogin(adminUsername, adminPassword);
      if (loggedUser.role !== 'admin') {
        adminLogout();
        setLoginError('আপনি অ্যাডমিন নন। শুধুমাত্র অ্যাডমিন লগইন করতে পারবেন।');
      } else {
        showToast('অ্যাডমিন প্যানেলে স্বাগতম');
      }
    } catch (err) {
      setLoginError(err.message || 'ভুল ইউজারনেম বা পাসওয়ার্ড');
    } finally {
      setLoginLoading(false);
    }
  };

  // Status Change for Order with Rider Info
  const handleOrderStatusChange = async (orderId, newStatus, riderInfo) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus, ...(riderInfo || {}) })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map((o) => (o.id === orderId ? (typeof updated === 'object' && updated.id ? updated : { ...o, status: newStatus, ...(riderInfo || {}) }) : o)));
        showToast(`অর্ডার #${orderId} স্ট্যাটাস '${newStatus}' করা হয়েছে`);
      }
    } catch (err) {
      showToast('স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে');
    }
  };

  const handlePackageOrderStatusChange = async (orderId, newStatus, riderInfo) => {
    try {
      const res = await fetch(`/api/package-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus, ...(riderInfo || {}) })
      });
      if (res.ok) {
        const updated = await res.json();
        setPackageOrders(packageOrders.map((o) => (o.id === orderId ? (typeof updated === 'object' && updated.id ? updated : { ...o, status: newStatus, ...(riderInfo || {}) }) : o)));
        showToast(`প্যাকেজ অর্ডার স্ট্যাটাস '${newStatus}' করা হয়েছে`);
      }
    } catch (err) {
      showToast('স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে');
    }
  };

  const handlePackageOrderAssignRider = async (orderId, riderId) => {
    try {
      const res = await fetch(`/api/package-orders/${orderId}/rider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ riderId, rider_id: riderId })
      });
      if (res.ok) {
        const updated = await res.json();
        setPackageOrders(packageOrders.map((o) => (o.id === orderId ? (typeof updated === 'object' && updated.id ? updated : { ...o, delivery_rider_id: riderId }) : o)));
        showToast('রাইডার সফলভাবে নির্ধারণ করা হয়েছে');
        fetchAllData();
      }
    } catch (err) {
      showToast('রাইডার নির্ধারণে সমস্যা হয়েছে');
    }
  };

  // Category & Product Modal Openers with Image State Reset
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setNewCatData({ en: '', bn: '', icon: '', group: groups[0]?.key || 'staples' });
    setCatImageFile(null);
    setCatImagePreview(null);
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setNewCatData({ en: cat.en, bn: cat.bn, icon: cat.icon || '', group: cat.group });
    setCatImageFile(null);
    setCatImagePreview(cat.icon || null);
    setCategoryModalOpen(true);
  };

  const handleOpenAddBrand = (cat) => {
    setSelectedCatForBrand(cat);
    setEditingBrand(null);
    setBrandForm({ name: '', unit: 'প্রতি কেজি', price: '', cost_price: '', image: '', stock: 100, force_stock_out: false });
    setBrandImageFile(null);
    setBrandImagePreview(null);
    setProductModalOpen(true);
  };

  const handleOpenEditBrand = (cat, b) => {
    setSelectedCatForBrand(cat);
    setEditingBrand(b);
    setBrandForm({
      name: b.name,
      unit: b.unit,
      price: String(b.price),
      cost_price: b.cost_price !== undefined ? String(b.cost_price) : '',
      image: b.image || '',
      stock: b.stock ?? 100,
      force_stock_out: b.force_stock_out ?? false
    });
    setBrandImageFile(null);
    setBrandImagePreview(b.image || null);
    setProductModalOpen(true);
  };

  // Category Save
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCatData.bn || !newCatData.en) return;

    setSavingCategory(true);
    let finalIcon = newCatData.icon ? newCatData.icon.trim() : '';

    try {
      if (catImageFile) {
        showToast('লোগো ছবি ImgBB-তে আপলোড হচ্ছে...');
        finalIcon = await uploadImage(catImageFile);
      }

      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ ...newCatData, icon: finalIcon })
      });
      if (res.ok) {
        const savedCat = await res.json();
        if (editingCategory) {
          setCategories(categories.map((c) => (c.id === savedCat.id ? savedCat : c)));
          showToast('ক্যাটাগরি আপডেট করা হয়েছে');
        } else {
          setCategories([...categories, savedCat]);
          showToast('নতুন ক্যাটাগরি তৈরি হয়েছে');
        }
        setCategoryModalOpen(false);
        setEditingCategory(null);
        setNewCatData({ en: '', bn: '', icon: '', group: 'staples' });
        setCatImageFile(null);
        setCatImagePreview(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'ক্যাটাগরি সংরক্ষণে সমস্যা হয়েছে');
      }
    } catch (err) {
      showToast(err.message || 'ক্যাটাগরি সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSavingCategory(false);
    }
  };

  // Category Delete
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('আপনি কি এই ক্যাটাগরি এবং এর অধীনস্থ সকল পণ্য মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== id));
        showToast('ক্যাটাগরি মুছে ফেলা হয়েছে');
      }
    } catch (err) {
      showToast('ক্যাটাগরি মুছতে ব্যর্থ');
    }
  };

  // Save Brand
  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!selectedCatForBrand) return;

    setSavingBrand(true);
    let finalImage = brandForm.image ? brandForm.image.trim() : '';

    try {
      if (brandImageFile) {
        showToast('পণ্যের ছবি ImgBB-তে আপলোড হচ্ছে...');
        finalImage = await uploadImage(brandImageFile);
      }

      const brandPayload = {
        name: brandForm.name.trim(),
        unit: brandForm.unit.trim(),
        price: parseFloat(brandForm.price) || 0,
        cost_price: parseFloat(brandForm.cost_price) || 0,
        image: finalImage,
        stock: parseInt(brandForm.stock) || 0,
        force_stock_out: Boolean(brandForm.force_stock_out)
      };

      if (editingBrand) {
        const res = await fetch(`/api/products/${editingBrand.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(brandPayload)
        });
        if (res.ok) {
          const updatedBrand = await res.json();
          setCategories(
            categories.map((c) => {
              if (c.id === selectedCatForBrand.id) {
                return {
                  ...c,
                  brands: c.brands.map((b) => (b.id === editingBrand.id ? updatedBrand : b))
                };
              }
              return c;
            })
          );
          showToast(`'${brandPayload.name}' পণ্যের তথ্য আপডেট করা হয়েছে`);
          setProductModalOpen(false);
          setSelectedCatForBrand(null);
          setEditingBrand(null);
          setBrandForm({ name: '', unit: 'প্রতি কেজি', price: '', cost_price: '', image: '', stock: 100, force_stock_out: false });
          setBrandImageFile(null);
          setBrandImagePreview(null);
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.error || 'পণ্য আপডেট করতে সমস্যা হয়েছে');
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            category_id: selectedCatForBrand.id,
            ...brandPayload
          })
        });
        if (res.ok) {
          const createdBrand = await res.json();
          setCategories(
            categories.map((c) => {
              if (c.id === selectedCatForBrand.id) {
                return { ...c, brands: [...c.brands, createdBrand] };
              }
              return c;
            })
          );
          showToast(`'${brandPayload.name}' পণ্য যোগ করা হয়েছে`);
          setProductModalOpen(false);
          setSelectedCatForBrand(null);
          setEditingBrand(null);
          setBrandForm({ name: '', unit: 'প্রতি কেজি', price: '', cost_price: '', image: '', stock: 100, force_stock_out: false });
          setBrandImageFile(null);
          setBrandImagePreview(null);
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.error || 'পণ্য যোগ করতে সমস্যা হয়েছে');
        }
      }
    } catch (err) {
      showToast(err.message || 'পণ্য সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSavingBrand(false);
    }
  };

  // Delete Brand (100% ID-based)
  const handleDeleteBrand = async (catId, brandOrId) => {
    const brandId = typeof brandOrId === 'object' ? brandOrId.id : (typeof brandOrId === 'number' ? brandOrId : null);
    const brandName = typeof brandOrId === 'object' ? brandOrId.name : 'পণ্য';

    if (!window.confirm(`আপনি কি '${brandName}' পণ্যটি মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/products/${brandId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setCategories(
          categories.map((c) => {
            if (c.id === catId) {
              return {
                ...c,
                brands: c.brands.filter((b) => b.id !== brandId)
              };
            }
            return c;
          })
        );
        showToast(`'${brandName}' পণ্য মুছে ফেলা হয়েছে`);
      }
    } catch (err) {
      showToast('পণ্য মুছতে ব্যর্থ');
    }
  };

  // Open Stock Edit Modal
  const handleOpenStockModal = (catId, brand) => {
    setStockModal({
      catId,
      brandId: brand.id,
      brandName: brand.name,
      unit: brand.unit,
      stock: brand.stock ?? 100,
      force_stock_out: brand.force_stock_out ?? false
    });
  };

  // Save Stock and Status (100% ID-based)
  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!stockModal || !stockModal.brandId) {
      showToast('পণ্যের তথ্য খুঁজে পাওয়া যায়নি');
      return;
    }
    setSavingStock(true);
    try {
      const res = await fetch(`/api/products/${stockModal.brandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ 
          stock: stockModal.stock,
          force_stock_out: stockModal.force_stock_out
        })
      });
      if (res.ok) {
        const updatedBrand = await res.json();
        setCategories(
          categories.map((c) => {
            if (c.id === stockModal.catId) {
              return {
                ...c,
                brands: c.brands.map((b) => (b.id === stockModal.brandId ? updatedBrand : b))
              };
            }
            return c;
          })
        );
        showToast(`'${stockModal.brandName}' এর স্টক সফলভাবে আপডেট করা হয়েছে`);
        setStockModal(null);
      }
    } catch (err) {
      showToast('স্টক সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSavingStock(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      let updatedSettings = { ...settings };

      if (settingsFaviconFile) {
        showToast('ফেভিকন ছবি ImgBB-তে আপলোড হচ্ছে...');
        const faviconUrl = await uploadImage(settingsFaviconFile);
        updatedSettings.favicon_image_url = faviconUrl;
      }

      if (settingsLogoFile) {
        showToast('লোগো ছবি ImgBB-তে আপলোড হচ্ছে...');
        const logoUrl = await uploadImage(settingsLogoFile);
        updatedSettings.logo_image_url = logoUrl;
      }

      if (settingsBannerFile) {
        showToast('ব্যানার ছবি ImgBB-তে আপলোড হচ্ছে...');
        const bannerUrl = await uploadImage(settingsBannerFile);
        updatedSettings.banner_url = bannerUrl;
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        setSettings(updatedSettings);
        setSettingsFaviconFile(null);
        setSettingsFaviconPreview(null);
        setSettingsLogoFile(null);
        setSettingsLogoPreview(null);
        setSettingsBannerFile(null);
        setSettingsBannerPreview(null);
        updateAppMeta(updatedSettings);
        showToast('হেডার লোগো, ফেভিকন ও সাইট সেটিংস সংরক্ষিত হয়েছে');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'সেটিংস সংরক্ষণে ব্যর্থ');
      }
    } catch (err) {
      showToast(err.message || 'সেটিংস সংরক্ষণে ব্যর্থ');
    } finally {
      setSavingSettings(false);
    }
  };

  // Payment Method Save
  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    try {
      const isEdit = Boolean(editingPayment && editingPayment.id);
      const url = isEdit ? `/api/payment-methods/${editingPayment.id}` : '/api/payment-methods';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(newPayment)
      });
      if (res.ok) {
        const saved = await res.json();
        const exists = paymentMethods.find((p) => p.id === saved.id || p.code === saved.code);
        if (exists) {
          setPaymentMethods(paymentMethods.map((p) => (p.id === saved.id || p.code === saved.code ? saved : p)));
          showToast('পেমেন্ট মেথড আপডেট করা হয়েছে');
        } else {
          setPaymentMethods([...paymentMethods, saved]);
          showToast('নতুন পেমেন্ট মেথড যোগ হয়েছে');
        }
        setEditingPayment(null);
        setNewPayment({ code: '', name_bn: '', name_en: '', number: '', instructions_bn: '', is_active: true });
        setIsPaymentModalOpen(false);
      }
    } catch (err) {
      showToast('পেমেন্ট মেথড সংরক্ষণে ত্রুটি');
    }
  };

  // Toggle Payment Method Status Directly on Click
  const handleTogglePaymentStatus = async (payment) => {
    try {
      const newStatus = payment.is_active !== false ? false : true;
      const targetId = payment.id !== undefined ? payment.id : payment.code;
      const res = await fetch(`/api/payment-methods/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setPaymentMethods((prev) =>
          prev.map((p) => ((p.id && p.id === updated.id) || p.code === updated.code ? { ...p, ...updated, is_active: newStatus } : p))
        );
        showToast(`'${payment.name_bn}' পেমেন্ট মেথডটি ${newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
      } else {
        showToast('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
      }
    } catch (err) {
      showToast('স্ট্যাটাস পরিবর্তন ব্যর্থ');
    }
  };

  // Save Payment Verification Gateway Config
  const handleSavePaymentVerifyConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingVerifyConfig(true);
    setVerifySaveMessage(null);
    try {
      const res = await fetch('/api/admin/payment-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(paymentVerifyConfig)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে');
      setVerifySaveMessage({ type: 'success', text: 'পেমেন্ট ভেরিফিকেশন গেটওয়ে সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' });
      showToast('পেমেন্ট গেটওয়ে সেটিংস সংরক্ষিত হয়েছে');
    } catch (err) {
      setVerifySaveMessage({ type: 'error', text: err.message || 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে' });
      showToast(err.message || 'সেটিংস সংরক্ষণে ত্রুটি');
    } finally {
      setIsSavingVerifyConfig(false);
    }
  };

  // Test Payment Verification API
  const handleTestPaymentVerifyApi = async () => {
    setIsTestingVerifyApi(true);
    setTestVerifyResult(null);
    try {
      const res = await fetch('/api/admin/payment-verify/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          api_url: paymentVerifyConfig.api_url,
          api_key: paymentVerifyConfig.api_key
        })
      });
      const data = await res.json();
      setTestVerifyResult(data);
    } catch (err) {
      setTestVerifyResult({
        success: false,
        message: 'টেস্ট রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে: ' + err.message
      });
    } finally {
      setIsTestingVerifyApi(false);
    }
  };

  // Default Delivery Fee Save
  const handleSaveDefaultFee = async (e) => {
    e.preventDefault();
    setSavingFee(true);
    try {
      const feeNum = parseFloat(defaultDeliveryFee) || 0;
      const res = await fetch('/api/delivery-areas/default-fee', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ default_fee: feeNum })
      });
      if (res.ok) {
        const data = await res.json();
        setDefaultDeliveryFee(data.default_delivery_fee);
        showToast(`ডিফল্ট ডেলিভারি চার্জ ৳${data.default_delivery_fee} সংরক্ষিত হয়েছে`);
      }
    } catch (err) {
      showToast('ডিফল্ট ফি সংরক্ষণে সমস্যা');
    } finally {
      setSavingFee(false);
    }
  };

  // Area Save
  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return;

    try {
      const payload = {
        name: areaForm.name.trim(),
        charge: areaForm.charge !== '' ? parseFloat(areaForm.charge) : undefined,
        is_active: areaForm.is_active
      };

      if (editingArea) {
        const res = await fetch(`/api/delivery-areas/${editingArea.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setDeliveryAreas(deliveryAreas.map((a) => (a.id === updated.id ? updated : a)));
          showToast(`'${updated.name}' এলাকা আপডেট হয়েছে`);
          setEditingArea(null);
          setAreaForm({ name: '', charge: '', is_active: true });
          setIsAreaModalOpen(false);
        }
      } else {
        const res = await fetch('/api/delivery-areas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setDeliveryAreas([...deliveryAreas, created]);
          showToast(`নতুন এলাকা '${created.name}' যুক্ত হয়েছে`);
          setAreaForm({ name: '', charge: '', is_active: true });
          setIsAreaModalOpen(false);
        }
      }
    } catch (err) {
      showToast('এলাকা সংরক্ষণে ত্রুটি হয়েছে');
    }
  };

  const handleDeleteArea = async (id, name) => {
    if (!window.confirm(`আপনি কি '${name}' এলাকাটি মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`/api/delivery-areas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setDeliveryAreas(deliveryAreas.filter((a) => a.id !== id));
        showToast(`'${name}' এলাকা মুছে ফেলা হয়েছে`);
      }
    } catch (err) {
      showToast('এলাকা মুছতে সমস্যা হয়েছে');
    }
  };

  const handleToggleAreaStatus = async (area) => {
    try {
      const res = await fetch(`/api/delivery-areas/${area.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ is_active: !area.is_active })
      });
      if (res.ok) {
        const updated = await res.json();
        setDeliveryAreas(deliveryAreas.map((a) => (a.id === updated.id ? updated : a)));
        showToast(`এলাকাটি ${!area.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
      }
    } catch (err) {
      showToast('স্ট্যাটাস পরিবর্তন ব্যর্থ');
    }
  };

  // Admin Credentials Update
  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    setAdminPassMsg({ text: '', type: '' });

    if (!newAdminName.trim()) {
      setAdminPassMsg({ text: 'অ্যাডমিনের নাম দিতে হবে', type: 'error' });
      return;
    }

    if (!newAdminPhone.trim()) {
      setAdminPassMsg({ text: 'অ্যাডমিন ইউজারনেম দিতে হবে', type: 'error' });
      return;
    }

    // If changing password, validate fields
    if (newAdminPass.trim()) {
      if (!currentAdminPass.trim()) {
        setAdminPassMsg({ text: 'পাসওয়ার্ড পরিবর্তন করতে বর্তমান পাসওয়ার্ড দিন', type: 'error' });
        return;
      }
      if (newAdminPass.trim().length < 4) {
        setAdminPassMsg({ text: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে', type: 'error' });
        return;
      }
      if (newAdminPass.trim() !== confirmAdminPass.trim()) {
        setAdminPassMsg({ text: 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি', type: 'error' });
        return;
      }
    }

    setSavingAdminProfile(true);
    try {
      await updateAdminProfile({
        name: newAdminName.trim(),
        username: newAdminPhone.trim(),
        current_password: currentAdminPass.trim() || undefined,
        new_password: newAdminPass.trim() || undefined
      });
      setAdminPassMsg({ text: 'অ্যাডমিন ক্রেডেনশিয়াল সফলভাবে আপডেট হয়েছে', type: 'success' });
      setCurrentAdminPass('');
      setNewAdminPass('');
      setConfirmAdminPass('');
      showToast('অ্যাডমিন ক্রেডেনশিয়াল আপডেট হয়েছে');
    } catch (err) {
      setAdminPassMsg({ text: err.message || 'আপডেট করতে ব্যর্থ', type: 'error' });
    } finally {
      setSavingAdminProfile(false);
    }
  };

  // If NOT yet mounted or auth is hydrating, render neutral loading placeholder
  if (!mounted || !isAuthHydrated || authLoading) {
    return (
      <div className="section-wrap" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 600 }}>লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="section-wrap" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          className="auth-modal"
          style={{ maxWidth: '420px', margin: '40px auto' }}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} />
            <span>আড়ৎ এক্সপ্রেস — অ্যাডমিন লগইন</span>
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
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
            শুধুমাত্র অনুমোদিত অ্যাডমিনের জন্য সংরক্ষিত পোর্টাল।
          </p>
          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: '#ffeded', border: '1px solid #FECDD3', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '14px', fontWeight: 500 }}
            >
              {loginError}
            </motion.div>
          )}
          <form onSubmit={handleAdminLogin}>
            <div className="field">
              <label>অ্যাডমিন ইউজারনেম</label>
              <input
                type="text"
                placeholder="admin"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>অ্যাডমিন পাসওয়ার্ড</label>
              <input
                type="password"
                placeholder="পাসওয়ার্ড দিন"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            <motion.button
              type="submit"
              className="submit-btn"
              disabled={loginLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loginLoading ? 'যাচাই করা হচ্ছে...' : 'অ্যাডমিন লগইন'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

  // Admin Dashboard Render
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
          <div className="stamp" style={{ width: '40px', height: '40px', fontSize: '14px' }}>AE</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>আড়ৎ অ্যাডমিন</div>
            <div style={{ fontSize: '11.5px', color: 'var(--green-dim)' }}>ম্যানেজমেন্ট কন্ট্রোল</div>
          </div>
        </div>

        <nav className="admin-nav">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setAdminTab('dashboard'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <LayoutDashboard size={16} />
            <span>ড্যাশবোর্ড ও বিশ্লেষণ</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setAdminTab('orders'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <ShoppingBag size={16} />
            <span>অর্ডারসমূহ ({orders.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'package_orders' ? 'active' : ''}`}
            onClick={() => { setAdminTab('package_orders'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <Package size={16} />
            <span>প্যাকেজ অর্ডারসমূহ ({packageOrders.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'riders' ? 'active' : ''}`}
            onClick={() => { setAdminTab('riders'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <Bike size={16} />
            <span>ডেলিভারিম্যান ({deliveryRiders.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'users' ? 'active' : ''}`}
            onClick={() => { setAdminTab('users'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <Users size={16} />
            <span>কাস্টমার তালিকা ({usersList.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'products' ? 'active' : ''}`}
            onClick={() => { setAdminTab('products'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <Layers size={16} />
            <span>ক্যাটাগরি ও পণ্য ({categories.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'package_management' ? 'active' : ''}`}
            onClick={() => { setAdminTab('package_management'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <Package size={16} />
            <span>প্যাকেজ বক্স (Hero 10)</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'groups' ? 'active' : ''}`}
            onClick={() => { setAdminTab('groups'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <FolderKanban size={16} />
            <span>গ্রুপ ব্যবস্থাপনা ({groups.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'delivery' ? 'active' : ''}`}
            onClick={() => { setAdminTab('delivery'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <MapPin size={16} />
            <span>ডেলিভারি ও ঠিকানা ({deliveryAreas.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'payments' ? 'active' : ''}`}
            onClick={() => { setAdminTab('payments'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <CreditCard size={16} />
            <span>পেমেন্ট মেথড ({paymentMethods.length})</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'expenses' || adminTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setAdminTab('expenses'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <BarChart3 size={16} />
            <span>আয়-ব্যয় ও লাভ-ক্ষতি</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'reports_hub' ? 'active' : ''}`}
            onClick={() => { setAdminTab('reports_hub'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <FileText size={16} />
            <span>রিপোর্টস ও প্রিন্ট</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setAdminTab('settings'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <Sliders size={16} />
            <span>সাইট সেটিংস</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'footer_settings' || adminTab === 'footer' ? 'active' : ''}`}
            onClick={() => { setAdminTab('footer_settings'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <PanelBottom size={16} />
            <span>ফুটার সেটিংস</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'social_links' ? 'active' : ''}`}
            onClick={() => { setAdminTab('social_links'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <Share2 size={16} />
            <span>সোশ্যাল লিংকস</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className={`admin-nav-item ${adminTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setAdminTab('profile'); setSidebarOpen(false); window.scrollTo(0, 0); }}
          >
            <KeyRound size={16} />
            <span>অ্যাডমিন ক্রেডেনশিয়াল</span>
          </motion.button>
        </nav>

        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '14px', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="admin-btn danger"
            style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => { adminLogout(); onNavigateHome(); }}
          >
            <LogOut size={15} />
            <span>লগআউট</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="admin-btn"
            style={{ width: '100%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={onNavigateHome}
          >
            <ExternalLink size={14} />
            <span>সাইট লাইভ ভিউ</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        {/* Mobile menu trigger */}
        <div className="admin-mobile-bar no-print">
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="মেনু খুলুন"
          >
            <Menu size={18} />
            <span>অ্যাডমিন মেনু</span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="admin-btn secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              onClick={() => setBulkModalOpen(true)}
            >
              <FileSpreadsheet size={14} color="#16a34a" />
            </button>
            <button
              className="admin-btn secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              onClick={fetchAllData}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Low Stock Real-time Alert Banner */}
        <LowStockBanner
          categories={categories}
          onOpenStockModal={handleOpenStockModal}
          onRefresh={fetchAllData}
          showToast={showToast}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={adminTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* 0. DASHBOARD TAB */}
            {adminTab === 'dashboard' && (
              <AdminDashboard
                orders={orders}
                categories={categories}
                usersList={usersList}
                onNavigateTab={(tab) => setAdminTab(tab)}
                onOpenReceipt={(ord) => setSelectedOrderForReceipt(ord)}
              />
            )}

            {/* 1. ORDERS TAB */}
            {adminTab === 'orders' && (
              <AdminOrders
                orders={orders}
                deliveryRiders={deliveryRiders}
                onUpdateStatus={handleOrderStatusChange}
                onOpenReceipt={(ord) => setSelectedOrderForReceipt(ord)}
                onOpenInvoice={(ord) => setInvoiceModalOrder(ord)}
              />
            )}

            {/* 1.1. PACKAGE ORDERS TAB */}
            {adminTab === 'package_orders' && (
              <AdminPackageOrders
                packageOrders={packageOrders}
                deliveryRiders={deliveryRiders}
                onUpdateStatus={handlePackageOrderStatusChange}
                onAssignRider={handlePackageOrderAssignRider}
                onOpenReceipt={(ord) => setSelectedOrderForReceipt(ord)}
                onOpenInvoice={(ord) => setInvoiceModalOrder(ord)}
                onRefresh={fetchAllData}
              />
            )}

            {/* 1.15. HERO PACKAGE PRODUCTS MANAGEMENT TAB */}
            {adminTab === 'package_management' && (
              <AdminPackageManagement
                packageProducts={packageProducts}
                categories={categories}
                settings={settings}
                adminToken={adminToken}
                onRefresh={fetchAllData}
              />
            )}

            {/* 1.2. DELIVERY RIDERS TAB */}
            {adminTab === 'riders' && (
              <AdminDeliveryRiders
                deliveryRiders={deliveryRiders}
                deliveryAreas={deliveryAreas}
                orders={orders}
                packageOrders={packageOrders}
                onRefresh={fetchAllData}
                adminToken={adminToken}
                showToast={showToast}
              />
            )}

            {/* 1.4. FINANCE & P&L INTEGRATED TAB */}
            {(adminTab === 'expenses' || adminTab === 'reports') && (
              <AdminFinanceTracker
                adminToken={adminToken}
                orders={orders}
                packageOrders={packageOrders}
                categories={categories}
                showToast={showToast}
              />
            )}

            {/* 1.5. GROUPS MANAGEMENT TAB */}
            {adminTab === 'groups' && (
              <AdminGroups
                groups={groups}
                categories={categories}
                adminToken={adminToken}
                showToast={showToast}
                onGroupsUpdated={fetchAllData}
              />
            )}

        {/* 2. CATEGORIES, PRODUCTS & 7-DAY PRICE SCHEDULE TAB */}
        {adminTab === 'products' && (
          <div>
            {/* Top Summary Metrics */}
            {(() => {
              const totalCategories = categories.length;
              let totalProductsCount = 0;
              let inStockCount = 0;
              let outOfStockCount = 0;

              categories.forEach((cat) => {
                (cat.brands || []).forEach((b) => {
                  totalProductsCount++;
                  if (b.force_stock_out || b.stock === 0) {
                    outOfStockCount++;
                  } else {
                    inStockCount++;
                  }
                });
              });

              return (
                <div className="admin-products-metrics-grid">
                  <div className="metric-stat-card">
                    <div className="stat-icon-wrap" style={{ background: 'rgba(0, 108, 76, 0.12)', color: 'var(--green)' }}>
                      <Package size={20} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-label">মোট ক্যাটাগরি</div>
                      <div className="stat-value mono">{toBengaliNumber(totalCategories)} টি</div>
                    </div>
                  </div>

                  <div className="metric-stat-card">
                    <div className="stat-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}>
                      <Layers size={20} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-label">মোট পণ্য তালিকা</div>
                      <div className="stat-value mono">{toBengaliNumber(totalProductsCount)} টি</div>
                    </div>
                  </div>

                  <div className="metric-stat-card">
                    <div className="stat-icon-wrap" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-label">স্টকে মজুদ আছে</div>
                      <div className="stat-value mono" style={{ color: '#059669' }}>{toBengaliNumber(inStockCount)} টি</div>
                    </div>
                  </div>

                  <div className="metric-stat-card">
                    <div className="stat-icon-wrap" style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#e11d48' }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-label">স্টক শেষ / স্টক-আউট</div>
                      <div className="stat-value mono" style={{ color: '#e11d48' }}>{toBengaliNumber(outOfStockCount)} টি</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Top Toolbar: Search, Group Filter, and Action Buttons */}
            <div className="admin-products-controls">
              <div className="admin-products-toolbar">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                  <div className="admin-products-search-wrap">
                    <input
                      type="text"
                      placeholder="ক্যাটাগরি বা পণ্যের নাম দিয়ে খুঁজুন..."
                      value={adminProductSearch}
                      onChange={(e) => setAdminProductSearch(e.target.value)}
                    />
                    <span className="search-icon">
                      <Search size={15} />
                    </span>
                    {adminProductSearch && (
                      <button
                        type="button"
                        onClick={() => setAdminProductSearch('')}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          color: 'var(--muted)'
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)' }}>গ্রুপ:</span>
                    <select
                      value={adminGroupFilter}
                      onChange={(e) => setAdminGroupFilter(e.target.value)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--rule)',
                        background: '#F8FAF9',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">সকল গ্রুপ ({categories.length})</option>
                      {groups.map((g) => (
                        <option key={g.key} value={g.key}>
                          {g.bn} ({categories.filter((c) => c.group === g.key).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)' }}>স্টক ফিল্টার:</span>
                    <select
                      value={adminStockFilter}
                      onChange={(e) => setAdminStockFilter(e.target.value)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--rule)',
                        background: adminStockFilter === 'low' ? '#FEF3C7' : adminStockFilter === 'out' ? '#FEE2E2' : '#F8FAF9',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: adminStockFilter === 'low' ? '#92400E' : adminStockFilter === 'out' ? '#DC2626' : 'var(--ink)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">সকল স্টক অবস্থা</option>
                      <option value="low">⚠️ স্বল্প মজুত (&lt; {toBengaliNumber(LOW_STOCK_THRESHOLD)}) ({toBengaliNumber(lowStockCount)})</option>
                      <option value="out">❌ স্টক শেষ / আউট ({toBengaliNumber(outOfStockCount)})</option>
                      <option value="in">✅ পর্যাপ্ত মজুত</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="admin-btn secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                    onClick={() => setBulkModalOpen(true)}
                    title="এক্সেল বা CSV এর মাধ্যমে পণ্যের দর ও স্টক একবারে আপডেট করুন"
                  >
                    <FileSpreadsheet size={16} color="#16a34a" />
                    <span>এক্সেল / CSV বাল্ক আপডেট</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700
                    }}
                    onClick={handleOpenAddCategory}
                  >
                    <Plus size={16} />
                    <span>নতুন ক্যাটাগরি তৈরি করুন</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filtered Categories & Products Cards List */}
            {(() => {
              const query = adminProductSearch.trim().toLowerCase();
              const filteredCategories = categories.filter((cat) => {
                if (adminGroupFilter !== 'all' && cat.group !== adminGroupFilter) return false;

                const hasMatchingBrand = cat.brands?.some((b) => {
                  if (adminStockFilter === 'low') {
                    const isLow = !b.force_stock_out && b.stock !== undefined && b.stock > 0 && b.stock < LOW_STOCK_THRESHOLD;
                    if (!isLow) return false;
                  } else if (adminStockFilter === 'out') {
                    const isOut = b.force_stock_out || b.stock === 0;
                    if (!isOut) return false;
                  } else if (adminStockFilter === 'in') {
                    const isIn = !b.force_stock_out && (b.stock === undefined || b.stock >= LOW_STOCK_THRESHOLD);
                    if (!isIn) return false;
                  }
                  if (!query) return true;
                  return (b.name + ' ' + b.unit + ' ' + cat.bn).toLowerCase().includes(query);
                });

                if (!query && adminStockFilter === 'all') return true;
                return (query && (cat.bn + ' ' + cat.en).toLowerCase().includes(query)) || hasMatchingBrand;
              });

              if (filteredCategories.length === 0) {
                return (
                  <div className="admin-empty-state-box">
                    <div className="empty-icon-circle">
                      <Package size={28} />
                    </div>
                    <h4>কোনো ক্যাটাগরি বা পণ্য পাওয়া যায়নি</h4>
                    <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '0 0 16px' }}>
                      {adminStockFilter !== 'all'
                        ? 'নির্বাচিত স্টক ফিল্টারে কোনো পণ্য পাওয়া যায়নি।'
                        : 'অন্য বানানে খুঁজে দেখুন অথবা নতুন ক্যাটাগরি তৈরি করুন।'}
                    </p>
                    <button
                      type="button"
                      className="admin-btn primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
                      onClick={handleOpenAddCategory}
                    >
                      <Plus size={15} />
                      <span>নতুন ক্যাটাগরি যোগ করুন</span>
                    </button>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {filteredCategories.map((cat) => {
                    const groupObj = groups.find((g) => g.key === cat.group);
                    const matchingBrands = cat.brands?.filter((b) => {
                      if (adminStockFilter === 'low') {
                        const isLow = !b.force_stock_out && b.stock !== undefined && b.stock > 0 && b.stock < LOW_STOCK_THRESHOLD;
                        if (!isLow) return false;
                      } else if (adminStockFilter === 'out') {
                        const isOut = b.force_stock_out || b.stock === 0;
                        if (!isOut) return false;
                      } else if (adminStockFilter === 'in') {
                        const isIn = !b.force_stock_out && (b.stock === undefined || b.stock >= LOW_STOCK_THRESHOLD);
                        if (!isIn) return false;
                      }
                      if (!query) return true;
                      return (b.name + ' ' + b.unit + ' ' + cat.bn).toLowerCase().includes(query);
                    }) || [];

                    return (
                      <div key={cat.id} className="admin-category-card">
                        {/* Category Card Header */}
                        <div className="admin-category-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div className="admin-cat-icon-container">
                              <CategoryIcon icon={cat.icon} category={cat} size={45} />
                            </div>
                            <div>
                              <div className="admin-cat-title-group">
                                <h3 className="admin-cat-title-bn">{cat.bn}</h3>
                                <span className="admin-cat-title-en">({cat.en})</span>
                                <span className="admin-cat-group-tag">
                                  {groupObj ? groupObj.bn : cat.group}
                                </span>
                                <span className="admin-cat-count-tag mono">
                                  {toBengaliNumber(cat.brands?.length || 0)} টি পণ্য
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="admin-cat-action-btns">
                            <button
                              type="button"
                              className="admin-btn primary"
                              style={{
                                padding: '6px 14px',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              onClick={() => handleOpenAddBrand(cat)}
                              title="এই ক্যাটাগরিতে নতুন পণ্য যোগ করুন"
                            >
                              <Plus size={14} />
                              <span>পণ্য যোগ</span>
                            </button>

                            <button
                              type="button"
                              className="admin-btn secondary"
                              style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
                              onClick={() => handleOpenEditCategory(cat)}
                              title="ক্যাটাগরি নাম বা লোগো এডিট করুন"
                            >
                              <Edit3 size={13} />
                              <span>এডিট</span>
                            </button>

                            <button
                              type="button"
                              className="admin-btn danger"
                              style={{ padding: '6px 10px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center' }}
                              onClick={() => handleDeleteCategory(cat.id)}
                              title="ক্যাটাগরি মুছুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Products inside this Category */}
                        {cat.brands && cat.brands.length > 0 ? (
                          <>
                            {/* 1. Desktop Modern Table View */}
                            <div className="admin-modern-table-wrap">
                              <table className="admin-modern-table">
                                <thead>
                                  <tr>
                                    <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                                    <th>পণ্যের বিবরণ</th>
                                    <th>একক (Unit)</th>
                                    <th>বিক্রয় মূল্য (দর)</th>
                                    <th>আড়ত কেনা দর</th>
                                    <th>বর্তমান স্টক</th>
                                    <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchingBrands.map((b, idx) => {
                                    const isOutOfStock = b.force_stock_out || b.stock === 0;
                                    const isLowStock = !isOutOfStock && b.stock !== undefined && b.stock < LOW_STOCK_THRESHOLD;
                                    const rowClass = isOutOfStock ? 'admin-row-out-of-stock' : isLowStock ? 'admin-row-low-stock' : '';

                                    return (
                                      <tr key={b.name} className={rowClass}>
                                        <td className="mono" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                                          {toBengaliNumber(idx + 1)}
                                        </td>
                                        <td>
                                          <div className="admin-prod-name-wrap">
                                            {b.image ? (
                                              <img
                                                src={b.image}
                                                alt={b.name}
                                                className="admin-prod-thumb"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                              />
                                            ) : (
                                              <div className="admin-prod-thumb">
                                                <Package size={16} color="var(--green)" />
                                              </div>
                                            )}
                                            <div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                <span className="admin-prod-name-text">{b.name}</span>
                                                {isOutOfStock ? (
                                                  <span className="admin-stock-out-badge" title="পণ্যটির স্টক বর্তমানে শেষ">
                                                    <X size={10} />
                                                    <span>স্টক আউট</span>
                                                  </span>
                                                ) : isLowStock ? (
                                                  <span className="admin-stock-warning-badge" title={`সতর্কতা: মজুত ৫ টির কম রয়েছে (${toBengaliNumber(b.stock)} ${b.unit || ''})`}>
                                                    <AlertTriangle size={11} color="#b45309" />
                                                    <span>স্বল্প স্টক (&lt;{toBengaliNumber(LOW_STOCK_THRESHOLD)})</span>
                                                  </span>
                                                ) : null}
                                              </div>
                                              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                                                ক্যাটাগরি: {cat.bn}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td>
                                          <span className="tag" style={{ background: '#F1F5F3', border: '1px solid var(--rule)', fontSize: '12px', fontWeight: 600 }}>
                                            {b.unit}
                                          </span>
                                        </td>
                                        <td>
                                          <span className="admin-price-badge mono">
                                            ৳{toBengaliNumber(b.price)}
                                          </span>
                                        </td>
                                        <td>
                                          {b.cost_price ? (
                                            <span className="admin-cost-badge mono">
                                              ৳{toBengaliNumber(b.cost_price)}
                                            </span>
                                          ) : (
                                            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>-</span>
                                          )}
                                        </td>
                                        <td>
                                          <button
                                            type="button"
                                            className={`admin-stock-trigger-btn ${
                                              isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'
                                            }`}
                                            onClick={() => handleOpenStockModal(cat.id, b)}
                                            title={`স্টক পরিবর্তন করুন ${isLowStock ? `(সতর্কতা: স্টক < ${LOW_STOCK_THRESHOLD})` : ''}`}
                                          >
                                            {isOutOfStock ? (
                                              <X size={13} />
                                            ) : isLowStock ? (
                                              <AlertTriangle size={13} />
                                            ) : (
                                              <Layers size={13} />
                                            )}
                                            <span>
                                              {isOutOfStock
                                                ? (b.force_stock_out ? 'স্টক নেই (Force)' : 'স্টক শেষ')
                                                : `${formatStockDisplay(b.stock ?? 100, b.unit)} ${isLowStock ? '(স্বল্প)' : 'মজুত'}`}
                                            </span>
                                          </button>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                                            <button
                                              type="button"
                                              className="admin-btn secondary"
                                              style={{
                                                padding: '5px 10px',
                                                fontSize: '12px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontWeight: 600
                                              }}
                                              onClick={() => handleOpenEditBrand(cat, b)}
                                              title="পণ্য এডিট করুন"
                                            >
                                              <Edit3 size={13} />
                                              <span>এডিট</span>
                                            </button>
                                            <button
                                              type="button"
                                              className="admin-btn danger"
                                              style={{ padding: '5px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center' }}
                                              onClick={() => handleDeleteBrand(cat.id, b)}
                                              title="পণ্য মুছুন"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* 2. Mobile Responsive Product Cards */}
                            <div className="admin-products-mobile-cards">
                              {matchingBrands.map((b, idx) => {
                                const isOutOfStock = b.force_stock_out || b.stock === 0;
                                const isLowStock = !isOutOfStock && b.stock !== undefined && b.stock < LOW_STOCK_THRESHOLD;

                                return (
                                  <div key={b.name} className={`admin-product-mobile-item ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`}>
                                    <div className="admin-prod-mobile-header">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {b.image ? (
                                          <img
                                            src={b.image}
                                            alt={b.name}
                                            className="admin-prod-thumb"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <div className="admin-prod-thumb">
                                            <Package size={25} color="var(--green)" />
                                          </div>
                                        )}
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)' }}>{b.name}</span>
                                            {isOutOfStock ? (
                                              <span className="admin-stock-out-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                                <X size={9} />
                                                <span>আউট</span>
                                              </span>
                                            ) : isLowStock ? (
                                              <span className="admin-stock-warning-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                                <AlertTriangle size={9} color="#b45309" />
                                                <span>&lt;{toBengaliNumber(LOW_STOCK_THRESHOLD)}</span>
                                              </span>
                                            ) : null}
                                          </div>
                                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>একক: {b.unit}</div>
                                        </div>
                                      </div>
                                      <span className="admin-price-badge mono">
                                        ৳{toBengaliNumber(b.price)}
                                      </span>
                                    </div>

                                    <div className="admin-prod-mobile-info-grid">
                                      <div>
                                        <span style={{ color: 'var(--muted)' }}>কেনা দর: </span>
                                        <strong className="mono">{b.cost_price ? `৳${toBengaliNumber(b.cost_price)}` : '-'}</strong>
                                      </div>
                                      <div>
                                        <span style={{ color: 'var(--muted)' }}>স্টক: </span>
                                        <button
                                          type="button"
                                          className={`admin-stock-trigger-btn ${
                                            isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'
                                          }`}
                                          style={{ padding: '2px 8px', fontSize: '11px' }}
                                          onClick={() => handleOpenStockModal(cat.id, b)}
                                        >
                                          {isLowStock ? <AlertTriangle size={11} /> : null}
                                          <span>
                                            {isOutOfStock
                                              ? (b.force_stock_out ? 'স্টক নেই' : 'শেষ')
                                              : `${toBengaliNumber(b.stock ?? 100)} ${isLowStock ? '(স্বল্প)' : ''}`}
                                          </span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="admin-prod-mobile-actions">
                                      <button
                                        type="button"
                                        className="admin-btn secondary"
                                        style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                                        onClick={() => handleOpenEditBrand(cat, b)}
                                      >
                                        <Edit3 size={12} />
                                        <span>এডিট</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="admin-btn danger"
                                        style={{ padding: '5px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center' }}
                                        onClick={() => handleDeleteBrand(cat.id, b)}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', background: '#F8FAF9' }}>
                            <p style={{ margin: '0 0 12px', fontSize: '13.5px' }}>
                              এই ক্যাটাগরিতে এখনো কোনো পণ্য যুক্ত করা হয়নি।
                            </p>
                            <button
                              type="button"
                              className="admin-btn primary"
                              style={{
                                padding: '7px 16px',
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: 700
                              }}
                              onClick={() => {
                                setSelectedCatForBrand(cat);
                                setNewCatData({ en: '', bn: '', icon: '', group: groups[0]?.key || 'staples' });
                                setBrandForm({ name: '', unit: 'প্রতি কেজি', price: '', cost_price: '', image: '', stock: 100, force_stock_out: false });
                                setProductModalOpen(true);
                              }}
                            >
                              <Plus size={15} />
                              <span>প্রথম পণ্য যোগ করুন</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* POPUP MODAL 1: Category Add / Edit Modal */}
            <AnimatePresence>
              {categoryModalOpen && (
                <motion.div
                  className="admin-modal-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setCategoryModalOpen(false)}
                >
                  <motion.div
                    className="admin-modal-card"
                    style={{ maxWidth: '520px' }}
                    initial={{ scale: 0.92, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="admin-modal-header">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {editingCategory ? (
                          <>
                            <Edit3 size={18} />
                            <span>ক্যাটাগরি এডিট করুন</span>
                          </>
                        ) : (
                          <>
                            <Plus size={18} />
                            <span>নতুন ক্যাটাগরি তৈরি করুন</span>
                          </>
                        )}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCategoryModalOpen(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'inline-flex' }}
                        aria-label="বন্ধ করুন"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <form className="admin-modal-form" onSubmit={handleSaveCategory}>
                      <div className="admin-modal-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontWeight: 600, fontSize: '13px' }}>বাংলা নাম *</label>
                            <input
                              type="text"
                              placeholder="যেমন: পোলাও চাল"
                              value={newCatData.bn}
                              onChange={(e) => setNewCatData({ ...newCatData, bn: e.target.value })}
                              required
                              autoFocus
                              style={{ padding: '9px 12px' }}
                            />
                          </div>

                          <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontWeight: 600, fontSize: '13px' }}>ইংরেজি নাম *</label>
                            <input
                              type="text"
                              placeholder="e.g. Polao Rice"
                              value={newCatData.en}
                              onChange={(e) => setNewCatData({ ...newCatData, en: e.target.value })}
                              required
                              style={{ padding: '9px 12px' }}
                            />
                          </div>

                          {/* Category Logo Upload Field */}
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontWeight: 600, fontSize: '13px' }}>ক্যাটাগরি লোগো</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  border: '1px solid var(--rule)',
                                  borderRadius: 'var(--radius-md)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#F8FAF9',
                                  flexShrink: 0
                                }}
                                title="লোগো প্রিভিউ (ছবি না থাকলে স্বয়ংক্রিয় রিঅ্যাক্ট আইকন থাকবে)"
                              >
                                <CategoryIcon icon={catImagePreview || newCatData.icon} category={newCatData} size={22} />
                              </div>
                              <ImageUploadInput
                                value={newCatData.icon || ''}
                                file={catImageFile}
                                previewUrl={catImagePreview || ''}
                                onFileSelect={(file, preview) => {
                                  setCatImageFile(file);
                                  setCatImagePreview(preview);
                                }}
                                onClear={() => {
                                  setCatImageFile(null);
                                  setCatImagePreview(null);
                                  setNewCatData({ ...newCatData, icon: '' });
                                }}
                                placeholder="লোগো ছবি আপলোড করতে ক্লিক করুন..."
                                disabled={savingCategory}
                              />
                            </div>
                            <span style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                              * লোগো ছবি না দিলে ক্যাটাগরির নাম অনুযায়ী স্বয়ংক্রিয় আইকন সেট হবে।
                            </span>
                          </div>

                          <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontWeight: 600, fontSize: '13px' }}>গ্রুপ নির্বাচন *</label>
                            <select
                              value={newCatData.group}
                              onChange={(e) => setNewCatData({ ...newCatData, group: e.target.value })}
                              style={{ padding: '9px 12px' }}
                            >
                              {groups.map((g) => (
                                <option key={g.key} value={g.key}>
                                  {g.bn} ({g.en})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                                            <div className="admin-modal-footer">
                        <button
                          type="button"
                          className="admin-btn"
                          onClick={() => setCategoryModalOpen(false)}
                        >
                          বাতিল
                        </button>
                        <motion.button
                          type="submit"
                          className="admin-btn primary"
                          style={{ padding: '8px 20px', fontWeight: 700 }}
                          disabled={savingCategory}
                          whileHover={savingCategory ? {} : { scale: 1.02 }}
                          whileTap={savingCategory ? {} : { scale: 0.98 }}
                        >
                          {savingCategory ? 'আপলোড ও সংরক্ষণ হচ্ছে...' : (editingCategory ? 'আপডেট করুন' : 'সংরক্ষণ করুন')}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* POPUP MODAL 2: Product Add / Edit Modal (Floating Dialog) */}
            <AnimatePresence>
              {productModalOpen && selectedCatForBrand && (
                <motion.div
                  className="admin-modal-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setProductModalOpen(false);
                    setSelectedCatForBrand(null);
                    setEditingBrand(null);
                  }}
                >
                  <motion.div
                    className="admin-modal-card"
                    style={{ maxWidth: '540px' }}
                    initial={{ scale: 0.92, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="admin-modal-header">
                      <div>
                        <h3 style={{ margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {editingBrand ? (
                            <>
                              <Edit3 size={18} />
                              <span>পণ্য তথ্য এডিট করুন</span>
                            </>
                          ) : (
                            <>
                              <Plus size={18} />
                              <span>নতুন পণ্য যোগ করুন</span>
                            </>
                          )}
                        </h3>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>ক্যাটাগরি:</span>
                          <CategoryIcon icon={selectedCatForBrand.icon} category={selectedCatForBrand} size={14} />
                          <strong>{selectedCatForBrand.bn} ({selectedCatForBrand.en})</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProductModalOpen(false);
                          setSelectedCatForBrand(null);
                          setEditingBrand(null);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'inline-flex' }}
                        aria-label="বন্ধ করুন"
                      >
                        <X size={20} />
                      </button>
                    </div>

                                        <form className="admin-modal-form" onSubmit={handleSaveBrand}>
                      <div className="admin-modal-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontWeight: 600, fontSize: '13px' }}>পণ্য / ব্র্যান্ডের নাম *</label>
                            <input
                              type="text"
                              placeholder="যেমন: মিনিকেট চাল, দেশি পেঁয়াজ"
                              value={brandForm.name}
                              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                              required
                              autoFocus
                              style={{ padding: '9px 12px' }}
                            />
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div className="field" style={{ margin: 0 }}>
                              <label style={{ fontWeight: 600, fontSize: '13px' }}>প্যাকেট / ইউনিট পরিমাপ *</label>
                              <input
                                type="text"
                                placeholder="যেমন: ২৫০ গ্রাম প্যাকেট, ১ কেজি, ৫ লিটার"
                                value={brandForm.unit}
                                onChange={(e) => setBrandForm({ ...brandForm, unit: e.target.value })}
                                required
                                style={{ padding: '9px 12px', width: '100%' }}
                              />
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label style={{ fontWeight: 600, fontSize: '13px' }}>ক্রয় মূল্য (৳) *</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontWeight: 700, fontSize: '15px' }}>৳</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="50"
                                  value={brandForm.cost_price}
                                  onChange={(e) => setBrandForm({ ...brandForm, cost_price: e.target.value })}
                                  required
                                  style={{ padding: '9px 12px', width: '100%' }}
                                />
                              </div>
                            </div>
                            <div className="field" style={{ margin: 0 }}>
                              <label style={{ fontWeight: 600, fontSize: '13px' }}>বিক্রয় মূল্য (৳) *</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontWeight: 700, fontSize: '15px' }}>৳</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="72"
                                  value={brandForm.price}
                                  onChange={(e) => setBrandForm({ ...brandForm, price: e.target.value })}
                                  required
                                  style={{ padding: '9px 12px', width: '100%' }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontWeight: 600, fontSize: '13px' }}>পণ্যের ছবি (ঐচ্ছিক)</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  border: '1px solid var(--rule)',
                                  borderRadius: 'var(--radius-md)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#F8FAF9',
                                  flexShrink: 0,
                                  overflow: 'hidden'
                                }}
                                title="পণ্যের ছবি প্রিভিউ"
                              >
                                {(brandImagePreview || brandForm.image) ? (
                                  <img
                                    src={brandImagePreview || brandForm.image}
                                    alt="Preview"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <Package size={22} color="var(--muted)" />
                                )}
                              </div>
                              <ImageUploadInput
                                value={brandForm.image || ''}
                                file={brandImageFile}
                                previewUrl={brandImagePreview || ''}
                                onFileSelect={(file, preview) => {
                                  setBrandImageFile(file);
                                  setBrandImagePreview(preview);
                                }}
                                onClear={() => {
                                  setBrandImageFile(null);
                                  setBrandImagePreview(null);
                                  setBrandForm({ ...brandForm, image: '' });
                                }}
                                placeholder="পণ্যের ছবি আপলোড করতে ক্লিক করুন..."
                                disabled={savingBrand}
                              />
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                            <div className="field" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>স্টক (পরিমাণ)</label>
                              <input
                                type="number"
                                min="0"
                                value={brandForm.stock}
                                onChange={(e) => setBrandForm({ ...brandForm, stock: e.target.value })}
                                style={{ padding: '6px 12px', width: '80px', textAlign: 'center' }}
                              />
                            </div>
                            <div className="field" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ fontWeight: 600, fontSize: '13px', margin: 0, color: 'var(--danger)' }}>স্টক আউট (Force)</label>
                              <input
                                type="checkbox"
                                checked={brandForm.force_stock_out}
                                onChange={(e) => setBrandForm({ ...brandForm, force_stock_out: e.target.checked })}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--danger)' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="admin-modal-footer">
                        <button
                          type="button"
                          className="admin-btn"
                          onClick={() => {
                            setProductModalOpen(false);
                            setSelectedCatForBrand(null);
                            setEditingBrand(null);
                          }}
                        >
                          বাতিল
                        </button>
                        <motion.button
                          type="submit"
                          className="admin-btn primary"
                          style={{ padding: '8px 20px', fontWeight: 700 }}
                          disabled={savingBrand}
                          whileHover={savingBrand ? {} : { scale: 1.02 }}
                          whileTap={savingBrand ? {} : { scale: 0.98 }}
                        >
                          {savingBrand ? 'আপলোড ও সংরক্ষণ হচ্ছে...' : (editingBrand ? 'আপডেট করুন' : 'পণ্য যোগ করুন')}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 3. PAYMENT METHODS TAB */}
        {adminTab === 'payments' && (
          <div>
            {/* Automatic Payment Verification Gateway Card */}
            <div
              style={{
                background: 'var(--cream-card)',
                border: '1.5px solid var(--ink)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
                    <ShieldCheck size={20} style={{ color: 'var(--green)' }} />
                    <span>স্বয়ংক্রিয় পেমেন্ট ভেরিফিকেশন গেটওয়ে (Auto-Verify API)</span>
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                    গ্রাহক চেকআউটে বিকাশ, নগদ বা রকেটের TrxID দিলে আপনার ব্যাকএন্ড সার্ভার এপিআইতে স্বয়ংক্রিয়ভাবে ৩ বার রিকোয়েস্ট পাঠিয়ে পেমেন্ট যাচাই করবে।
                  </p>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: paymentVerifyConfig.enabled ? '#ecfdf5' : '#f1f5f9',
                    color: paymentVerifyConfig.enabled ? '#047857' : '#64748b',
                    border: paymentVerifyConfig.enabled ? '1px solid #a7f3d0' : '1px solid #cbd5e1'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: paymentVerifyConfig.enabled ? '#10b981' : '#94a3b8' }}></span>
                  <span>{paymentVerifyConfig.enabled ? 'গেটওয়ে সক্রিয়' : 'গেটওয়ে বন্ধ'}</span>
                </div>
              </div>

              <form onSubmit={handleSavePaymentVerifyConfig}>
                {/* Enable toggle */}
                <div style={{ background: '#ffffff', border: '1px solid var(--rule)', borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>স্বয়ংক্রিয় পেমেন্ট যাচাই প্রক্রিয়া চালু রাখুন</strong>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                      চালু থাকলে ট্রানজেকশন আইডি (TrxID) নিশ্চিত না হয়ে কোনো অনলাইন পেমেন্ট অর্ডার গ্রহণ করা হবে না।
                    </div>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={paymentVerifyConfig.enabled}
                      onChange={(e) => setPaymentVerifyConfig({ ...paymentVerifyConfig, enabled: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--green)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: paymentVerifyConfig.enabled ? 'var(--green)' : 'var(--muted)' }}>
                      {paymentVerifyConfig.enabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                    </span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {/* API URL */}
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>
                      পেমেন্ট ভেরিফিকেশন API URL:
                    </label>
                    <input
                      type="text"
                      className="mono"
                      placeholder="http://192.168.241.200:3000/api/verify-payment"
                      value={paymentVerifyConfig.api_url}
                      onChange={(e) => setPaymentVerifyConfig({ ...paymentVerifyConfig, api_url: e.target.value })}
                      style={{ padding: '10px 12px', fontSize: '13.5px' }}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                      POST রিকোয়েস্ট পাঠাতে ফুল URL দিন (যেমন: http://SERVER_IP:PORT/api/verify-payment)
                    </div>
                  </div>

                  {/* API Secret Key */}
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>
                      সিক্রেট কী (x-api-key Secret):
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showVerifyApiKey ? 'text' : 'password'}
                        className="mono"
                        placeholder="pay_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={paymentVerifyConfig.api_key}
                        onChange={(e) => setPaymentVerifyConfig({ ...paymentVerifyConfig, api_key: e.target.value })}
                        style={{ padding: '10px 40px 10px 12px', fontSize: '13.5px', width: '100%' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowVerifyApiKey(!showVerifyApiKey)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={showVerifyApiKey ? 'লুকান' : 'দেখুন'}
                      >
                        {showVerifyApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                      রকেটের জন্য রিকোয়েস্ট স্বয়ংক্রিয়ভাবে 16216 সেন্ডার কোডে কনভার্ট হবে।
                    </div>
                  </div>
                </div>

                {/* Status or Toast Message */}
                {verifySaveMessage && (
                  <div
                    style={{
                      marginBottom: '14px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: verifySaveMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                      color: verifySaveMessage.type === 'success' ? '#047857' : '#b91c1c',
                      border: verifySaveMessage.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {verifySaveMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{verifySaveMessage.text}</span>
                  </div>
                )}

                {/* Test Result Display */}
                {testVerifyResult && (
                  <div
                    style={{
                      marginBottom: '14px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      background: testVerifyResult.success ? '#ecfdf5' : '#fffbeb',
                      color: testVerifyResult.success ? '#047857' : '#92400e',
                      border: testVerifyResult.success ? '1px solid #a7f3d0' : '1px solid #fde68a',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      {testVerifyResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{testVerifyResult.message}</span>
                    </div>
                    {testVerifyResult.latency && (
                      <div style={{ fontSize: '12px', color: testVerifyResult.success ? '#065f46' : '#78350f' }}>
                        রেসপন্স টাইম: <strong>{testVerifyResult.latency}ms</strong> | HTTP স্ট্যাটাস: <strong>{testVerifyResult.status}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleTestPaymentVerifyApi}
                    disabled={isTestingVerifyApi || !paymentVerifyConfig.api_url}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid var(--rule)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      cursor: (isTestingVerifyApi || !paymentVerifyConfig.api_url) ? 'not-allowed' : 'pointer',
                      opacity: (isTestingVerifyApi || !paymentVerifyConfig.api_url) ? 0.6 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isTestingVerifyApi ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>সার্ভারে পিং করা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        <span>সংযোগ পরীক্ষা করুন (Test API)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    className="admin-btn primary"
                    disabled={isSavingVerifyConfig}
                    style={{
                      padding: '8px 22px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isSavingVerifyConfig ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>গেটওয়ে সেটিংস সেভ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} />
                <span>পেমেন্ট মেথড তালিকা</span>
              </h3>
              <button
                className="admin-btn primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setEditingPayment(null);
                  setNewPayment({ code: '', name_bn: '', name_en: '', number: '', instructions_bn: '', is_active: true });
                  setIsPaymentModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>নতুন পদ্ধতি যোগ করুন</span>
              </button>
            </div>

            <AnimatePresence>
              {isPaymentModalOpen && (
                <div className="admin-modal-overlay">
                  <motion.div
                    className="admin-modal-card"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    style={{ maxWidth: '500px', width: '90%' }}
                  >
                    <div className="admin-modal-header">
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                        {editingPayment ? <><Edit3 size={18} /> পেমেন্ট মেথড এডিট</> : <><Plus size={18} /> নতুন পেমেন্ট মেথড</>}
                      </h4>
                      <button
                        type="button"
                        className="close-modal-btn"
                        onClick={() => {
                          setIsPaymentModalOpen(false);
                          setEditingPayment(null);
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSavePaymentMethod} className="admin-modal-form">
                      <div className="admin-modal-body">
                        <div className="field">
                          <label>কোড (Key) <span style={{ color: 'red' }}>*</span></label>
                          <input
                            type="text"
                            placeholder="e.g. bkash, nagad, rocket"
                            value={newPayment.code}
                            onChange={(e) => setNewPayment({ ...newPayment, code: e.target.value })}
                            required
                          />
                        </div>
                        <div className="field">
                          <label>পেমেন্ট মেথড নাম (বাংলা) <span style={{ color: 'red' }}>*</span></label>
                          <input
                            type="text"
                            placeholder="যেমন: বিকাশ পার্সোনাল"
                            value={newPayment.name_bn}
                            onChange={(e) => setNewPayment({ ...newPayment, name_bn: e.target.value })}
                            required
                          />
                        </div>
                        <div className="field">
                          <label>হিসাব / অ্যাকাউন্ট নম্বর</label>
                          <input
                            type="text"
                            placeholder="017XXXXXXXX"
                            value={newPayment.number}
                            onChange={(e) => setNewPayment({ ...newPayment, number: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>নির্দেশনা (Instructions)</label>
                          <textarea
                            placeholder="Send money করুন এবং TrxID দিন..."
                            value={newPayment.instructions_bn}
                            onChange={(e) => setNewPayment({ ...newPayment, instructions_bn: e.target.value })}
                            rows={2}
                            style={{ width: '100%', padding: '10px', border: '1.5px solid var(--rule)', borderRadius: 'var(--radius-md)', background: '#F8FAF9', fontSize: '14px', resize: 'vertical' }}
                          />
                        </div>
                        <div className="field" style={{ marginTop: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={newPayment.is_active}
                              onChange={(e) => setNewPayment({ ...newPayment, is_active: e.target.checked })}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--green)' }}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>ওয়েবসাইটে পদ্ধতিটি সক্রিয় রাখুন</span>
                          </label>
                        </div>
                      </div>

                      <div className="admin-modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="admin-btn secondary"
                          onClick={() => {
                            setIsPaymentModalOpen(false);
                            setEditingPayment(null);
                          }}
                        >
                          বাতিল
                        </button>
                        <button type="submit" className="admin-btn primary">
                          {editingPayment ? 'আপডেট করুন' : 'যোগ করুন'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>পদ্ধতি</th>
                    <th>কোড</th>
                    <th>অ্যাকাউন্ট নম্বর</th>
                    <th>নির্দেশনা</th>
                    <th>সক্রিয় স্ট্যাটাস</th>
                    <th>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map((p) => (
                    <tr key={p.id || p.code}>
                      <td><strong>{p.name_bn}</strong></td>
                      <td className="mono">{p.code}</td>
                      <td className="mono">{p.number || '—'}</td>
                      <td style={{ fontSize: '12px' }}>{p.instructions_bn}</td>
                      <td>
                        <button
                          type="button"
                          className="status-badge"
                          style={{
                            background: p.is_active !== false ? '#e8f8f0' : '#ffeded',
                            border: 'none',
                            cursor: 'pointer',
                            color: p.is_active !== false ? 'var(--success)' : 'var(--danger)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => handleTogglePaymentStatus(p)}
                          title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন (সক্রিয় / নিষ্ক্রিয়)"
                        >
                          {p.is_active !== false ? (
                            <>
                              <Check size={12} />
                              <span>সক্রিয়</span>
                            </>
                          ) : (
                            <>
                              <X size={12} />
                              <span>নিষ্ক্রিয়</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td>
                        <button
                          className="admin-btn"
                          onClick={() => {
                            setEditingPayment(p);
                            setNewPayment({ ...p });
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          এডিট
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. DELIVERY & ADDRESS MANAGEMENT TAB */}
        {adminTab === 'delivery' && (
          <div>
            {/* Delivery Charge Card */}
            <div
              style={{
                background: 'var(--cream-card)',
                border: '1.5px solid var(--ink)',
                borderRadius: '4px',
                padding: '20px',
                marginBottom: '24px',
                maxWidth: '650px'
              }}
            >
              <h3 style={{ fontSize: '17px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} />
                <span>ডিফল্ট ডেলিভারি চার্জ নির্ধারণ</span>
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 14px' }}>
                যে এলাকাগুলোর জন্য আলাদা ডেলিভারি চার্জ নির্ধারণ করা থাকবে না, সেগুলোতে এই সাধারণ চার্জ প্রযোজ্য হবে।
              </p>

              <form onSubmit={handleSaveDefaultFee} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div className="field" style={{ margin: 0, flex: 1 }}>
                  <label>ডিফল্ট ডেলিভারি ফি (টাকা ৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="60"
                    value={defaultDeliveryFee}
                    onChange={(e) => setDefaultDeliveryFee(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="submit-btn"
                  style={{ width: 'auto', minWidth: '160px', height: '42px', margin: 0 }}
                  disabled={savingFee}
                >
                  {savingFee ? 'সংরক্ষণ হচ্ছে...' : 'চার্জ সংরক্ষণ করুন'}
                </button>
              </form>
            </div>

            {/* Delivery Areas Form & Table */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} />
                <span>ডেলিভারি এলাকা তালিকা</span>
              </h3>
              <button
                className="admin-btn primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setEditingArea(null);
                  setAreaForm({ name: '', charge: '', is_active: true });
                  setIsAreaModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>নতুন এলাকা যোগ করুন</span>
              </button>
            </div>

            <AnimatePresence>
              {isAreaModalOpen && (
                <div
                  className="admin-modal-overlay"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setIsAreaModalOpen(false);
                      setEditingArea(null);
                    }
                  }}
                >
                  <motion.div
                    className="admin-modal-card"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    style={{ maxWidth: '500px', width: '90%' }}
                  >
                    <div className="admin-modal-header">
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                        {editingArea ? <><Edit3 size={18} /> '{editingArea.name}' এলাকা এডিট করুন</> : <><Plus size={18} /> নতুন ডেলিভারি এলাকা যুক্ত করুন</>}
                      </h4>
                      <button
                        type="button"
                        className="close-modal-btn"
                        onClick={() => {
                          setIsAreaModalOpen(false);
                          setEditingArea(null);
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveArea} className="admin-modal-form">
                      <div className="admin-modal-body">
                        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 16px' }}>
                          এখানে যে এলাকাগুলো যুক্ত করবেন তা সরাসরি কাস্টমারদের চেকআউট পেজের ড্রপডাউনে প্রদর্শিত হবে।
                        </p>

                        <div className="field">
                          <label>এলাকার নাম <span style={{ color: 'red' }}>*</span></label>
                          <input
                            type="text"
                            placeholder="যেমন: মিরপুর ১০, উত্তরা সেক্টর ৭, যাত্রাবাড়ী"
                            value={areaForm.name}
                            onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="field">
                          <label>এই এলাকার নির্দিষ্ট ডেলিভারি চার্জ (৳) (ঐচ্ছিক)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder={`ডিফল্ট: ৳${defaultDeliveryFee}`}
                            value={areaForm.charge}
                            onChange={(e) => setAreaForm({ ...areaForm, charge: e.target.value })}
                          />
                        </div>
                        <div className="field" style={{ marginTop: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={areaForm.is_active}
                              onChange={(e) => setAreaForm({ ...areaForm, is_active: e.target.checked })}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--green)' }}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>চেকআউট পেজে এলাকাটি প্রদর্শন করুন</span>
                          </label>
                        </div>
                      </div>

                      <div className="admin-modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="admin-btn secondary"
                          onClick={() => {
                            setIsAreaModalOpen(false);
                            setEditingArea(null);
                          }}
                        >
                          বাতিল
                        </button>
                        <button type="submit" className="admin-btn primary">
                          {editingArea ? 'আপডেট করুন' : 'যোগ করুন'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Delivery Areas List Table */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>আইডি</th>
                    <th>এলাকার নাম</th>
                    <th>ডেলিভারি চার্জ</th>
                    <th>স্ট্যাটাস</th>
                    <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryAreas.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        কোনো এলাকা যোগ করা হয়নি। উপরে ফর্ম ব্যবহার করে এলাকা যোগ করুন।
                      </td>
                    </tr>
                  ) : (
                    deliveryAreas.map((a) => (
                      <tr key={a.id || a.name}>
                        <td className="mono">#{toBengaliNumber(a.id)}</td>
                        <td>
                          <strong>{a.name}</strong>
                        </td>
                        <td>
                          <span className="mono" style={{ fontWeight: 700, color: 'var(--green)' }}>
                            ৳{toBengaliNumber(typeof a.charge === 'number' ? a.charge : defaultDeliveryFee)}
                          </span>
                          {typeof a.charge !== 'number' && (
                            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '4px' }}>
                              (ডিফল্ট)
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="status-badge"
                            style={{
                              background: a.is_active !== false ? '#e8f8f0' : '#ffeded',
                              border: 'none',
                              cursor: 'pointer',
                              color: a.is_active !== false ? 'var(--success)' : 'var(--danger)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => handleToggleAreaStatus(a)}
                            title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                          >
                            {a.is_active !== false ? <><Check size={12} /> সক্রিয়</> : <><X size={12} /> নিষ্ক্রিয়</>}
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="admin-btn"
                            style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              setEditingArea(a);
                              setAreaForm({
                                name: a.name,
                                charge: a.charge !== undefined ? String(a.charge) : '',
                                is_active: a.is_active !== false
                              });
                              setIsAreaModalOpen(true);
                            }}
                          >
                            <Edit3 size={12} />
                            <span>এডিট</span>
                          </button>
                          <button
                            className="admin-btn danger"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleDeleteArea(a.id, a.name)}
                          >
                            <Trash2 size={12} />
                            <span>মুছুন</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* COMPREHENSIVE REPORTS & PRINT HUB */}
        {adminTab === 'reports_hub' && (
          <AdminReportsHub
            orders={orders}
            packageOrders={packageOrders}
            categories={categories}
            usersList={usersList}
            deliveryAreas={deliveryAreas}
            deliveryRiders={deliveryRiders}
            settings={settings}
          />
        )}

        {/* 5. SITE & RECEIPT SETTINGS TAB */}
        {adminTab === 'settings' && settings && (
          <div style={{ maxWidth: '750px' }}>
            <form onSubmit={handleSaveSettings}>
              <div style={{ background: '#FFFFFF', border: '1px solid var(--rule)', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontSize: '15px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={17} />
                  <span>ওয়েবসাইট ও রসিদ (ক্যাশ মেমো) সংক্রান্ত তথ্য</span>
                </h4>

                {/* 1. Favicon Upload (On Top) */}
                <div className="field" style={{ marginBottom: '18px', background: '#F8FAF9', padding: '14px', borderRadius: '10px', border: '1px solid var(--rule)' }}>
                  <label style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                    🌐 ওয়েবসাইটের ফেভিকন (Favicon / Browser Tab Icon)
                  </label>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--muted)' }}>
                    ব্রাউজারের ট্যাবে এই ছোট ফেভিকন আইকনটি প্রদর্শিত হবে। স্কয়ার সাইজের (1:1 অনুপাত, যেমন: 64x64 বা 128x128 পিক্সেল) ছবি আপলোড করুন।
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        border: '1.5px solid var(--rule)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FFFFFF',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}
                      title="ফেভিকন প্রিভিউ"
                    >
                      {(settingsFaviconPreview || settings.favicon_image_url) ? (
                        <img
                          src={settingsFaviconPreview || settings.favicon_image_url}
                          alt="Favicon preview"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>Favicon</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <ImageUploadInput
                        value={settings.favicon_image_url || ''}
                        file={settingsFaviconFile}
                        previewUrl={settingsFaviconPreview || ''}
                        onFileSelect={(file, preview) => {
                          setSettingsFaviconFile(file);
                          setSettingsFaviconPreview(preview);
                        }}
                        onClear={() => {
                          setSettingsFaviconFile(null);
                          setSettingsFaviconPreview(null);
                          setSettings({ ...settings, favicon_image_url: '' });
                        }}
                        placeholder="ফেভিকন ছবি আপলোড করতে ক্লিক করুন..."
                        disabled={savingSettings}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Main Header Logo Upload (Below Favicon) */}
                <div className="field" style={{ marginBottom: '18px', background: '#F8FAF9', padding: '14px', borderRadius: '10px', border: '1px solid var(--rule)' }}>
                  <label style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                    🏷️ ওয়েবসাইটের মূল লোগো (Header & Website Logo)
                  </label>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--muted)' }}>
                    ওয়েবসাইটের হেডারে ব্র্যান্ড এরিয়াতে এই লোগোটি প্রদর্শিত হবে।
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '80px',
                        height: '44px',
                        border: '1.5px solid var(--rule)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FFFFFF',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}
                      title="লোগো প্রিভিউ"
                    >
                      {(settingsLogoPreview || settings.logo_image_url) ? (
                        <img
                          src={settingsLogoPreview || settings.logo_image_url}
                          alt="Logo preview"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>লোগো নেই</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <ImageUploadInput
                        value={settings.logo_image_url || ''}
                        file={settingsLogoFile}
                        previewUrl={settingsLogoPreview || ''}
                        onFileSelect={(file, preview) => {
                          setSettingsLogoFile(file);
                          setSettingsLogoPreview(preview);
                        }}
                        onClear={() => {
                          setSettingsLogoFile(null);
                          setSettingsLogoPreview(null);
                          setSettings({ ...settings, logo_image_url: '' });
                        }}
                        placeholder="হেডার লোগো ছবি আপলোড করতে ক্লিক করুন..."
                        disabled={savingSettings}
                      />
                    </div>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field" style={{ margin: 0 }}>
                    <label>ওয়েবসাইটের নাম / শপ নাম</label>
                    <input
                      type="text"
                      value={settings.site_name || ''}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                      placeholder="আড়ৎ এক্সপ্রেস"
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>হটলাইন / মোবাইল নম্বর</label>
                    <input
                      type="text"
                      value={settings.site_helpline || ''}
                      onChange={(e) => setSettings({ ...settings, site_helpline: e.target.value })}
                      placeholder="০১৭১২-৩৪৫৬৭৮"
                    />
                  </div>
                </div>

                <div className="field" style={{ marginTop: '12px' }}>
                  <label>ট্যাগলাইন / উপ-শিরোনাম</label>
                  <input
                    type="text"
                    value={settings.site_tagline || ''}
                    onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                    placeholder="Arot Express — তাজা পাইকারি ও খুচরা মুদি বাজার"
                  />
                </div>

                <div className="field" style={{ marginTop: '12px' }}>
                  <label>ব্যানার ছবি (সোশ্যাল মিডিয়ায় লিংক শেয়ার করলে প্রিভিউতে যে ছবি দেখাবে)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '72px',
                        height: '44px',
                        border: '1px solid var(--rule)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#F8FAF9',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}
                      title="ব্যানার প্রিভিউ"
                    >
                      {(settingsBannerPreview || settings.banner_url) ? (
                        <img
                          src={settingsBannerPreview || settings.banner_url}
                          alt="Banner preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>ছবি নেই</span>
                      )}
                    </div>
                    <ImageUploadInput
                      value={settings.banner_url || ''}
                      file={settingsBannerFile}
                      previewUrl={settingsBannerPreview || ''}
                      onFileSelect={(file, preview) => {
                        setSettingsBannerFile(file);
                        setSettingsBannerPreview(preview);
                      }}
                      onClear={() => {
                        setSettingsBannerFile(null);
                        setSettingsBannerPreview(null);
                        setSettings({ ...settings, banner_url: '' });
                      }}
                      placeholder="ব্যানার ছবি আপলোড করতে ক্লিক করুন..."
                      disabled={savingSettings}
                    />
                  </div>
                </div>
                <div className="field" style={{ marginTop: '12px', marginBottom: 0 }}>
                  <label>দোকান / আড়তের ঠিকানা (রসিদে প্রদর্শনের জন্য)</label>
                  <input
                    type="text"
                    value={settings.site_address || settings.footer_address || ''}
                    onChange={(e) => setSettings({ ...settings, site_address: e.target.value, footer_address: e.target.value })}
                    placeholder="ঢাকা, বাংলাদেশ"
                  />
                </div>
              </div>

              <div className="field">
                <label>হেডার মূল শিরোনাম (Hero Title)</label>
                <input
                  type="text"
                  value={settings.header_title}
                  onChange={(e) => setSettings({ ...settings, header_title: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>হেডার উপ-শিরোনাম (Hero Subtitle)</label>
                <textarea
                  rows="3"
                  value={settings.header_subtitle}
                  onChange={(e) => setSettings({ ...settings, header_subtitle: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="field">
                <label>ফুটার কপিরাইট বার্তা</label>
                <input
                  type="text"
                  value={settings.footer_text}
                  onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label>ফুটার ঠিকানা</label>
                <input
                  type="text"
                  value={settings.footer_address}
                  onChange={(e) => setSettings({ ...settings, footer_address: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                style={{ maxWidth: '240px', marginTop: '10px' }}
                disabled={savingSettings}
              >
                {savingSettings ? 'আপলোড ও সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
              </button>
            </form>
          </div>
        )}

        {/* 5.4. FOOTER SETTINGS TAB */}
        {(adminTab === 'footer_settings' || adminTab === 'footer') && (
          <AdminFooterSettings />
        )}

        {/* 5.5. SOCIAL LINKS MANAGEMENT TAB */}
        {adminTab === 'social_links' && (
          <AdminSocialLinks adminToken={adminToken} />
        )}

        {/* 6. USERS TAB (Admins completely separated, shows registered customers only) */}
        {adminTab === 'users' && (
          <div>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '14px' }}>
              আপনার প্ল্যাটফর্মে নিবন্ধিত সাধারণ কাস্টমারদের তালিকা (অ্যাডমিন অ্যাকাউন্ট সুরক্ষিতভাবে পৃথক রাখা হয়েছে):
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>আইডি</th>
                    <th>কাস্টমার নাম</th>
                    <th>মোবাইল নম্বর</th>
                    <th>মোট অর্ডার</th>
                    <th>যোগদানের তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                        এখনো কোনো সাধারণ কাস্টমার নিবন্ধন করেনি।
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => (
                      <tr key={u.id}>
                        <td className="mono">#{toBengaliNumber(u.id)}</td>
                        <td><strong>{u.name}</strong></td>
                        <td className="mono">{u.phone}</td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--green)' }}>
                          {toBengaliNumber(u.orders_count || 0)} টি
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(u.created_at).toLocaleDateString('bn-BD')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. ADMIN PROFILE TAB */}
        {adminTab === 'profile' && (
          <div style={{ maxWidth: '440px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '14px' }}>
              অ্যাডমিন প্যানেলে লগইন করার ইউজারনেম এবং পাসওয়ার্ড পরিবর্তন করুন:
            </p>

            {adminPassMsg.text && (
              <div
                style={{
                  background: adminPassMsg.type === 'success' ? 'var(--md-primary-container)' : '#ffeded',
                  color: adminPassMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
                  border: `1px solid ${adminPassMsg.type === 'success' ? '#BBF7D0' : '#FECDD3'}`,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  marginBottom: '14px',
                  fontWeight: 500
                }}
              >
                {adminPassMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateAdminProfile}>
              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} />
                  <span>অ্যাডমিন নাম (Display Name)</span>
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="যেমন: সুপার অ্যাডমিন"
                  required
                />
              </div>

              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={15} />
                  <span>অ্যাডমিন ইউজারনেম / লগইন আইডি</span>
                </label>
                <input
                  type="text"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="যেমন: admin বা আপনার নিজস্ব আইডি"
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                  পরবর্তীতে অ্যাডমিন প্যানেলে লগইন করার সময় এই ইউজারনেমটি ব্যবহার করবেন।
                </span>
              </div>

              <div style={{ margin: '20px 0 14px 0', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <KeyRound size={15} />
                    <span>পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {showAdminPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{showAdminPass ? 'লুকান' : 'দেখান'}</span>
                  </button>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '12px' }}>
                  পাসওয়ার্ড পরিবর্তন করতে না চাইলে নিচের পাসওয়ার্ডের ঘরগুলো ফাঁকা রাখুন।
                </span>
              </div>

              <div className="field">
                <label>বর্তমান পাসওয়ার্ড</label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন (পাসওয়ার্ড পরিবর্তন করতে চাইলে)"
                  value={currentAdminPass}
                  onChange={(e) => setCurrentAdminPass(e.target.value)}
                />
              </div>

              <div className="field">
                <label>নতুন পাসওয়ার্ড</label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  placeholder="নতুন পাসওয়ার্ড লিখুন (কমপক্ষে ৪ অক্ষর)"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                />
              </div>

              <div className="field">
                <label>নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
                  value={confirmAdminPass}
                  onChange={(e) => setConfirmAdminPass(e.target.value)}
                />
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                disabled={savingAdminProfile}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: '8px' }}
              >
                {savingAdminProfile ? 'সংরক্ষণ করা হচ্ছে...' : 'ক্রেডেনশিয়াল সংরক্ষণ করুন'}
              </motion.button>
            </form>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* POS Thermal Receipt Modal */}
      {selectedOrderForReceipt && (
        <PosReceiptModal
          order={selectedOrderForReceipt}
          settings={settings}
          onClose={() => setSelectedOrderForReceipt(null)}
          onOpenFullInvoice={() => {
            const ord = selectedOrderForReceipt;
            setSelectedOrderForReceipt(null);
            setInvoiceModalOrder(ord);
          }}
        />
      )}

      {/* Full Customer Invoice / Cash Memo Modal */}
      <CustomerInvoiceModal
        isOpen={!!invoiceModalOrder}
        onClose={() => setInvoiceModalOrder(null)}
        order={invoiceModalOrder}
        settings={settings}
      />

      {/* Excel / CSV Bulk Products Importer & Exporter */}
      {bulkModalOpen && (
        <AdminBulkProducts
          isOpen={true}
          onClose={() => setBulkModalOpen(false)}
          adminToken={adminToken}
          groups={groups}
          categories={categories}
          onRefresh={fetchAllData}
          showToast={showToast}
        />
      )}

      {/* Global Stock Edit Modal - Accessible from any tab / LowStockBanner */}
      <AnimatePresence>
        {stockModal && (
          <motion.div
            className="admin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setStockModal(null)}
          >
            <motion.div
              className="admin-modal-card"
              style={{ maxWidth: '400px' }}
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div>
                  <h3 style={{ margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} />
                    <span>'{stockModal.brandName || stockModal.brand?.name}' এর স্টক ম্যানেজমেন্ট</span>
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    পরিমাপ: {stockModal.unit}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStockModal(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'inline-flex' }}
                  aria-label="বন্ধ করুন"
                >
                  <X size={20} />
                </button>
              </div>
              <form className="admin-modal-form" onSubmit={handleSaveStock}>
                <div className="admin-modal-body">
                  <div className="field">
                    <label>বর্তমান স্টক</label>
                    <input
                      type="number"
                      min="0"
                      value={stockModal.stock}
                      onChange={(e) => setStockModal({ ...stockModal, stock: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="field" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="force_stock_out"
                      checked={stockModal.force_stock_out}
                      onChange={(e) => setStockModal({ ...stockModal, force_stock_out: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="force_stock_out" style={{ margin: 0, cursor: 'pointer' }}>স্টক ফুরিয়ে গেছে (স্টক থাকলেও এটি টিক দিলে পণ্যটি "স্টক নেই" দেখাবে)</label>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => setStockModal(null)}
                  >
                    বাতিল
                  </button>
                  <motion.button
                    type="submit"
                    className="admin-btn primary"
                    style={{ padding: '8px 20px', fontWeight: 700 }}
                    disabled={savingStock}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {savingStock ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
