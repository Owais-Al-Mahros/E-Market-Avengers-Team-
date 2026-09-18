// src/context/CartContext.jsx
import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { toBaseUnit } from "../lib/units";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems, clearCartItems] = useLocalStorage(
        "cartItems",
        []
    );

    // ============================================
    // إضافة منتج
    // ============================================
    const addToCart = (product, quantity = 1) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === product.id);

            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...prevItems, { ...product, quantity }];
        });
    };

    // ============================================
    // إزالة منتج
    // ============================================
    const removeFromCart = (productId) => {
        setCartItems((prevItems) =>
            prevItems.filter((item) => item.id !== productId)
        );
    };

    // ============================================
    // تحديث الكمية
    // ============================================
    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    // ============================================
    // تفريغ السلة
    // ============================================
    const clearCart = () => {
        clearCartItems();
    };

    // ============================================
    // إجمالي عدد المنتجات
    // ============================================
    const totalItems = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }, [cartItems]);

    // ============================================
    // إجمالي السعر (مع الضريبة)
    // ============================================
    const totalPrice = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const itemTotal = parseFloat(item.total_price || item.price || 0);
            return sum + itemTotal * item.quantity;
        }, 0);
    }, [cartItems]);

    // ============================================
    // ✅ إجمالي الوزن بالوحدة الأساسية (kg / L)
    // ============================================
    // يُستخدم لحساب تكلفة الشحن في calculate-delivery
    // ويمنع الخطأ الكارثي عند وجود منتجات بـ g أو ml
    const totalWeight = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const itemBaseWeight = toBaseUnit(item.weight, item.weight_unit);
            return sum + itemBaseWeight * item.quantity;
        }, 0);
    }, [cartItems]);

    // ============================================
    // Context Value
    // ============================================
    const value = {
        cartItems,
        totalItems,
        totalPrice,
        totalWeight, // ✅ بالكيلوغرام دائماً
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
    };

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
}

// ============================================
// Hook
// ============================================
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}