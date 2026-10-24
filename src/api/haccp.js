// ==========================================================
// 🛡️ HACCP API Layer (Simplified Driver System)
// ==========================================================

import { supabase } from "../lib/supabase";

/* ══════════════════════════════════════════════════════════
   🔧 Helpers
   ══════════════════════════════════════════════════════════ */
async function getCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

/* ══════════════════════════════════════════════════════════
   📋 1. الفحص اليومي (Shift Start Check)
   ══════════════════════════════════════════════════════════ */

/**
 * جلب فحص الوردية الحالية.
 * اليوم يبدأ من الساعة 6:00 صباحاً وينتهي 5:59 صباحاً من اليوم التالي.
 */
export async function getTodayShiftCheck() {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const now = new Date();
        const today6AM = new Date(now);
        today6AM.setHours(6, 0, 0, 0); // 6:00 صباحاً اليوم

        let startOfShift = new Date(today6AM);

        // إذا كان الوقت الحالي قبل 6 صباحاً (مثلاً 5:30)، فبداية الوردية هي 6 صباحاً من الأمس
        if (now < today6AM) {
            startOfShift.setDate(startOfShift.getDate() - 1);
        }

        const { data, error } = await supabase
            .from("driver_shift_checks")
            .select("*")
            .eq("driver_id", driverId)
            .gte("created_at", startOfShift.toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("getTodayShiftCheck:", err);
        return { success: false, error: err.message };
    }
}

/**
 * حفظ فحص جديد لبداية الوردية
 */
export async function saveShiftCheck(payload) {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const { data, error } = await supabase
            .from("driver_shift_checks")
            .insert({
                driver_id: driverId,
                vehicle_number: payload.vehicle_number,
                tour_number: payload.tour_number,
                checklist: payload.checklist,
                has_cooling_boxes: payload.has_cooling_boxes,
                cooling_boxes: payload.cooling_boxes,
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("saveShiftCheck:", err);
        return { success: false, error: err.message };
    }
}

/* ══════════════════════════════════════════════════════════
   🧽 2. تنظيف نهاية الوردية (Shift End Cleaning)
   ══════════════════════════════════════════════════════════ */

export async function saveShiftCleaning(payload) {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const { data, error } = await supabase
            .from("driver_shift_cleaning")
            .insert({
                driver_id: driverId,
                is_cleaned: payload.is_cleaned,
                notes: payload.notes || null,
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error("saveShiftCleaning:", err);
        return { success: false, error: err.message };
    }
}

/* ══════════════════════════════════════════════════════════
   👨‍💼 3. دوال مساعدة (للأدمن وإسناد السائقين)
   ══════════════════════════════════════════════════════════ */

/**
 * جلب قائمة كل السائقين النشطين (مستخدمة في إسناد السائق للطلب)
 */
export async function fetchAllDriversList() {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("role", "driver")
        .order("name");

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
}

/**
 * للأدمن: جلب سجلات الفحص اليومي
 */
export async function fetchAllShiftChecks({ driverId = null, limit = 100 } = {}) {
    try {
        let query = supabase
            .from("driver_shift_checks")
            .select(`
                *,
                driver:profiles(name, email)
            `)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (driverId) query = query.eq("driver_id", driverId);

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
/**
 * جلب السجل التاريخي للسائق (فحوصات + تنظيف)
 */
export async function fetchMyHistory() {
    try {
        const driverId = await getCurrentUserId();
        if (!driverId) return { success: false, error: "Not authenticated" };

        const [checksRes, cleaningRes] = await Promise.all([
            // ✅ غيرنا 30 إلى 10 هنا
            supabase.from("driver_shift_checks").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }).limit(10),
            // ✅ وغيرنا 30 إلى 10 هنا أيضاً
            supabase.from("driver_shift_cleaning").select("*").eq("driver_id", driverId).order("created_at", { ascending: false }).limit(10)
        ]);

        if (checksRes.error || cleaningRes.error) throw new Error("Fehler beim Laden der Historie");

        const combined = [
            ...(checksRes.data || []).map(c => ({ ...c, type: "check" })),
            ...(cleaningRes.data || []).map(c => ({ ...c, type: "cleaning" }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return { success: true, data: combined };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
/**
 * للأدمن: جلب سجلات التنظيف
 */
export async function fetchAllCleaningLogs({ driverId = null, limit = 100 } = {}) {
    try {
        let query = supabase
            .from("driver_shift_cleaning")
            .select(`
                *,
                driver:profiles(name, email)
            `)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (driverId) query = query.eq("driver_id", driverId);

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (err) {
        return { success: false, error: err.message };
    }
}
