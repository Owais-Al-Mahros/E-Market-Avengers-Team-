import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import "./ShipOrderModal.css";

export default function ShipOrderModal({ order, onClose, onSuccess }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // ===== جلب المنتجات =====
    useEffect(() => {
        const loadItems = async () => {
            const { data, error } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", order.id);

            if (error) {
                toast.error("Failed to load items");
                return;
            }

            const normalized = (data || []).map((item) => ({
                ...item,
                status: item.status || "pending",
                actual_weight: item.actual_weight || "",
                actual_quantity: item.actual_quantity || "",
                actual_unit_price:
                    item.actual_unit_price || item.unit_price || "",
            }));

            setItems(normalized);
            setLoading(false);
        };

        loadItems();
    }, [order.id]);

    // ===== حساب الإجمالي =====
    const calculateTotal = (item) => {
        const isKg = !item.weight_unit || item.weight_unit === "kg";
        const weight = parseFloat(item.actual_weight) || 0;
        const qty = parseFloat(item.actual_quantity) || 0;
        const price =
            parseFloat(item.actual_unit_price) ||
            parseFloat(item.unit_price) ||
            0;

        if (isKg && weight > 0) return weight * price;
        if (!isKg && qty > 0) return qty * price;
        return (item.quantity || 0) * price;
    };

    // ===== تحديث حقل =====
    const updateField = (id, field, value) => {
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
        );
    };

    // ===== تغيير الحالة =====
    const changeStatus = (item, newStatus) => {
        setItems((prev) =>
            prev.map((i) => {
                if (i.id !== item.id) return i;

                if (newStatus === "scanned") {
                    const total = calculateTotal(item);
                    return {
                        ...i,
                        status: "scanned",
                        actual_total: total,
                        price_difference: total - parseFloat(i.total_price || 0),
                    };
                }

                if (newStatus === "removed") {
                    return {
                        ...i,
                        status: "removed",
                        actual_weight: null,
                        actual_quantity: null,
                        actual_total: 0,
                        price_difference: -parseFloat(i.total_price || 0),
                    };
                }

                if (newStatus === "pending") {
                    return {
                        ...i,
                        status: "pending",
                        actual_total: null,
                        price_difference: null,
                    };
                }

                return i;
            })
        );
        setEditingId(null);
    };

    // ===== الإجماليات =====
    const estimatedTotal = items.reduce(
        (sum, i) => sum + parseFloat(i.total_price || 0),
        0
    );
    const actualTotal = items.reduce((sum, i) => {
        if (i.status === "scanned") return sum + (i.actual_total || 0);
        if (i.status === "removed") return sum + 0;
        return sum + calculateTotal(i);
    }, 0);
    const authorizedMax = parseFloat(order.authorized_amount || 0);
    const remainingBuffer = authorizedMax - actualTotal;
    const allScannedAndValid = items.every(
        (i) => i.status === "scanned" || i.status === "removed"
    );
    const isCOD = order.payment_method === "cod";
    const hasStripe = !!order.payment_intent_id;

    // ===== تأكيد الشحن =====
    const handleConfirmShip = async () => {
        if (!allScannedAndValid) {
            toast.error("Please handle all items first");
            return;
        }
        if (!isCOD && remainingBuffer < 0) {
            toast.error(
                `Amount exceeds authorized limit by €${Math.abs(
                    remainingBuffer
                ).toFixed(2)}`
            );
            return;
        }
        if (
            !window.confirm(
                `Confirm: charge €${actualTotal.toFixed(2)} and ship order?`
            )
        )
            return;

        setSubmitting(true);
        try {
            // 1. تحديث كل المنتجات
            for (const item of items) {
                await supabase
                    .from("order_items")
                    .update({
                        actual_weight: parseFloat(item.actual_weight) || null,
                        actual_quantity: parseFloat(item.actual_quantity) || null,
                        actual_unit_price:
                            parseFloat(item.actual_unit_price) || null,
                        actual_total: item.actual_total,
                        price_difference: item.price_difference,
                        status: item.status,
                        scanned_at: new Date().toISOString(),
                    })
                    .eq("id", item.id);
            }

            // 2. تحديث الطلب
            await supabase
                .from("orders")
                .update({
                    total_price: actualTotal,
                    status: "shipped",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", order.id);

            // 3. تحصيل Stripe (إن وُجد)
            if (!isCOD && hasStripe) {
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-payment`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                        },
                        body: JSON.stringify({ orderId: order.id }),
                    }
                );

                const result = await response.json();
                if (!result.success) {
                    toast.error(result.error || "Payment capture failed");
                    setSubmitting(false);
                    return;
                }
            }

            toast.success(
                `✅ Order shipped! €${actualTotal.toFixed(2)} ${isCOD ? "to collect" : "charged"
                }`
            );
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to ship order");
        } finally {
            setSubmitting(false);
        }
    };

    const customer = order.customer_info || {};
    const address = order.shipping_address || {};

    return createPortal(
        <div className="ship-modal-overlay" onClick={onClose}>
            <div className="ship-modal" onClick={(e) => e.stopPropagation()}>
                {/* ===== Header ===== */}
                <div className="ship-modal-header">
                    <div>
                        <h2>📦 Prepare Shipment</h2>
                        <p>
                            Order <strong>#{order.order_number}</strong>
                            {isCOD && <span className="ship-modal-cod"> · Cash on Delivery</span>}
                        </p>
                    </div>
                    <button className="ship-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* ===== Customer Info ===== */}
                <div className="ship-modal-customer">
                    <div className="ship-customer-row">
                        <span>👤</span>
                        <span>
                            {customer.first_name} {customer.last_name}
                        </span>
                    </div>
                    {customer.phone && (
                        <div className="ship-customer-row">
                            <span>📞</span>
                            <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                        </div>
                    )}
                    {address.street && (
                        <div className="ship-customer-row">
                            <span>📍</span>
                            <span>
                                {address.street} {address.house_number}, {address.postal_code}{" "}
                                {address.city}
                            </span>
                        </div>
                    )}
                </div>

                {/* ===== Instructions ===== */}
                <div className="ship-modal-instructions">
                    <span className="material-symbols-outlined">info</span>
                    <p>
                        Enter the <strong>actual weight</strong> of each item from the store
                        scale. The final total will be calculated automatically.
                    </p>
                </div>

                {/* ===== Items ===== */}
                <div className="ship-modal-body">
                    {loading ? (
                        <div className="ship-loading">
                            <div className="ship-spinner" />
                            <p>Loading items...</p>
                        </div>
                    ) : (
                        <div className="ship-items">
                            {items.map((item, idx) => {
                                const isKg = !item.weight_unit || item.weight_unit === "kg";
                                const calc = calculateTotal(item);
                                const isPending = item.status === "pending";
                                const isScanned = item.status === "scanned";
                                const isRemoved = item.status === "removed";
                                const isEditing = editingId === item.id;
                                const showInput = isPending || isEditing;

                                return (
                                    <div
                                        key={item.id}
                                        className={`ship-item ${isScanned ? "is-scanned" : ""} ${isRemoved ? "is-removed" : ""
                                            }`}
                                    >
                                        {/* Head */}
                                        <div className="ship-item-head">
                                            <span className="ship-item-num">{idx + 1}</span>
                                            <div className="ship-item-name">{item.product_name}</div>
                                            {isScanned && <span className="ship-badge ok">✓</span>}
                                            {isRemoved && <span className="ship-badge no">✕</span>}
                                            {isPending && (
                                                <span className="ship-badge pending">•</span>
                                            )}
                                        </div>

                                        {/* Requested */}
                                        <div className="ship-item-requested">
                                            <span>
                                                Requested: <strong>{item.quantity}</strong>
                                                {isKg && item.weight ? ` × ${item.weight} kg` : ""}
                                            </span>
                                            <span>
                                                €
                                                <strong>
                                                    {parseFloat(item.unit_price).toFixed(2)}
                                                </strong>
                                                {isKg ? "/kg" : ""}
                                            </span>
                                        </div>

                                        {/* Input mode */}
                                        {showInput && (
                                            <div className="ship-item-edit">
                                                <div className="ship-input-row">
                                                    <div className="ship-input-wrap">
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            inputMode="decimal"
                                                            placeholder="0.000"
                                                            value={
                                                                isKg
                                                                    ? item.actual_weight || ""
                                                                    : item.actual_quantity || ""
                                                            }
                                                            onChange={(e) =>
                                                                updateField(
                                                                    item.id,
                                                                    isKg ? "actual_weight" : "actual_quantity",
                                                                    e.target.value
                                                                )
                                                            }
                                                            autoFocus={idx === 0}
                                                        />
                                                        <span className="ship-unit">
                                                            {isKg ? "kg" : "pcs"}
                                                        </span>
                                                    </div>
                                                    <div className="ship-calc">
                                                        <span>Total</span>
                                                        <strong>€{calc.toFixed(2)}</strong>
                                                    </div>
                                                </div>

                                                <div className="ship-item-actions">
                                                    <button
                                                        className="ship-btn-confirm"
                                                        onClick={() => changeStatus(item, "scanned")}
                                                        disabled={
                                                            isKg ? !item.actual_weight : !item.actual_quantity
                                                        }
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            check
                                                        </span>
                                                        Confirm
                                                    </button>
                                                    <button
                                                        className="ship-btn-unavailable"
                                                        onClick={() => changeStatus(item, "removed")}
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            block
                                                        </span>
                                                        Not Available
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Final mode */}
                                        {!showInput && (
                                            <div className="ship-item-final">
                                                {isScanned && (
                                                    <>
                                                        <div className="ship-item-result">
                                                            <span className="ship-item-weight">
                                                                {isKg
                                                                    ? `${item.actual_weight} kg`
                                                                    : `${item.actual_quantity} pcs`}
                                                            </span>
                                                            <strong className="ship-item-total">
                                                                €{parseFloat(item.actual_total).toFixed(2)}
                                                            </strong>
                                                        </div>
                                                        <div className="ship-item-actions">
                                                            <button
                                                                className="ship-btn-edit"
                                                                onClick={() => setEditingId(item.id)}
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    edit
                                                                </span>
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="ship-btn-unavailable"
                                                                onClick={() => changeStatus(item, "removed")}
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    block
                                                                </span>
                                                                Not Available
                                                            </button>
                                                        </div>
                                                    </>
                                                )}

                                                {isRemoved && (
                                                    <>
                                                        <div className="ship-item-result">
                                                            <span className="ship-item-removed-text">
                                                                Not available in store
                                                            </span>
                                                            <strong className="ship-item-total-zero">
                                                                €0.00
                                                            </strong>
                                                        </div>
                                                        <div className="ship-item-actions">
                                                            <button
                                                                className="ship-btn-restore"
                                                                onClick={() => changeStatus(item, "pending")}
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    undo
                                                                </span>
                                                                Restore (Found it)
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ===== Footer ===== */}
                <div className="ship-modal-footer">
                    <div className="ship-totals">
                        <div className="ship-total-row">
                            <span>Estimated</span>
                            <span>€{estimatedTotal.toFixed(2)}</span>
                        </div>
                        <div className="ship-total-row actual">
                            <span>
                                Actual {isCOD ? "(to collect)" : "(to charge)"}
                            </span>
                            <span>€{actualTotal.toFixed(2)}</span>
                        </div>
                        {!isCOD && hasStripe && (
                            <div className="ship-total-row">
                                <span>Buffer Remaining</span>
                                <span
                                    className={remainingBuffer >= 0 ? "ok" : "bad"}
                                >
                                    €{remainingBuffer.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="ship-footer-actions">
                        <button className="ship-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="ship-btn-ship"
                            onClick={handleConfirmShip}
                            disabled={!allScannedAndValid || submitting}
                        >
                            <span className="material-symbols-outlined">local_shipping</span>
                            {submitting
                                ? "Processing..."
                                : allScannedAndValid
                                    ? `Confirm & Ship · €${actualTotal.toFixed(2)}`
                                    : `${items.filter((i) => i.status === "pending").length} items remaining`}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}