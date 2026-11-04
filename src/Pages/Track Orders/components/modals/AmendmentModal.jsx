import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { applyAmendment, cancelOrder } from "../../../../api/orders";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import "./AmendmentModal.css";

export default function AmendmentModal({ order, onClose, onSuccess }) {
    const [items, setItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ============================================
    // تحميل المنتجات
    // ============================================
    useEffect(() => {
        const normalized = (order.order_items || []).map((item) => ({
            ...item,
            newQuantity: item.quantity,
            toDelete: false,
        }));
        setItems(normalized);
    }, [order.id]);

    // ============================================
    // Handlers
    // ============================================
    const decreaseQuantity = (itemId) => {
        setItems((prev) =>
            prev.map((i) => {
                if (i.id !== itemId) return i;
                const newQty = Math.max(1, i.newQuantity - 1);
                return { ...i, newQuantity: newQty };
            })
        );
    };

    const toggleDelete = (itemId) => {
        setItems((prev) =>
            prev.map((i) =>
                i.id === itemId ? { ...i, toDelete: !i.toDelete } : i
            )
        );
    };

    // ============================================
    // Calculations
    // ============================================
    const activeItems = items.filter((i) => !i.toDelete);

    // ✅ إذا تم حذف جميع المنتجات → إلغاء الطلب
    const allDeleted = items.length > 0 && activeItems.length === 0;

    const getUnitPrice = (item) => {
        const total = parseFloat(item.total_price || 0);
        const qty = parseFloat(item.quantity || 1);
        return total / qty;
    };

    const productsTotal = activeItems.reduce((sum, i) => {
        const unitPrice = getUnitPrice(i);
        return sum + unitPrice * i.newQuantity;
    }, 0);

    const shipping = parseFloat(order.shipping_cost || 0);
    const newTotal = productsTotal + shipping;
    const priceDelta = newTotal - parseFloat(order.total_price || 0);

    const hasChanges =
        items.some((i) => i.toDelete) ||
        items.some((i) => i.newQuantity < i.quantity);

    const changesSummary = items
        .filter((i) => i.toDelete || i.newQuantity < i.quantity)
        .map((i) => {
            if (i.toDelete) return `${i.product_name} entfernt`;
            return `${i.product_name} ${i.quantity}→${i.newQuantity}`;
        })
        .join(", ");

    // ============================================
    // Submit (open Confirm Dialog)
    // ============================================
    const handleSubmitClick = () => {
        if (!hasChanges) {
            toast.error("Keine Änderungen vorgenommen.");
            return;
        }
        setShowConfirm(true);
    };

    // ============================================
    // Perform actual submission
    // ============================================
    const performSubmit = async () => {
        setSubmitting(true);

        // ═══════════════════════════════════════════════════════
        // ✅ حالة خاصة: كل المنتجات محذوفة → إلغاء الطلب
        // ═══════════════════════════════════════════════════════
        if (allDeleted) {
            const email = order.customer_info?.email;
            if (!email) {
                toast.error("E-Mail fehlt. Stornierung nicht möglich.");
                setSubmitting(false);
                setShowConfirm(false);
                return;
            }

            const toastId = toast.loading("Bestellung wird storniert...");
            try {
                const result = await cancelOrder(order.id, email);

                if (!result.success) {
                    toast.error(result.error || "Stornierung fehlgeschlagen", {
                        id: toastId,
                        duration: 7000,
                    });
                    setSubmitting(false);
                    setShowConfirm(false);
                    return;
                }

                let msg = "✅ Bestellung erfolgreich storniert!";
                if (result.refund_type === "refunded") {
                    msg += ` €${result.refund_amount?.toFixed(2)} werden innerhalb von 3-5 Werktagen erstattet.`;
                } else if (result.refund_type === "authorization_cancelled") {
                    msg += ` Reservierter Betrag (€${result.refund_amount?.toFixed(2)}) wurde freigegeben.`;
                } else if (result.refund_type === "no_payment") {
                    msg += " Es wurde kein Betrag belastet.";
                }

                toast.success(msg, { id: toastId, duration: 8000 });

                setShowConfirm(false);
                setSubmitting(false);
                onSuccess();
            } catch (err) {
                console.error("Cancel failed:", err);
                toast.error("Verbindungsfehler. Bitte versuchen Sie es später.", {
                    id: toastId,
                });
                setSubmitting(false);
                setShowConfirm(false);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════
        // ✅ حالة عادية: تعديل الطلب
        // ═══════════════════════════════════════════════════════
        const toastId = toast.loading("Änderungen werden gespeichert...");

        try {
            const result = await applyAmendment({
                orderId: order.id,
                email: order.customer_info?.email,
                changes: {
                    existingItems: items.map((i) => ({
                        id: i.id,
                        newQuantity: i.toDelete ? 0 : i.newQuantity,
                        deleted: i.toDelete,
                    })),
                    newItems: [],
                },
                productsTotal,
                shipping,
                newTotal,
                priceDelta,
                changesSummary,
            });

            if (!result.success) {
                toast.error(result.error || "Fehler", { id: toastId });
                setSubmitting(false);
                setShowConfirm(false);
                return;
            }

            toast.success(
                `✅ Bestellung geändert! Referenz: ${result.amendment_number}`,
                { id: toastId, duration: 5000 }
            );

            setShowConfirm(false);
            setSubmitting(false);
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error("Verbindungsfehler", { id: toastId });
            setSubmitting(false);
            setShowConfirm(false);
        }
    };

    // ============================================
    // Render
    // ============================================
    return createPortal(
        <>
            <div className="am-overlay" onClick={onClose}>
                <div className="am-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="am-header">
                        <div>
                            <h2>
                                <span className="material-symbols-outlined">
                                    {allDeleted ? "cancel" : "edit_note"}
                                </span>
                                {allDeleted ? "Bestellung stornieren" : "Bestellung ändern"}
                            </h2>
                            <p>Bestellung #{order.order_number}</p>
                        </div>
                        <button className="am-close" onClick={onClose}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="am-body">
                        {/* Info Banner — يتغير حسب الحالة */}
                        <div className={`am-info ${allDeleted ? "am-info-danger" : ""}`}>
                            <span className="material-symbols-outlined">
                                {allDeleted ? "warning" : "info"}
                            </span>
                            <div>
                                <strong>
                                    {allDeleted
                                        ? "Alle Artikel entfernt"
                                        : "Artikel reduzieren oder entfernen"}
                                </strong>
                                <p>
                                    {allDeleted
                                        ? "Da Sie alle Artikel entfernt haben, wird die gesamte Bestellung storniert. Eine eventuell vorhandene Zahlung wird automatisch erstattet oder die Autorisierung freigegeben."
                                        : "Sie können Mengen verringern oder Artikel entfernen. Neue Artikel können nicht hinzugefügt werden."}
                                </p>
                            </div>
                        </div>

                        <div className="am-items">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`am-item ${item.toDelete ? "is-deleted" : ""}`}
                                >
                                    <div className="am-item-info">
                                        <span className="am-item-name">
                                            {item.product_name}
                                        </span>
                                        <span className="am-item-meta">
                                            Original: {item.quantity}× €
                                            {getUnitPrice(item).toFixed(2)}
                                        </span>
                                    </div>

                                    {!item.toDelete ? (
                                        <div className="am-qty">
                                            <button
                                                onClick={() => decreaseQuantity(item.id)}
                                                disabled={item.newQuantity <= 1}
                                                title="Menge verringern"
                                            >
                                                −
                                            </button>
                                            <span>{item.newQuantity}</span>
                                        </div>
                                    ) : (
                                        <span className="am-deleted-label">
                                            Entfernt
                                        </span>
                                    )}

                                    <button
                                        className={`am-delete ${item.toDelete ? "am-restore" : ""}`}
                                        onClick={() => toggleDelete(item.id)}
                                        title={item.toDelete ? "Wiederherstellen" : "Entfernen"}
                                    >
                                        <span className="material-symbols-outlined">
                                            {item.toDelete ? "undo" : "delete"}
                                        </span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {hasChanges && (
                            <div className="am-summary">
                                {allDeleted ? (
                                    <div className="am-cancel-notice">
                                        <span className="material-symbols-outlined">
                                            cancel
                                        </span>
                                        <span>
                                            <strong>Die gesamte Bestellung wird storniert.</strong>
                                            <br />
                                            Eine Rückerstattung erfolgt automatisch (falls erforderlich).
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="am-summary-row">
                                            <span>Produkte (inkl. MwSt.)</span>
                                            <span>€{productsTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="am-summary-row">
                                            <span>Versand</span>
                                            <span>€{shipping.toFixed(2)}</span>
                                        </div>
                                        <div className="am-summary-row am-summary-total">
                                            <span>Neuer Gesamtbetrag</span>
                                            <strong>€{newTotal.toFixed(2)}</strong>
                                        </div>
                                        <div className="am-summary-row am-summary-delta">
                                            <span>Differenz zum Original</span>
                                            <span
                                                className={
                                                    priceDelta >= 0
                                                        ? "am-delta-positive"
                                                        : "am-delta-negative"
                                                }
                                            >
                                                {priceDelta >= 0 ? "+" : ""}€
                                                {priceDelta.toFixed(2)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="am-footer">
                        <button
                            className="am-btn am-btn-cancel"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Abbrechen
                        </button>
                        <button
                            className={`am-btn ${allDeleted ? "am-btn-danger" : "am-btn-submit"}`}
                            onClick={handleSubmitClick}
                            disabled={submitting || !hasChanges}
                        >
                            {submitting ? (
                                <>
                                    <div className="am-spinner-small" />
                                    {allDeleted ? "Wird storniert..." : "Wird gespeichert..."}
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">
                                        {allDeleted ? "cancel" : "check"}
                                    </span>
                                    {allDeleted ? "Bestellung stornieren" : "Änderungen speichern"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={showConfirm}
                title={allDeleted ? "Bestellung stornieren?" : "Bestellung ändern?"}
                message={
                    allDeleted ? (
                        <>
                            <p>
                                Sie haben <strong>alle Artikel</strong> entfernt.
                            </p>
                            <p>
                                Die gesamte Bestellung{" "}
                                <strong style={{ color: "var(--danger-color)" }}>
                                    wird storniert
                                </strong>
                                .
                            </p>
                            <p>
                                Falls eine Zahlung autorisiert oder abgebucht wurde, wird diese
                                automatisch zurückerstattet bzw. freigegeben.
                            </p>
                        </>
                    ) : (
                        <>
                            <p>
                                <strong>Änderungen:</strong>
                            </p>
                            <p>{changesSummary}</p>
                            <p>
                                Neuer Gesamtbetrag:{" "}
                                <strong>€{newTotal.toFixed(2)}</strong>
                            </p>
                        </>
                    )
                }
                variant={allDeleted ? "danger" : "warning"}
                icon={allDeleted ? "cancel" : "edit_note"}
                confirmLabel={allDeleted ? "Ja, stornieren" : "Änderungen speichern"}
                cancelLabel="Zurück"
                isLoading={submitting}
                onConfirm={performSubmit}
                onCancel={() => setShowConfirm(false)}
            />
        </>,
        document.body
    );
}