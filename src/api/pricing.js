/**
 * الوحدة الأساسية لعرض سعر الوحدة:
 *  - kg / g  → "kg"
 *  - L  / ml → "L"
 *  - غير ذلك → null (Stk ليس لها سعر وحدة)
 */
export function getBaseUnitLabel(unit) {
    const u = String(unit || "").trim().toLowerCase();
    if (u === "kg" || u === "g") return "kg";
    if (u === "l" || u === "ml") return "L";
    return null;
}

/**
 * سعر الوحدة الأساسية (€/kg أو €/L) — يعتمد على الوزن الصافي فقط.
 * لا علاقة له بـ deposit_amount إطلاقًا.
 */
export function calculatePriceByKg(price, weight, unit) {
    const p = parseFloat(price);
    const w = parseFloat(weight);
    if (!p || !w || w <= 0) return 0;
    const u = String(unit || "").trim().toLowerCase();
    if (u === "kg" || u === "l") return (p / w).toFixed(2);
    if (u === "g" || u === "ml") return ((p * 1000) / w).toFixed(2);
    return 0;
}

/** جاهز للعرض: "3.50 €/kg" أو null. */
export function formatPricePerBaseUnit(price, weight, unit) {
    const value = calculatePriceByKg(price, weight, unit);
    const label = getBaseUnitLabel(unit);
    if (!value || !label) return null;
    return `${value} €/${label}`;
}

/**
 * نسبة ضريبة الـ Pfand الفعلية.
 * - إذا deposit_amount = 0 → 0
 * - إذا deposit_tax_rate > 0 → هي
 * - وإلا → ضريبة المنتج
 */
export function getEffectiveDepositTaxRate(depositAmount, depositTaxRate, productTaxRate) {
    const amount = parseFloat(depositAmount) || 0;
    if (amount <= 0) return 0;
    const dtr = parseFloat(depositTaxRate) || 0;
    return dtr > 0 ? dtr : parseFloat(productTaxRate) || 0;
}

/** تقسيم مبلغ Brutto (Pfand) إلى Netto + Steuer. */
export function splitDepositTax(grossBrutto, taxRate) {
    const gross = parseFloat(grossBrutto) || 0;
    if (gross <= 0) return { net: 0, tax: 0, gross: 0 };
    const rate = parseFloat(taxRate) || 0;
    const net = rate > 0 ? gross / (1 + rate / 100) : gross;
    return { net, tax: gross - net, gross };
}