// src/lib/units.js
// ==========================================================
// 📏 Unit Helpers — توحيد التعامل مع وحدات القياس
// ==========================================================

/**
 * الوحدات التي تُباع بالوزن أو الحجم (يُدخل المستخدم كمية فعلية)
 * - kg: كيلوغرام
 * - g:  غرام
 * - L:  لتر
 * - ml: مليلتر
 *
 * ما عدا ذلك (Stk, pcs, piece) يُعامل كوحدة قائمة بذاتها (قطعة).
 */
const WEIGHT_BASED_UNITS = ["kg", "g", "l", "ml"];

// ==========================================================
// 1. الفحص الأساسي
// ==========================================================

/**
 * هل المنتج يُباع بالوزن/الحجم (وليس بالقطعة)؟
 * @param {string} unit - وحدة القياس
 * @returns {boolean}
 */
export function isWeightBased(unit) {
    if (!unit) return true; // الافتراضي = kg
    return WEIGHT_BASED_UNITS.includes(String(unit).trim().toLowerCase());
}

// ==========================================================
// 2. التوحيد والعرض
// ==========================================================

/**
 * توحيد اسم الوحدة للعرض (Stk بدل stk، L بدل l، ...)
 * @param {string} unit
 * @returns {string}
 */
export function normalizeUnit(unit) {
    if (!unit) return "kg";
    const normalized = String(unit).trim().toLowerCase();

    const map = {
        kg: "kg",
        g: "g",
        l: "L",
        ml: "ml",
        stk: "Stk",
        stück: "Stk",
        stuck: "Stk",
        pcs: "Stk",
        piece: "Stk",
        pieces: "Stk",
    };

    return map[normalized] || "Stk";
}

/**
 * تنسيق الكمية مع الوحدة: "1.5 kg" / "3 Stk" / "500 ml"
 * @param {number|string} quantity
 * @param {string} unit
 * @returns {string}
 */
export function formatQuantity(quantity, unit) {
    const q = parseFloat(quantity) || 0;
    const u = normalizeUnit(unit);
    const qFormatted = Number.isInteger(q) ? q : q.toFixed(2);
    return `${qFormatted} ${u}`;
}

/**
 * تنسيق سعر الوحدة: "€/kg" / "€/L" / "€/Stk"
 * @param {string} unit
 * @returns {string}
 */
export function formatUnitPrice(unit) {
    return `€/${normalizeUnit(unit)}`;
}

/**
 * ملصق الحقل في ShipOrderModal: "Actual Weight (kg)" / "Quantity"
 * @param {string} unit
 * @returns {string}
 */
export function getQuantityFieldLabel(unit) {
    const u = normalizeUnit(unit);
    return isWeightBased(unit) ? `Actual Weight (${u})` : "Quantity";
}

// ==========================================================
// 3. التحويل للوحدة الأساسية (kg / L) — للحسابات
// ==========================================================

/**
 * تحويل أي وزن/حجم إلى الوحدة الأساسية (kg أو L)
 * للاستخدام في الحسابات المحاسبية (الشحن، الفواتير، التقارير)
 *
 * @param {number|string} value - القيمة الرقمية
 * @param {string} unit - الوحدة الأصلية
 * @returns {number} القيمة بالكيلوغرام أو اللتر
 *
 * @example
 *   toBaseUnit(500, "g")  // 0.5
 *   toBaseUnit(500, "ml") // 0.5
 *   toBaseUnit(2, "kg")   // 2
 *   toBaseUnit(1.5, "L")  // 1.5
 *   toBaseUnit(3, "Stk")  // 0  (القطع ليس لها وزن)
 */
export function toBaseUnit(value, unit) {
    const v = parseFloat(value) || 0;
    const normalized = String(unit || "kg").trim().toLowerCase();

    switch (normalized) {
        case "kg":
            return v;
        case "g":
            return v / 1000; // 500 g → 0.5 kg
        case "l":
            return v; // L → L (1:1)
        case "ml":
            return v / 1000; // 500 ml → 0.5 L
        case "stk":
        case "stück":
        case "stuck":
        case "pcs":
        case "piece":
        case "pieces":
            return 0; // القطع ليس لها وزن
        default:
            return v;
    }
}

/**
 * التحويل من الوحدة الأساسية (kg/L) إلى وحدة أخرى — للعرض المضاد
 * @param {number} valueInBaseUnit - القيمة بالكيلوغرام أو اللتر
 * @param {string} targetUnit - الوحدة الهدف
 * @returns {number}
 *
 * @example
 *   fromBaseUnit(0.5, "g")  // 500
 *   fromBaseUnit(1, "kg")   // 1
 *   fromBaseUnit(2, "ml")   // 2000
 */
export function fromBaseUnit(valueInBaseUnit, targetUnit) {
    const v = parseFloat(valueInBaseUnit) || 0;
    const normalized = String(targetUnit || "kg").trim().toLowerCase();

    switch (normalized) {
        case "kg":
            return v;
        case "g":
            return v * 1000;
        case "l":
            return v;
        case "ml":
            return v * 1000;
        default:
            return v;
    }
}

// ==========================================================
// 4. دوال مساعدة للعرض الإداري
// ==========================================================

/**
 * تنسيق الوزن الإجمالي كـ "X.XX kg"
 * يُستخدم في الجداول الإدارية و OrderDetailsModal
 *
 * @param {number} weightInBaseUnit - الوزن بالكيلوغرام
 * @returns {string}
 */
export function formatTotalWeight(weightInBaseUnit) {
    const w = parseFloat(weightInBaseUnit) || 0;
    return `${w.toFixed(2)} kg`;
}

/**
 * حساب الوزن الإجمالي لعنصر واحد (مع الكمية)
 * @param {object} item - { weight, weight_unit, quantity }
 * @returns {number} الوزن الإجمالي بالكيلوغرام
 */
export function calcItemTotalWeight(item) {
    if (!item) return 0;
    const unitWeight = toBaseUnit(item.weight, item.weight_unit);
    const qty = parseFloat(item.quantity) || 1;
    return unitWeight * qty;
}

/**
 * حساب الوزن الإجمالي لمصفوفة عناصر
 * @param {Array<object>} items
 * @returns {number} الوزن الإجمالي بالكيلوغرام
 */
export function calcTotalWeight(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + calcItemTotalWeight(item), 0);
}

// ==========================================================
// 5. الثوابت المُصدَّرة (للاستخدام في التوسعات المستقبلية)
// ==========================================================

export const SUPPORTED_UNITS = {
    WEIGHT: ["kg", "g"],
    VOLUME: ["L", "ml"],
    PIECE: ["Stk"],
};

export const UNIT_LABELS = {
    kg: { en: "Kilogram", de: "Kilogramm", short: "kg" },
    g: { en: "Gram", de: "Gramm", short: "g" },
    L: { en: "Liter", de: "Liter", short: "L" },
    ml: { en: "Milliliter", de: "Milliliter", short: "ml" },
    Stk: { en: "Piece", de: "Stück", short: "Stk" },
};