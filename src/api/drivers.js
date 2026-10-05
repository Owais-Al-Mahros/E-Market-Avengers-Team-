// ==========================================================
// 🚗 Drivers API
// ==========================================================

import { supabase } from "../lib/supabase";

/* ═══════════════════════════════════════════
   🔐 Admin — جلب كل السائقين
   ═══════════════════════════════════════════ */
export async function fetchAllDrivers() {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, is_active")
        .eq("role", "driver")
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error("fetchAllDrivers:", error);
        return { success: false, error: error.message };
    }
    return { success: true, data: data || [] };
}

/* ═══════════════════════════════════════════
   🚗 Driver — جلب طلباتي
   ═══════════════════════════════════════════ */
export async function fetchMyOrders() {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data, error } = await supabase
        .from("orders")
        .select(`
      *,
      order_items (id, product_name, quantity, weight, weight_unit, total_price)
    `)
        .eq("driver_id", user.id)
        .in("status", ["confirmed", "shipped", "delivered"])
        .order("delivery_date", { ascending: true })
        .order("delivery_time", { ascending: true });

    if (error) {
        console.error("fetchMyOrders:", error);
        return { success: false, error: error.message };
    }
    return { success: true, data: data || [] };
}

/* ═══════════════════════════════════════════
   🚗 Driver — تحديث الحالة (shipped/delivered فقط)
   ═══════════════════════════════════════════ */
export async function updateOrderStatusByDriver(orderId, newStatus) {
    const ALLOWED = ["delivered"];   // "shipped" يتم عبر ShipOrderModal
    if (!ALLOWED.includes(newStatus)) {
        return { success: false, error: "Status nicht erlaubt." };
    }

    const { error } = await supabase
        .from("orders")
        .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

    if (error) {
        console.error("updateOrderStatusByDriver:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

/* ═══════════════════════════════════════════
   🔐 Admin — إسناد سائق لطلب
   ═══════════════════════════════════════════ */
export async function assignDriverToOrder(orderId, driverId) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
        .from("orders")
        .update({
            driver_id: driverId,
            assigned_at: new Date().toISOString(),
            assigned_by: user?.id || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

    if (error) {
        console.error("assignDriverToOrder:", error);
        return { success: false, error: error.message };
    }
    return { success: true };
}