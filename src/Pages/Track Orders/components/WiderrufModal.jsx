import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import "./WiderrufModal.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// قائمة الفئات الطازجة المستثناة
const PERISHABLE_CATEGORIES = [
    "fruits", "vegetables", "obst", "gemüse", "früchte",
    "meat", "fisch", "fish", "fleisch",
    "dairy", "milch", "molkerei",
    "bread", "brot", "bakery",
];

export default function WiderrufModal({ order, onClose, onSuccess }) {
    const [selectedItems, setSelectedItems] = useState({});
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);

    const items_list = order.order_items || [];

    // ============================================
    // تحديد المنتجات القابلة للإرجاع
    // ============================================
    useEffect(() => {
        const enriched = items_list.map((item) => {
            // ⚠️ يمكن تحسينها بجلب category من DB
            // حالياً نفترض أن المنتجات التي لها "frisch" في الاسم = طازجة
            const name = (item.product_name || "").toLowerCase();
            const isPerishable = PERISHABLE_CATEGORIES.some((cat) =>
                name.includes(cat)
            ) || item.is_perishable === true;

            return {
                ...item,
                isPerishable,
                canReturn: !isPerishable,
            };
        });

        setItems(enriched);
        setLoadingItems(false);

        // تحديد تلقائي للمنتجات القابلة للإرجاع
        const initial = {};
        enriched.forEach((item) => {
            if (item.canReturn) initial[item.id] = false;
        });
        setSelectedItems(initial);
    }, [order.id]);

    // ============================================
    // Toggle item
    // ============================================
    const toggleItem = (itemId) => {
        const item = items.find((i) => i.id === itemId);
        if (!item?.canReturn) {
            toast.error(
                `${item.product_name} ist vom Widerrufsrecht ausgeschlossen.`
            );
            return;
        }
        setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const toggleAll = () => {
        const returnableItems = items.filter((i) => i.canReturn);
        const allSelected = returnableItems.every((i) => selectedItems[i.id]);
        const newSel = { ...selectedItems };
        returnableItems.forEach((i) => {
            newSel[i.id] = !allSelected;
        });
        setSelectedItems(newSel);
    };

    // ============================================
    // Calculations
    // ============================================
    const selectedItemsList = items.filter((i) => selectedItems[i.id]);
    const returnableCount = items.filter((i) => i.canReturn).length;
    const selectedCount = selectedItemsList.length;

    const subtotal = selectedItemsList.reduce(
        (sum, i) => sum + parseFloat(i.total_price || 0),
        0
    );
    const TAX_RATE = 0.07;
    const taxAmount = subtotal * TAX_RATE;
    const totalRefund = subtotal + taxAmount;

    // ============================================
    // Submit
    // ============================================
    const handleSubmit = async () => {
        if (selectedCount === 0) {
            toast.error("Bitte wählen Sie mindestens ein Produkt aus.");
            return;
        }

        const confirmed = window.confirm(
            `Widerruf bestätigen?\n\n` +
            `${selectedCount} Produkt(e) werden zurückgegeben.\n` +
            `Erstattungsbetrag: €${totalRefund.toFixed(2)}\n\n` +
            `Ihre Anfrage wird innerhalb von 24-48 Stunden bearbeitet.`
        );
        if (!confirmed) return;

        setSubmitting(true);
        const toastId = toast.loading("Widerruf wird eingereicht...");

        try {
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/apply-widerruf`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${SUPABASE_KEY}`,
                    },
                    body: JSON.stringify({
                        orderId: order.id,
                        orderNumber: order.order_number,
                        email: order.customer_info?.email,
                        items: selectedItemsList.map((i) => ({
                            id: i.id,
                            product_id: i.product_id,
                            product_name: i.product_name,
                            quantity: i.quantity,
                            unit_price: parseFloat(i.unit_price),
                            total_price: parseFloat(i.total_price),
                            weight: parseFloat(i.weight) || 0,
                        })),
                        reason: reason.trim() || null,
                        refundAmount: totalRefund,
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                toast.error(result.error || "Fehler beim Einreichen", { id: toastId });
                setSubmitting(false);
                return;
            }

            toast.success(
                `✅ Widerruf eingereicht!\nReferenz: ${result.amendment_number}`,
                { id: toastId, duration: 6000 }
            );

            onSuccess();
        } catch (err) {
            console.error("Widerruf failed:", err);
            toast.error("Verbindungsfehler", { id: toastId });
            setSubmitting(false);
        }
    };

    // ============================================
    // Render
    // ============================================
    return createPortal(
        <div className="wm-overlay" onClick={onClose}>
            <div className="wm-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="wm-header">
                    <div>
                        <h2>
                            <span className="material-symbols-outlined">assignment_return</span>
                            Produkte zurückgeben
                        </h2>
                        <p>Bestellung #{order.order_number}</p>
                    </div>
                    <button className="wm-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="wm-body">
                    {loadingItems ? (
                        <div className="wm-loading">
                            <div className="wm-spinner" />
                            <p>Produkte werden geladen...</p>
                        </div>
                    ) : (
                        <>
                            {/* Info Box */}
                            <div className="wm-info">
                                <span className="material-symbols-outlined">info</span>
                                <div>
                                    <strong>Widerrufsfrist: 14 Tage</strong>
                                    <p>
                                        Gemäß § 355 BGB können Sie Ihre Bestellung innerhalb von 14
                                        Tagen nach Erhalt widerrufen.
                                    </p>
                                </div>
                            </div>

                            {/* Warning about perishables */}
                            <div className="wm-warning">
                                <span className="material-symbols-outlined">warning</span>
                                <p>
                                    <strong>Ausnahme:</strong> Frischeprodukte (Obst, Gemüse,
                                    Fleisch, Fisch, Milchprodukte) sind gemäß § 312g Abs. 2 Nr. 2
                                    BGB vom Widerrufsrecht ausgeschlossen.
                                </p>
                            </div>

                            {/* Select All */}
                            {returnableCount > 0 && (
                                <div className="wm-select-all">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                returnableCount > 0 &&
                                                items
                                                    .filter((i) => i.canReturn)
                                                    .every((i) => selectedItems[i.id])
                                            }
                                            onChange={toggleAll}
                                        />
                                        <span>
                                            Alle auswählen ({returnableCount} verfügbar)
                                        </span>
                                    </label>
                                    <span className="wm-count">
                                        {selectedCount} ausgewählt
                                    </span>
                                </div>
                            )}

                            {/* Items List */}
                            <div className="wm-items">
                                {items.map((item) => {
                                    const isSelected = selectedItems[item.id];
                                    const itemTotal = parseFloat(item.total_price || 0);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`wm-item ${isSelected ? "is-selected" : ""
                                                } ${!item.canReturn ? "is-excluded" : ""}`}
                                            onClick={() => item.canReturn && toggleItem(item.id)}
                                        >
                                            <div className="wm-checkbox">
                                                {item.canReturn ? (
                                                    <div
                                                        className={`wm-check ${isSelected ? "checked" : ""}`}
                                                    >
                                                        {isSelected && (
                                                            <span className="material-symbols-outlined">
                                                                check
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="material-symbols-outlined wm-lock">
                                                        block
                                                    </span>
                                                )}
                                            </div>

                                            <div className="wm-item-info">
                                                <span className="wm-item-name">{item.product_name}</span>
                                                <span className="wm-item-meta">
                                                    {item.quantity}× €
                                                    {parseFloat(item.unit_price || 0).toFixed(2)}
                                                    {item.weight > 0 && ` · ${item.weight} kg`}
                                                </span>
                                                {!item.canReturn && (
                                                    <span className="wm-item-excluded">
                                                        Nicht widerrufsfähig
                                                    </span>
                                                )}
                                            </div>

                                            <span className="wm-item-price">
                                                €{itemTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reason */}
                            <div className="wm-field">
                                <label>Grund (optional)</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Warum möchten Sie diese Produkte zurückgeben?"
                                    rows="3"
                                    maxLength={500}
                                />
                            </div>

                            {/* Summary */}
                            {selectedCount > 0 && (
                                <div className="wm-summary">
                                    <div className="wm-summary-row">
                                        <span>Zwischensumme</span>
                                        <span>€{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="wm-summary-row">
                                        <span>MwSt. (7%)</span>
                                        <span>€{taxAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="wm-summary-row wm-summary-total">
                                        <span>Erstattungsbetrag</span>
                                        <strong>€{totalRefund.toFixed(2)}</strong>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="wm-footer">
                    <button className="wm-btn wm-btn-cancel" onClick={onClose}>
                        Abbrechen
                    </button>
                    <button
                        className="wm-btn wm-btn-submit"
                        onClick={handleSubmit}
                        disabled={submitting || selectedCount === 0}
                    >
                        {submitting ? (
                            <>
                                <div className="wm-spinner-small" />
                                Wird gesendet...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check</span>
                                Widerruf einreichen
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}