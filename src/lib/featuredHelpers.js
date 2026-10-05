// ==========================================================
// 🔥 Featured Products — Helpers
// ==========================================================

export const MAX_FEATURED = 10;

/**
 * إضافة/إزالة من مصفوفة اختيار الأدمن (بحفظ الترتيب)
 * الحد الأقصى 10 — أي إضافة فوقه تُتجاهل.
 */
export function toggleFeatured(ids, productId) {
    const exists = ids.includes(productId);
    if (exists) return ids.filter((id) => id !== productId);
    if (ids.length >= MAX_FEATURED) return ids;
    return [...ids, productId];
}

/**
 * هل وصلنا الحد الأقصى؟
 */
export function isFeaturedFull(ids) {
    return ids.length >= MAX_FEATURED;
}

/**
 * تحريك عنصر للأعلى في قائمة الاختيار
 */
export function moveUp(ids, productId) {
    const idx = ids.indexOf(productId);
    if (idx <= 0) return ids;
    const next = [...ids];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    return next;
}