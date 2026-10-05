// ==========================================================
// 📊 Analytics API — Overview Statistics
// ==========================================================
//
// 🎯 استراتيجية الأداء:
// - العدّ: head:true → COUNT(*) على السيرفر (لا نقل صفوف)
// - المجموع: RPC → SUM على السيرفر (يُرجع رقمًا واحدًا)
// - التجميع: Promise.all → كل النداءات متوازية
//
// 📅 حساب الأرباح: من بداية الشهر الحالي حتى بداية الشهر القادم
// ==========================================================

import { supabase } from "../lib/supabase";

/* ═══════════════════════════════════════════
   ⚙️ الإعدادات
   ═══════════════════════════════════════════ */

const IN_PROGRESS_STATUSES = ["confirmed", "shipped"];
const REVENUE_STATUSES = ["delivered"];

/* ═══════════════════════════════════════════
   📅 Helper: نطاق الشهر الحالي
   ═══════════════════════════════════════════ */
/**
 * يُعيد بداية الشهر الحالي ونهاية الشهر القادم (ISO strings).
 * "من بداية الشهر حتى بداية الشهر القادم" — توقيت محلي.
 */
function getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

/* ═══════════════════════════════════════════
   💰 1. إيرادات التوصيل — هذا الشهر افتراضيًا
   ═══════════════════════════════════════════ */
/**
 * يجمع shipping_cost + floor_fee من الطلبات المُسلَّمة.
 * افتراضيًا: من بداية الشهر الحالي حتى بداية الشهر القادم.
 *
 * @param {object} options
 * @param {string[]} options.statuses     - الحالات المُحتسبة
 * @param {boolean}  options.includeFloor - هل نضيف floor_fee؟
 * @param {string}   options.from         - ISO date (اختياري، يتجاوز الشهر الحالي)
 * @param {string}   options.to           - ISO date (اختياري)
 * @returns {Promise<{ success, data?: { total, orderCount }, error?, range?: {from, to} }>}
 */
export async function getDeliveryRevenue({
    statuses = REVENUE_STATUSES,
    includeFloor = true,
    from = null,
    to = null,
} = {}) {
    if (!statuses.length) {
        return { success: true, data: { total: 0, orderCount: 0 } };
    }

    const monthRange = getCurrentMonthRange();
    const pFrom = from || monthRange.start;
    const pTo = to || monthRange.end;

    const { data, error } = await supabase.rpc("get_delivery_revenue", {
        p_statuses: statuses,
        p_from: pFrom,
        p_to: pTo,
        p_include_floor: includeFloor,
    });

    if (error) {
        console.error("getDeliveryRevenue:", error);
        return { success: false, error: error.message };
    }

    const row = Array.isArray(data) ? data[0] : data;

    return {
        success: true,
        data: {
            total: Number(row?.total ?? 0),
            orderCount: Number(row?.order_count ?? 0),
        },
        range: { from: pFrom, to: pTo },
    };
}

/* ═══════════════════════════════════════════
   📦 2. عدّ الطلبات حسب الحالة
   ═══════════════════════════════════════════ */
async function countOrdersByStatuses(statuses) {
    if (!statuses?.length) return { success: true, data: 0 };

    const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", statuses);

    if (error) {
        console.error("countOrdersByStatuses:", error);
        return { success: false, error: error.message };
    }
    return { success: true, data: count || 0 };
}

/**
 * عدد الطلبات في حالة "pending" (بانتظار التأكيد).
 */
export function countPendingOrders() {
    return countOrdersByStatuses(["pending"]);
}

/**
 * عدد الطلبات قيد العمل (confirmed + shipped).
 */
export function countInProgressOrders() {
    return countOrdersByStatuses(IN_PROGRESS_STATUSES);
}

/* ═══════════════════════════════════════════
   💬 3. الرسائل الواردة
   ═══════════════════════════════════════════ */
/**
 * يجمع:
 *   - contact_messages بحالة pending
 *   - order_amendments (widerruf) بحالة pending
 */
async function countIncomingMessages() {
    const [contactRes, widerrufRes] = await Promise.all([
        supabase
            .from("contact_messages")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
        supabase
            .from("order_amendments")
            .select("*", { count: "exact", head: true })
            .eq("amendment_type", "widerruf")
            .eq("status", "pending"),
    ]);

    const err = contactRes.error || widerrufRes.error;
    if (err) {
        console.error("countIncomingMessages:", err);
        return { success: false, error: err.message };
    }

    const contactMessages = contactRes.count || 0;
    const widerrufRequests = widerrufRes.count || 0;

    return {
        success: true,
        data: {
            contactMessages,
            widerrufRequests,
            total: contactMessages + widerrufRequests,
        },
    };
}

/* ═══════════════════════════════════════════
   👥 4. عدد العملاء (عبر الإيميلات الفريدة)
   ═══════════════════════════════════════════ */
/**
 * يُرجع عدد العملاء الفريدين بناءً على الإيميلات في الطلبات.
 * الإيميل هو المفتاح الأدق لتمييز العملاء.
 *
 * @returns {Promise<{ success, data?: { customerCount, totalOrders }, error? }>}
 */
export async function getCustomerCount() {
    const { data, error } = await supabase.rpc(
        "get_approximate_customer_count"
    );

    if (error) {
        console.error("getCustomerCount:", error);
        return { success: false, error: error.message };
    }

    const row = Array.isArray(data) ? data[0] : data;

    return {
        success: true,
        data: {
            customerCount: Number(row?.exact_email_count ?? 0),
            totalOrders: Number(row?.total_orders ?? 0),
        },
    };
}

/* ═══════════════════════════════════════════
   🎯 5. مجمّع الـ Overview
   ═══════════════════════════════════════════ */
/**
 * يجلب كل إحصائيات صفحة الـ Overview دفعة واحدة.
 * كل النداءات متوازية عبر Promise.all.
 */
export async function getOverviewStats() {
    try {
        const [revenue, pending, inProgress, messages, customers] =
            await Promise.all([
                getDeliveryRevenue(),
                countPendingOrders(),
                countInProgressOrders(),
                countIncomingMessages(),
                getCustomerCount(),
            ]);

        const failed = [revenue, pending, inProgress, messages, customers].find(
            (r) => !r.success
        );
        if (failed) return { success: false, error: failed.error };

        return {
            success: true,
            data: {
                deliveryRevenue: revenue.data.total,
                revenueOrderCount: revenue.data.orderCount,
                revenueRange: revenue.range,
                pendingOrders: pending.data,
                inProgressOrders: inProgress.data,
                incomingMessages: messages.data,
                customerCount: customers.data.customerCount,
                totalOrders: customers.data.totalOrders,
            },
        };
    } catch (err) {
        console.error("getOverviewStats:", err);
        return { success: false, error: "Verbindungsfehler" };
    }
}