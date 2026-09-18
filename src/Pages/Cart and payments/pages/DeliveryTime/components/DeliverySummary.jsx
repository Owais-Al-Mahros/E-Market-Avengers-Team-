import "./DeliverySummary.css";

export default function DeliverySummary({
    checkoutData,
    selectedDate,
    selectedTime,
    cartItems,
    totalPrice,
}) {
    const shipping = checkoutData?.shippingDetails?.totalShipping || 0;
    const tax = totalPrice * 0.07;
    const total = totalPrice + shipping + tax;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("de-DE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "—";
        const [h] = timeStr.split(":");
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:00 ${ampm}`;
    };

    const calculateEndTime = () => {
        if (!selectedTime) return "—";
        const [h] = selectedTime.split(":");
        const endHour = parseInt(h, 10) + 2;
        return formatTime(`${String(endHour).padStart(2, "0")}:00`);
    };

    return (
        <aside className="dsum-container">
            <h3 className="dsum-title">
                <span className="material-symbols-outlined">receipt_long</span>
                Übersicht
            </h3>

            {/* Delivery Date */}
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

            {/* Address */}
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
                    {checkoutData?.floor && (
                        <span className="dsum-detail">
                            Etage {checkoutData.floor}
                            {checkoutData.hasElevator === "yes" && " (Aufzug)"}
                        </span>
                    )}
                </div>
            </div>

            {/* Items Count */}
            <div className="dsum-block">
                <div className="dsum-block-header">
                    <span className="material-symbols-outlined">shopping_bag</span>
                    <span>Produkte ({cartItems.length})</span>
                </div>
            </div>

            {/* Totals */}
            <div className="dsum-totals">
                <div className="dsum-row">
                    <span>Zwischensumme</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                </div>
                <div className="dsum-row">
                    <span>Versand</span>
                    <span>€{shipping.toFixed(2)}</span>
                </div>
                <div className="dsum-row">
                    <span>MwSt. (7%)</span>
                    <span>€{tax.toFixed(2)}</span>
                </div>
                <div className="dsum-row dsum-total">
                    <span>Gesamt</span>
                    <strong>€{total.toFixed(2)}</strong>
                </div>
            </div>

            {/* Note */}
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