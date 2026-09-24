"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, token } = useAuth();
  const [cart, setCart] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate cart from localStorage on client mount to guarantee clean SSR hydration
  useEffect(() => {
    try {
      const local = localStorage.getItem("arot_cart");
      if (local) {
        setCart(JSON.parse(local));
      }
    } catch (e) {
      console.error("Error hydrating cart from localStorage:", e);
    }
    setIsHydrated(true);
  }, []);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [cartCountBump, setCartCountBump] = useState(false);

  // Sync with DB on Login
  useEffect(() => {
    if (user && token) {
      fetch("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) return null;
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return res.json();
          }
          return null;
        })
        .then((data) => {
          if (data && data.cart && Object.keys(data.cart).length > 0) {
            // Merge DB cart with local cart
            setCart((prev) => {
              const merged = { ...prev, ...data.cart };
              localStorage.setItem("arot_cart", JSON.stringify(merged));
              return merged;
            });
          } else if (cart && Object.keys(cart).length > 0) {
            // Save local cart to DB
            fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ cart }),
            }).catch(() => {});
          }
        })
        .catch((err) => console.warn("Cart sync notice:", err.message));
    }
  }, [user, token]);

  // Persist locally and sync to DB on change
  const updateCartState = (newCart) => {
    setCart(newCart);
    localStorage.setItem("arot_cart", JSON.stringify(newCart));

    // Trigger bump animation
    setCartCountBump(true);
    setTimeout(() => setCartCountBump(false), 300);

    if (token) {
      fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cart: newCart }),
      }).catch((err) => console.error("Cart DB sync error:", err));
    }
  };

  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, out: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, out: true } : t)),
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    }, 2200);
  };

  const changeQty = (key, delta, itemMeta = null) => {
    const newCart = { ...cart };
    const current = newCart[key];

    if (!current) {
      if (delta > 0 && itemMeta) {
        newCart[key] = { ...itemMeta, qty: delta };
        showToast(`${itemMeta.brand} কার্টে যোগ হয়েছে`);
      }
    } else {
      const nextQty = current.qty + delta;
      if (nextQty <= 0) {
        const brandName = current.brand;
        delete newCart[key];
        showToast(`${brandName} কার্ট থেকে সরানো হয়েছে`);
      } else {
        newCart[key] = { ...current, qty: nextQty };
        if (delta > 0 && !cart[key]) {
          showToast(`${current.brand} কার্টে যোগ হয়েছে`);
        }
      }
    }

    updateCartState(newCart);
  };

  const removeFromCart = (key) => {
    const newCart = { ...cart };
    if (newCart[key]) {
      const brandName = newCart[key].brand;
      delete newCart[key];
      showToast(`${brandName} কার্ট থেকে সরানো হয়েছে`);
      updateCartState(newCart);
    }
  };

  const addBulkToCart = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const newCart = { ...cart };
    let addedCount = 0;
    items.forEach((item) => {
      const pId = item.productId || item.product_id || item.brandId || item.id;
      const key = pId ? `p-${pId}` : `${item.catId || "item"}_${item.brand}`;
      const qtyToAdd = item.qty || 1;
      if (newCart[key]) {
        newCart[key] = { ...newCart[key], qty: newCart[key].qty + qtyToAdd };
      } else {
        newCart[key] = {
          productId: pId || null,
          brandId: pId || null,
          catId: item.catId,
          catBn: item.catBn,
          brand: item.brand,
          unit: item.unit || "প্রতি কেজি",
          price: item.price,
          qty: qtyToAdd,
        };
      }
      addedCount += qtyToAdd;
    });
    updateCartState(newCart);
    showToast(`পুনরায় অর্ডারের পণ্যগুলো কার্টে যোগ করা হয়েছে`);
    setIsCartOpen(true);
  };

  const replaceCartWithOrder = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const newCart = {};
    items.forEach((item) => {
      const pId = item.productId || item.product_id || item.brandId || item.id;
      const key = pId ? `p-${pId}` : `${item.catId || "item"}_${item.brand}`;
      const qtyToAdd = Math.max(1, Number(item.qty) || 1);
      newCart[key] = {
        productId: pId || null,
        brandId: pId || null,
        catId: item.catId,
        catBn: item.catBn,
        brand: item.brand || item.product_name || item.name || "পণ্য",
        unit: item.unit || "প্রতি কেজি",
        price: Number(item.price) || 0,
        qty: qtyToAdd,
        image: item.image || "",
      };
    });
    updateCartState(newCart);
    showToast(`পূর্ববর্তী কার্ট খালি করে এই অর্ডারের পণ্যগুলো যোগ করা হয়েছে!`);
    setIsCartOpen(true);
  };

  const clearCart = () => {
    updateCartState({});
  };

  // Calculations
  const cartItemsArray = Object.values(cart);
  const totalCount = cartItemsArray.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cartItemsArray.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        changeQty,
        addBulkToCart,
        replaceCartWithOrder,
        removeFromCart,
        clearCart,
        toasts,
        showToast,
        cartCountBump,
        totalCount,
        subtotal,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
