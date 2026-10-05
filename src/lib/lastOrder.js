// src/lib/lastOrder.js
// ==========================================================
// 📌 آخر طلب — مصدر واحد للحقيقة
// ==========================================================

const KEY = "lastOrder";
const MAX_AGE_DAYS = 30;

/**
 * حفظ آخر طلب (يُستدعى بعد إنشاء طلب جديد)
 * @param {object} order - من Supabase أو object مُختصر
 */
export function saveLastOrder(order) {
    if (!order || !order.order_number) {
        console.warn("saveLastOrder: order_number مفقود");
        return false;
    }

    try {
        const payload = {
            id: order.id ?? null,
            order_number: order.order_number,
            status: order.status ?? "pending",
            email: order.customer_info?.email ?? order.email ?? "",
            created_at: order.created_at ?? new Date().toISOString(),
            tracked_at: new Date().toISOString(),
        };
        localStorage.setItem(KEY, JSON.stringify(payload));
        return true;
    } catch (err) {
        console.warn("saveLastOrder failed:", err);
        return false;
    }
}

/**
 * قراءة آخر طلب (مع التحقق من الصلاحية)
 * @returns {object|null}
 */
export function getLastOrder() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);

        if (!parsed?.order_number) {
            clearLastOrder();
            return null;
        }

        // ✅ التحقق من العمر — نحذف الطلبات القديمة
        const refDate = parsed.tracked_at || parsed.created_at;
        if (refDate) {
            const days = Math.floor(
                (Date.now() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (days > MAX_AGE_DAYS) {
                clearLastOrder();
                return null;
            }
        }

        return parsed;
    } catch (err) {
        console.warn("getLastOrder failed:", err);
        clearLastOrder();
        return null;
    }
}

/**
 * حذف آخر طلب
 */
export function clearLastOrder() {
    try {
        localStorage.removeItem(KEY);
    } catch (err) {
        console.warn("clearLastOrder failed:", err);
    }
}

/**
 * تحديث حالة آخر طلب (بعد تعديل/إلغاء)
 * @param {string} newStatus
 */
export function updateLastOrderStatus(newStatus) {
    const current = getLastOrder();
    if (!current) return false;
    return saveLastOrder({ ...current, status: newStatus });
}

export function hasLastOrder() {
    return getLastOrder() !== null;
}