// src/lib/bestSellers.js
import { supabase } from "./supabase";

/**
 * تحديث عدد المبيعات لكل منتج في الطلب
 * يُستدعى عند تحويل الطلب إلى "delivered"
 */
export async function updateBestSellers(orderId) {
    try {
        // ١. جلب منتجات الطلب
        const { data: items, error } = await supabase
            .from("order_items")
            .select("product_id, quantity, actual_quantity, status")
            .eq("order_id", orderId);

        if (error) {
            console.error("❌ Failed to load order items:", error);
            return false;
        }

        if (!items || items.length === 0) {
            console.log("⚠️ No items to update");
            return true;
        }

        // ٢. تحديث كل منتج
        const updates = items
            .filter((item) => {
                // تجاهل المنتجات المحذوفة (Not Available)
                if (item.status === "removed") return false;
                // تجاهل المنتجات بدون product_id
                if (!item.product_id) return false;
                return true;
            })
            .map((item) => {
                // استخدم الكمية الفعلية إذا وُجدت، وإلا الكمية المطلوبة
                const qty = parseFloat(item.actual_quantity) || parseFloat(item.quantity) || 0;
                return { product_id: item.product_id, qty };
            })
            .filter((u) => u.qty > 0);

        if (updates.length === 0) {
            console.log("⚠️ No valid items to update");
            return true;
        }

        // ٣. استدعاء RPC لكل منتج
        const results = await Promise.all(
            updates.map((u) =>
                supabase.rpc("increment_sold", {
                    product_id: u.product_id,
                    amount: Math.round(u.qty),
                })
            )
        );

        // ٤. التحقق من الأخطاء
        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
            console.error("❌ Some updates failed:", errors);
            return false;
        }

        console.log(`✅ Updated ${updates.length} products`);
        return true;
    } catch (error) {
        console.error("❌ Best sellers update failed:", error);
        return false;
    }
}

/**
 * خصم مبيعات المنتجات (عند التراجع عن التسليم)
 */
export async function decrementBestSellers(orderId) {
    try {
        const { data: items } = await supabase
            .from("order_items")
            .select("product_id, quantity, actual_quantity, status")
            .eq("order_id", orderId);

        if (!items || items.length === 0) return true;

        const updates = items
            .filter((item) => {
                if (item.status === "removed") return false;
                if (!item.product_id) return false;
                return true;
            })
            .map((item) => {
                const qty = parseFloat(item.actual_quantity) || parseFloat(item.quantity) || 0;
                return { product_id: item.product_id, qty };
            })
            .filter((u) => u.qty > 0);

        await Promise.all(
            updates.map((u) =>
                supabase.rpc("increment_sold", {
                    product_id: u.product_id,
                    amount: -Math.round(u.qty),   // ← قيمة سالبة
                })
            )
        );

        return true;
    } catch (error) {
        console.error("❌ Decrement failed:", error);
        return false;
    }
}