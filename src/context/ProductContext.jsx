// src/context/ProductContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchData, searchProduct } from '../hooks/useProduct';

const ProductContext = createContext();

export function ProductProvider({ children }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        setLoading(true);
        const data = await fetchData('products');
        setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // ✅ دوال CRUD
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

    // ✅ دالة البحث
    const searchProducts = async (term) => {
        setLoading(true);
        const data = await searchProduct(term);
        setProducts(data);
        setLoading(false);
    };

    // ✅ دالة إعادة التحميل
    const refreshProducts = fetchProducts;

    const value = {
        products,
        loading,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
        searchProducts,
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
}