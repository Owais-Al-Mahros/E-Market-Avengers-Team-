import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { fetchData } from "./fetchData";

const TABLE = "products";
const STORAGE_BUCKET = "upload-image";

// ============================================================
// 1. CRUD
// ============================================================
export async function addProduct(productData) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .insert([productData])
            .select();
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error("Failed to add product:", error.message);
        return { success: false, error: error.message };
    }
}

export async function updateProduct(id, updatedData) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .update(updatedData)
            .eq("id", id)
            .select();
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error("Failed to update product:", error.message);
        return { success: false, error: error.message };
    }
}

export async function deleteProduct(id) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
        toast.error(error.message);
        return false;
    }
    return true;
}

// ============================================================
// 2. Queries
// ============================================================
/**
 * بحث عن منتجات — يُستخدم للاقتراحات في الهيدر
 * @param {string} searchItem - كلمة البحث
 * @param {number} limit - الحد الأقصى للنتائج (افتراضي 40)
 */
export async function searchProduct(searchItem, limit = 40) {
    try {
        const term = String(searchItem || "").trim();
        if (!term) return fetchData(TABLE);

        let query = supabase.from(TABLE).select("*");

        if (/^\d+$/.test(term)) {
            query = query.eq("product_number", Number(term));
        } else {
            query = query.ilike("name", `%${term}%`);
        }

        const { data, error } = await query
            .order("id", { ascending: true })
            .limit(limit);                    // ← ✅ الحد الأقصى

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Search error:", error.message);
        return [];
    }
}

export async function getProductById(productId) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*, categories(name)")
            .eq("id", productId)
            .single();
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Failed to get product:", error.message);
        return { success: false, error: error.message };
    }
}

export async function getProductsByCategory(categoryId, currentProductId) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("category_id", categoryId)
            .neq("id", currentProductId);
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Failed to get products by category:", error.message);
        return { success: false, error: error.message };
    }
}

export async function fetchBestSellers(limit = 8) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .gt("total_sold", 0)
            .order("total_sold", { ascending: false })
            .limit(limit);
        if (error) {
            console.error("Failed to fetch best sellers:", error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error("Best sellers fetch error:", error);
        return [];
    }
}

export async function countSubCategory(categoryId) {
    try {
        const { count, error } = await supabase
            .from("subcategories")
            .select("*", { count: "exact", head: true })
            .eq("category_id", categoryId);
        if (error) throw error;
        return { success: true, count };
    } catch (error) {
        console.error("Error counting subcategories:", error.message);
        return { success: false, error: error.message };
    }
}

// ============================================================
// 3. Storage
// ============================================================
export async function uploadProductImage(file) {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file);
        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);
        return { success: true, publicUrl: publicUrlData.publicUrl };
    } catch (error) {
        console.error("Failed to upload image:", error.message);
        return { success: false, error: error.message };
    }
}