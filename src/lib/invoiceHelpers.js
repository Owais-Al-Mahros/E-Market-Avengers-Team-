// ==========================================================
// 🧾 Invoice Helpers — حساب الضرائب الألمانية
// ==========================================================

/**
 * تنسيق السعر باليورو (ألماني: 4,00 €)
 */
export function formatEuro(amount) {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
    });
}

/**
 * حساب Netto (السعر بدون ضريبة) من Brutto (السعر مع ضريبة)
 * Brutto = Netto × (1 + rate/100)
 * Netto = Brutto / (1 + rate/100)
 */
export function calcNetFromGross(gross, taxRate) {
    const rate = parseFloat(taxRate) || 0;
    const grossNum = parseFloat(gross) || 0;
    return grossNum / (1 + rate / 100);
}

/**
 * حساب قيمة الضريبة من Brutto
 */
export function calcTaxFromGross(gross, taxRate) {
    const grossNum = parseFloat(gross) || 0;
    const net = calcNetFromGross(grossNum, taxRate);
    return grossNum - net;
}

/**
 * تجميع الفاتورة حسب نسبة الضريبة
 * يُرجع مصفوفة: [{ rate, net, tax, gross, itemCount }]
 */
export function buildTaxBreakdown(items) {
    const groups = {};

    items.forEach((item) => {
        const rate = parseFloat(item.tax_rate) || 0;
        const gross = parseFloat(item.total_price) || 0;
        const net = calcNetFromGross(gross, rate);
        const tax = gross - net;

        const key = String(rate);
        if (!groups[key]) {
            groups[key] = {
                rate,
                net: 0,
                tax: 0,
                gross: 0,
                itemCount: 0,
            };
        }
        groups[key].net += net;
        groups[key].tax += tax;
        groups[key].gross += gross;
        groups[key].itemCount += 1;
    });

    // ترتيب تصاعدي حسب النسبة (7% قبل 19%)
    return Object.values(groups).sort((a, b) => a.rate - b.rate);
}

/**
 * حساب Netto لسطر كامل (مع كمية)
 */
export function calcLineNet(item) {
    const grossLine = parseFloat(item.total_price) || 0;
    return calcNetFromGross(grossLine, item.tax_rate);
}

/**
 * حساب الضريبة لسطر كامل
 */
export function calcLineTax(item) {
    const grossLine = parseFloat(item.total_price) || 0;
    return calcTaxFromGross(grossLine, item.tax_rate);
}