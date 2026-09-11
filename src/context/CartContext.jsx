import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems, clearCartItems] = useLocalStorage("cartItems", []);

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

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    };

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

    const clearCart = () => {
        clearCartItems();
    };

    // ✅ إجمالي عدد المنتجات
    const totalItems = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }, [cartItems]);

    // ✅ إجمالي السعر
    const totalPrice = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cartItems]);

    // ✅ جديد: إجمالي الوزن بالكيلوغرام
    const totalWeight = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const weight = parseFloat(item.weight) || 0;
            return sum + weight * item.quantity;
        }, 0);
    }, [cartItems]);

    const value = {
        cartItems,
        totalItems,
        totalPrice,
        totalWeight, // ✅ تصدير الوزن
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}