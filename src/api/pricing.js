/**
 * حساب سعر الكيلوغرام من سعر قطعة بوزن ووحدة معطاة.
 * @param {number} price
 * @param {number} weight
 * @param {string} unit - "kg" أو "g"
 * @returns {string} السعر بالكيلوغرام بشكل نصي (2 decimals) أو "0"
 */
export function calculatePriceByKg(price, weight, unit) {
    if (!price || !weight || weight <= 0) return 0;

    const normalizedUnit = String(unit).trim().toLowerCase();

    if (normalizedUnit === "kg") return (price / weight).toFixed(2);
    if (normalizedUnit === "g") return ((price * 1000) / weight).toFixed(2);

    return 0;
}