// src/lib/lastOrder.js
// ==========================================================
// 📌 آخر طلب — مصدر واحد للحقيقة
// ==========================================================

const KEY = "lastOrder";
const MAX_AGE_DAYS = 30;

/* ══════════════════════════════════════════════════════════
   ✅ FIX #20: التحقق من صحة البريد
   ══════════════════════════════════════════════════════════ */
const isValidEmail = (email) =>
    typeof email === "string" &&
    /^\S+@\S+\.\S+$/.test(email.trim());

/**
 * حفظ آخر طلب (يُستدعى بعد إنشاء طلب جديد)
 *
 * ✅ FIX #20: نحفظ فقط إذا كل البيانات الأساسية متوفرة
 *            (order_number + email صالحين) —
 *            لأن البحث التلقائي يحتاج الاثنين.
 *
 * @param {object} order - من Supabase أو object مُختصر
 * @returns {boolean} هل تم الحفظ بنجاح؟
 */
export function saveLastOrder(order) {
    if (!order) {
        console.warn("saveLastOrder: order مفقود");
        return false;
    }

    if (!order.order_number) {
        console.warn("saveLastOrder: order_number مفقود");
        return false;
    }

    // ✅ FIX #20: استخراج البريد من كل المصادر المحتملة
    const email = String(
        order.customer_info?.email ??
        order.email ??
        order.customer_email ??
        ""
    )
        .trim()
        .toLowerCase();

    // ✅ FIX #20: لا نحفظ بدون بريد صالح
    if (!isValidEmail(email)) {
        console.warn(
            "saveLastOrder: email غير صالح — لن يُحفظ lastOrder",
            { order_number: order.order_number, email }
        );
        return false;
    }

    try {
        const payload = {
            id: order.id ?? null,
            order_number: order.order_number,
            status: order.status ?? "awaiting_payment",
            email,
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
 *
 * ✅ FIX #20: نحذف أي إدخال بدون بريد صالح (قديم أو تالف)
 *
 * @returns {object|null}
 */
export function getLastOrder() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);

        // ✅ تحقق من order_number
        if (!parsed?.order_number) {
            clearLastOrder();
            return null;
        }

        // ✅ FIX #20: تحقق من البريد
        if (!isValidEmail(parsed.email)) {
            console.warn(
                "getLastOrder: آخر طلب بدون بريد صالح — حُذف",
                { order_number: parsed.order_number }
            );
            clearLastOrder();
            return null;
        }

        // ✅ التحقق من العمر
        const refDate = parsed.tracked_at || parsed.created_at;
        if (refDate) {
            const days = Math.floor(
                (Date.now() - new Date(refDate).getTime()) /
                (1000 * 60 * 60 * 24)
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
 *
 * ✅ FIX #20: لا نُلغي البريد الموجود
 *
 * @param {string} newStatus
 */
export function updateLastOrderStatus(newStatus) {
    const current = getLastOrder();
    if (!current) return false;
    return saveLastOrder({
        ...current,
        status: newStatus,
    });
}

export function hasLastOrder() {
    return getLastOrder() !== null;
}