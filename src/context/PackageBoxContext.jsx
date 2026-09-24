"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext.jsx";

const PackageBoxContext = createContext(null);

export function PackageBoxProvider({ children }) {
  const { user, token } = useAuth();
  const [packageQuantities, setPackageQuantities] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);
  const packageQuantitiesRef = useRef(packageQuantities);
  packageQuantitiesRef.current = packageQuantities;

  // 1. Initial Client Hydration from localStorage (avoids SSR mismatch)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("arot_package_box_quantities");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            setPackageQuantities(parsed);
          }
        }
      }
    } catch (e) {
      console.warn(
        "Could not read arot_package_box_quantities from localStorage:",
        e,
      );
    }
    setIsHydrated(true);
  }, []);

  // 2. Sync with Backend when User Logs In (Cart-like persistence across devices)
  useEffect(() => {
    if (user && token) {
      fetch("/api/package-cart", {
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
          if (
            data &&
            data.packageCart &&
            Object.keys(data.packageCart).length > 0
          ) {
            // Merge server package cart with local package cart
            setPackageQuantities((prev) => {
              const merged = { ...prev, ...data.packageCart };
              try {
                localStorage.setItem(
                  "arot_package_box_quantities",
                  JSON.stringify(merged),
                );
              } catch (e) {}
              return merged;
            });
          } else if (
            packageQuantitiesRef.current &&
            Object.keys(packageQuantitiesRef.current).length > 0
          ) {
            // Save local package cart to server
            fetch("/api/package-cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                packageCart: packageQuantitiesRef.current,
              }),
            }).catch(() => {});
          }
        })
        .catch((err) => console.warn("Package cart sync notice:", err.message));
    }
  }, [user, token]);

  // 3. Listen to external clearing / storage events (e.g. from successful checkout or multi-tab)
  useEffect(() => {
    const handleCleared = () => {
      setPackageQuantities({});
      try {
        localStorage.removeItem("arot_package_box_quantities");
      } catch (e) {}
    };

    const handleStorage = (e) => {
      if (e.key === "arot_package_box_quantities") {
        if (!e.newValue) {
          setPackageQuantities({});
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && typeof parsed === "object") {
              setPackageQuantities(parsed);
            }
          } catch (err) {}
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("arot_package_cleared", handleCleared);
      window.addEventListener("storage", handleStorage);
      return () => {
        window.removeEventListener("arot_package_cleared", handleCleared);
        window.removeEventListener("storage", handleStorage);
      };
    }
  }, []);

  // 4. Update state, localStorage, and sync to DB
  const updatePackageState = useCallback(
    (newQuantities) => {
      setPackageQuantities(newQuantities);

      try {
        if (typeof window !== "undefined") {
          if (!newQuantities || Object.keys(newQuantities).length === 0) {
            localStorage.removeItem("arot_package_box_quantities");
          } else {
            localStorage.setItem(
              "arot_package_box_quantities",
              JSON.stringify(newQuantities),
            );
          }
        }
      } catch (e) {
        console.warn(
          "Failed to persist package quantities to localStorage:",
          e,
        );
      }

      if (token) {
        fetch("/api/package-cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packageCart: newQuantities || {} }),
        }).catch(() => {});
      }
    },
    [token],
  );

  // 5. Quantity Helpers
  const getQty = useCallback(
    (id) => {
      return packageQuantities[id] || 0;
    },
    [packageQuantities],
  );

  const increment = useCallback(
    (id) => {
      setPackageQuantities((prev) => {
        const next = {
          ...prev,
          [id]: (prev[id] || 0) + 1,
        };
        updatePackageState(next);
        return next;
      });
    },
    [updatePackageState],
  );

  const decrement = useCallback(
    (id) => {
      setPackageQuantities((prev) => {
        const current = prev[id] || 0;
        let next;
        if (current <= 1) {
          next = { ...prev };
          delete next[id];
        } else {
          next = {
            ...prev,
            [id]: current - 1,
          };
        }
        updatePackageState(next);
        return next;
      });
    },
    [updatePackageState],
  );

  const clearPackageBox = useCallback(() => {
    updatePackageState({});
  }, [updatePackageState]);

  const loadPackageOrderItems = useCallback(
    async (items, allPackageProducts = []) => {
      let parsedItems = items;
      if (typeof parsedItems === "string") {
        try {
          parsedItems = JSON.parse(parsedItems);
        } catch (e) {
          parsedItems = [];
        }
      }
      if (!Array.isArray(parsedItems) || parsedItems.length === 0) return {};

      let pkgProducts =
        Array.isArray(allPackageProducts) && allPackageProducts.length > 0
          ? allPackageProducts
          : [];

      // If package products not supplied or empty, fetch from API
      if (pkgProducts.length === 0) {
        try {
          const res = await fetch("/api/package-products");
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.products)) {
              pkgProducts = data.products;
            }
          }
        } catch (err) {
          console.warn(
            "Failed to fetch package products for reorder matching:",
            err,
          );
        }
      }

      const newQuantities = {};

      parsedItems.forEach((item) => {
        const qty = Math.max(1, Number(item.qty) || 1);
        let matchedPkgProduct = null;

        if (pkgProducts.length > 0) {
          matchedPkgProduct = pkgProducts.find((p) => {
            const pId = String(p.id);
            const pProdId = p.product_id ? String(p.product_id) : null;
            const itPkgId = item.packageProductId
              ? String(item.packageProductId)
              : item.package_product_id
                ? String(item.package_product_id)
                : null;
            const itProdId = item.productId
              ? String(item.productId)
              : item.product_id
                ? String(item.product_id)
                : item.id
                  ? String(item.id)
                  : null;

            // 1. Direct ID matches
            if (itPkgId && pId === itPkgId) return true;
            if (itProdId && pProdId && pProdId === itProdId) return true;
            if (itProdId && pId === itProdId) return true;

            // 2. Slot number match
            if (item.slot_number && p.slot_number === item.slot_number)
              return true;

            // 3. Name match
            const pName = (p.product_name || "").trim().toLowerCase();
            const itName = (item.product_name || item.brand || item.name || "")
              .trim()
              .toLowerCase();
            if (pName && itName && pName === itName) return true;

            return false;
          });
        }

        if (matchedPkgProduct) {
          newQuantities[matchedPkgProduct.id] =
            (newQuantities[matchedPkgProduct.id] || 0) + qty;
        } else {
          const fallbackKey =
            item.packageProductId ||
            item.package_product_id ||
            item.productId ||
            item.product_id ||
            item.id ||
            item.slot_number;
          if (fallbackKey) {
            newQuantities[fallbackKey] =
              (newQuantities[fallbackKey] || 0) + qty;
          }
        }
      });

      updatePackageState(newQuantities);
      return newQuantities;
    },
    [updatePackageState],
  );

  return (
    <PackageBoxContext.Provider
      value={{
        packageQuantities,
        isHydrated,
        getQty,
        increment,
        decrement,
        clearPackageBox,
        setPackageQuantities: updatePackageState,
        loadPackageOrderItems,
      }}
    >
      {children}
    </PackageBoxContext.Provider>
  );
}

export function usePackageBox() {
  const ctx = useContext(PackageBoxContext);
  if (!ctx) {
    throw new Error("usePackageBox must be used within a PackageBoxProvider");
  }
  return ctx;
}
