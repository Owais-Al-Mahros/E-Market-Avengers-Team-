// ==========================================================
// 🔥 Featured API — Separate table
// ==========================================================

import { supabase } from "../lib/supabase";

const MAX = 10;

/* ═══════════════════════════════════════════
   🌍 Public — قراءة المنتجات المميزة
   ═══════════════════════════════════════════ */
export async function fetchFeaturedProducts() {
    const { data, error } = await supabase
        .from("featured_products")
        .select(`
      display_order,
      product:products (*)
    `)
        .order("display_order", { ascending: true })
        .limit(MAX);

    if (error) {
        console.error("fetchFeaturedProducts:", error);
        return { success: false, error: error.message };
    }

    const products = (data || [])
        .map((row) => row.product)
        .filter(Boolean);

    return { success: true, data: products };
}

/* ═══════════════════════════════════════════
   🔐 Admin — معرّفات المميزة (للتحرير)
   ═══════════════════════════════════════════ */
export async function fetchFeaturedIds() {
    const { data, error } = await supabase
        .from("featured_products")
        .select("product_id")
        .order("display_order", { ascending: true });

    if (error) {
        console.error("fetchFeaturedIds:", error);
        return { success: false, error: error.message };
    }

    return {
        success: true,
        data: (data || []).map((r) => r.product_id),
    };
}

/* ═══════════════════════════════════════════
   🔐 Admin — حفظ القائمة
   ═══════════════════════════════════════════ */
export async function saveFeaturedProducts(productIds) {
    const clean = Array.from(new Set(productIds));

    if (clean.length > MAX) {
        return { success: false, error: `Maximum ${MAX} products allowed` };
    }

    const { error } = await supabase.rpc("set_featured_products", {
        p_product_ids: clean,
    });

    if (error) {
        console.error("saveFeaturedProducts:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
}