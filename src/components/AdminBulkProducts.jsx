"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Database,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  CheckCircle2,
  Table as TableIcon,
  Search,
  Package,
  Layers,
  HelpCircle,
  FileCheck2,
  ArrowRight,
  Filter,
  CheckCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toBengaliNumber, formatStockDisplay } from '../utils/bengali.js';

export default function AdminBulkProducts({
  isOpen = true,
  adminToken,
  groups = [],
  categories: initialCategories = [],
  onRefresh,
  showToast,
  onClose
}) {
  if (isOpen === false) return null;

  const [categories, setCategories] = useState(initialCategories || []);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [csvText, setCsvText] = useState('');
  const [parsedUpdates, setParsedUpdates] = useState([]);
  const [fileStats, setFileStats] = useState({ total: 0, changed: 0, unchanged: 0, unmatched: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewFilter, setPreviewFilter] = useState('');
  const [selectedGroupExport, setSelectedGroupExport] = useState('');
  const [selectedCatExport, setSelectedCatExport] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Synchronize or auto-fetch categories if empty
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    } else {
      fetchCategories();
    }
  }, [initialCategories]);

  const fetchCategories = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories for export', err);
    } finally {
      setLoadingData(false);
    }
  };

  // 1. Full Store Products (all products without export filters for accurate matching)
  const allStoreProducts = [];
  if (Array.isArray(categories)) {
    categories.forEach((cat) => {
      let brandsList = cat.brands;
      if (typeof brandsList === 'string') {
        try { brandsList = JSON.parse(brandsList); } catch (e) { brandsList = []; }
      }
      if (brandsList && Array.isArray(brandsList)) {
        brandsList.forEach((brand) => {
          allStoreProducts.push({
            productId: brand.id || '',
            categoryId: cat.id,
            categoryName: cat.bn || cat.en || 'সাধারণ',
            categoryEn: cat.en || '',
            group: cat.group || 'staples',
            brandName: brand.name || '',
            unit: brand.unit || 'প্রতি কেজি',
            price: Number(brand.price) || 0,
            costPrice: Number(brand.cost_price) || 0,
            stock: brand.stock !== undefined && brand.stock !== null ? Number(brand.stock) : 100,
            forceStockOut: !!brand.force_stock_out
          });
        });
      }
    });
  }

  // 2. Export Products (filtered by selected group & category for Tab 1)
  const exportProducts = allStoreProducts.filter((p) => {
    if (selectedGroupExport && p.group !== selectedGroupExport) return false;
    if (selectedCatExport && p.categoryId !== parseInt(selectedCatExport)) return false;
    return true;
  });

  // Export as Native Microsoft Excel (.xlsx) Workbook
  const handleExportExcel = () => {
    try {
      if (exportProducts.length === 0) {
        if (showToast) showToast('কোনো পণ্য ডাটা পাওয়া যায়নি');
        return;
      }

      const headers = [
        'SL',
        'Product_ID',
        'Category_ID',
        'Category_Name_BN',
        'Category_Name_EN',
        'Product_Name',
        'Unit',
        'Price_BDT',
        'Cost_Price_BDT',
        'Stock_Quantity',
        'Stock_Status'
      ];

      const dataRows = exportProducts.map((p, idx) => [
        idx + 1,
        p.productId,
        p.categoryId,
        p.categoryName || '',
        p.categoryEn || '',
        p.brandName || '',
        p.unit || 'প্রতি কেজি',
        p.price,
        p.costPrice,
        p.stock,
        p.forceStockOut ? 'স্টক আউট' : (p.stock <= 0 ? 'মজুত শেষ' : 'সচল')
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

      // Set clean column widths for Excel
      ws['!cols'] = [
        { wch: 6 },  // SL
        { wch: 14 }, // Product_ID
        { wch: 14 }, // Category_ID
        { wch: 22 }, // Category_Name_BN
        { wch: 20 }, // Category_Name_EN
        { wch: 32 }, // Product_Name
        { wch: 16 }, // Unit
        { wch: 14 }, // Price_BDT
        { wch: 15 }, // Cost_Price_BDT
        { wch: 16 }, // Stock_Quantity
        { wch: 16 }  // Stock_Status
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      const fileName = `Arot_Express_Product_List_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      if (showToast) showToast(`মোট ${toBengaliNumber(exportProducts.length)} টি পণ্যের এক্সেল (.xlsx) ফাইল ডাউনলোড হয়েছে`);
    } catch (err) {
      console.error('Excel export error:', err);
      if (showToast) showToast('এক্সেল ফাইলে এক্সপোর্ট করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // Export as Standard UTF-8 CSV (with BOM for Excel Bangla Support)
  const handleExportCSV = () => {
    try {
      if (exportProducts.length === 0) {
        if (showToast) showToast('কোনো পণ্য ডাটা পাওয়া যায়নি');
        return;
      }

      const headers = [
        'SL',
        'Product_ID',
        'Category_ID',
        'Category_Name_BN',
        'Category_Name_EN',
        'Product_Name',
        'Unit',
        'Price_BDT',
        'Cost_Price_BDT',
        'Stock_Quantity',
        'Stock_Status'
      ];

      const rows = exportProducts.map((p, idx) => {
        const safeCatBn = `"${(p.categoryName || '').replace(/"/g, '""')}"`;
        const safeCatEn = `"${(p.categoryEn || '').replace(/"/g, '""')}"`;
        const safeBrand = `"${(p.brandName || '').replace(/"/g, '""')}"`;
        const safeUnit = `"${(p.unit || 'প্রতি কেজি').replace(/"/g, '""')}"`;
        const statusText = p.forceStockOut ? 'স্টক আউট' : (p.stock <= 0 ? 'মজুত শেষ' : 'সচল');

        return [
          idx + 1,
          p.productId,
          p.categoryId,
          safeCatBn,
          safeCatEn,
          safeBrand,
          safeUnit,
          p.price,
          p.costPrice,
          p.stock,
          `"${statusText}"`
        ].join(',');
      });

      const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Arot_Express_Product_List_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      if (link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(url);

      if (showToast) showToast(`মোট ${toBengaliNumber(exportProducts.length)} টি পণ্যের সাজানো CSV ডাউনলোড হয়েছে`);
    } catch (err) {
      if (showToast) showToast('CSV এক্সপোর্টে ত্রুটি হয়েছে: ' + err.message);
    }
  };

  // Universal Row Processor (Handles Excel & CSV, filter ONLY rows with changes)
  const processTableRows = (rows) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!Array.isArray(rows) || rows.length < 2) {
      setErrorMsg('ফাইলে পর্যাপ্ত পণ্যের ডাটা বা সারি পাওয়া যায়নি');
      setParsedUpdates([]);
      setFileStats({ total: 0, changed: 0, unchanged: 0, unmatched: 0 });
      return;
    }

    // Identify header row
    const headerLine = rows[0].map((h) => String(h || '').toLowerCase().trim());

    const productIdIdx = headerLine.findIndex(
      (h) => (h.includes('product') && h.includes('id')) || h === 'product_id' || h === 'id' || h === 'পণ্য আইডি'
    );
    const brandIdx = headerLine.findIndex(
      (h) =>
        h.includes('brand') ||
        h.includes('product_name') ||
        (h.includes('name') && !h.includes('category')) ||
        h.includes('পণ্য') ||
        h.includes('item')
    );
    const priceIdx = headerLine.findIndex(
      (h) =>
        (h.includes('price') || h.includes('দর') || h.includes('বিক্রি') || h.includes('মূল্য')) &&
        !h.includes('cost') &&
        !h.includes('কেনা')
    );
    const costIdx = headerLine.findIndex(
      (h) => h.includes('cost') || h.includes('কেনা') || h.includes('পাইকারি_ক্রয়') || h.includes('ক্রয়')
    );
    const stockIdx = headerLine.findIndex(
      (h) => h.includes('stock') || h.includes('মজুত') || h.includes('পরিমাণ') || h.includes('qty')
    );
    const unitIdx = headerLine.findIndex((h) => h.includes('unit') || h.includes('একক'));
    const catIdIdx = headerLine.findIndex(
      (h) => (h.includes('category') && h.includes('id')) || h.includes('cat_id')
    );
    const catNameIdx = headerLine.findIndex((h) => h.includes('category') || h.includes('ক্যাটাগরি'));
    const forceOutIdx = headerLine.findIndex(
      (h) => h.includes('force') || h.includes('out') || h.includes('status') || h.includes('স্ট্যাটাস')
    );

    if (brandIdx === -1 && productIdIdx === -1) {
      setErrorMsg('ফাইলে Product_ID অথবা Product_Name (পণ্যের নাম) কোনো কলামই পাওয়া যায়নি। দয়া করে কলামের নাম যাচাই করুন।');
      setParsedUpdates([]);
      setFileStats({ total: 0, changed: 0, unchanged: 0, unmatched: 0 });
      return;
    }

    let totalParsed = 0;
    const changedUpdates = [];
    let unchangedCount = 0;
    let unmatchedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row) || row.every((cell) => String(cell || '').trim() === '')) continue;
      totalParsed++;

      const rawPId = productIdIdx !== -1 ? row[productIdIdx] : null;
      const parsedPId =
        rawPId !== null && rawPId !== undefined && String(rawPId).trim() !== '' && !isNaN(Number(rawPId))
          ? Number(rawPId)
          : undefined;
      const brandName = brandIdx !== -1 && row[brandIdx] !== undefined ? String(row[brandIdx]).trim() : '';

      // Live comparison with current full store database
      let existing = null;
      let matchType = null; // 'id' | 'name'

      // Priority 1: Direct, precise Match by Product ID
      if (parsedPId) {
        existing = allStoreProducts.find((p) => p.productId === parsedPId);
        if (existing) matchType = 'id';
      }

      // Priority 2: Fallback match by Name and optional Category
      if (!existing && brandName) {
        const rawCatId = catIdIdx !== -1 && row[catIdIdx] ? Number(row[catIdIdx]) : null;
        existing = allStoreProducts.find((p) => {
          const nameMatches = p.brandName.toLowerCase().trim() === brandName.toLowerCase();
          if (!nameMatches) return false;
          if (rawCatId && !isNaN(rawCatId)) {
            return p.categoryId === rawCatId;
          }
          return true;
        });
        if (existing) matchType = 'name';
      }

      // Extract new values or keep undefined
      const rawPrice =
        priceIdx !== -1 && row[priceIdx] !== undefined && String(row[priceIdx]).trim() !== ''
          ? Number(row[priceIdx])
          : undefined;
      const rawCost =
        costIdx !== -1 && row[costIdx] !== undefined && String(row[costIdx]).trim() !== ''
          ? Number(row[costIdx])
          : undefined;
      const rawStock =
        stockIdx !== -1 && row[stockIdx] !== undefined && String(row[stockIdx]).trim() !== ''
          ? Number(row[stockIdx])
          : undefined;
      const rawUnit =
        unitIdx !== -1 && row[unitIdx] !== undefined && String(row[unitIdx]).trim() !== ''
          ? String(row[unitIdx]).trim()
          : undefined;

      let rawForceOut = undefined;
      if (forceOutIdx !== -1 && row[forceOutIdx] !== undefined && String(row[forceOutIdx]).trim() !== '') {
        const statusStr = String(row[forceOutIdx]).toLowerCase().trim();
        rawForceOut =
          statusStr === 'true' ||
          statusStr === '1' ||
          statusStr.includes('আউট') ||
          statusStr.includes('out') ||
          statusStr.includes('শেষ');
      }

      const newPrice = rawPrice !== undefined && !isNaN(rawPrice) ? rawPrice : undefined;
      const newCost = rawCost !== undefined && !isNaN(rawCost) ? rawCost : undefined;
      const newStock = rawStock !== undefined && !isNaN(rawStock) ? Math.max(0, rawStock) : undefined;

      if (!existing) {
        unmatchedCount++;
        continue;
      }

      // Detect EXACT changes compared to existing database state
      const changedFields = [];

      if (newPrice !== undefined && Number(newPrice) !== Number(existing.price)) {
        changedFields.push({ type: 'price', label: 'বিক্রয় মূল্য', old: existing.price, new: newPrice });
      }
      if (newCost !== undefined && Number(newCost) !== Number(existing.costPrice)) {
        changedFields.push({ type: 'cost', label: 'ক্রয় মূল্য', old: existing.costPrice, new: newCost });
      }
      if (newStock !== undefined && Number(newStock) !== Number(existing.stock)) {
        changedFields.push({ type: 'stock', label: 'স্টক', old: existing.stock, new: newStock });
      }
      if (rawUnit && rawUnit.trim() && rawUnit.trim() !== (existing.unit || '').trim()) {
        changedFields.push({ type: 'unit', label: 'একক', old: existing.unit, new: rawUnit.trim() });
      }
      if (brandName && brandName.trim() && brandName.trim() !== (existing.brandName || '').trim()) {
        changedFields.push({ type: 'name', label: 'নাম', old: existing.brandName, new: brandName.trim() });
      }
      if (rawForceOut !== undefined && Boolean(rawForceOut) !== Boolean(existing.forceStockOut)) {
        changedFields.push({
          type: 'force_stock_out',
          label: 'স্ট্যাটাস',
          old: existing.forceStockOut ? 'আউট' : 'সচল',
          new: rawForceOut ? 'আউট' : 'সচল'
        });
      }

      // ONLY include this row if at least one field changed!
      if (changedFields.length > 0) {
        changedUpdates.push({
          product_id: parsedPId || existing.productId,
          brand_name: brandName || existing.brandName,
          category_id: existing.categoryId,
          category_name: existing.categoryName,
          unit: rawUnit || existing.unit,
          price: newPrice !== undefined ? newPrice : existing.price,
          cost_price: newCost !== undefined ? newCost : existing.costPrice,
          stock: newStock !== undefined ? newStock : existing.stock,
          force_stock_out: rawForceOut !== undefined ? rawForceOut : existing.forceStockOut,
          existingPrice: existing.price,
          existingCost: existing.costPrice,
          existingStock: existing.stock,
          existingUnit: existing.unit,
          existingBrandName: existing.brandName,
          matched: true,
          matchType,
          changedFields
        });
      } else {
        unchangedCount++;
      }
    }

    setParsedUpdates(changedUpdates);
    setFileStats({
      total: totalParsed,
      changed: changedUpdates.length,
      unchanged: unchangedCount,
      unmatched: unmatchedCount
    });

    if (totalParsed === 0) {
      setErrorMsg('ফাইলে কোনো পণ্যের তথ্য পাওয়া যায়নি');
    } else if (changedUpdates.length === 0) {
      setSuccessMsg(
        `✓ ফাইলে মোট ${toBengaliNumber(totalParsed)} টি পণ্য স্ক্যান করা হয়েছে। সব তথ্য ইতোমধ্যে বর্তমান ডেটাবেজের সাথে সম্পূর্ণ হুবহু মিল রয়েছে। কোনো পরিবর্তন না থাকায় আপডেট করার প্রয়োজন নেই।`
      );
    } else {
      setSuccessMsg(
        `মোট ${toBengaliNumber(totalParsed)} টি পণ্যের মধ্যে ${toBengaliNumber(
          changedUpdates.length
        )} টি পণ্যে পরিবর্তন সনাক্ত হয়েছে। অপরিবর্তিত ${toBengaliNumber(
          unchangedCount
        )} টি পণ্য স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়েছে।`
      );
    }
  };

  // File Upload (Accepts both .xlsx, .xls and .csv)
  const handleFileProcess = async (file) => {
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setUploadedFileName(file.name);

    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.type.includes('sheet') ||
      file.type.includes('excel');

    try {
      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        processTableRows(rows);
      } else {
        // CSV parsing
        const text = await file.text();
        setCsvText(text);
        parseCSVText(text);
      }
    } catch (err) {
      console.error('File parsing error:', err);
      setErrorMsg('ফাইল পার্স করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  // Intelligent CSV Text Parser (handles comma, semicolon, quoted tokens)
  const parseCSVText = (rawText) => {
    if (!rawText || !rawText.trim()) {
      setParsedUpdates([]);
      setFileStats({ total: 0, changed: 0, unchanged: 0, unmatched: 0 });
      return;
    }

    try {
      const cleanText = rawText.replace(/^\uFEFF/, '');
      const lines = cleanText.trim().split(/\r\n|\r|\n/);
      if (lines.length < 2) {
        setErrorMsg('CSV ফাইলে পর্যাপ্ত ডাটা পাওয়া যায়নি');
        return;
      }

      const delimiter = lines[0].includes(';') ? ';' : ',';

      const parsedRows = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = [];
        let inQuote = false;
        let token = '';
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"' || char === "'") {
            inQuote = !inQuote;
          } else if (char === delimiter && !inQuote) {
            cols.push(token.trim().replace(/^["']|["']$/g, ''));
            token = '';
          } else {
            token += char;
          }
        }
        cols.push(token.trim().replace(/^["']|["']$/g, ''));
        parsedRows.push(cols);
      }

      processTableRows(parsedRows);
    } catch (err) {
      setErrorMsg('CSV পার্স করতে ত্রুটি হয়েছে: ' + err.message);
    }
  };

  // Submit ONLY the changed updates to Server
  const handleApplyUpdates = async () => {
    if (parsedUpdates.length === 0) {
      setErrorMsg('আপডেট করার মতো কোনো পরিবর্তিত পণ্য নেই');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/products/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ updates: parsedUpdates })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'বাল্ক আপডেট করতে সমস্যা হয়েছে');
      }

      setSuccessMsg(`সফলভাবে মোট ${toBengaliNumber(data.updatedCount)} টি পরিবর্তিত পণ্যের তথ্য ও স্টক ডেটাবেজে আপডেট হয়েছে!`);
      if (showToast) showToast(`মোট ${toBengaliNumber(data.updatedCount)} টি পণ্য আপডেট হয়েছে`);

      // Refresh parent & local state
      if (onRefresh) onRefresh();
      fetchCategories();
      setParsedUpdates([]);
      setFileStats({ total: 0, changed: 0, unchanged: 0, unmatched: 0 });
    } catch (err) {
      setErrorMsg(err.message || 'সার্ভারে ত্রুটি হয়েছে');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter preview table in export tab
  const filteredExportProducts = exportProducts.filter((p) => {
    if (!previewFilter.trim()) return true;
    const term = previewFilter.toLowerCase();
    return (
      String(p.productId).includes(term) ||
      p.brandName.toLowerCase().includes(term) ||
      p.categoryName.toLowerCase().includes(term) ||
      p.unit.toLowerCase().includes(term)
    );
  });

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <motion.div
        className="admin-modal-card"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{ width: '960px', maxWidth: '96%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div
          className="admin-modal-header"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderBottom: '1px solid var(--rule)' }}
        >
          <div style={{ background: 'var(--green-dim)', padding: '10px', borderRadius: '8px', color: 'var(--green)', display: 'flex' }}>
            <Database size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
              বাল্ক প্রোডাক্ট এক্সপোর্ট ও ইমপোর্ট (Excel & CSV)
            </h3>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px' }}>
              আইডি অনুযায়ী বাল্ক ডাউনলোড করুন এবং আপলোড করলে শুধু পরিবর্তিত পণ্যগুলোই স্বয়ংক্রিয়ভাবে আপডেট হবে
            </div>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="বন্ধ করুন">
            <X size={20} />
          </button>
        </div>

        <div className="admin-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Action Tabs using Pills */}
          <div
            className="admin-status-filters"
            style={{ marginBottom: '24px', borderBottom: '1px solid var(--rule)', paddingBottom: '16px' }}
          >
            <button
              type="button"
              className={`admin-filter-pill ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontWeight: 700 }}
            >
              <Download size={16} />
              <span>১. ডাটাবেজ ডাউনলোড (Export)</span>
            </button>
            <button
              type="button"
              className={`admin-filter-pill ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontWeight: 700 }}
            >
              <Upload size={16} />
              <span>২. স্মার্ট বাল্ক আপডেট (Import)</span>
            </button>
          </div>

          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div>
              {/* Summary Metrics Banner */}
              <div
                style={{
                  background: 'var(--cream-card)',
                  border: '1px solid var(--rule)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--ink)', fontWeight: 800 }}>
                      ক্যাটালগ এক্সপোর্ট অপশন
                    </h5>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                      প্রতিটি পণ্যের নিজস্ব ইউনিক <b>Product_ID</b> সহ ফাইল ডাউনলোড হবে। পরে দর বা স্টক এডিট করে আপলোড করলে শুধু পরিবর্তনের রোগুলোই আপডেট হবে।
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div
                      style={{
                        background: 'var(--paper)',
                        border: '1px solid var(--rule)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 16px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600, marginBottom: '2px' }}>
                        মোট ক্যাটাগরি
                      </div>
                      <div className="mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green)' }}>
                        {toBengaliNumber(categories.length)}
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'var(--paper)',
                        border: '1px solid var(--rule)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 16px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600, marginBottom: '2px' }}>
                        এক্সপোর্টযোগ্য পণ্য
                      </div>
                      <div className="mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green)' }}>
                        {toBengaliNumber(exportProducts.length)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Filters */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div className="field" style={{ flex: 1, minWidth: '220px' }}>
                  <label>গ্রুপ ফিল্টার (ঐচ্ছিক)</label>
                  <select
                    value={selectedGroupExport}
                    onChange={(e) => {
                      setSelectedGroupExport(e.target.value);
                      setSelectedCatExport('');
                    }}
                  >
                    <option value="">-- সকল গ্রুপ --</option>
                    {groups &&
                      groups.map((g) => (
                        <option key={g.key} value={g.key}>
                          {g.en} ({g.bn})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="field" style={{ flex: 1, minWidth: '220px' }}>
                  <label>ক্যাটাগরি ফিল্টার (ঐচ্ছিক)</label>
                  <select value={selectedCatExport} onChange={(e) => setSelectedCatExport(e.target.value)}>
                    <option value="">-- সকল ক্যাটাগরি --</option>
                    {categories
                      .filter((c) => !selectedGroupExport || c.group === selectedGroupExport)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.en} ({c.bn})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Action Export Buttons */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button
                  type="button"
                  className="admin-btn primary"
                  onClick={handleExportExcel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                >
                  <FileSpreadsheet size={18} />
                  <span>এক্সেল ফাইল (.XLSX) ডাউনলোড</span>
                </button>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={handleExportCSV}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  <Download size={18} />
                  <span>স্ট্যান্ডার্ড CSV ফাইল (.CSV) ডাউনলোড</span>
                </button>
              </div>

              {/* Live Catalog Table Preview with Search */}
              <div style={{ border: '1px solid var(--rule)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div
                  style={{
                    background: 'var(--cream-card)',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--rule)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 700 }}>
                    <TableIcon size={16} color="var(--green)" />
                    <span>লাইভ পণ্য তালিকা প্রিভিউ ({toBengaliNumber(filteredExportProducts.length)} টি)</span>
                  </div>
                  <div className="field" style={{ position: 'relative', width: '280px', margin: 0, gap: 0 }}>
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--muted)',
                        zIndex: 2
                      }}
                    />
                    <input
                      type="text"
                      placeholder="আইডি, পণ্য বা ক্যাটাগরি খুঁজুন..."
                      value={previewFilter}
                      onChange={(e) => setPreviewFilter(e.target.value)}
                      style={{ paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px' }}
                    />
                  </div>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%', margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: '10px 14px', fontSize: '11px', textAlign: 'center' }}>Product ID</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px' }}>ক্যাটাগরি</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px' }}>পণ্যের নাম</th>
                        <th style={{ padding: '10px 14px', fontSize: '11px' }}>একক</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px' }}>বিক্রয় মূল্য</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px' }}>ক্রয় মূল্য</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px' }}>মজুত স্টক</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px' }}>স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExportProducts.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                            কোনো পণ্য পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        filteredExportProducts.map((p, idx) => (
                          <tr key={idx}>
                            <td
                              className="mono"
                              style={{
                                padding: '10px 14px',
                                textAlign: 'center',
                                fontWeight: 800,
                                color: 'var(--green)',
                                fontSize: '12px'
                              }}
                            >
                              #{p.productId}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ink)', fontSize: '12.5px' }}>
                              {p.categoryName}
                            </td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: '12.5px' }}>
                              {p.brandName}
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: '12px' }}>
                              {p.unit}
                            </td>
                            <td
                              className="mono"
                              style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--green)', fontSize: '12.5px' }}
                            >
                              ৳{toBengaliNumber(p.price)}
                            </td>
                            <td className="mono" style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--muted)', fontSize: '12.5px' }}>
                              ৳{toBengaliNumber(p.costPrice)}
                            </td>
                            <td className="mono" style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                              {formatStockDisplay(p.stock, p.unit)}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: p.forceStockOut || p.stock <= 10 ? '#fee2e2' : '#dcfce7',
                                  color: p.forceStockOut || p.stock <= 10 ? '#dc2626' : '#15803d'
                                }}
                              >
                                {p.forceStockOut ? 'আউট' : (p.stock <= 0 ? 'শেষ' : 'সচল')}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div>
              {/* How it works info card */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <CheckCheck size={20} color="#166534" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6 }}>
                  <b>🎯 স্মার্ট ডিফারেন্স ডিটেকশন (Smart Change Detection):</b><br />
                  আপনি যে ফাইলই আপলোড করুন (.xlsx বা .csv), সিস্টেম স্বয়ংক্রিয়ভাবে <b>শুধুমাত্র যে রোগুলোতে পরিবর্তন হয়েছে</b> সেগুলোই আলাদা করবে এবং প্রিভিউতে দেখাবে। যে পণ্যের কোনো পরিবর্তন নেই, সেগুলো কোনো অবস্থাতেই প্রিভিউতে আসবে না এবং ডেটাবেজেও একই ডেটা পুনরায় লিখবে না।
                </div>
              </div>

              {/* Upload Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileProcess(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? 'var(--green)' : 'var(--green-dim)'}`,
                  background: isDragging ? 'var(--cream-card)' : 'var(--cream-card)',
                  padding: '32px 20px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--green-dim)',
                    color: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}
                >
                  <FileSpreadsheet size={28} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '15.5px', color: 'var(--ink)', marginBottom: '4px' }}>
                  Excel (.xlsx, .xls) অথবা CSV (.csv) ফাইল এখানে আপলোড করুন
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                  ফাইল টেনে এনে ছেড়ে দিন অথবা ক্লিক করে আপনার ডিভাইস থেকে নির্বাচন করুন
                </div>
                {uploadedFileName && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'var(--paper)',
                      border: '1px solid var(--green)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--green)'
                    }}
                  >
                    <FileCheck2 size={16} />
                    <span>লোড হওয়া ফাইল: {uploadedFileName}</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Manual Paste Area Toggle */}
              <div className="field" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>অথবা সরাসরি CSV টেক্সট পেস্ট করুন (ঐচ্ছিক):</span>
                  {csvText && (
                    <button
                      type="button"
                      onClick={() => {
                        setCsvText('');
                        setParsedUpdates([]);
                        setFileStats({ total: 0, changed: 0, unchanged: 0, unmatched: 0 });
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}
                    >
                      মুছে ফেলুন
                    </button>
                  )}
                </label>
                <textarea
                  rows={3}
                  placeholder={`Product_ID,Category_ID,Product_Name,Unit,Price_BDT,Cost_Price_BDT,Stock_Quantity,Stock_Status\n101,1,"মিনিকেট চাল","প্রতি কেজি",75,68,150,সচল`}
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    parseCSVText(e.target.value);
                  }}
                  style={{ fontFamily: 'monospace', fontSize: '12px', padding: '10px' }}
                />
              </div>

              {errorMsg && (
                <div
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecdd3',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13.5px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    background: 'var(--md-primary-container)',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13.5px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Parsed Preview Table - ONLY CHANGED ROWS */}
              {parsedUpdates.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <h5 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                        পরিবর্তন প্রিভিউ ({toBengaliNumber(parsedUpdates.length)} টি পণ্য)
                      </h5>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        শুধুমাত্র পরিবর্তিত তথ্যগুলো ডেটাবেজে হালনাগাদ হবে
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', fontWeight: 700 }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '4px' }}>
                        পরিবর্তিত পণ্য: {toBengaliNumber(parsedUpdates.length)}
                      </span>
                      {fileStats.unchanged > 0 && (
                        <span style={{ background: 'var(--paper)', border: '1px solid var(--rule)', color: 'var(--muted)', padding: '4px 10px', borderRadius: '4px' }}>
                          অপরিবর্তিত (বাদ দেওয়া হয়েছে): {toBengaliNumber(fileStats.unchanged)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: '320px',
                      overflowY: 'auto',
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <table className="admin-table" style={{ width: '100%', margin: 0 }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'center' }}>Product ID</th>
                          <th style={{ padding: '10px 12px', fontSize: '11px' }}>পণ্যের নাম ও ক্যাটাগরি</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px' }}>বিক্রয় মূল্য</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px' }}>ক্রয় মূল্য</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px' }}>মজুত স্টক</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px' }}>পরিবর্তিত বিষয়</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedUpdates.map((u, idx) => {
                          const priceChanged = u.changedFields?.some((c) => c.type === 'price');
                          const costChanged = u.changedFields?.some((c) => c.type === 'cost');
                          const stockChanged = u.changedFields?.some((c) => c.type === 'stock');
                          const unitChanged = u.changedFields?.some((c) => c.type === 'unit');
                          const nameChanged = u.changedFields?.some((c) => c.type === 'name');

                          return (
                            <tr key={idx} style={{ background: '#fdfdfb' }}>
                              <td
                                className="mono"
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '12px',
                                  color: 'var(--green)'
                                }}
                              >
                                #{u.product_id}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: '12.5px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                                  {u.brand_name}
                                  {nameChanged && (
                                    <span style={{ fontSize: '10.5px', color: '#15803d', marginLeft: '6px', fontWeight: 600 }}>
                                      (নতুন নাম)
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                                  {u.category_name ? `${u.category_name} • ` : ''}একক: {u.unit}
                                  {unitChanged && (
                                    <span style={{ color: '#d97706', marginLeft: '4px', fontWeight: 600 }}>
                                      [পূর্বে: {u.existingUnit}]
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td
                                className="mono"
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'right',
                                  fontSize: '12.5px',
                                  background: priceChanged ? '#f0fdf4' : 'transparent'
                                }}
                              >
                                {priceChanged ? (
                                  <div>
                                    <span style={{ fontWeight: 800, color: 'var(--green)', fontSize: '13px' }}>
                                      ৳{toBengaliNumber(u.price)}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '10.5px',
                                        color: 'var(--muted)',
                                        display: 'block',
                                        marginTop: '1px',
                                        textDecoration: 'line-through'
                                      }}
                                    >
                                      ৳{toBengaliNumber(u.existingPrice)}
                                    </span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>৳{toBengaliNumber(u.price)}</span>
                                )}
                              </td>
                              <td
                                className="mono"
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'right',
                                  fontSize: '12.5px',
                                  background: costChanged ? '#fefce8' : 'transparent'
                                }}
                              >
                                {costChanged ? (
                                  <div>
                                    <span style={{ fontWeight: 700, color: '#854d0e', fontSize: '13px' }}>
                                      ৳{toBengaliNumber(u.cost_price)}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '10.5px',
                                        color: 'var(--muted)',
                                        display: 'block',
                                        marginTop: '1px',
                                        textDecoration: 'line-through'
                                      }}
                                    >
                                      ৳{toBengaliNumber(u.existingCost)}
                                    </span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>৳{toBengaliNumber(u.cost_price)}</span>
                                )}
                              </td>
                              <td
                                className="mono"
                                style={{
                                  padding: '10px 12px',
                                  textAlign: 'center',
                                  fontSize: '12.5px',
                                  background: stockChanged ? '#fffbeb' : 'transparent'
                                }}
                              >
                                {stockChanged ? (
                                  <div>
                                    <span style={{ fontWeight: 800, color: '#d97706', fontSize: '13px' }}>
                                      {toBengaliNumber(u.stock)}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '10.5px',
                                        color: 'var(--muted)',
                                        display: 'block',
                                        marginTop: '1px'
                                      }}
                                    >
                                      (পূর্বে: {toBengaliNumber(u.existingStock)})
                                    </span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>{toBengaliNumber(u.stock)}</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                  {u.changedFields?.map((cf, cIdx) => (
                                    <span
                                      key={cIdx}
                                      style={{
                                        display: 'inline-block',
                                        padding: '2px 7px',
                                        borderRadius: '3px',
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                        background:
                                          cf.type === 'price'
                                            ? '#dcfce7'
                                            : cf.type === 'stock'
                                            ? '#fef3c7'
                                            : '#e0e7ff',
                                        color:
                                          cf.type === 'price'
                                            ? '#15803d'
                                            : cf.type === 'stock'
                                            ? '#b45309'
                                            : '#3730a3'
                                      }}
                                    >
                                      {cf.label}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="admin-btn primary"
                      onClick={handleApplyUpdates}
                      disabled={isProcessing || parsedUpdates.length === 0}
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '14.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                    >
                      {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                      <span>
                        {isProcessing
                          ? 'ডাটাবেজে আপডেট সংরক্ষণ হচ্ছে...'
                          : `মোট ${toBengaliNumber(parsedUpdates.length)} টি পরিবর্তিত পণ্যের তথ্য ডেটাবেজে সংরক্ষণ করুন`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-modal-footer" style={{ padding: '14px 24px', borderTop: '1px solid var(--rule)' }}>
          <button type="button" className="admin-btn secondary" onClick={onClose}>
            বন্ধ করুন
          </button>
        </div>
      </motion.div>
    </div>
  );
}
