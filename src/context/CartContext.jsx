import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage"; // ✅ استيراد الهوك

const CartContext = createContext();

export function CartProvider({ children }) {
    // ✅ استخدم useLocalStorage بدلاً من useState + useEffect
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
        clearCartItems(); // ✅ حذف من localStorage مباشرة
    };

    // الإجماليات (باستخدام useMemo)
    const totalItems = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }, [cartItems]);

    const totalPrice = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cartItems]);

    const value = {
        cartItems,
        totalItems,
        totalPrice,
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