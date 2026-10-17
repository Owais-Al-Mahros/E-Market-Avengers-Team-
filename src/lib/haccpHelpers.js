// ==========================================================
// 🛡️ HACCP Helpers — ثوابت + دوال مساعدة
// ==========================================================

/* ══════════════════════════════════════════════════════════
   💶 معاملات درجة الحرارة
   ══════════════════════════════════════════════════════════ */
export const TEMP_REVIEW_MARGIN = 2.0; // °C — فوق/تحت النطاق بحد أقصى 2°C → review_needed

/* ══════════════════════════════════════════════════════════
   🔴 حالات المخالفات
   ══════════════════════════════════════════════════════════ */
export const VIOLATION_STATUSES = {
    pending: { label: "⏳ Ausstehend", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    resolved: { label: "✅ Gelöst", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
    escalated: { label: "🚨 Eskaliert", color: "#dc2626", bg: "rgba(220,38,38,0.12)" },
};

export const SEVERITY_LEVELS = {
    critical: { label: "Kritisch", color: "#dc2626", bg: "rgba(220,38,38,0.12)", icon: "🚨" },
    minor: { label: "Gering", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "⚠️" },
};

/* ══════════════════════════════════════════════════════════
   🎯 حساب الحالات آليًا
   ══════════════════════════════════════════════════════════ */

/**
 * حالة فحص السيارة: passed فقط إذا كل الـ10 booleans = true
 * @param {object} checks - { is_vehicle_suitable, is_cargo_clean, ... }
 */
export function computeVehicleCheckStatus(checks) {
    const keys = [
        "is_vehicle_suitable",
        "is_cargo_clean",
        "no_dirt_or_contaminants",
        "no_abnormal_odors",
        "no_chemicals",
        "boxes_clean_and_intact",
        "no_pests",
        "no_damaged_food",
        "driver_hygiene_compliant",
        "no_health_issues",
    ];
    return keys.every((k) => checks[k] === true) ? "passed" : "failed";
}

/**
 * حالة فحص معدات التبريد
 */
export function computeCoolingEquipmentStatus(checks) {
    const keys = [
        "box_clean",
        "box_intact",
        "cooling_unit_working",
        "thermometer_working",
        "required_temp_achieved",
        "products_in_correct_compartment",
        "no_cross_contamination_risk",
    ];
    return keys.every((k) => checks[k] === true) ? "passed" : "failed";
}

/**
 * حالة فحص المنتجات عند الاستلام (بند 3)
 */
export function computeProductReceiptStatus(checks) {
    const keys = [
        "products_match_order",
        "packaging_intact",
        "no_open_or_leaking_packages",
        "no_visible_damage_or_spoilage",
        "chilled_products_stored_correctly",
        "frozen_products_not_thawed",
        "no_cross_contamination_risk",
    ];
    return keys.every((k) => checks[k] === true) ? "passed" : "failed";
}

/**
 * حالة درجة الحرارة — آليًا حسب الفئة
 * @param {number} actual  - القراءة الفعلية
 * @param {number} min     - الحد الأدنى للفئة
 * @param {number} max     - الحد الأعلى للفئة
 * @returns {'compliant' | 'non_compliant' | 'review_needed'}
 */
export function computeTemperatureStatus(actual, min, max) {
    if (actual >= min && actual <= max) return "compliant";
    // خارج النطاق بـ margin صغير → review_needed
    if (actual >= min - TEMP_REVIEW_MARGIN && actual <= max + TEMP_REVIEW_MARGIN) {
        return "review_needed";
    }
    return "non_compliant";
}

/* ══════════════════════════════════════════════════════════
   🎨 دوال عرض
   ══════════════════════════════════════════════════════════ */

export function getSeverityBadge(severity) {
    return SEVERITY_LEVELS[severity] || SEVERITY_LEVELS.minor;
}

export function getViolationStatusBadge(status) {
    return VIOLATION_STATUSES[status] || VIOLATION_STATUSES.pending;
}

/**
 * تنسيق نطاق حراري: "−18.0 bis −15.0 °C"
 */
export function formatTempRange(min, max) {
    const fmt = (n) => Number(n).toFixed(1).replace(".", ",");
    return `${fmt(min)} bis ${fmt(max)} °C`;
}

/**
 * تنسيق درجة حرارة مفردة: "−18.0 °C"
 */
export function formatTemp(value) {
    if (value === null || value === undefined) return "—";
    return `${Number(value).toFixed(1).replace(".", ",")} °C`;
}

/* ══════════════════════════════════════════════════════════
   🕒 تنسيق التاريخ والوقت بالألمانية
   ══════════════════════════════════════════════════════════ */
export function formatDateTimeDE(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatDateDE(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/* ══════════════════════════════════════════════════════════
   🏷️ ترجمة مفاتيح إلى تسميات
   ══════════════════════════════════════════════════════════ */

/**
 * @param {string[]} keys - ['recleaning', 'isolate_product']
 * @param {Array} referenceTable - من fetchCorrectiveActions أو fetchViolationTypes
 * @returns {string} "Erneute Reinigung · Produkt isolieren"
 */
export function translateKeysToLabels(keys, referenceTable) {
    if (!Array.isArray(keys) || keys.length === 0) return "—";
    if (!Array.isArray(referenceTable)) return keys.join(" · ");
    return keys
        .map((k) => referenceTable.find((r) => r.key === k)?.label_de || k)
        .join(" · ");
}