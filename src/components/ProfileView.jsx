"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Package,
  Settings,
  LogOut,
  ShoppingBag,
  Check,
  RotateCcw,
  FileText,
  Navigation,
  Bike,
  Phone,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Search,
  Filter,
  User as UserIcon,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { usePackageBox } from "../context/PackageBoxContext.jsx";
import { useStoreData } from "../context/StoreDataContext";
import { toBengaliNumber } from "../utils/bengali.js";
import CustomerInvoiceModal from "./CustomerInvoiceModal.jsx";
import OrderTrackingModal from "./OrderTrackingModal.jsx";

export default function ProfileView({ onBackToHome }) {
  const { user, token, logout, updateProfile } = useAuth();
  const { showToast, replaceCartWithOrder } = useCart();
  const { loadPackageOrderItems } = usePackageBox();
  const { packageProducts = [] } = useStoreData();

  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'settings'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'delivered' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState("");
  const [reorderingCode, setReorderingCode] = useState(null);

  // Modals for Customer invoice and live tracking
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [trackingOrderCode, setTrackingOrderCode] = useState(null);

  const [name, setName] = useState(user ? user.name : "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState({ text: "", type: "" });

  // 1-Click Re-order Handler
  const handleReorder = async (order) => {
    let items = order.items_json;
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      showToast("অর্ডারে কোনো পণ্য পাওয়া যায়নি");
      return;
    }

    const orderIdKey = order.order_code || order.id;
    setReorderingCode(orderIdKey);

    const isPackageOrder = Boolean(
      order.is_package_order ||
      order.is_package ||
      order.isPackage ||
      (order.order_code && order.order_code.startsWith("PK-")),
    );

    try {
      if (isPackageOrder) {
        await loadPackageOrderItems(items, packageProducts);
        showToast("প্যাকেজ পণ্যগুলো সফলভাবে প্যাকেজ বক্সে যোগ করা হয়েছে!");

        if (typeof onBackToHome === "function") {
          onBackToHome();
        }
        setTimeout(() => {
          const el = document.getElementById("hero-package-box");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
      } else {
        replaceCartWithOrder(items);
      }
    } catch (err) {
      console.error("Reorder error:", err);
      showToast("পুনরায় অর্ডারে সমস্যা হয়েছে");
    } finally {
      setReorderingCode(null);
    }
  };

  useEffect(() => {
    if (token) {
      fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setOrders(data);
          }
        })
        .catch((err) => console.error("Fetch orders error:", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [token]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateMsg({ text: "", type: "" });

    if (!name.trim()) {
      setUpdateMsg({ text: "নাম খালি রাখা যাবে না", type: "error" });
      return;
    }

    if (newPassword && !oldPassword) {
      setUpdateMsg({
        text: "নতুন পাসওয়ার্ড সেট করতে বর্তমান পাসওয়ার্ড দিন",
        type: "error",
      });
      return;
    }

    setUpdating(true);
    try {
      await updateProfile({
        name: name.trim(),
        password: oldPassword || undefined,
        new_password: newPassword || undefined,
      });
      setUpdateMsg({
        text: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে",
        type: "success",
      });
      setOldPassword("");
      setNewPassword("");
      showToast("প্রোফাইল তথ্য আপডেট হয়েছে");
    } catch (err) {
      setUpdateMsg({
        text: err.message || "আপডেট করতে ত্রুটি হয়েছে",
        type: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBn = (status) => {
    const s = String(status || "")
      .toLowerCase()
      .trim();
    if (s === "pending" || s === "পেন্ডিং") return "পেন্ডিং";
    if (s === "processing" || s === "প্রসেসিং") return "প্রসেসিং";
    if (
      s === "shipped" ||
      s === "পাঠানো হয়েছে" ||
      s === "ডেলিভারিতে আছে" ||
      s === "ডেলিভারিতে পাঠানো হয়েছে" ||
      s === "অন-ওয়ে" ||
      s === "অন-ডেলিভারি"
    )
      return "ডেলিভারিতে আছে";
    if (
      s === "delivered" ||
      s === "ডেলিভার্ড" ||
      s === "সম্পন্ন" ||
      s === "ডেলিভারি সম্পন্ন"
    )
      return "ডেলিভার্ড";
    if (s === "cancelled" || s === "বাতিল") return "বাতিল";
    return status || "পেন্ডিং";
  };

  const getStatusClass = (status) => {
    const s = String(status || "")
      .toLowerCase()
      .trim();
    if (s === "pending" || s === "পেন্ডিং") return "status-pending";
    if (s === "processing" || s === "প্রসেসিং") return "status-processing";
    if (
      s === "shipped" ||
      s === "পাঠানো হয়েছে" ||
      s === "ডেলিভারিতে আছে" ||
      s === "অন-ওয়ে" ||
      s === "অন-ডেলিভারি"
    )
      return "status-shipped";
    if (
      s === "delivered" ||
      s === "ডেলিভার্ড" ||
      s === "সম্পন্ন" ||
      s === "ডেলিভারি সম্পন্ন"
    )
      return "status-delivered";
    if (s === "cancelled" || s === "বাতিল") return "status-cancelled";
    return "status-pending";
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => {
      const s = String(o.status || "").toLowerCase();
      return s === "delivered" || s === "ডেলিভার্ড" || s === "সম্পন্ন";
    }).length;
    const active = orders.filter((o) => {
      const s = String(o.status || "").toLowerCase();
      return (
        s === "pending" ||
        s === "পেন্ডিং" ||
        s === "processing" ||
        s === "প্রসেসিং" ||
        s === "shipped" ||
        s === "ডেলিভারিতে আছে"
      );
    }).length;
    return { total, delivered, active };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const s = String(order.status || "").toLowerCase();
      const code = String(order.order_code || "").toLowerCase();

      // Search matching
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchCode = code.includes(query);
        const matchAddress = String(order.delivery_address || "")
          .toLowerCase()
          .includes(query);
        const matchArea = String(order.delivery_area || "")
          .toLowerCase()
          .includes(query);
        if (!matchCode && !matchAddress && !matchArea) return false;
      }

      // Status matching
      if (statusFilter === "active") {
        return (
          s === "pending" ||
          s === "পেন্ডিং" ||
          s === "processing" ||
          s === "প্রসেসিং" ||
          s === "shipped" ||
          s === "ডেলিভারিতে আছে"
        );
      }
      if (statusFilter === "delivered") {
        return s === "delivered" || s === "ডেলিভার্ড" || s === "সম্পন্ন";
      }
      if (statusFilter === "cancelled") {
        return s === "cancelled" || s === "বাতিল";
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  if (!user) {
    return (
      <motion.div
        className="section-wrap"
        style={{ paddingTop: "40px", textAlign: "center" }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>অনুগ্রহ করে লগইন করুন</h2>
        <motion.button
          className="cta"
          onClick={onBackToHome}
          style={{ marginTop: "16px" }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          হোম পেজে যান
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="section-wrap"
      style={{ paddingTop: "24px", paddingBottom: "50px" }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28 }}
    >
      {/* Back button */}
      <motion.button
        className="breadcrumb"
        onClick={onBackToHome}
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.96 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "16px",
        }}
      >
        <ArrowLeft size={16} /> <span>হোম পেজে ফিরে যান</span>
      </motion.button>

      {/* Main Profile Card Container */}
      <div className="profile-card">
        {/* Header with User Info & Logout */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "var(--md-primary-container)",
                border: "2px solid #A7F3D0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                fontWeight: 800,
                fontSize: "20px",
              }}
            >
              {user.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon size={24} />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: "21px", margin: 0, fontWeight: 800 }}>
                স্বাগতম, {user.name}!
              </h2>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  মোবাইল:{" "}
                  <strong className="mono" style={{ color: "var(--ink)" }}>
                    {user.phone}
                  </strong>
                </span>
                <span>•</span>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                  সক্রিয় গ্রাহক
                </span>
              </div>
            </div>
          </div>

          <motion.button
            className="admin-btn danger"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              logout();
              onBackToHome();
              showToast("লগআউট করা হয়েছে");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              borderRadius: "var(--radius-pill)",
            }}
          >
            <LogOut size={15} /> <span>লগআউট</span>
          </motion.button>
        </div>

        {/* Navigation Tabs (Orders vs Settings) */}
        <div className="profile-nav-tabs">
          <button
            className={`profile-nav-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
            style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
          >
            <Package size={16} />
            <span>আমার অর্ডারসমূহ ({toBengaliNumber(orders.length)})</span>
          </button>
          <button
            className={`profile-nav-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
            style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
          >
            <Settings size={16} />
            <span>প্রোফাইল সেটিংস</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "orders" && (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Order Stats Overview Cards */}
              <div className="profile-stats-grid">
                <div className="profile-stat-box">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "var(--muted)",
                        fontWeight: 600,
                      }}
                    >
                      মোট অর্ডার
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "var(--ink)",
                      }}
                    >
                      {toBengaliNumber(stats.total)}
                    </div>
                  </div>
                </div>

                <div className="profile-stat-box">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#FEF3C7",
                      color: "#D97706",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "var(--muted)",
                        fontWeight: 600,
                      }}
                    >
                      প্রক্রিয়াধীন / চলমান
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#D97706",
                      }}
                    >
                      {toBengaliNumber(stats.active)}
                    </div>
                  </div>
                </div>

                <div className="profile-stat-box">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#ECFDF5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "var(--muted)",
                        fontWeight: 600,
                      }}
                    >
                      ডেলিভার্ড সম্পন্ন
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#059669",
                      }}
                    >
                      {toBengaliNumber(stats.delivered)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Filter & Search Toolbar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "18px",
                  background: "#F8FAF9",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--rule)",
                }}
              >
                {/* Status Filter Buttons */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      border: "1px solid",
                      cursor: "pointer",
                      background:
                        statusFilter === "all" ? "var(--primary)" : "#FFFFFF",
                      color: statusFilter === "all" ? "#FFFFFF" : "var(--ink)",
                      borderColor:
                        statusFilter === "all"
                          ? "var(--primary)"
                          : "var(--rule)",
                    }}
                  >
                    সব ({toBengaliNumber(orders.length)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("active")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      border: "1px solid",
                      cursor: "pointer",
                      background:
                        statusFilter === "active" ? "#D97706" : "#FFFFFF",
                      color:
                        statusFilter === "active" ? "#FFFFFF" : "var(--ink)",
                      borderColor:
                        statusFilter === "active" ? "#D97706" : "var(--rule)",
                    }}
                  >
                    চলমান ({toBengaliNumber(stats.active)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("delivered")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      border: "1px solid",
                      cursor: "pointer",
                      background:
                        statusFilter === "delivered" ? "#059669" : "#FFFFFF",
                      color:
                        statusFilter === "delivered" ? "#FFFFFF" : "var(--ink)",
                      borderColor:
                        statusFilter === "delivered"
                          ? "#059669"
                          : "var(--rule)",
                    }}
                  >
                    ডেলিভার্ড ({toBengaliNumber(stats.delivered)})
                  </button>
                </div>

                {/* Search Bar */}
                <div
                  style={{
                    position: "relative",
                    minWidth: "220px",
                    flex: "1 1 220px",
                    maxWidth: "320px",
                  }}
                >
                  <Search
                    size={15}
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="অর্ডার কোড বা ঠিকানা দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px 6px 32px",
                      fontSize: "12.5px",
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--rule)",
                      background: "#FFFFFF",
                      outline: "none",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {loadingOrders ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--muted)",
                  }}
                >
                  <div className="spinner" style={{ margin: "0 auto 12px" }} />
                  <p>অর্ডার হিস্টোরি লোড হচ্ছে...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    background: "#F8FAF9",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--rule)",
                    color: "var(--muted)",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--muted)",
                      marginBottom: "10px",
                    }}
                  >
                    <ShoppingBag size={44} />
                  </div>
                  <h3
                    style={{
                      fontSize: "16px",
                      color: "var(--ink)",
                      margin: "0 0 6px",
                    }}
                  >
                    কোনো অর্ডার পাওয়া যায়নি
                  </h3>
                  <p style={{ fontSize: "13.5px", margin: 0 }}>
                    {searchQuery
                      ? "আপনার সার্চকৃত তথ্যের সাথে কোনো অর্ডার মেলেনি।"
                      : "আপনি এখনও কোনো অর্ডার করেননি।"}
                  </p>
                  <motion.button
                    className="cta"
                    style={{
                      marginTop: "16px",
                      padding: "8px 20px",
                      fontSize: "13.5px",
                    }}
                    onClick={onBackToHome}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    বাজার শুরু করুন
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* ======================================================== */}
                  {/* DESKTOP MODERN TABLE VIEW (>= 768px)                      */}
                  {/* ======================================================== */}
                  <div className="profile-orders-desktop-table">
                    <div className="profile-tbl-wrap">
                      <table className="profile-modern-table">
                        <thead>
                          <tr>
                            <th>অর্ডার কোড ও সময়</th>
                            <th>পণ্যের বিবরণ</th>
                            <th>ডেলিভারি ঠিকানা ও রাইডার</th>
                            <th>মোট টাকা ও পেমেন্ট</th>
                            <th>স্ট্যাটাস</th>
                            <th style={{ textAlign: "right" }}>অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order, idx) => {
                            const isPackageOrder = Boolean(
                              order.is_package_order ||
                              order.is_package ||
                              order.isPackage ||
                              (order.order_code &&
                                order.order_code.startsWith("PK-")),
                            );

                            let parsedItems = order.items_json;
                            if (typeof parsedItems === "string") {
                              try {
                                parsedItems = JSON.parse(parsedItems);
                              } catch (e) {
                                parsedItems = [];
                              }
                            }
                            if (!Array.isArray(parsedItems)) parsedItems = [];

                            const isReorderingThis =
                              reorderingCode === (order.order_code || order.id);

                            return (
                              <tr
                                key={
                                  order.order_code
                                    ? `profile-tbl-ord-${order.order_code}`
                                    : `profile-tbl-ord-${order.id || idx}`
                                }
                              >
                                {/* Column 1: Order Code & Date */}
                                <td>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "4px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      <span
                                        className="mono"
                                        style={{
                                          fontWeight: 800,
                                          fontSize: "14px",
                                          color: "var(--ink)",
                                        }}
                                      >
                                        {order.order_code}
                                      </span>
                                    </div>
                                    <div>
                                      {isPackageOrder ? (
                                        <span
                                          style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            padding: "2px 8px",
                                            borderRadius: "4px",
                                            background: "#EFF6FF",
                                            color: "#1D4ED8",
                                            border: "1px solid #BFDBFE",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "3px",
                                          }}
                                        >
                                          <Package size={11} /> প্যাকেজ বক্স
                                        </span>
                                      ) : (
                                        <span
                                          style={{
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            padding: "2px 7px",
                                            borderRadius: "4px",
                                            background: "#F1F5F3",
                                            color: "var(--muted)",
                                            border: "1px solid var(--rule)",
                                          }}
                                        >
                                          সাধারণ বাজার
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "11.5px",
                                        color: "var(--muted)",
                                      }}
                                    >
                                      {new Date(
                                        order.created_at,
                                      ).toLocaleDateString("bn-BD", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </td>

                                {/* Column 2: Items Summary */}
                                <td>
                                  <div style={{ maxWidth: "240px" }}>
                                    <div
                                      style={{
                                        fontWeight: 700,
                                        fontSize: "12.5px",
                                        color: "var(--ink)",
                                        marginBottom: "4px",
                                      }}
                                    >
                                      মোট {toBengaliNumber(parsedItems.length)}{" "}
                                      টি পণ্য
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "3px",
                                        maxHeight: "70px",
                                        overflowY: "auto",
                                      }}
                                    >
                                      {parsedItems
                                        .slice(0, 3)
                                        .map((it, iIdx) => (
                                          <div
                                            key={iIdx}
                                            style={{
                                              fontSize: "11.5px",
                                              color: "var(--muted)",
                                              display: "flex",
                                              justifyContent: "space-between",
                                            }}
                                          >
                                            <span
                                              style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: "160px",
                                              }}
                                            >
                                              •{" "}
                                              {it.brand ||
                                                it.product_name ||
                                                it.name}
                                            </span>
                                            <span
                                              className="mono"
                                              style={{ fontWeight: 600 }}
                                            >
                                              ×{toBengaliNumber(it.qty || 1)}
                                            </span>
                                          </div>
                                        ))}
                                      {parsedItems.length > 3 && (
                                        <span
                                          style={{
                                            fontSize: "11px",
                                            color: "var(--primary)",
                                            fontWeight: 600,
                                          }}
                                        >
                                          + আরও{" "}
                                          {toBengaliNumber(
                                            parsedItems.length - 3,
                                          )}{" "}
                                          টি পণ্য
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Column 3: Delivery Address & Rider */}
                                <td>
                                  <div
                                    style={{
                                      fontSize: "12.5px",
                                      maxWidth: "200px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        color: "var(--ink)",
                                        fontWeight: 600,
                                        lineHeight: 1.35,
                                        marginBottom: "4px",
                                      }}
                                    >
                                      {order.delivery_address}
                                    </div>
                                    {order.delivery_area && (
                                      <div
                                        style={{
                                          fontSize: "11.5px",
                                          color: "var(--muted)",
                                        }}
                                      >
                                        এলাকা: {order.delivery_area}
                                      </div>
                                    )}

                                    {order.delivery_rider_name && (
                                      <div
                                        style={{
                                          marginTop: "6px",
                                          padding: "3px 8px",
                                          background:
                                            "var(--md-primary-container)",
                                          borderRadius: "4px",
                                          border: "1px solid #BBF7D0",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "5px",
                                          fontSize: "11px",
                                          color: "#166534",
                                        }}
                                      >
                                        <Bike size={12} color="#15803d" />
                                        <span>
                                          রাইডার:{" "}
                                          <strong>
                                            {order.delivery_rider_name}
                                          </strong>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Column 4: Total & Payment */}
                                <td>
                                  <div>
                                    <div
                                      className="mono"
                                      style={{
                                        fontSize: "16px",
                                        fontWeight: 800,
                                        color: "var(--green)",
                                      }}
                                    >
                                      ৳{toBengaliNumber(order.total_amount)}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "11.5px",
                                        color: "var(--muted)",
                                        marginTop: "2px",
                                      }}
                                    >
                                      {order.payment_method}
                                    </div>
                                    {order.trx_id && (
                                      <div
                                        className="mono"
                                        style={{
                                          fontSize: "10.5px",
                                          color: "var(--primary)",
                                        }}
                                      >
                                        TrxID: {order.trx_id}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Column 5: Status */}
                                <td>
                                  <span
                                    className={`status-badge ${getStatusClass(order.status)}`}
                                  >
                                    {getStatusBn(order.status)}
                                  </span>
                                </td>

                                {/* Column 6: Action Buttons */}
                                <td style={{ textAlign: "right" }}>
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      justifyContent: "flex-end",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {/* 1-Click Reorder Button */}
                                    <motion.button
                                      type="button"
                                      className="admin-btn"
                                      disabled={isReorderingThis}
                                      style={{
                                        padding: "6px 12px",
                                        fontSize: "12px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        background: isPackageOrder
                                          ? "#EFF6FF"
                                          : "#ECFDF5",
                                        color: isPackageOrder
                                          ? "#1D4ED8"
                                          : "#065F46",
                                        borderColor: isPackageOrder
                                          ? "#BFDBFE"
                                          : "#A7F3D0",
                                        fontWeight: 700,
                                        borderRadius: "var(--radius-pill)",
                                      }}
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() => handleReorder(order)}
                                      title={
                                        isPackageOrder
                                          ? "এক ক্লিকে পুনরায় এই পণ্যগুলো প্যাকেজ বক্সে যোগ করুন"
                                          : "এক ক্লিকে কার্ট খালি করে এই অর্ডারটি যুক্ত করুন"
                                      }
                                    >
                                      <RotateCcw
                                        size={12}
                                        className={
                                          isReorderingThis ? "spin" : ""
                                        }
                                      />
                                      <span>
                                        {isPackageOrder
                                          ? "প্যাকেজ রি-অর্ডার"
                                          : "১-ক্লিকে রি-অর্ডার"}
                                      </span>
                                    </motion.button>

                                    {/* Live Tracking Button */}
                                    <motion.button
                                      type="button"
                                      className="admin-btn secondary"
                                      style={{
                                        padding: "6px 10px",
                                        fontSize: "12px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        borderRadius: "var(--radius-pill)",
                                      }}
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() =>
                                        setTrackingOrderCode(order.order_code)
                                      }
                                      title="অর্ডারের বর্তমান লাইভ অবস্থা ট্র্যাক করুন"
                                    >
                                      <Navigation size={12} />
                                      <span>ট্র্যাক</span>
                                    </motion.button>

                                    {/* Cash Memo Invoice Modal */}
                                    <motion.button
                                      type="button"
                                      className="admin-btn secondary"
                                      style={{
                                        padding: "6px 10px",
                                        fontSize: "12px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        borderRadius: "var(--radius-pill)",
                                      }}
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      onClick={() =>
                                        setSelectedOrderForInvoice(order)
                                      }
                                      title="ক্যাশ মেমো / ইনভয়েস ভিউ ও প্রিন্ট করুন"
                                    >
                                      <Printer size={12} />
                                      <span>মেমো</span>
                                    </motion.button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* MOBILE CARD VIEW (< 768px)                                */}
                  {/* ======================================================== */}
                  <div className="profile-orders-mobile-cards">
                    {filteredOrders.map((order, idx) => {
                      const isPackageOrder = Boolean(
                        order.is_package_order ||
                        order.is_package ||
                        order.isPackage ||
                        (order.order_code &&
                          order.order_code.startsWith("PK-")),
                      );

                      let parsedItems = order.items_json;
                      if (typeof parsedItems === "string") {
                        try {
                          parsedItems = JSON.parse(parsedItems);
                        } catch (e) {
                          parsedItems = [];
                        }
                      }
                      if (!Array.isArray(parsedItems)) parsedItems = [];

                      const isReorderingThis =
                        reorderingCode === (order.order_code || order.id);

                      return (
                        <motion.div
                          className="order-card"
                          key={
                            order.order_code
                              ? `profile-card-ord-${order.order_code}`
                              : `profile-card-ord-${order.id || idx}`
                          }
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                        >
                          <div className="order-header">
                            <div>
                              <strong>অর্ডার কোড: </strong>
                              <span
                                className="mono"
                                style={{ fontWeight: 700, fontSize: "14px" }}
                              >
                                {order.order_code}
                              </span>
                              {isPackageOrder && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    background: "#EFF6FF",
                                    color: "#1D4ED8",
                                    border: "1px solid #BFDBFE",
                                    marginLeft: "8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Package size={12} /> প্যাকেজ
                                </span>
                              )}
                              <div
                                style={{
                                  fontSize: "11.5px",
                                  color: "var(--muted)",
                                  marginTop: "2px",
                                }}
                              >
                                {new Date(order.created_at).toLocaleDateString(
                                  "bn-BD",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            </div>
                            <div>
                              <span
                                className={`status-badge ${getStatusClass(order.status)}`}
                              >
                                {getStatusBn(order.status)}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              fontSize: "13px",
                              marginBottom: "8px",
                              lineHeight: 1.4,
                            }}
                          >
                            <strong>ঠিকানা:</strong> {order.delivery_address}{" "}
                            {order.delivery_area
                              ? `(${order.delivery_area})`
                              : ""}{" "}
                            | <strong>পেমেন্ট:</strong> {order.payment_method}
                            {order.trx_id && (
                              <span>
                                {" "}
                                (TrxID:{" "}
                                <span className="mono">{order.trx_id}</span>)
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              background: "#F8FAF9",
                              border: "1px solid var(--rule)",
                              padding: "10px 12px",
                              borderRadius: "var(--radius-md)",
                              fontSize: "12.5px",
                            }}
                          >
                            <strong style={{ color: "var(--ink)" }}>
                              পণ্যসমূহ ({toBengaliNumber(parsedItems.length)}{" "}
                              টি):
                            </strong>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                marginTop: "6px",
                              }}
                            >
                              {parsedItems.map((it, iIdx) => (
                                <div
                                  key={iIdx}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <span>
                                    • {it.brand || it.product_name || it.name} ×
                                    {toBengaliNumber(it.qty || 1)}
                                  </span>
                                  <span className="mono">
                                    ৳
                                    {toBengaliNumber(
                                      (Number(it.price) || 0) *
                                        (Number(it.qty) || 1),
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div
                              style={{
                                borderTop: "1px dashed var(--rule)",
                                marginTop: "8px",
                                paddingTop: "6px",
                                display: "flex",
                                justifyContent: "space-between",
                                fontWeight: 700,
                              }}
                            >
                              <span>মোট পরিশোধযোগ্য:</span>
                              <span
                                className="mono"
                                style={{
                                  color: "var(--green-dim)",
                                  fontSize: "14.5px",
                                }}
                              >
                                ৳{toBengaliNumber(order.total_amount)}
                              </span>
                            </div>
                          </div>

                          {/* Assigned Rider Info (if present) */}
                          {order.delivery_rider_name && (
                            <div
                              style={{
                                marginTop: "10px",
                                padding: "8px 12px",
                                background: "var(--md-primary-container)",
                                border: "1px solid #BBF7D0",
                                borderRadius: "var(--radius-md)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "12px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "#166534",
                                }}
                              >
                                <Bike size={14} color="#15803d" />
                                <span>
                                  রাইডার:{" "}
                                  <strong>{order.delivery_rider_name}</strong>
                                </span>
                              </div>
                              {order.delivery_rider_phone && (
                                <a
                                  href={`tel:${order.delivery_rider_phone}`}
                                  style={{
                                    color: "#15803d",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    textDecoration: "none",
                                  }}
                                >
                                  <Phone size={11} />{" "}
                                  {order.delivery_rider_phone}
                                </a>
                              )}
                            </div>
                          )}

                          {/* Order Action Buttons: Re-order, Cash Memo Invoice, Live Tracking */}
                          <div
                            style={{
                              marginTop: "12px",
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              justifyContent: "flex-end",
                              borderTop: "1px solid var(--rule)",
                              paddingTop: "10px",
                            }}
                          >
                            {/* 1-Click Re-order Button */}
                            <motion.button
                              type="button"
                              className="admin-btn"
                              disabled={isReorderingThis}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: isPackageOrder
                                  ? "#EFF6FF"
                                  : "#ECFDF5",
                                color: isPackageOrder ? "#1D4ED8" : "#065F46",
                                borderColor: isPackageOrder
                                  ? "#BFDBFE"
                                  : "#A7F3D0",
                                fontWeight: 700,
                                borderRadius: "var(--radius-pill)",
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleReorder(order)}
                              title={
                                isPackageOrder
                                  ? "এক ক্লিকে পুনরায় এই পণ্যগুলো প্যাকেজ বক্সে যোগ করুন"
                                  : "এক ক্লিকে কার্ট খালি করে এই অর্ডারটি যুক্ত করুন"
                              }
                            >
                              <RotateCcw
                                size={13}
                                className={isReorderingThis ? "spin" : ""}
                              />
                              <span>
                                {isPackageOrder
                                  ? "প্যাকেজ রি-অর্ডার"
                                  : "১-ক্লিকে পুনরায় অর্ডার"}
                              </span>
                            </motion.button>

                            {/* Live Tracking Button */}
                            <motion.button
                              type="button"
                              className="admin-btn secondary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                borderRadius: "var(--radius-pill)",
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() =>
                                setTrackingOrderCode(order.order_code)
                              }
                              title="অর্ডারের বর্তমান লাইভ অবস্থা ট্র্যাক করুন"
                            >
                              <Navigation size={13} />
                              <span>ট্র্যাক</span>
                            </motion.button>

                            {/* Cash Memo Invoice Modal */}
                            <motion.button
                              type="button"
                              className="admin-btn secondary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                borderRadius: "var(--radius-pill)",
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedOrderForInvoice(order)}
                              title="ক্যাশ মেমো / ইনভয়েস ভিউ ও ডাউনলোড করুন"
                            >
                              <Printer size={13} />
                              <span>ক্যাশ মেমো</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.form
              key="settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleProfileUpdate}
              style={{ maxWidth: "460px" }}
            >
              {updateMsg.text && (
                <div
                  style={{
                    background:
                      updateMsg.type === "success"
                        ? "var(--md-primary-container)"
                        : "#ffeded",
                    color:
                      updateMsg.type === "success"
                        ? "var(--success)"
                        : "var(--danger)",
                    border: `1px solid ${updateMsg.type === "success" ? "#A7F3D0" : "#FECDD3"}`,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    marginBottom: "14px",
                  }}
                >
                  {updateMsg.text}
                </div>
              )}

              <div className="field">
                <label htmlFor="user-name-edit">আপনার নাম</label>
                <input
                  id="user-name-edit"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="user-phone-locked">
                  মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)
                </label>
                <input
                  id="user-phone-locked"
                  type="text"
                  value={user.phone}
                  disabled
                  style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                />
              </div>

              <div
                style={{
                  borderTop: "1px dashed var(--rule)",
                  margin: "18px 0",
                  paddingTop: "14px",
                }}
              >
                <h4 style={{ fontSize: "15px", marginBottom: "10px" }}>
                  পাসওয়ার্ড পরিবর্তন করতে চাইলে:
                </h4>

                <div className="field">
                  <label htmlFor="user-old-pass">বর্তমান পাসওয়ার্ড</label>
                  <input
                    id="user-old-pass"
                    type="password"
                    placeholder="বর্তমান পাসওয়ার্ড দিন"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="user-new-pass">নতুন পাসওয়ার্ড</label>
                  <input
                    id="user-new-pass"
                    type="password"
                    placeholder="নতুন পাসওয়ার্ড লিখুন"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                className="submit-btn"
                disabled={updating}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {updating ? "আপডেট হচ্ছে..." : "তথ্য সংরক্ষণ করুন"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Customer Cash Memo Invoice Modal */}
      {selectedOrderForInvoice && (
        <CustomerInvoiceModal
          isOpen={true}
          onClose={() => setSelectedOrderForInvoice(null)}
          order={selectedOrderForInvoice}
        />
      )}

      {/* Live Order Tracking Modal */}
      {trackingOrderCode && (
        <OrderTrackingModal
          isOpen={true}
          onClose={() => setTrackingOrderCode(null)}
          initialOrderCode={trackingOrderCode}
        />
      )}
    </motion.div>
  );
}
