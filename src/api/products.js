import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { fetchData } from "./fetchData";

const TABLE = "products";
const STORAGE_BUCKET = "upload-image";

// ═══════════════════════════════════════════════════════════
// 🎯 Public Columns
// ═══════════════════════════════════════════════════════════
const PUBLIC_COLUMNS = `
    id,
    product_number,
    name,
    image,
    price,
    total_price,
    tax_rate,
    weight,
    weight_unit,
    gross_weight,
    deposit_amount,
    deposit_tax_rate,
    manufacturer,
    manufacturer_info,
    origin_country,
    category_id,
    subcategory_id,
    description,
    ingredients,
    nutrition_facts,
    storage_notes,
    nutrition_basis,
    product_type,
    total_sold
`;

// ============================================================
// 1. CRUD — Admin فقط
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
// 2. Queries — Customer-facing
// ============================================================

/**
 * بحث عن منتجات — يُستخدم للاقتراحات في الهيدر والسلة
 */
export async function searchProduct(searchItem, limit = 40) {
    try {
        const term = String(searchItem || "").trim();
        if (!term) {
            const { data, error } = await supabase
                .from(TABLE)
                .select(PUBLIC_COLUMNS)
                .order("id", { ascending: true })
                .limit(limit);
            if (error) throw error;
            return data || [];
        }

        const { data, error } = await supabase
            .from(TABLE)
            .select(PUBLIC_COLUMNS)
            .ilike("name", `%${term}%`)
            .order("id", { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Search error:", error.message);
        return [];
    }
}

/**
 * جلب منتج واحد بالـ id — لواجهة العميل
 */
export async function getProductById(productId) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select(`${PUBLIC_COLUMNS}, categories(name)`)
            .eq("id", productId)
            .single();
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Failed to get product:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * منتجات من نفس الفئة — للـ "منتجات ذات صلة"
 */
export async function getProductsByCategory(categoryId, currentProductId) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select(PUBLIC_COLUMNS)
            .eq("category_id", categoryId)
            .neq("id", currentProductId);
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Failed to get products by category:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * الأكثر مبيعًا — للـ HomePage
 */
export async function fetchBestSellers(limit = 8) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select(PUBLIC_COLUMNS)
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

/**
 * جلب المنتجات مع الترقيم (Pagination)
 */
export async function fetchProductsPaginated({
    categoryId = null,
    subcategoryId = null,
    search = null,
    page = 1,
    limit = 40,
} = {}) {
    try {
        const offset = (page - 1) * limit;

        let query = supabase
            .from(TABLE)
            .select(PUBLIC_COLUMNS, { count: "exact" });

        if (categoryId) query = query.eq("category_id", categoryId);
        if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);
        if (search) query = query.ilike("name", `%${search}%`);

        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order("id", { ascending: true });

        if (error) throw error;

        return { success: true, data: data || [], total: count || 0 };
    } catch (err) {
        console.error("fetchProductsPaginated error:", err);
        return { success: false, error: err.message, data: [], total: 0 };
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