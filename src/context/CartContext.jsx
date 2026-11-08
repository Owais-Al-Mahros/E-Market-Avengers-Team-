import { createContext, useContext, useMemo, useCallback } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { toBaseUnit, getShippingWeight } from "../lib/units";
import { supabase } from "../lib/supabase";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems, clearCartItems] = useLocalStorage(
    "cartItems",
    []
  );



  // ═══ Normalize before storing — new fields guaranteed ═══
  const normalizeItem = (product) => ({
    ...product,
    deposit_amount: Math.max(0, parseFloat(product.deposit_amount) || 0),
    deposit_tax_rate: Math.max(0, parseFloat(product.deposit_tax_rate) || 0),
    gross_weight: getShippingWeight(product),
  });

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const normalized = normalizeItem(product);
      const existing = prevItems.find((item) => item.id === normalized.id);

      if (existing) {
        return prevItems.map((item) =>
          item.id === normalized.id
            ? { ...item, ...normalized, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { ...normalized, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const increaseQty = (productId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (productId) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => clearCartItems();

  // داخل CartProvider، بعد clearCart:
const syncPrices = useCallback(async () => {
  if (cartItems.length === 0) return { changed: false, removed: [] };

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, total_price, tax_rate, weight, weight_unit, deposit_amount, deposit_tax_rate, product_type")
    .in("id", cartItems.map((i) => i.id));
  if (error || !data) return { changed: false, removed: [], failed: true };

  const fresh = new Map(data.map((p) => [p.id, p]));
  const unit = (x) => parseFloat(x.total_price || x.price || 0);
  const removed = [];
  let changed = false;
  const next = [];

  for (const item of cartItems) {
    const p = fresh.get(item.id);
    if (!p) { removed.push(item.name); changed = true; continue; }
    if (unit(p) !== unit(item) ||
        Number(p.deposit_amount || 0) !== Number(item.deposit_amount || 0)) changed = true;
    next.push(normalizeItem({ ...item, ...p }));
  }
  setCartItems(next);
  return { changed, removed };
}, [cartItems]);

  // ═══ Totals ═══
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // المنتجات فقط (بدون Pfand، بدون شحن)
  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const unit = parseFloat(item.total_price || item.price || 0);
      return sum + unit * item.quantity;
    }, 0);
  }, [cartItems]);

  // الـ Pfand كإجمالي
  const totalDeposit = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const d = parseFloat(item.deposit_amount) || 0;
      return sum + d * item.quantity;
    }, 0);
  }, [cartItems]);

  // المجموع النهائي قبل الشحن = منتجات + Pfand
  const cartGrandTotal = totalPrice + totalDeposit;

  // ⚠️ للأغراض القديمة: totalWeight الآن = الوزن الفيزيائي (gross) للشحن
  const totalWeight = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const w = getShippingWeight(item);
      return sum + w * item.quantity;
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    totalItems,
    totalPrice,        // منتجات فقط
    totalDeposit,      // Pfand
    cartGrandTotal,    // منتجات + Pfand
    totalWeight,       // الوزن الفيزيائي (kg) للشحن
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    decreaseQty,
    increaseQty,
    syncPrices,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}