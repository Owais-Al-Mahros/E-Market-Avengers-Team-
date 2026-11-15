import "./DeliverySummary.css";
import { useState } from "react";
import { useShippingSettings } from "../../../../../context/ShippingSettingsContext";

export default function DeliverySummary({
    checkoutData,
    selectedDate,
    selectedTime,
    cartItems,
    totalPrice,
    totalDeposit = 0,
}) {
    const { settings } = useShippingSettings();
    // قائمة المنتجات مفتوحة على الديسكتوب (الملخص عمود جانبي)، ومطويّة على الجوال:
    // وإلا تدفع كل منتجات السلة زر المتابعة إلى أسفل الصفحة
    const [productsOpen, setProductsOpen] = useState(
        () => window.matchMedia("(min-width: 64.0625rem)").matches
    );
    const fmt = (n) =>
        (Number(n) || 0).toLocaleString("de-DE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    const duration = settings.minDurationHours || 2;

    const shipping = checkoutData?.shippingDetails?.totalShipping || 0;
    // يطابق مبلغ الطلب الفعلي في DeliveryTimePage (منتجات + Pfand + شحن)
    const total = totalPrice + (totalDeposit || 0) + shipping;

    /* ═══ 24h format ═══ */
    const formatTime = (timeStr) => {
        if (!timeStr) return "—";
        const [h, m] = timeStr.split(":");
        return `${String(h).padStart(2, "0")}:${m || "00"} Uhr`;
    };

    const calculateEndTime = () => {
        if (!selectedTime) return "—";
        const [h] = selectedTime.split(":");
        const endHour = (parseInt(h, 10) + duration) % 24;
        return `${String(endHour).padStart(2, "0")}:00 Uhr`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(`${dateStr}T00:00:00`);
        return date.toLocaleDateString("de-DE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    /* ═══ الكمية مع الوحدة ═══ */
    const formatQty = (item) => {
        const unit = String(item.weight_unit || "").toLowerCase();
        const isWeightUnit = ["kg", "g", "l", "ml"].includes(unit);
        const weight = parseFloat(item.weight);

        if (isWeightUnit && weight > 0 && weight !== item.quantity) {
            return `${item.quantity} × ${weight} ${item.weight_unit}`;
        }
        return `${item.quantity} ${item.weight_unit || "Stk"}`;
    };

    /* ═══ سعر الوحدة ═══ */
    const getUnitPrice = (item) => {
        const total = parseFloat(item.total_price || item.price) || 0;
        return total / (item.quantity || 1);
    };

    return (
        <aside className="dsum-container">
            <h3 className="dsum-title">
                <span className="material-symbols-outlined">receipt_long</span>
                Übersicht
            </h3>

            {/* ═══ Liefertermin ═══ */}
            <div className="dsum-block">
                <div className="dsum-block-header">
                    <span className="material-symbols-outlined">event</span>
                    <span>Liefertermin</span>
                </div>
                {selectedDate && selectedTime ? (
                    <div className="dsum-block-content">
                        <strong>{formatDate(selectedDate)}</strong>
                        <span className="dsum-time">
                            {formatTime(selectedTime)} – {calculateEndTime()}
                        </span>
                    </div>
                ) : (
                    <p className="dsum-placeholder">Noch nicht ausgewählt</p>
                )}
            </div>

            {/* ═══ Lieferadresse ═══ */}
            <div className="dsum-block">
                <div className="dsum-block-header">
                    <span className="material-symbols-outlined">location_on</span>
                    <span>Lieferadresse</span>
                </div>
                <div className="dsum-block-content">
                    <strong>
                        {checkoutData?.street} {checkoutData?.houseNumber}
                    </strong>
                    <span>
                        {checkoutData?.postalCode} {checkoutData?.city}
                    </span>
                    {checkoutData?.floor !== "" && (
                        <span className="dsum-detail">
                            Etage {checkoutData.floor}
                            {checkoutData.hasElevator === "yes" && " (Aufzug)"}
                        </span>
                    )}
                </div>
            </div>

            {/* ═══ Produkte (تفصيل) ═══ */}
            <details
                className="dsum-block dsum-products"
                open={productsOpen}
                onToggle={(e) => setProductsOpen(e.currentTarget.open)}
            >
                <summary className="dsum-block-header">
                    <span className="material-symbols-outlined">shopping_bag</span>
                    <span>Produkte ({cartItems.length})</span>
                    <span className="material-symbols-outlined dsum-chevron" aria-hidden="true">expand_more</span>
                </summary>

                <ul className="dsum-items">
                    {cartItems.map((item) => {
                        const unitPrice = getUnitPrice(item);
                        const lineTotal = unitPrice * item.quantity;

                        return (
                            <li key={item.id} className="dsum-item">
                                <div className="dsum-item-info">
                                    <span className="dsum-item-name">
                                        {item.name}
                                    </span>
                                    <span className="dsum-item-meta">
                                        {formatQty(item)} × {fmt(unitPrice)} €
                                    </span>
                                </div>
                                <span className="dsum-item-price">
                                    {fmt(lineTotal)} €
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </details>

            {/* ═══ Totals ═══ */}
            <div className="dsum-totals">
                <div className="dsum-row">
                    <span>Zwischensumme</span>
                    <span>{fmt(totalPrice)} €</span>
                </div>
                {totalDeposit > 0 && (
                    <div className="dsum-row">
                        <span>Pfand</span>
                        <span>{fmt(totalDeposit)} €</span>
                    </div>
                )}
                <div className="dsum-row">
                    <span>Versand</span>
                    <span>{fmt(shipping)} €</span>
                </div>

                <div className="dsum-row dsum-total">
                    <span>Gesamt (inkl. MwSt.)</span>
                    <strong>{fmt(total)} €</strong>
                </div>
            </div>

            {/* ═══ Note ═══ */}
            <div className="dsum-note">
                <span className="material-symbols-outlined">info</span>
                <p>
                    Die Zahlung erfolgt im nächsten Schritt. Änderungen sind bis zur
                    Bestätigung möglich.
                </p>
            </div>
        </aside>
    );
}