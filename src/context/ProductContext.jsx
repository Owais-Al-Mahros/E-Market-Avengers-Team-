// src/context/ProductContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchData } from '../hooks/useProduct';

// 1. إنشاء السياق
const ProductContext = createContext();

// 2. إنشاء الـ Provider (الذي سيُغلف التطبيق)
export function ProductProvider({ children }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // جلب البيانات من الخادم (مرة واحدة)
    const fetchProducts = async () => {
        setLoading(true);
        const data = await fetchData('products');
        setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // دوال التحديث المحلية (لن نضطر لإعادة الجلب بعد الحذف أو الإضافة)
    const addProduct = (newProduct) => {
        setProducts((prev) => [...prev, newProduct]);
    };

    const updateProduct = (updatedProduct) => {
        setProducts((prev) =>
            prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
    };

    const deleteProduct = (productId) => {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
    };

    // القيم التي ستُمرر للمكونات
    const value = {
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts: fetchProducts, // لإعادة الجلب يدوياً عند الحاجة
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}

// 3. الـ Hook المخصص لتسهيل الاستخدام (بدون الحاجة لاستدعاء useContext مباشرة)
export function useProducts() {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
}