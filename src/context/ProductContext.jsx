import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { fetchData, searchProduct, fetchBestSellers } from "../api";
import { supabase } from "../lib/supabase";

const ProductContext = createContext();

export function ProductProvider({ children }) {
    // ─── القديم (لـ HomePage) ───
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // ─── الجديد (للـ Dashboard) ───
    const [paginatedProducts, setPaginatedProducts] = useState([]);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [paginationMeta, setPaginationMeta] = useState({ total: 0, page: 1, limit: 40 });

    const [categoriesWithCounts, setCategoriesWithCounts] = useState([]);
    const [subcategoriesWithCounts, setSubcategoriesWithCounts] = useState([]);

    // ═══════════════════════════════════════════
    // القديم — HomePage
    // ═══════════════════════════════════════════
    const refreshProducts = useCallback(async () => {
        setLoading(true);
        const data = await fetchData("products");
        setProducts(data);
        setLoading(false);
    }, []);

    useEffect(() => { refreshProducts(); }, [refreshProducts]);

    const addProduct = useCallback((p) => setProducts((prev) => [...prev, p]), []);
    const updateProduct = useCallback(
        (updated) => setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p))),
        []
    );
    const deleteProduct = useCallback(
        (id) => setProducts((prev) => prev.filter((p) => p.id !== id)),
        []
    );

    const searchProducts = useCallback(async (term) => {
        setLoading(true);
        const data = await searchProduct(term);
        setProducts(data);
        setLoading(false);
    }, []);

    // ═══════════════════════════════════════════
    // الجديد — Pagination
    // ═══════════════════════════════════════════
    const fetchProductsPaginated = useCallback(async ({
        categoryId = null,
        subcategoryId = null,
        search = null,
        page = 1,
        limit = 40,
    } = {}) => {
        setPaginationLoading(true);
        try {
            const offset = (page - 1) * limit;
            const { data, error } = await supabase.rpc("get_products_paginated", {
                p_category_id: categoryId,
                p_subcategory_id: subcategoryId,
                p_search: search,
                p_limit: limit,
                p_offset: offset,
            });
            if (error) throw error;

            const total = Number(data?.[0]?.total_count || 0);
            const rows = (data || []).map(({ total_count, ...rest }) => rest);

            setPaginatedProducts(rows);
            setPaginationMeta({ total, page, limit });
            return { success: true, products: rows, total };
        } catch (err) {
            console.error("fetchProductsPaginated error:", err);
            return { success: false, error: err.message };
        } finally {
            setPaginationLoading(false);
        }
    }, []);

    // ═══════════════════════════════════════════
    // الجديد — Counts
    // ═══════════════════════════════════════════
    const fetchCategoriesWithCounts = useCallback(async () => {
        try {
            const { data, error } = await supabase.rpc("get_categories_with_counts");
            if (error) throw error;
            setCategoriesWithCounts(data || []);
            return data || [];
        } catch (err) {
            console.error("fetchCategoriesWithCounts error:", err);
            return [];
        }
    }, []);

    const fetchSubcategoriesWithCounts = useCallback(async (categoryId) => {
        try {
            const { data, error } = await supabase.rpc("get_subcategories_with_counts", {
                p_category_id: categoryId,
            });
            if (error) throw error;
            setSubcategoriesWithCounts(data || []);
            return data || [];
        } catch (err) {
            console.error("fetchSubcategoriesWithCounts error:", err);
            return [];
        }
    }, []);

    const value = useMemo(() => ({
        // قديم
        products, loading, setProducts,
        addProduct, updateProduct, deleteProduct,
        refreshProducts, searchProducts, fetchBestSellers,
        // جديد
        paginatedProducts, paginationLoading, paginationMeta,
        fetchProductsPaginated,
        categoriesWithCounts, fetchCategoriesWithCounts,
        subcategoriesWithCounts, fetchSubcategoriesWithCounts,
    }), [
        products, loading,
        addProduct, updateProduct, deleteProduct, refreshProducts, searchProducts,
        paginatedProducts, paginationLoading, paginationMeta,
        fetchProductsPaginated,
        categoriesWithCounts, fetchCategoriesWithCounts,
        subcategoriesWithCounts, fetchSubcategoriesWithCounts,
    ]);

    return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => {
    const ctx = useContext(ProductContext);
    if (!ctx) throw new Error("useProducts must be used within ProductProvider");
    return ctx;
};