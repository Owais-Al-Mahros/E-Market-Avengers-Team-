/* ══════════════════════════════════════════════════════════
   🇩🇪 German Formatting Helpers
   ══════════════════════════════════════════════════════════ */

/**
 * تنسيق السعر بالألمانية: 36,84 €
 */
export function formatEuro(amount) {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * تنسيق رقم عادي بالألمانية: 1.234,56
 */
export function formatNumber(num, decimals = 2) {
    const n = parseFloat(num) || 0;
    return n.toLocaleString("de-DE", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * تنسيق الوزن مع الوحدة: "2,400 kg" أو "450 g"
 */
export function formatWeight(value, unit) {
    const n = parseFloat(value) || 0;
    const u = String(unit || "").trim();
    const decimals = u === "g" || u === "ml" ? 0 : 3;
    return `${formatNumber(n, decimals)} ${u}`;
}

/**
 * تنسيق الكمية مع الوحدة: "3 Stk" أو "1,5 kg"
 */
export function formatQuantity(quantity, unit) {
    const q = parseFloat(quantity) || 0;
    const u = String(unit || "").trim();

    // للقطع — أرقام صحيحة
    if (u === "Stk" || u.toLowerCase() === "stück") {
        return `${q} Stk`;
    }

    // للأوزان — منازل عشرية
    const formatted = Number.isInteger(q) ? q : formatNumber(q, 2);
    return `${formatted} ${u}`;
}

/**
 * تنسيق التاريخ بالألمانية: 10.10.2026
 */
export function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/**
 * تنسيق التاريخ الطويل: Freitag, 10. Oktober 2026
 */
export function formatDateLong(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

/**
 * تنسيق الوقت: 14:30 Uhr
 */
export function formatTime(timeStr) {
    if (!timeStr) return "—";
    const [h, m] = String(timeStr).split(":");
    return `${String(h).padStart(2, "0")}:${m || "00"} Uhr`;
}