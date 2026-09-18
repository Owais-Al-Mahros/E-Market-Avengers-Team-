import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import "./AmendmentModal.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function AmendmentModal({ order, onClose, onSuccess }) {
    const [items, setItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);

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
    // Handlers — فقط إنقاص وحذف
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

    // ⚠️ السعر المُخزَّن في total_price هو للكمية الأصلية
    // لذا نحسب سعر الوحدة أولاً
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

    // ============================================
    // هل هناك تغيير؟
    // ============================================
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
    // Submit
    // ============================================
    const handleSubmit = async () => {
        if (!hasChanges) {
            toast.error("Keine Änderungen vorgenommen.");
            return;
        }

        const confirmed = window.confirm(
            `Bestellung ändern?\n\n${changesSummary}\n\n` +
            `Neuer Gesamtbetrag: €${newTotal.toFixed(2)}`
        );
        if (!confirmed) return;

        setSubmitting(true);
        const toastId = toast.loading("Änderungen werden gespeichert...");

        try {
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/apply-amendment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${SUPABASE_KEY}`,
                    },
                    body: JSON.stringify({
                        orderId: order.id,
                        email: order.customer_info?.email,
                        changes: {
                            existingItems: items.map((i) => ({
                                id: i.id,
                                newQuantity: i.toDelete ? 0 : i.newQuantity,
                                deleted: i.toDelete,
                            })),
                            newItems: [], // ✅ لا إضافة إطلاقاً
                        },
                        productsTotal,
                        shipping,
                        newTotal,
                        priceDelta,
                        changesSummary,
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                toast.error(result.error || "Fehler", { id: toastId });
                setSubmitting(false);
                return;
            }

            toast.success(
                `✅ Bestellung geändert!\nReferenz: ${result.amendment_number}`,
                { id: toastId, duration: 5000 }
            );
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error("Verbindungsfehler", { id: toastId });
            setSubmitting(false);
        }
    };

    // ============================================
    // Render
    // ============================================
    return createPortal(
        <div className="am-overlay" onClick={onClose}>
            <div className="am-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="am-header">
                    <div>
                        <h2>
                            <span className="material-symbols-outlined">edit_note</span>
                            Bestellung ändern
                        </h2>
                        <p>Bestellung #{order.order_number}</p>
                    </div>
                    <button className="am-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="am-body">
                    {/* Info */}
                    <div className="am-info">
                        <span className="material-symbols-outlined">info</span>
                        <div>
                            <strong>Artikel reduzieren oder entfernen</strong>
                            <p>
                                Sie können Mengen verringern oder Artikel entfernen. Neue
                                Artikel können nicht hinzugefügt werden.
                            </p>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="am-items">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`am-item ${item.toDelete ? "is-deleted" : ""}`}
                            >
                                <div className="am-item-info">
                                    <span className="am-item-name">{item.product_name}</span>
                                    <span className="am-item-meta">
                                        Original: {item.quantity}× €
                                        {getUnitPrice(item).toFixed(2)}
                                    </span>
                                </div>

                                {!item.toDelete ? (
                                    <div className="am-qty">
                                        {/* ✅ فقط زر إنقاص */}
                                        <button
                                            onClick={() => decreaseQuantity(item.id)}
                                            disabled={item.newQuantity <= 1}
                                            title="Menge verringern"
                                        >
                                            −
                                        </button>
                                        <span>{item.newQuantity}</span>
                                        {/* ❌ لا زر زيادة */}
                                    </div>
                                ) : (
                                    <span className="am-deleted-label">Entfernt</span>
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

                    {/* Summary */}
                    {hasChanges && (
                        <div className="am-summary">
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
                                        priceDelta >= 0 ? "am-delta-positive" : "am-delta-negative"
                                    }
                                >
                                    {priceDelta >= 0 ? "+" : ""}€{priceDelta.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="am-footer">
                    <button className="am-btn am-btn-cancel" onClick={onClose}>
                        Abbrechen
                    </button>
                    <button
                        className="am-btn am-btn-submit"
                        onClick={handleSubmit}
                        disabled={submitting || !hasChanges}
                    >
                        {submitting ? (
                            <>
                                <div className="am-spinner-small" />
                                Wird gespeichert...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check</span>
                                Änderungen speichern
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}