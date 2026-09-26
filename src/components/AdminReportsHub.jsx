"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Printer,
  Calendar,
  Filter,
  Search,
  ShoppingBag,
  Package,
  Users,
  MapPin,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Layers,
  Sparkles,
  ArrowUpDown,
  Download,
  Info,
  X,
  Eye,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { toBengaliNumber, formatStockDisplay } from '../utils/bengali.js';
import { printElement } from '../utils/printHelper.js';

export default function AdminReportsHub({
  orders = [],
  packageOrders = [],
  categories = [],
  usersList = [],
  deliveryAreas = [],
  deliveryRiders = [],
  settings = null
}) {
  // Modal State: null if closed, or the string report key if open
  const [selectedReportModal, setSelectedReportModal] = useState(null);

  // Time & Source Filter State
  const [timeFilter, setTimeFilter] = useState('this_month'); // 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_30_days' | 'all' | 'custom'
  const [orderSourceFilter, setOrderSourceFilter] = useState('all'); // 'all' | 'regular' | 'package'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Secondary Filters inside modal
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [manifestRiderId, setManifestRiderId] = useState('');

  // Combined orders list with package classification
  const allOrdersList = useMemo(() => {
    const list = [];
    (orders || []).forEach((o) => {
      list.push({ ...o, is_package_order: false, order_type_label: 'সাধারণ অর্ডার' });
    });
    (packageOrders || []).forEach((po) => {
      list.push({
        ...po,
        is_package_order: true,
        order_type_label: 'প্যাকেজ অর্ডার',
        order_code: po.order_code || `#PK-${po.id}`
      });
    });
    return list;
  }, [orders, packageOrders]);

  // Print Handling using Isolated Print Engine
  const handlePrint = () => {
    // Determine optimal orientation: Multi-column wide data tables benefit from Landscape
    const wideReportTypes = [
      'delivery_manifest', 
      'order_status', 
      'sales_summary', 
      'package_sales',
      'current_stock', 
      'top_customers', 
      'area_sales', 
      'top_products',
      'category_stock'
    ];
    const isLandscape = wideReportTypes.includes(selectedReportModal);
    
    printElement('printable-report-sheet', {
      type: isLandscape ? 'landscape' : 'a4',
      title: `${reportTitleMap[selectedReportModal] || 'Report'}-${new Date().toISOString().slice(0, 10)}`
    });
  };

  // Helper date formatters
  const formatDateBn = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    if (num < 0) {
      return `- ৳ ${toBengaliNumber(Math.abs(Math.round(num)))}`;
    }
    return `৳ ${toBengaliNumber(Math.round(num))}`;
  };

  // Compute Active Date Range Text for Report Header
  const dateRangeLabel = useMemo(() => {
    const today = new Date();
    if (timeFilter === 'today') {
      return `আজকের হিসাব (${today.toLocaleDateString('bn-BD')})`;
    }
    if (timeFilter === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return `গতকালের হিসাব (${y.toLocaleDateString('bn-BD')})`;
    }
    if (timeFilter === 'last_7_days') {
      return 'গত ৭ দিনের হিসাব';
    }
    if (timeFilter === 'this_month') {
      return `চলতি মাস (${today.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })})`;
    }
    if (timeFilter === 'last_30_days') {
      return 'গত ৩০ দিনের হিসাব';
    }
    if (timeFilter === 'custom' && (customStartDate || customEndDate)) {
      return `তারিখ: ${customStartDate || 'শুরু'} থেকে ${customEndDate || 'বর্তমান'}`;
    }
    return 'সর্বকালের সামগ্রিক হিসাব (All Time)';
  }, [timeFilter, customStartDate, customEndDate]);

  // Filter Orders based on Date and Source Filter
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return allOrdersList.filter((o) => {
      // Source filter
      if (orderSourceFilter === 'regular' && o.is_package_order) return false;
      if (orderSourceFilter === 'package' && !o.is_package_order) return false;

      if (!o.created_at) return true;
      const orderDate = new Date(o.created_at);

      if (timeFilter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (timeFilter === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return orderDate.toDateString() === y.toDateString();
      }
      if (timeFilter === 'last_7_days') {
        const past7 = new Date();
        past7.setDate(past7.getDate() - 7);
        return orderDate >= past7;
      }
      if (timeFilter === 'this_month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'last_30_days') {
        const past30 = new Date();
        past30.setDate(past30.getDate() - 30);
        return orderDate >= past30;
      }
      if (timeFilter === 'custom') {
        if (customStartDate && new Date(o.created_at) < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(o.created_at) > end) return false;
        }
        return true;
      }
      return true; // 'all'
    });
  }, [allOrdersList, orderSourceFilter, timeFilter, customStartDate, customEndDate]);

  // All Products Flattened List with Category info
  const allProductsList = useMemo(() => {
    const list = [];
    categories.forEach((cat) => {
      (cat.brands || []).forEach((brand) => {
        const stockQty = Number(brand.stock !== undefined ? brand.stock : 100);
        const costPrice = Number(brand.cost_price || 0);
        const sellPrice = Number(brand.price || 0);
        const totalCostValuation = stockQty * costPrice;
        const totalMarketValuation = stockQty * sellPrice;
        const isLow = stockQty <= 10 || brand.force_stock_out;

        list.push({
          categoryId: cat.id,
          categoryNameBn: cat.bn,
          categoryNameEn: cat.en,
          brandName: brand.name,
          unit: brand.unit || 'কেজি',
          stock: stockQty,
          costPrice,
          sellPrice,
          totalCostValuation,
          totalMarketValuation,
          potentialProfit: totalMarketValuation - totalCostValuation,
          isLow,
          isOut: stockQty <= 0 || brand.force_stock_out
        });
      });
    });
    return list;
  }, [categories]);

  // 1. SALES SUMMARY CALCULATIONS
  const salesSummaryData = useMemo(() => {
    let totalOrdersCount = filteredOrders.length;
    let deliveredOrders = filteredOrders.filter(
      (o) => o.status === 'delivered' || o.status === 'ডেলিভার্ড'
    );
    let totalSalesDelivered = deliveredOrders.reduce(
      (sum, o) => sum + (Number(o.total_amount) || 0),
      0
    );
    let totalDeliveryFees = deliveredOrders.reduce(
      (sum, o) => sum + (Number(o.delivery_fee) || 0),
      0
    );
    let totalProductsSales = totalSalesDelivered - totalDeliveryFees;
    let avgOrderValue =
      deliveredOrders.length > 0 ? totalSalesDelivered / deliveredOrders.length : 0;

    // Grouping by Date for Daily Breakdown Table
    const dayMap = {};
    filteredOrders.forEach((o) => {
      const dateKey = o.created_at
        ? new Date(o.created_at).toISOString().split('T')[0]
        : 'Unknown';
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          date: dateKey,
          totalOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          deliveredRevenue: 0,
          deliveredDeliveryFee: 0
        };
      }
      dayMap[dateKey].totalOrders += 1;
      if (o.status === 'delivered' || o.status === 'ডেলিভার্ড') {
        dayMap[dateKey].deliveredOrders += 1;
        dayMap[dateKey].deliveredRevenue += Number(o.total_amount) || 0;
        dayMap[dateKey].deliveredDeliveryFee += Number(o.delivery_fee) || 0;
      } else if (o.status === 'cancelled' || o.status === 'বাতিল') {
        dayMap[dateKey].cancelledOrders += 1;
      }
    });

    const dailyBreakdown = Object.values(dayMap).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    return {
      totalOrdersCount,
      deliveredCount: deliveredOrders.length,
      cancelledCount: filteredOrders.filter(
        (o) => o.status === 'cancelled' || o.status === 'বাতিল'
      ).length,
      pendingCount: filteredOrders.filter(
        (o) => o.status === 'pending' || o.status === 'পেন্ডিং'
      ).length,
      processingCount: filteredOrders.filter(
        (o) => o.status === 'processing' || o.status === 'প্রসেসিং'
      ).length,
      shippedCount: filteredOrders.filter(
        (o) => o.status === 'shipped' || o.status === 'অন-ওয়ে'
      ).length,
      totalSalesDelivered,
      totalDeliveryFees,
      totalProductsSales,
      avgOrderValue,
      dailyBreakdown
    };
  }, [filteredOrders]);

  // 2. ORDER STATUS REPORT DATA
  const orderStatusData = useMemo(() => {
    let list = filteredOrders;
    if (statusFilter !== 'all') {
      list = list.filter((o) => {
        if (statusFilter === 'pending') return o.status === 'pending' || o.status === 'পেন্ডিং';
        if (statusFilter === 'processing') return o.status === 'processing' || o.status === 'প্রসেসিং';
        if (statusFilter === 'shipped') return o.status === 'shipped' || o.status === 'অন-ওয়ে';
        if (statusFilter === 'delivered') return o.status === 'delivered' || o.status === 'ডেলিভার্ড';
        if (statusFilter === 'cancelled') return o.status === 'cancelled' || o.status === 'বাতিল';
        return true;
      });
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          (o.order_code && o.order_code.toLowerCase().includes(q)) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.customer_phone && o.customer_phone.includes(q)) ||
          (o.delivery_address && o.delivery_address.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filteredOrders, statusFilter, searchTerm]);

  // 3. PAYMENT METHOD BREAKDOWN DATA
  const paymentMethodData = useMemo(() => {
    const stats = {
      cod: { count: 0, amount: 0, deliveredAmount: 0, orders: [] },
      bkash: { count: 0, amount: 0, deliveredAmount: 0, orders: [] },
      nagad: { count: 0, amount: 0, deliveredAmount: 0, orders: [] },
      rocket: { count: 0, amount: 0, deliveredAmount: 0, orders: [] },
      other: { count: 0, amount: 0, deliveredAmount: 0, orders: [] }
    };

    filteredOrders.forEach((o) => {
      const rawMethod = (o.payment_method || 'cod').toLowerCase();
      let key = 'other';
      if (rawMethod.includes('cod') || rawMethod.includes('ক্যাশ')) key = 'cod';
      else if (rawMethod.includes('bkash') || rawMethod.includes('বিকাশ')) key = 'bkash';
      else if (rawMethod.includes('nagad') || rawMethod.includes('নগদ')) key = 'nagad';
      else if (rawMethod.includes('rocket') || rawMethod.includes('রকেট')) key = 'rocket';

      const amount = Number(o.total_amount) || 0;
      stats[key].count += 1;
      stats[key].amount += amount;
      if (o.status === 'delivered' || o.status === 'ডেলিভার্ড') {
        stats[key].deliveredAmount += amount;
      }
      stats[key].orders.push(o);
    });

    return stats;
  }, [filteredOrders]);

  // 4. STOCK & INVENTORY DATA
  const stockReportData = useMemo(() => {
    let list = allProductsList;
    if (categoryFilter !== 'all') {
      list = list.filter((p) => String(p.categoryId) === String(categoryFilter));
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.brandName.toLowerCase().includes(q) ||
          p.categoryNameBn.toLowerCase().includes(q) ||
          p.categoryNameEn.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allProductsList, categoryFilter, searchTerm]);

  // Low Stock Items (stock <= 10 or forced out)
  const lowStockData = useMemo(() => {
    return allProductsList.filter((p) => p.isLow || p.isOut);
  }, [allProductsList]);

  // Category Stock Valuation Summary
  const categoryValuationData = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.id] = {
        id: cat.id,
        nameBn: cat.bn,
        nameEn: cat.en,
        totalItems: 0,
        totalStockQty: 0,
        totalCostValuation: 0,
        totalMarketValuation: 0
      };
    });

    allProductsList.forEach((p) => {
      if (map[p.categoryId]) {
        map[p.categoryId].totalItems += 1;
        map[p.categoryId].totalStockQty += p.stock;
        map[p.categoryId].totalCostValuation += p.totalCostValuation;
        map[p.categoryId].totalMarketValuation += p.totalMarketValuation;
      }
    });

    return Object.values(map);
  }, [categories, allProductsList]);

  // 5. PRODUCT PERFORMANCE (TOP & SLOW MOVING PRODUCTS)
  const productPerformanceData = useMemo(() => {
    const productStats = {};

    allProductsList.forEach((p) => {
      const key = `${p.categoryNameBn}_${p.brandName}`;
      productStats[key] = {
        categoryBn: p.categoryNameBn,
        brandName: p.brandName,
        unit: p.unit,
        currentStock: p.stock,
        sellingPrice: p.sellPrice,
        costPrice: p.costPrice,
        qtySold: 0,
        totalSalesRevenue: 0,
        totalOrdersCount: 0
      };
    });

    filteredOrders.forEach((o) => {
      if (o.status !== 'cancelled' && o.status !== 'বাতিল') {
        (o.items_json || []).forEach((item) => {
          const catName = item.catBn || 'সাধারণ';
          const brand = item.brand;
          const key = `${catName}_${brand}`;

          if (!productStats[key]) {
            productStats[key] = {
              categoryBn: catName,
              brandName: brand,
              unit: item.unit || 'কেজি',
              currentStock: 0,
              sellingPrice: item.price || 0,
              costPrice: 0,
              qtySold: 0,
              totalSalesRevenue: 0,
              totalOrdersCount: 0
            };
          }

          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          productStats[key].qtySold += qty;
          productStats[key].totalSalesRevenue += qty * price;
          productStats[key].totalOrdersCount += 1;
        });
      }
    });

    const allStats = Object.values(productStats);
    const topSelling = [...allStats]
      .filter((p) => p.qtySold > 0)
      .sort((a, b) => b.qtySold - a.qtySold);
    const slowMoving = [...allStats]
      .filter((p) => p.qtySold === 0 || p.qtySold <= 2)
      .sort((a, b) => a.qtySold - b.qtySold);

    return { topSelling, slowMoving, allStats };
  }, [allProductsList, filteredOrders]);

  // 6. TOP CUSTOMERS DATA
  const topCustomersData = useMemo(() => {
    const custMap = {};

    filteredOrders.forEach((o) => {
      const phone = o.customer_phone || 'N/A';
      if (!custMap[phone]) {
        custMap[phone] = {
          name: o.customer_name || 'বেনামী ক্রেতা',
          phone: phone,
          address: o.delivery_address || '',
          area: o.delivery_area || '',
          totalOrders: 0,
          deliveredOrders: 0,
          totalSpent: 0,
          lastOrderDate: o.created_at
        };
      }

      custMap[phone].totalOrders += 1;
      if (o.status === 'delivered' || o.status === 'ডেলিভার্ড') {
        custMap[phone].deliveredOrders += 1;
        custMap[phone].totalSpent += Number(o.total_amount) || 0;
      }
      if (new Date(o.created_at) > new Date(custMap[phone].lastOrderDate)) {
        custMap[phone].lastOrderDate = o.created_at;
      }
    });

    return Object.values(custMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filteredOrders]);

  // 7. AREA-WISE PERFORMANCE
  const areaPerformanceData = useMemo(() => {
    const areaMap = {};

    filteredOrders.forEach((o) => {
      const area = o.delivery_area || 'অনির্দিষ্ট এলাকা';
      if (!areaMap[area]) {
        areaMap[area] = {
          areaName: area,
          totalOrders: 0,
          deliveredOrders: 0,
          totalRevenue: 0,
          totalDeliveryFees: 0
        };
      }

      areaMap[area].totalOrders += 1;
      if (o.status === 'delivered' || o.status === 'ডেলিভার্ড') {
        areaMap[area].deliveredOrders += 1;
        areaMap[area].totalRevenue += Number(o.total_amount) || 0;
        areaMap[area].totalDeliveryFees += Number(o.delivery_fee) || 0;
      }
    });

    return Object.values(areaMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders]);

  // Combine all riders from deliveryRiders prop and any assigned in orders
  const allAvailableRiders = useMemo(() => {
    const map = new Map();
    (deliveryRiders || []).forEach((r) => {
      map.set(String(r.id), {
        id: String(r.id),
        name: r.name,
        phone: r.phone,
        vehicle: r.vehicle || 'মোটরসাইকেল',
        area: r.area || ''
      });
    });
    (orders || []).forEach((o) => {
      if (o.delivery_rider_id && !map.has(String(o.delivery_rider_id))) {
        map.set(String(o.delivery_rider_id), {
          id: String(o.delivery_rider_id),
          name: o.delivery_rider_name || `রাইডার #${o.delivery_rider_id}`,
          phone: o.delivery_rider_phone || '',
          vehicle: o.delivery_rider_vehicle || 'মোটরসাইকেল',
          area: o.delivery_area || ''
        });
      }
    });
    return Array.from(map.values());
  }, [deliveryRiders, orders]);

  // 8. DELIVERY MAN RUN-SHEET / MANIFEST
  // CRITICAL REQUIREMENT: Only include orders with status 'shipped' (or 'অন-ওয়ে') because delivery man only has shipped orders!
  const deliveryManifestData = useMemo(() => {
    let shippedList = allOrdersList.filter(
      (o) => o.status === 'shipped' || o.status === 'অন-ওয়ে'
    );
    if (manifestRiderId) {
      shippedList = shippedList.filter((o) => String(o.delivery_rider_id) === String(manifestRiderId));
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      shippedList = shippedList.filter(
        (o) =>
          (o.order_code && o.order_code.toLowerCase().includes(q)) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.customer_phone && o.customer_phone.includes(q)) ||
          (o.delivery_address && o.delivery_address.toLowerCase().includes(q)) ||
          (o.delivery_area && o.delivery_area.toLowerCase().includes(q))
      );
    }
    return shippedList;
  }, [allOrdersList, searchTerm, manifestRiderId]);

  // 12. PACKAGE ORDERS DATA FOR REPORT
  const packageOrdersData = useMemo(() => {
    let list = allOrdersList.filter((o) => o.is_package_order);
    if (statusFilter !== 'all') {
      list = list.filter((o) => {
        if (statusFilter === 'pending') return o.status === 'pending' || o.status === 'পেন্ডিং';
        if (statusFilter === 'processing') return o.status === 'processing' || o.status === 'প্রসেসিং';
        if (statusFilter === 'shipped') return o.status === 'shipped' || o.status === 'অন-ওয়ে';
        if (statusFilter === 'delivered') return o.status === 'delivered' || o.status === 'ডেলিভার্ড' || o.status === 'সম্পন্ন';
        if (statusFilter === 'cancelled') return o.status === 'cancelled' || o.status === 'বাতিল';
        return true;
      });
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          (o.order_code && o.order_code.toLowerCase().includes(q)) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.customer_phone && o.customer_phone.includes(q)) ||
          (o.delivery_address && o.delivery_address.toLowerCase().includes(q)) ||
          (o.package_name && o.package_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allOrdersList, statusFilter, searchTerm]);

  // Store metadata for print header
  const siteName = settings?.site_name || 'আড়ৎ এক্সপ্রেস';
  const siteTagline =
    settings?.site_tagline ||
    settings?.header_subtitle ||
    'Arot Express — তাজা পাইকারি ও খুচরা মুদি বাজার';
  const siteAddress = settings?.site_address || settings?.footer_address || 'ঢাকা, বাংলাদেশ';
  const siteHelpline = settings?.site_helpline || '০১৭১২-৩৪৫৬৭৮';
  const logoImageUrl = settings?.logo_image_url || '';

  const reportConfigs = [
    // 1. DELIVERY & DISPATCH
    {
      id: 'delivery_manifest',
      category: 'ডেলিভারি ও চালান',
      title: 'ডেলিভারি রান-শীট (চালান)',
      subtitle: 'ডেলিভারিম্যানের জন্য পার্সেল ও ক্যাশ কালেকশন চালান শিট',
      icon: Truck,
      color: '#B45309',
      bgColor: '#FEF3C7',
      badge: `${toBengaliNumber(allOrdersList.filter(o => o.status === 'shipped' || o.status === 'অন-ওয়ে').length)} টি অন-ওয়ে অর্ডার`,
      badgeColor: '#B45309',
      highlight: true
    },
    {
      id: 'sales_summary',
      category: 'বিক্রয় ও আয়',
      title: 'দৈনিক ও পিরিয়ডিক সেলস সামারি',
      subtitle: 'মোট অর্ডার, বিক্রয় টাকা, গড় অর্ডার মূল্য ও দৈনিক অগ্রগতি',
      icon: TrendingUp,
      color: '#15803D',
      bgColor: '#DCFCE7',
      badge: formatCurrency(salesSummaryData.totalSalesDelivered),
      badgeColor: '#15803D'
    },
    {
      id: 'order_status',
      category: 'বিক্রয় ও আয়',
      title: 'অর্ডার স্ট্যাটাস রিপোর্ট',
      subtitle: 'পেন্ডিং, প্রসেসিং, অন-ওয়ে ও ডেলিভার্ড অর্ডারের সম্পূর্ণ বিবরণী',
      icon: ShoppingBag,
      color: '#1D4ED8',
      bgColor: '#DBEAFE',
      badge: `${toBengaliNumber(filteredOrders.length)} টি অর্ডার`,
      badgeColor: '#1D4ED8'
    },
    {
      id: 'package_sales',
      category: 'বিক্রয় ও আয়',
      title: 'প্যাকেজ ও স্পেশাল বক্স বিক্রয় রিপোর্ট',
      subtitle: 'সকল স্পেশাল প্যাকেজ ও সেভিং বান্ডেলের বিস্তারিত বিক্রয় রিপোর্ট ও রাজস্ব',
      icon: Package,
      color: '#E11D48',
      bgColor: '#FFE4E6',
      badge: `${toBengaliNumber((packageOrders || []).length)} টি প্যাকেজ অর্ডার`,
      badgeColor: '#E11D48'
    },
    {
      id: 'payment_methods',
      category: 'বিক্রয় ও আয়',
      title: 'পেমেন্ট মেথড ভিত্তিক আয়',
      subtitle: 'ক্যাশ অন ডেলিভারি (COD), বিকাশ, নগদ ও রকেট কালেকশন বিশ্লেষণ',
      icon: CreditCard,
      color: '#7C3AED',
      bgColor: '#EDE9FE',
      badge: 'COD / bKash / নগদ',
      badgeColor: '#7C3AED'
    },

    // 2. INVENTORY & STOCK
    {
      id: 'current_stock',
      category: 'স্টক ও ইনভেন্টরি',
      title: 'গুদাম স্টক ব্যালেন্স শিট',
      subtitle: 'সকল পণ্যের বর্তমান স্টক, ক্রয়মূল্য, বিক্রয়মূল্য ও মোট মূল্যায়ন',
      icon: Package,
      color: '#0F766E',
      bgColor: '#CCFBF1',
      badge: `${toBengaliNumber(allProductsList.length)} টি আইটেম`,
      badgeColor: '#0F766E'
    },
    {
      id: 'low_stock',
      category: 'স্টক ও ইনভেন্টরি',
      title: 'লো-স্টক অ্যালার্ট ও রি-অর্ডার শিট',
      subtitle: 'যেসব পণ্যের স্টক শেষ বা ১০ কেজির নিচে নেমে গেছে তাদের সতর্কতা',
      icon: AlertTriangle,
      color: '#DC2626',
      bgColor: '#FEE2E2',
      badge: `${toBengaliNumber(lowStockData.length)} টি জরুরি রি-অর্ডার`,
      badgeColor: '#DC2626',
      alert: lowStockData.length > 0
    },
    {
      id: 'category_stock',
      category: 'স্টক ও ইনভেন্টরি',
      title: 'ক্যাটাগরি ভিত্তিক স্টক মূল্যায়ন',
      subtitle: 'চাল, ডাল, তেল ইত্যাদি প্রতিটি ক্যাটাগরিতে মোট টাকার মজুত',
      icon: Layers,
      color: '#4338CA',
      bgColor: '#E0E7FF',
      badge: `${toBengaliNumber(categories.length)} টি ক্যাটাগরি`,
      badgeColor: '#4338CA'
    },

    // 3. PERFORMANCE & CUSTOMER
    {
      id: 'top_products',
      category: 'পারফরম্যান্স ও গ্রাহক',
      title: 'সর্বাধিক বিক্রিত পণ্য তালিকা',
      subtitle: 'সবচেয়ে বেশি বিক্রি হওয়া জনপ্রিয় পণ্য ও অর্জিত রাজস্ব',
      icon: Sparkles,
      color: '#C2410C',
      bgColor: '#FFEDD5',
      badge: 'টপ সেলিং আইটেম',
      badgeColor: '#C2410C'
    },
    {
      id: 'slow_products',
      category: 'পারফরম্যান্স ও গ্রাহক',
      title: 'কম বিক্রিত / স্লো-মুভিং পণ্য',
      subtitle: 'যেসব পণ্যের বিক্রি কম হচ্ছে, যাতে ছাড় দিয়ে দ্রুত সেল করা যায়',
      icon: RotateCcw,
      color: '#4B5563',
      bgColor: '#F3F4F6',
      badge: 'স্লো স্টক',
      badgeColor: '#4B5563'
    },
    {
      id: 'top_customers',
      category: 'পারফরম্যান্স ও গ্রাহক',
      title: 'সেরা ক্রেতা ও গ্রাহক তালিকা',
      subtitle: 'সবচেয়ে বেশি টাকার কেনাকাটা করা বিশ্বস্ত কাস্টমারদের ডাটা',
      icon: Users,
      color: '#0369A1',
      bgColor: '#E0F2FE',
      badge: `${toBengaliNumber(topCustomersData.length)} জন ক্রেতা`,
      badgeColor: '#0369A1'
    },
    {
      id: 'area_sales',
      category: 'পারফরম্যান্স ও গ্রাহক',
      title: 'এলাকা ভিত্তিক ডেলিভারি ও সেলস',
      subtitle: 'মিরপুর, ধানমন্ডি, উত্তরা ইত্যাদি এলাকার অর্ডার ও ডেলিভারি ফি',
      icon: MapPin,
      color: '#047857',
      bgColor: '#D1FAE5',
      badge: 'এরিয়া ডাটা',
      badgeColor: '#047857'
    }
  ];

  const reportTitleMap = {
    sales_summary: 'বিক্রয় ও অর্ডার বিশ্লেষণ রিপোর্ট (Sales Summary Report)',
    order_status: 'অর্ডার স্ট্যাটাস বিবরণী তালিকা (Order Status Report)',
    package_sales: 'প্যাকেজ ও স্পেশাল বক্স বিক্রয় রিপোর্ট (Package & Bundle Sales Report)',
    payment_methods: 'পেমেন্ট মেথড ভিত্তিক আয় রিপোর্ট (Payment Methods Breakdown)',
    current_stock: 'বর্তমান গুদাম স্টক ব্যালেন্স শিট (Current Inventory Stock Sheet)',
    low_stock: 'লো-স্টক ও রি-অর্ডার ওয়ার্নিং শিট (Low Stock Alert Report)',
    category_stock: 'ক্যাটাগরি ভিত্তিক স্টক মূল্যায়ন (Category Stock Valuation)',
    top_products: 'সর্বাধিক বিক্রিত সেরা পণ্য তালিকা (Top Selling Products)',
    slow_products: 'কম বিক্রিত / স্লো মুভিং স্টক রিপোর্ট (Slow Moving Inventory)',
    top_customers: 'সেরা ক্রেতা ও গ্রাহক বিশ্লেষণ (Top Customer Ranking)',
    area_sales: 'এলাকা ভিত্তিক ডেলিভারি ও সেলস রিপোর্ট (Area-wise Delivery Report)',
    delivery_manifest: 'ডেলিভারি রান-শীট ও ক্যাশ কালেকশন চালান (Delivery Manifest Run-Sheet)'
  };

  const openModalFor = (reportId) => {
    setSelectedReportModal(reportId);
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const closeModal = () => {
    setSelectedReportModal(null);
  };

  return (
    <div className="reports-hub-root" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Banner / Dashboard Intro */}
      <div
        className="no-print"
        style={{
          background: 'var(--cream-card)',
          border: '1.5px solid var(--ink)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div
                style={{
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={22} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                ব্যবসায়িক রিপোর্টস ও প্রিন্ট হাব
              </h2>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
              যে কোনো রিপোর্টে ক্লিক করে তাৎক্ষণিক পপআপে প্রিভিউ দেখুন, সময়সীমা ফিল্টার করুন এবং এক ক্লিকে স্পষ্ট A4 সাইজে প্রিন্ট বা PDF ডাউনলোড করুন।
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                background: '#FEF3C7',
                border: '1.5px solid #B45309',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Truck size={18} style={{ color: '#B45309' }} />
              <div>
                <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 700 }}>ডেলিভারির জন্য প্রস্তুত (Shipped)</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#B45309' }} className="mono">
                  {toBengaliNumber(allOrdersList.filter(o => o.status === 'shipped' || o.status === 'অন-ওয়ে').length)} টি পার্সেল
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#DCFCE7',
                border: '1.5px solid #15803D',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} style={{ color: '#15803D' }} />
              <div>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>মোট সম্পন্ন ডেলিভারি</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803D' }} className="mono">
                  {toBengaliNumber(allOrdersList.filter(o => o.status === 'delivered' || o.status === 'ডেলিভার্ড' || o.status === 'সম্পন্ন').length)} টি
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#FFE4E6',
                border: '1.5px solid #E11D48',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Package size={18} style={{ color: '#E11D48' }} />
              <div>
                <div style={{ fontSize: '11px', color: '#9F1239', fontWeight: 700 }}>প্যাকেজ অর্ডার</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#E11D48' }} className="mono">
                  {toBengaliNumber((packageOrders || []).length)} টি
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="no-print">
        {/* Section 1: Delivery & Sales */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Truck size={18} style={{ color: 'var(--ink)' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              ১. ডেলিভারি, চালান ও বিক্রয় রিপোর্ট
            </h3>
          </div>

          <div className="reports-grid-3cols">
            {reportConfigs.filter(r => r.category === 'ডেলিভারি ও চালান' || r.category === 'বিক্রয় ও আয়').map((rpt) => {
              const IconComp = rpt.icon;
              return (
                <motion.div
                  key={rpt.id}
                  whileHover={{ y: -3, boxShadow: 'var(--shadow)' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openModalFor(rpt.id)}
                  style={{
                    background: rpt.highlight ? '#FFFBEB' : 'var(--cream-card)',
                    border: rpt.highlight ? '2px solid #D97706' : '1.5px solid var(--ink)',
                    borderRadius: 'var(--radius)',
                    padding: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div
                        style={{
                          background: rpt.bgColor,
                          color: rpt.color,
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconComp size={22} />
                      </div>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: rpt.bgColor,
                          color: rpt.badgeColor,
                          border: `1px solid ${rpt.badgeColor}`
                        }}
                      >
                        {rpt.badge}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
                      {rpt.title}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                      {rpt.subtitle}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid var(--rule)',
                      paddingTop: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: rpt.highlight ? '#B45309' : 'var(--ink)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={15} /> রিপোর্ট প্রিভিউ ও প্রিন্ট
                    </span>
                    <ChevronRight size={16} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Inventory & Stock */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Package size={18} style={{ color: 'var(--ink)' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              ২. স্টক ও ইনভেন্টরি রিপোর্ট
            </h3>
          </div>

          <div className="reports-grid-3cols">
            {reportConfigs.filter(r => r.category === 'স্টক ও ইনভেন্টরি').map((rpt) => {
              const IconComp = rpt.icon;
              return (
                <motion.div
                  key={rpt.id}
                  whileHover={{ y: -3, boxShadow: 'var(--shadow)' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openModalFor(rpt.id)}
                  style={{
                    background: rpt.alert ? '#FEF2F2' : 'var(--cream-card)',
                    border: rpt.alert ? '2px solid #DC2626' : '1.5px solid var(--ink)',
                    borderRadius: 'var(--radius)',
                    padding: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div
                        style={{
                          background: rpt.bgColor,
                          color: rpt.color,
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconComp size={22} />
                      </div>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: rpt.bgColor,
                          color: rpt.badgeColor,
                          border: `1px solid ${rpt.badgeColor}`
                        }}
                      >
                        {rpt.badge}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
                      {rpt.title}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                      {rpt.subtitle}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid var(--rule)',
                      paddingTop: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: rpt.alert ? '#DC2626' : 'var(--ink)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={15} /> রিপোর্ট প্রিভিউ ও প্রিন্ট
                    </span>
                    <ChevronRight size={16} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Performance & Customers */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Users size={18} style={{ color: 'var(--ink)' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              ৩. পারফরম্যান্স, সেরা পণ্য ও গ্রাহক রিপোর্ট
            </h3>
          </div>

          <div className="reports-grid-3cols">
            {reportConfigs.filter(r => r.category === 'পারফরম্যান্স ও গ্রাহক').map((rpt) => {
              const IconComp = rpt.icon;
              return (
                <motion.div
                  key={rpt.id}
                  whileHover={{ y: -3, boxShadow: 'var(--shadow)' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openModalFor(rpt.id)}
                  style={{
                    background: 'var(--cream-card)',
                    border: '1.5px solid var(--ink)',
                    borderRadius: 'var(--radius)',
                    padding: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div
                        style={{
                          background: rpt.bgColor,
                          color: rpt.color,
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconComp size={22} />
                      </div>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: rpt.bgColor,
                          color: rpt.badgeColor,
                          border: `1px solid ${rpt.badgeColor}`
                        }}
                      >
                        {rpt.badge}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
                      {rpt.title}
                    </h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                      {rpt.subtitle}
                    </p>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid var(--rule)',
                      paddingTop: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--ink)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={15} /> রিপোর্ট প্রিভিউ ও প্রিন্ট
                    </span>
                    <ChevronRight size={16} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL-SCREEN POPUP MODAL FOR REPORT PREVIEW & PRINTING                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedReportModal && (
          <div
            className="report-modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="report-modal-container"
              style={{
                background: 'var(--paper)',
                border: '2px solid var(--ink)',
                borderRadius: 'var(--radius)',
                width: '100%',
                maxWidth: '960px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Fixed Top Header (No Print) */}
              <div
                className="no-print"
                style={{
                  padding: '16px 20px',
                  background: 'var(--cream-card)',
                  borderBottom: '1.5px solid var(--ink)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} style={{ color: 'var(--green)' }} />
                    <span>{reportTitleMap[selectedReportModal] || 'রিপোর্ট প্রিভিউ'}</span>
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    ফিল্টার: <strong>{dateRangeLabel}</strong>
                  </div>
                </div>

                {/* Print & Close Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePrint}
                    className="admin-btn primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <Printer size={16} />
                    <span>প্রিন্ট / PDF ডাউনলোড</span>
                  </motion.button>

                  <button
                    onClick={closeModal}
                    style={{
                      background: 'none',
                      border: '1.5px solid var(--ink)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink)',
                      transition: 'background 0.15s'
                    }}
                    title="পপআপ বন্ধ করুন"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Filter Toolbar (No Print) */}
              <div
                className="no-print"
                style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid var(--rule)',
                  padding: '10px 18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                {/* Date Filter Buttons */}
                {selectedReportModal !== 'delivery_manifest' && selectedReportModal !== 'current_stock' && selectedReportModal !== 'low_stock' && selectedReportModal !== 'category_stock' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', marginRight: '4px' }}>
                      <Calendar size={13} /> সময়:
                    </span>
                    <button
                      onClick={() => setTimeFilter('today')}
                      className={`admin-btn ${timeFilter === 'today' ? 'primary' : 'secondary'}`}
                      style={{ padding: '3px 8px', fontSize: '11.5px' }}
                    >
                      আজ
                    </button>
                    <button
                      onClick={() => setTimeFilter('yesterday')}
                      className={`admin-btn ${timeFilter === 'yesterday' ? 'primary' : 'secondary'}`}
                      style={{ padding: '3px 8px', fontSize: '11.5px' }}
                    >
                      গতকাল
                    </button>
                    <button
                      onClick={() => setTimeFilter('last_7_days')}
                      className={`admin-btn ${timeFilter === 'last_7_days' ? 'primary' : 'secondary'}`}
                      style={{ padding: '3px 8px', fontSize: '11.5px' }}
                    >
                      গত ৭ দিন
                    </button>
                    <button
                      onClick={() => setTimeFilter('this_month')}
                      className={`admin-btn ${timeFilter === 'this_month' ? 'primary' : 'secondary'}`}
                      style={{ padding: '3px 8px', fontSize: '11.5px' }}
                    >
                      চলতি মাস
                    </button>
                    <button
                      onClick={() => setTimeFilter('last_30_days')}
                      className={`admin-btn ${timeFilter === 'last_30_days' ? 'primary' : 'secondary'}`}
                      style={{ padding: '3px 8px', fontSize: '11.5px' }}
                    >
                      গত ৩০ দিন
                    </button>
                    <button
                      onClick={() => setTimeFilter('all')}
                      className={`admin-btn ${timeFilter === 'all' ? 'primary' : 'secondary'}`}
                      style={{ padding: '3px 8px', fontSize: '11.5px' }}
                    >
                      সব
                    </button>
                  </div>
                )}

                {/* Secondary Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {['sales_summary', 'order_status', 'payment_methods', 'area_sales', 'top_customers'].includes(selectedReportModal) && (
                    <select
                      value={orderSourceFilter}
                      onChange={(e) => setOrderSourceFilter(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--ink)', background: '#fff', fontWeight: 600 }}
                    >
                      <option value="all">📦 সব অর্ডার (সাধারণ + প্যাকেজ)</option>
                      <option value="regular">🛒 শুধু সাধারণ অর্ডার</option>
                      <option value="package">🎁 শুধু প্যাকেজ অর্ডার</option>
                    </select>
                  )}

                  {(selectedReportModal === 'order_status' || selectedReportModal === 'package_sales') && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--ink)', background: '#fff' }}
                    >
                      <option value="all">সব স্ট্যাটাস</option>
                      <option value="pending">অপেক্ষমান (Pending)</option>
                      <option value="processing">প্রসেসিং (Processing)</option>
                      <option value="shipped">অন-ওয়ে (Shipped)</option>
                      <option value="delivered">ডেলিভার্ড (Delivered)</option>
                      <option value="cancelled">বাতিল (Cancelled)</option>
                    </select>
                  )}

                  {(selectedReportModal === 'current_stock' || selectedReportModal === 'category_stock') && (
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--ink)', background: '#fff' }}
                    >
                      <option value="all">সব ক্যাটাগরি</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.bn} ({c.en})
                        </option>
                      ))}
                    </select>
                  )}

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="খুঁজুন..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: '4px 8px 4px 24px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--ink)', width: '140px', background: '#fff' }}
                    />
                    <Search size={12} style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  </div>
                </div>
              </div>

              {/* Modal Printable Document Body (Scrollable in UI, Full-width in Print) */}
              <div
                style={{
                  padding: '24px',
                  overflowY: 'auto',
                  flex: 1,
                  background: '#fff',
                  color: '#111'
                }}
              >
                <div id="printable-report-sheet">
                  {/* Official Store Letterhead */}
                  <div style={{ borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                      <div>
                        {logoImageUrl ? (
                          <div style={{ marginBottom: '6px' }}>
                            <img
                              src={logoImageUrl}
                              alt={siteName}
                              style={{
                                maxHeight: '48px',
                                maxWidth: '220px',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain',
                                display: 'block',
                                marginBottom: '4px'
                              }}
                            />
                            <div style={{ fontSize: '12px', color: '#333', marginBottom: '2px' }}>{siteTagline}</div>
                          </div>
                        ) : (
                          <>
                            <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                              {siteName}
                            </h1>
                            <div style={{ fontSize: '12.5px', color: '#333', marginBottom: '3px' }}>{siteTagline}</div>
                          </>
                        )}
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          {siteAddress} | হটলাইন: <span className="mono">{siteHelpline}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '180px' }}>
                        <div
                          style={{
                            display: 'inline-block',
                            background: '#f4f4f4',
                            border: '1px solid #000',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            marginBottom: '4px'
                          }}
                        >
                          অফিশিয়াল রিপোর্ট
                        </div>
                        <div style={{ fontSize: '11px', color: '#444' }}>
                          প্রিন্ট তারিখ: <span className="mono">{new Date().toLocaleString('bn-BD')}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
                          ফিল্টার: <strong>{dateRangeLabel}</strong>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#f9f9f9',
                        border: '1px solid #ddd',
                        padding: '8px 12px',
                        marginTop: '12px',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#000' }}>
                        {reportTitleMap[selectedReportModal] || 'ব্যবসায়িক রিপোর্ট'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        নথি আইডি: <strong className="mono">RPT-{selectedReportModal.toUpperCase()}-{new Date().toISOString().slice(0, 10)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 1: DELIVERY MANIFEST (RUN-SHEET)                 */}
                  {/* CRITICAL: ONLY SHIPPED (অন-ওয়ে) ORDERS AS REQUESTED           */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'delivery_manifest' && (
                    <div>
                      {/* Driver Selection Dropdown (No Print) */}
                      <div className="no-print" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>ডেলিভারিম্যান নির্বাচন করুন:</label>
                        <select
                          value={manifestRiderId}
                          onChange={(e) => setManifestRiderId(e.target.value)}
                          style={{
                            padding: '8px 14px',
                            fontSize: '13px',
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid var(--rule)',
                            background: '#FFFFFF',
                            outline: 'none',
                            flex: 1,
                            maxWidth: '340px',
                            fontWeight: 600,
                            color: 'var(--ink)'
                          }}
                        >
                          <option value="">সকল ডেলিভারিম্যান / সমন্বিত চালান</option>
                          {allAvailableRiders.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} - {r.phone} {r.vehicle ? `(${r.vehicle})` : ''} {r.area ? `[${r.area}]` : ''}
                            </option>
                          ))}
                        </select>
                        {manifestRiderId && (
                          <button
                            type="button"
                            onClick={() => setManifestRiderId('')}
                            className="admin-btn secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            রিসেট (সকল)
                          </button>
                        )}
                      </div>

                      {/* Driver Information Header Box (Auto-Populated for Screen & Print) */}
                      {(() => {
                        const selectedRider = manifestRiderId ? allAvailableRiders.find(r => String(r.id) === String(manifestRiderId)) : null;
                        const routeAreas = Array.from(
                          new Set(deliveryManifestData.map((o) => o.delivery_area).filter(Boolean))
                        ).join(', ');

                        const totalCodTarget = deliveryManifestData.reduce((sum, o) => {
                          const isCod = (o.payment_method || 'cod').toLowerCase().includes('cod') || (o.payment_method || '').includes('ক্যাশ');
                          return sum + (isCod ? (Number(o.total_amount) || 0) : 0);
                        }, 0);

                        return (
                          <div
                            style={{
                              border: '1.5px solid #0f172a',
                              padding: '12px 16px',
                              borderRadius: '6px',
                              background: '#F8FAFC',
                              marginBottom: '16px',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                              gap: '12px',
                              fontSize: '12px'
                            }}
                          >
                            <div>
                              <span style={{ color: '#475569', fontSize: '11px', display: 'block', fontWeight: 600 }}>ডেলিভারিম্যানের নাম:</span>
                              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                                {selectedRider ? selectedRider.name : 'সকল ডেলিভারিম্যান (সমন্বিত চালান)'}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: '#475569', fontSize: '11px', display: 'block', fontWeight: 600 }}>মোবাইল নম্বর:</span>
                              <strong className="mono" style={{ fontSize: '13px', color: '#0f172a' }}>
                                {selectedRider?.phone ? selectedRider.phone : (selectedRider ? 'দেওয়া হয়নি' : 'সকল মোবাইল')}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: '#475569', fontSize: '11px', display: 'block', fontWeight: 600 }}>যানবাহন:</span>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                                {selectedRider ? (selectedRider.vehicle || 'মোটরসাইকেল') : 'মোটরসাইকেল / ভ্যান'}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: '#475569', fontSize: '11px', display: 'block', fontWeight: 600 }}>ডেলিভারি রুট / এলাকা:</span>
                              <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                                {selectedRider?.area ? selectedRider.area : (routeAreas || 'ঢাকা সিটি')}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: '#475569', fontSize: '11px', display: 'block', fontWeight: 600 }}>ডেলিভারির তারিখ:</span>
                              <strong className="mono" style={{ fontSize: '12px', color: '#0f172a' }}>
                                {new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </strong>
                            </div>
                            <div>
                              <span style={{ color: '#475569', fontSize: '11px', display: 'block', fontWeight: 600 }}>অ্যাসাইনকৃত অন-ওয়ে পার্সেল:</span>
                              <strong style={{ fontSize: '12px', color: '#b45309' }}>
                                {toBengaliNumber(deliveryManifestData.length)} টি | ক্যাশ আদায়: {formatCurrency(totalCodTarget)}
                              </strong>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ fontSize: '12.5px', marginBottom: '10px', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                        <span>মোট অন-ওয়ে পার্সেল সংখ্যা: <strong>{toBengaliNumber(deliveryManifestData.length)} টি</strong></span>
                        <span style={{ color: '#B45309', fontWeight: 700 }}>* শুধুমাত্র Shipped (অন-ওয়ে) অর্ডারসমূহ</span>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', margin: '8px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px', textAlign: 'center', width: '35px' }}>ক্র:</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', width: '80px' }}>অর্ডার নং</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', width: '150px' }}>গ্রাহক নাম ও ফোন</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ডেলিভারি ঠিকানা ও এলাকা</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', width: '170px' }}>পণ্যের বিবরণ</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', width: '90px' }}>ক্যাশ আদায় (৳)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center', width: '85px' }}>গ্রাহক স্বাক্ষর</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliveryManifestData.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#777' }}>
                                বর্তমানে ডেলিভারির জন্য কোনো অন-ওয়ে (Shipped) অর্ডার নেই।
                              </td>
                            </tr>
                          ) : (
                            deliveryManifestData.map((ord, idx) => {
                              const isCod = (ord.payment_method || 'cod').toLowerCase().includes('cod') || (ord.payment_method || '').includes('ক্যাশ');
                              const collectAmount = isCod ? ord.total_amount : 0;
                              return (
                                <tr key={ord.order_code ? `manifest-${ord.order_code}` : `manifest-${ord.is_package ? 'pkg' : 'reg'}-${ord.id}-${idx}`} style={{ borderBottom: '1px solid #ddd' }}>
                                  <td style={{ padding: '6px', textAlign: 'center', fontWeight: 700 }} className="mono">
                                    {toBengaliNumber(idx + 1)}
                                  </td>
                                  <td style={{ padding: '6px 8px', fontWeight: 700 }} className="mono">
                                    {ord.order_code || `#${ord.id}`}
                                  </td>
                                  <td style={{ padding: '6px 8px' }}>
                                    <div style={{ fontWeight: 700 }}>{ord.customer_name}</div>
                                    <div className="mono" style={{ fontSize: '11px', color: '#333' }}>{ord.customer_phone}</div>
                                  </td>
                                  <td style={{ padding: '6px 8px' }}>
                                    <div style={{ fontSize: '11px', lineHeight: 1.3 }}>{ord.delivery_address}</div>
                                    {ord.delivery_area && (
                                      <div style={{ fontSize: '10px', color: '#555', fontWeight: 600, marginTop: '2px' }}>
                                        এরিয়া: {ord.delivery_area}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '6px 8px', fontSize: '10.5px' }}>
                                    {(ord.items_json || []).map((it, i) => (
                                      <div key={i}>
                                        • {it.catBn} ({it.brand}) - {toBengaliNumber(it.qty)} {it.unit || 'কেজি'}
                                      </div>
                                    ))}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }} className="mono">
                                    {isCod ? (
                                      <span style={{ color: '#B45309' }}>{formatCurrency(collectAmount)}</span>
                                    ) : (
                                      <span style={{ color: 'var(--green)', fontSize: '10px' }}>পরিশোধিত ({ord.payment_method})</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'bottom' }}>
                                    <div style={{ borderBottom: '1px dotted #888', height: '24px' }}></div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        {deliveryManifestData.length > 0 && (
                          <tfoot>
                            <tr style={{ background: '#f5f5f5', borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 800 }}>
                              <td colSpan="5" style={{ padding: '7px 8px', textAlign: 'right' }}>
                                মোট ক্যাশ কালেকশন লক্ষ্যমাত্রা:
                              </td>
                              <td style={{ padding: '7px 8px', textAlign: 'right', color: '#B45309' }} className="mono">
                                {formatCurrency(
                                  deliveryManifestData.reduce((sum, o) => {
                                    const isCod = (o.payment_method || 'cod').toLowerCase().includes('cod') || (o.payment_method || '').includes('ক্যাশ');
                                    return sum + (isCod ? (Number(o.total_amount) || 0) : 0);
                                  }, 0)
                                )}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>

                      {/* Manifest Signatures Footer */}
                      <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'space-between', padding: '0 20px', fontSize: '11.5px' }}>
                        <div style={{ textAlign: 'center', width: '180px' }}>
                          <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 700 }}>
                            ডেলিভারিম্যানের স্বাক্ষর
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', width: '180px' }}>
                          <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 700 }}>
                            ক্যাশ রিসিভার / ইনচার্জ
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 2: SALES SUMMARY                                 */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'sales_summary' && (
                    <div>
                      {/* Summary Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '18px' }}>
                        <div style={{ border: '1px solid #000', padding: '10px', borderRadius: '4px', background: '#fafafa' }}>
                          <div style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>মোট বিক্রয় (Delivered)</div>
                          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green)', margin: '3px 0' }}>
                            {formatCurrency(salesSummaryData.totalSalesDelivered)}
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>পণ্য + ডেলিভারি ফি সহ</div>
                        </div>

                        <div style={{ border: '1px solid #000', padding: '10px', borderRadius: '4px', background: '#fafafa' }}>
                          <div style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>মোট সম্পন্ন অর্ডার</div>
                          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: '#000', margin: '3px 0' }}>
                            {toBengaliNumber(salesSummaryData.deliveredCount)} টি
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>মোট গৃহীত: {toBengaliNumber(salesSummaryData.totalOrdersCount)} টি</div>
                        </div>

                        <div style={{ border: '1px solid #000', padding: '10px', borderRadius: '4px', background: '#fafafa' }}>
                          <div style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>গড় অর্ডার মূল্য (AOV)</div>
                          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: '#000', margin: '3px 0' }}>
                            {formatCurrency(salesSummaryData.avgOrderValue)}
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>প্রতি অর্ডারে গড় বিক্রয়</div>
                        </div>

                        <div style={{ border: '1px solid #000', padding: '10px', borderRadius: '4px', background: '#fafafa' }}>
                          <div style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>মোট ডেলিভারি চার্জ আদায়</div>
                          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: '#000', margin: '3px 0' }}>
                            {formatCurrency(salesSummaryData.totalDeliveryFees)}
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>ডেলিভারিম্যান ও ট্রান্সপোর্ট</div>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px', borderBottom: '1px solid #ccc', paddingBottom: '3px' }}>
                        দৈনিক বিক্রয় ও অর্ডার অগ্রগতি তালিকা (Daily Breakdown):
                      </h4>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '8px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>তারিখ</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>মোট অর্ডার</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>ডেলিভার্ড অর্ডার</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>বাতিল অর্ডার</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>আদায়কৃত ডেলিভারি ফি</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট বিক্রয় টাকা (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesSummaryData.dailyBreakdown.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: '#777' }}>
                                কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
                              </td>
                            </tr>
                          ) : (
                            salesSummaryData.dailyBreakdown.map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                                  {formatDateBn(row.date)}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">
                                  {toBengaliNumber(row.totalOrders)}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--green)', fontWeight: 700 }} className="mono">
                                  {toBengaliNumber(row.deliveredOrders)}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', color: row.cancelledOrders > 0 ? 'var(--chili)' : '#777' }} className="mono">
                                  {toBengaliNumber(row.cancelledOrders)}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">
                                  {formatCurrency(row.deliveredDeliveryFee)}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }} className="mono">
                                  {formatCurrency(row.deliveredRevenue)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {salesSummaryData.dailyBreakdown.length > 0 && (
                          <tfoot>
                            <tr style={{ background: '#f5f5f5', borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 800 }}>
                              <td style={{ padding: '7px 8px' }}>সর্বমোট (Total)</td>
                              <td style={{ padding: '7px 8px', textAlign: 'center' }} className="mono">
                                {toBengaliNumber(salesSummaryData.totalOrdersCount)}
                              </td>
                              <td style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--green)' }} className="mono">
                                {toBengaliNumber(salesSummaryData.deliveredCount)}
                              </td>
                              <td style={{ padding: '7px 8px', textAlign: 'center', color: 'var(--chili)' }} className="mono">
                                {toBengaliNumber(salesSummaryData.cancelledCount)}
                              </td>
                              <td style={{ padding: '7px 8px', textAlign: 'right' }} className="mono">
                                {formatCurrency(salesSummaryData.totalDeliveryFees)}
                              </td>
                              <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--green)' }} className="mono">
                                {formatCurrency(salesSummaryData.totalSalesDelivered)}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 3: ORDER STATUS REPORT                           */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'order_status' && (
                    <div>
                      <div style={{ fontSize: '12px', marginBottom: '8px', color: '#555' }}>
                        মোট প্রদর্শিত অর্ডার: <strong>{toBengaliNumber(orderStatusData.length)} টি</strong> | 
                        স্ট্যাটাস ফিল্টার: <strong>{statusFilter === 'all' ? 'সকল স্ট্যাটাস' : statusFilter}</strong>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px', textAlign: 'left' }}>অর্ডার নং</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>তারিখ</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>গ্রাহক নাম ও ফোন</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>ঠিকানা ও এলাকা</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>পেমেন্ট</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>স্ট্যাটাস</th>
                            <th style={{ padding: '6px', textAlign: 'right' }}>মোট টাকা (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderStatusData.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '18px', color: '#777' }}>
                                কোনো অর্ডার পাওয়া যায়নি।
                              </td>
                            </tr>
                          ) : (
                            orderStatusData.map((ord, oIdx) => (
                              <tr key={ord.order_code ? `status-rpt-${ord.order_code}` : `status-rpt-${ord.is_package ? 'pkg' : 'reg'}-${ord.id}-${oIdx}`} style={{ borderBottom: '1px solid #e8e8e8' }}>
                                <td style={{ padding: '6px', fontWeight: 700 }} className="mono">
                                  {ord.order_code || `#${ord.id}`}
                                </td>
                                <td style={{ padding: '6px' }}>
                                  {formatDateBn(ord.created_at)}
                                </td>
                                <td style={{ padding: '6px' }}>
                                  <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                                  <div className="mono" style={{ fontSize: '10.5px', color: '#555' }}>{ord.customer_phone}</div>
                                </td>
                                <td style={{ padding: '6px' }}>
                                  <div style={{ fontSize: '10.5px' }}>{ord.delivery_address}</div>
                                  {ord.delivery_area && (
                                    <span style={{ fontSize: '9.5px', color: '#666', background: '#eee', padding: '1px 4px', borderRadius: '2px' }}>
                                      {ord.delivery_area}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10px' }}>
                                  {ord.payment_method || 'COD'}
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 5px',
                                      borderRadius: '3px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      background:
                                        ord.status === 'delivered' || ord.status === 'ডেলিভার্ড'
                                          ? '#dcfce7'
                                          : ord.status === 'cancelled' || ord.status === 'বাতিল'
                                          ? '#fee2e2'
                                          : '#fef9c3',
                                      color:
                                        ord.status === 'delivered' || ord.status === 'ডেলিভার্ড'
                                          ? '#166534'
                                          : ord.status === 'cancelled' || ord.status === 'বাতিল'
                                          ? '#991b1b'
                                          : '#854d0e'
                                    }}
                                  >
                                    {ord.status}
                                  </span>
                                </td>
                                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700 }} className="mono">
                                  {formatCurrency(ord.total_amount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {orderStatusData.length > 0 && (
                          <tfoot>
                            <tr style={{ background: '#f5f5f5', borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 800 }}>
                              <td colSpan="6" style={{ padding: '6px 8px', textAlign: 'right' }}>
                                সর্বমোট যোগফল ({toBengaliNumber(orderStatusData.length)} টি অর্ডার):
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--green)' }} className="mono">
                                {formatCurrency(orderStatusData.reduce((s, o) => s + (Number(o.total_amount) || 0), 0))}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT: PACKAGE & BUNDLE SALES REPORT                   */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'package_sales' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          মোট প্যাকেজ অর্ডার: <strong>{toBengaliNumber(packageOrdersData.length)} টি</strong> | 
                          স্ট্যাটাস ফিল্টার: <strong>{statusFilter === 'all' ? 'সকল স্ট্যাটাস' : statusFilter}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#9F1239', fontWeight: 700 }}>
                          মোট প্যাকেজ বিক্রয়: <strong>{formatCurrency(packageOrdersData.reduce((s, o) => s + (Number(o.total_amount) || 0), 0))}</strong>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px', textAlign: 'left' }}>অর্ডার নং</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>তারিখ</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>প্যাকেজের নাম</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>গ্রাহক নাম ও ফোন</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>ঠিকানা ও এলাকা</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>পেমেন্ট</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>স্ট্যাটাস</th>
                            <th style={{ padding: '6px', textAlign: 'right' }}>মোট টাকা (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {packageOrdersData.length === 0 ? (
                            <tr>
                              <td colSpan="8" style={{ textAlign: 'center', padding: '18px', color: '#777' }}>
                                কোনো প্যাকেজ অর্ডার পাওয়া যায়নি।
                              </td>
                            </tr>
                          ) : (
                            packageOrdersData.map((ord, oIdx) => (
                              <tr key={`pkg-rpt-${ord.id || oIdx}`} style={{ borderBottom: '1px solid #e8e8e8' }}>
                                <td style={{ padding: '6px', fontWeight: 700 }} className="mono">
                                  {ord.order_code || `#PK-${ord.id}`}
                                </td>
                                <td style={{ padding: '6px' }}>
                                  {formatDateBn(ord.created_at)}
                                </td>
                                <td style={{ padding: '6px' }}>
                                  <div style={{ fontWeight: 700, color: '#9F1239' }}>{ord.package_name || 'স্পেশাল প্যাকেজ'}</div>
                                  {ord.items && Array.isArray(ord.items) && ord.items.length > 0 && (
                                    <div style={{ fontSize: '10px', color: '#666' }}>
                                      {ord.items.map(it => `${it.name || it.product_name} (${it.quantity || 1} ${it.unit || 'টি'})`).join(', ')}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '6px' }}>
                                  <div style={{ fontWeight: 600 }}>{ord.customer_name}</div>
                                  <div className="mono" style={{ fontSize: '10.5px', color: '#555' }}>{ord.customer_phone}</div>
                                </td>
                                <td style={{ padding: '6px' }}>
                                  <div style={{ fontSize: '10.5px' }}>{ord.delivery_address}</div>
                                  {ord.delivery_area && (
                                    <span style={{ fontSize: '9.5px', color: '#666', background: '#eee', padding: '1px 4px', borderRadius: '2px' }}>
                                      {ord.delivery_area}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center', textTransform: 'uppercase', fontSize: '10px' }}>
                                  <span style={{ fontWeight: 700 }}>{ord.payment_method || 'COD'}</span>
                                  {ord.payment_trxid && (
                                    <div className="mono" style={{ fontSize: '9px', color: '#555' }}>Trx: {ord.payment_trxid}</div>
                                  )}
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 5px',
                                      borderRadius: '3px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      background:
                                        ord.status === 'delivered' || ord.status === 'ডেলিভার্ড' || ord.status === 'সম্পন্ন'
                                          ? '#dcfce7'
                                          : ord.status === 'cancelled' || ord.status === 'বাতিল'
                                          ? '#fee2e2'
                                          : '#fef9c3',
                                      color:
                                        ord.status === 'delivered' || ord.status === 'ডেলিভার্ড' || ord.status === 'সম্পন্ন'
                                          ? '#166534'
                                          : ord.status === 'cancelled' || ord.status === 'বাতিল'
                                          ? '#991b1b'
                                          : '#854d0e'
                                    }}
                                  >
                                    {ord.status}
                                  </span>
                                </td>
                                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#9F1239' }} className="mono">
                                  {formatCurrency(ord.total_amount)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {packageOrdersData.length > 0 && (
                          <tfoot>
                            <tr style={{ background: '#f5f5f5', borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 800 }}>
                              <td colSpan="7" style={{ padding: '6px 8px', textAlign: 'right' }}>
                                প্যাকেজ অর্ডারের সর্বমোট যোগফল ({toBengaliNumber(packageOrdersData.length)} টি):
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#9F1239' }} className="mono">
                                {formatCurrency(packageOrdersData.reduce((s, o) => s + (Number(o.total_amount) || 0), 0))}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 4: PAYMENT METHODS REPORT                        */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'payment_methods' && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                        <div style={{ border: '1px solid #000', padding: '12px', borderRadius: '4px', background: '#fafafa' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#15803D' }}>ক্যাশ অন ডেলিভারি (COD)</div>
                          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0' }}>
                            {formatCurrency(paymentMethodData.cod.amount)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#555' }}>মোট {toBengaliNumber(paymentMethodData.cod.count)} টি অর্ডার</div>
                        </div>

                        <div style={{ border: '1px solid #000', padding: '12px', borderRadius: '4px', background: '#fafafa' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#D946EF' }}>বিকাশ (bKash)</div>
                          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0' }}>
                            {formatCurrency(paymentMethodData.bkash.amount)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#555' }}>মোট {toBengaliNumber(paymentMethodData.bkash.count)} টি অর্ডার</div>
                        </div>

                        <div style={{ border: '1px solid #000', padding: '12px', borderRadius: '4px', background: '#fafafa' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#EA580C' }}>নগদ (Nagad)</div>
                          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0' }}>
                            {formatCurrency(paymentMethodData.nagad.amount)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#555' }}>মোট {toBengaliNumber(paymentMethodData.nagad.count)} টি অর্ডার</div>
                        </div>

                        <div style={{ border: '1px solid #000', padding: '12px', borderRadius: '4px', background: '#fafafa' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#7C3AED' }}>রকেট ও অন্যান্য</div>
                          <div className="mono" style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0' }}>
                            {formatCurrency(paymentMethodData.rocket.amount + paymentMethodData.other.amount)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#555' }}>মোট {toBengaliNumber(paymentMethodData.rocket.count + paymentMethodData.other.count)} টি অর্ডার</div>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '8px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>পেমেন্ট মাধ্যম</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>মোট অর্ডার</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট অর্ডারকৃত টাকা</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>সফল ডেলিভার্ড টাকা (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>ক্যাশ অন ডেলিভারি (Cash on Delivery)</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(paymentMethodData.cod.count)}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(paymentMethodData.cod.amount)}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }} className="mono">{formatCurrency(paymentMethodData.cod.deliveredAmount)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>বিকাশ (bKash)</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(paymentMethodData.bkash.count)}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(paymentMethodData.bkash.amount)}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }} className="mono">{formatCurrency(paymentMethodData.bkash.deliveredAmount)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>নগদ (Nagad)</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(paymentMethodData.nagad.count)}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(paymentMethodData.nagad.amount)}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }} className="mono">{formatCurrency(paymentMethodData.nagad.deliveredAmount)}</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>রকেট ও অন্যান্য (Rocket & Other)</td>
                            <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(paymentMethodData.rocket.count + paymentMethodData.other.count)}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(paymentMethodData.rocket.amount + paymentMethodData.other.amount)}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }} className="mono">{formatCurrency(paymentMethodData.rocket.deliveredAmount + paymentMethodData.other.deliveredAmount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 5: CURRENT STOCK BALANCE                         */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'current_stock' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                        <span>মোট পণ্য আইটেম: <strong>{toBengaliNumber(stockReportData.length)} টি</strong></span>
                        <span>মোট গুদাম ভ্যালুয়েশন (ক্রয়মূল্য): <strong>{formatCurrency(stockReportData.reduce((s, p) => s + p.totalCostValuation, 0))}</strong></span>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ক্যাটাগরি</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>পণ্যের নাম / ব্র্যান্ড</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>বর্তমান মজুত</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>ক্রয়মূল্য (৳)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>বিক্রয়মূল্য (৳)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট ক্রয় ভ্যালু (৳)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট বাজার ভ্যালু (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockReportData.length === 0 ? (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '16px', color: '#777' }}>
                                কোনো পণ্য পাওয়া যায়নি।
                              </td>
                            </tr>
                          ) : (
                            stockReportData.map((p, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e8e8e8', background: p.isLow ? '#fffbeb' : undefined }}>
                                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.categoryNameBn}</td>
                                <td style={{ padding: '6px 8px' }}>
                                  <strong>{p.brandName}</strong>
                                  {p.isLow && (
                                    <span style={{ marginLeft: '6px', fontSize: '9.5px', color: '#DC2626', fontWeight: 700 }}>[লো-স্টক]</span>
                                  )}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }} className="mono">
                                  {formatStockDisplay(p.stock, p.unit)}
                                  <div style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>({p.unit})</div>
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(p.costPrice)}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(p.sellPrice)}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(p.totalCostValuation)}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }} className="mono">{formatCurrency(p.totalMarketValuation)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {stockReportData.length > 0 && (
                          <tfoot>
                            <tr style={{ background: '#f5f5f5', borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 800 }}>
                              <td colSpan="5" style={{ padding: '6px 8px', textAlign: 'right' }}>সর্বমোট গুদাম মূল্য:</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(stockReportData.reduce((s, p) => s + p.totalCostValuation, 0))}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--green)' }} className="mono">{formatCurrency(stockReportData.reduce((s, p) => s + p.totalMarketValuation, 0))}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 6: LOW STOCK WARNINGS                            */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'low_stock' && (
                    <div>
                      <div
                        style={{
                          background: '#fee2e2',
                          border: '1px solid #dc2626',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#991b1b',
                          marginBottom: '12px',
                          fontWeight: 600
                        }}
                      >
                        ⚠️ যেসব পণ্যের মজুত ১০ কেজি/পিসের নিচে নেমে গেছে সেগুলোর তালিকা নিচে দেওয়া হলো। অনতিবিলম্বে নতুন চালান কেনার সুপারিশ করা হচ্ছে।
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ক্যাটাগরি</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>পণ্যের নাম</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>অবশিষ্ট স্টক</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>ক্রয়মূল্য (৳)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>বিক্রয়মূল্য (৳)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>স্ট্যাটাস</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStockData.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '18px', color: 'var(--green)', fontWeight: 700 }}>
                                বর্তমানে সব পণ্যের পর্যাপ্ত মজুত রয়েছে! কোনো লো-স্টক পণ্য নেই।
                              </td>
                            </tr>
                          ) : (
                            lowStockData.map((p, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #ddd', background: '#fff1f2' }}>
                                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.categoryNameBn}</td>
                                <td style={{ padding: '6px 8px', fontWeight: 700 }}>{p.brandName}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', color: '#DC2626', fontWeight: 800 }} className="mono">
                                  {formatStockDisplay(p.stock, p.unit)}
                                  <div style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>({p.unit})</div>
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(p.costPrice)}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(p.sellPrice)}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                  <span style={{ background: '#DC2626', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px' }}>
                                    {p.stock <= 0 ? 'স্টক শেষ' : 'রি-অর্ডার প্রয়োজন'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 7: CATEGORY STOCK VALUATION                      */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'category_stock' && (
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ক্যাটাগরির নাম</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>মোট আইটেম সংখ্যা</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>মোট মজুত পরিমাণ</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট ক্রয় ভ্যালুয়েশন (৳)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>সম্ভাব্য বিক্রয় মূল্য (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryValuationData.map((cat, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 700 }}>{cat.nameBn} ({cat.nameEn})</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(cat.totalItems)} টি</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(cat.totalStockQty)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(cat.totalCostValuation)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }} className="mono">{formatCurrency(cat.totalMarketValuation)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f5f5f5', borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 800 }}>
                            <td style={{ padding: '7px 8px' }}>সর্বমোট যোগফল:</td>
                            <td style={{ padding: '7px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(categoryValuationData.reduce((s, c) => s + c.totalItems, 0))} টি</td>
                            <td style={{ padding: '7px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(categoryValuationData.reduce((s, c) => s + c.totalStockQty, 0))}</td>
                            <td style={{ padding: '7px 8px', textAlign: 'right' }} className="mono">{formatCurrency(categoryValuationData.reduce((s, c) => s + c.totalCostValuation, 0))}</td>
                            <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--green)' }} className="mono">{formatCurrency(categoryValuationData.reduce((s, c) => s + c.totalMarketValuation, 0))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 8: TOP SELLING PRODUCTS                          */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'top_products' && (
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'center', width: '40px' }}>র‌্যাংক</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ক্যাটাগরি</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>পণ্যের নাম / ব্র্যান্ড</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>মোট বিক্রিত পরিমাণ</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>অর্ডার সংখ্যা</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট বিক্রয় টাকা (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productPerformanceData.topSelling.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: '#777' }}>
                                কোনো বিক্রয় তথ্য পাওয়া যায়নি।
                              </td>
                            </tr>
                          ) : (
                            productPerformanceData.topSelling.map((p, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>#{toBengaliNumber(idx + 1)}</td>
                                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.categoryBn}</td>
                                <td style={{ padding: '6px 8px', fontWeight: 700 }}>{p.brandName}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--green)' }} className="mono">
                                  {toBengaliNumber(p.qtySold)} {p.unit}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(p.totalOrdersCount)} বার</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }} className="mono">{formatCurrency(p.totalSalesRevenue)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 9: SLOW MOVING PRODUCTS                          */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'slow_products' && (
                    <div>
                      <div style={{ background: '#f3f4f6', border: '1px solid #ccc', padding: '8px 12px', borderRadius: '4px', fontSize: '11.5px', marginBottom: '10px' }}>
                        💡 যেসব পণ্যের বিক্রি খুব কম বা শূন্য, সেগুলোতে বিশেষ অফার বা ডিসকাউন্ট দিয়ে দ্রুত স্টক খালি করার ব্যবস্থা নিতে পারেন।
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ক্যাটাগরি</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>পণ্যের নাম</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>বর্তমান মজুত</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>বিক্রিত পরিমাণ</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>বর্তমান মূল্য (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productPerformanceData.slowMoving.map((p, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.categoryBn}</td>
                              <td style={{ padding: '6px 8px', fontWeight: 700 }}>{p.brandName}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(p.currentStock)} {p.unit}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#dc2626', fontWeight: 700 }} className="mono">{toBengaliNumber(p.qtySold)} {p.unit}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(p.sellingPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 10: TOP CUSTOMERS                                */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'top_customers' && (
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'center', width: '40px' }}>র‌্যাংক</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ক্রেতার নাম ও ফোন</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ঠিকানা / এলাকা</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>মোট অর্ডার</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>ডেলিভার্ড অর্ডার</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট ক্রয়ের পরিমাণ (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topCustomersData.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: '#777' }}>
                                কোনো গ্রাহক তথ্য পাওয়া যায়নি।
                              </td>
                            </tr>
                          ) : (
                            topCustomersData.map((c, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>#{toBengaliNumber(idx + 1)}</td>
                                <td style={{ padding: '6px 8px' }}>
                                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                                  <div className="mono" style={{ fontSize: '10.5px', color: '#555' }}>{c.phone}</div>
                                </td>
                                <td style={{ padding: '6px 8px', fontSize: '11px' }}>
                                  {c.address || c.area || '—'}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(c.totalOrders)} টি</td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--green)', fontWeight: 700 }} className="mono">{toBengaliNumber(c.deliveredOrders)} টি</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: 'var(--green)' }} className="mono">{formatCurrency(c.totalSpent)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* MODAL REPORT 11: AREA SALES & DELIVERY                        */}
                  {/* ------------------------------------------------------------- */}
                  {selectedReportModal === 'area_sales' && (
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', margin: '6px 0' }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>ডেলিভারি এলাকা</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>মোট অর্ডার সংখ্যা</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>ডেলিভার্ড সম্পন্ন</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>আদায়কৃত ডেলিভারি ফি (৳)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>মোট বিক্রয় ভলিউম (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {areaPerformanceData.map((a, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 700 }}>{a.areaName}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }} className="mono">{toBengaliNumber(a.totalOrders)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--green)', fontWeight: 700 }} className="mono">{toBengaliNumber(a.deliveredOrders)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }} className="mono">{formatCurrency(a.totalDeliveryFees)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }} className="mono">{formatCurrency(a.totalRevenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer (No Print) */}
              <div
                className="no-print"
                style={{
                  padding: '12px 20px',
                  background: 'var(--cream-card)',
                  borderTop: '1.5px solid var(--ink)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <button
                  onClick={closeModal}
                  className="admin-btn secondary"
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                >
                  বন্ধ করুন
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrint}
                  className="admin-btn primary"
                  style={{ padding: '8px 20px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={16} />
                  <span>প্রিন্ট / PDF ডাউনলোড</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
