// ==========================================================
// 🥗 Nutrition Helpers — Basis & Formatting
// ==========================================================

/**
 * الخيارات المتاحة للأساس (per what?).
 * - key: القيمة المخزنة في DB
 * - adminLabel: ما يراه الأدمن في الإنجليزية
 * - customerLabel: ما يراه الزائر بالألمانية
 */
export const NUTRITION_BASIS_OPTIONS = [
    { key: "100 g", adminLabel: "Per 100 g", customerLabel: "pro 100 g" },
    { key: "100 ml", adminLabel: "Per 100 ml", customerLabel: "pro 100 ml" },
    { key: "1 kg", adminLabel: "Per 1 kg", customerLabel: "pro 1 kg" },
    { key: "1 L", adminLabel: "Per 1 L", customerLabel: "pro 1 L" },
    { key: "Portion", adminLabel: "Per portion", customerLabel: "pro Portion" },
    { key: "Stück", adminLabel: "Per piece", customerLabel: "pro Stück" },
];

export const DEFAULT_NUTRITION_BASIS = "100 g";

/**
 * الحصول على الكائن الكامل من القيمة المخزنة
 */
export function getBasisOption(basis) {
    return (
        NUTRITION_BASIS_OPTIONS.find((o) => o.key === basis) ||
        NUTRITION_BASIS_OPTIONS[0]
    );
}

/**
 * عرض الزائر بالألمانية — "pro 100 g"
 */
export function getBasisDisplay(basis) {
    return getBasisOption(basis).customerLabel;
}