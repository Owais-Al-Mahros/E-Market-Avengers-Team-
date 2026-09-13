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

    // ✅ الحقول تُقرأ بأمان مع دعم كلا التسميتين
    const paymentMethod = order.payment_method || "cod";
    const isCOD = paymentMethod === "cod";
    const hasStripe = !!order.payment_intent_id;

    // ============================================
    // جلب المنتجات
    // ============================================
    useEffect(() => {
        const loadItems = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", order.id);

            if (error) {
                console.error("Load items error:", error);
                toast.error("Failed to load items");
                setLoading(false);
                return;
            }

            const normalized = (data || []).map((item) => ({
                ...item,
                status: item.status || "pending",
                actual_weight: item.actual_weight ?? "",
                actual_quantity: item.actual_quantity ?? "",
                actual_unit_price: item.actual_unit_price ?? item.unit_price ?? "",
            }));

            setItems(normalized);
            setLoading(false);
        };

        loadItems();
    }, [order.id]);

    // ============================================
    // حساب إجمالي منتج واحد
    // ============================================
    const calculateTotal = (item) => {
        const isKg = !item.weight_unit || item.weight_unit === "kg";
        const weight = parseFloat(item.actual_weight) || 0;
        const qty = parseFloat(item.actual_quantity) || 0;
        const price = parseFloat(item.actual_unit_price) || 0;

        if (isKg && weight > 0) return weight * price;
        if (!isKg && qty > 0) return qty * price;
        return 0;
    };

    // ============================================
    // تحديث حقل
    // ============================================
    const updateField = (id, field, value) => {
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
        );
    };

    // ============================================
    // تغيير حالة منتج
    // ============================================
    const changeStatus = (item, newStatus) => {
        setItems((prev) =>
            prev.map((i) => {
                if (i.id !== item.id) return i;

                if (newStatus === "scanned") {
                    const total = calculateTotal(i);
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

    // ============================================
    // الإجماليات
    // ============================================
    const estimatedProductsTotal = items.reduce(
        (sum, i) => sum + parseFloat(i.total_price || 0),
        0
    );

    const actualProductsTotal = items.reduce((sum, i) => {
        if (i.status === "scanned") return sum + (i.actual_total || 0);
        if (i.status === "removed") return sum + 0;
        return sum;
    }, 0);

    const shippingCost = parseFloat(order.shipping_cost || 0);
    const TAX_RATE = 0.07;
    const actualTax = actualProductsTotal * TAX_RATE;
    const finalTotal = actualProductsTotal + shippingCost + actualTax;

    const authorizedMax = parseFloat(order.authorized_amount || 0);
    const remainingBuffer = authorizedMax - finalTotal;

    const allHandled = items.every(
        (i) => i.status === "scanned" || i.status === "removed"
    );
    const pendingCount = items.filter((i) => i.status === "pending").length;

    // ============================================
    // تأكيد الشحن
    // ============================================
    const handleConfirmShip = async () => {
        // ===== التحقق =====
        if (!allHandled) {
            toast.error(`Please handle all items (${pendingCount} remaining)`);
            return;
        }

        if (!isCOD && hasStripe && remainingBuffer < 0) {
            toast.error(
                `Amount exceeds authorized limit by €${Math.abs(remainingBuffer).toFixed(2)}. Please contact support.`
            );
            return;
        }

        // ===== رسالة التأكيد =====
        const confirmMsg = isCOD
            ? `Confirm shipment?\n\nProducts: €${actualProductsTotal.toFixed(2)}\nShipping: €${shippingCost.toFixed(2)}\nTax: €${actualTax.toFixed(2)}\nTotal to collect: €${finalTotal.toFixed(2)}`
            : `Confirm shipment and charge €${finalTotal.toFixed(2)}?\n\nProducts: €${actualProductsTotal.toFixed(2)}\nShipping: €${shippingCost.toFixed(2)}\nTax: €${actualTax.toFixed(2)}\nTotal: €${finalTotal.toFixed(2)}`;

        if (!window.confirm(confirmMsg)) return;

        setSubmitting(true);

        try {
            // ============================================
            // 1. تحديث كل منتج في order_items
            // ============================================
            for (const item of items) {
                const { error: itemError } = await supabase
                    .from("order_items")
                    .update({
                        actual_weight: parseFloat(item.actual_weight) || null,
                        actual_quantity: parseFloat(item.actual_quantity) || null,
                        actual_unit_price: parseFloat(item.actual_unit_price) || null,
                        actual_total: item.actual_total,
                        price_difference: item.price_difference,
                        status: item.status,
                        scanned_at: new Date().toISOString(),
                    })
                    .eq("id", item.id);

                if (itemError) {
                    console.error(`Item ${item.product_name} update failed:`, itemError);
                    throw new Error(
                        `Failed to update ${item.product_name}: ${itemError.message}`
                    );
                }
            }

            // ============================================
            // 2. تحديث الطلب الرئيسي
            // ============================================
            const { error: orderError } = await supabase
                .from("orders")
                .update({
                    total_price: finalTotal,
                    subtotal: actualProductsTotal,
                    shipping_cost: shippingCost,
                    tax: actualTax,
                    price_adjustment: 0,
                    status: "shipped",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", order.id);

            if (orderError) {
                console.error("Order update failed:", orderError);
                throw new Error(`Failed to update order: ${orderError.message}`);
            }

            // ============================================
            // 3. معالجة الدفع (لكل الطرق)
            // ============================================
            console.log("🎯 Processing payment for method:", order.payment_method);

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
            console.log("📦 Capture result:", result);

            if (!result.success) {
                toast.error(result.error || "Payment processing failed");
                setSubmitting(false);
                return;
            }

            // ============================================
            // 4. رسائل النجاح حسب نوع الدفع
            // ============================================
            if (result.type === "cod") {
                toast.success(
                    `✅ Order shipped! €${result.amountToCollect.toFixed(2)} to collect on delivery`,
                    { duration: 5000 }
                );
            } else if (result.type === "bank_transfer") {
                toast.success(
                    `✅ Order shipped! Awaiting bank transfer of €${result.amountToCollect.toFixed(2)}`,
                    { duration: 5000 }
                );
            } else if (result.alreadyCaptured) {
                toast.success(
                    `✅ Order shipped! Payment was already captured (€${result.finalAmount.toFixed(2)})`,
                    { duration: 5000 }
                );
            } else {
                toast.success(
                    `✅ Order shipped & €${result.finalAmount.toFixed(2)} charged!`,
                    { duration: 5000 }
                );
            }

            onSuccess();
        } catch (error) {
            console.error("❌ Ship failed:", error);
            toast.error(error.message || "Failed to ship order");
        } finally {
            setSubmitting(false);
        }
    };

    const customer = order.customer_info || {};
    const address = order.shipping_address || {};

    // ============================================
    // عرض الواجهة
    // ============================================
    return createPortal(
        <div className="ship-modal-overlay" onClick={onClose}>
            <div className="ship-modal" onClick={(e) => e.stopPropagation()}>
                {/* ===== Header ===== */}
                <div className="ship-modal-header">
                    <div>
                        <h2>📦 Prepare Shipment</h2>
                        <p>
                            Order <strong>#{order.order_number}</strong>
                            {isCOD && (
                                <span className="ship-modal-cod"> · Cash on Delivery</span>
                            )}
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
                        Enter the <strong>actual weight</strong> and{" "}
                        <strong>actual price</strong> for each item from the store. Total
                        is calculated automatically.
                    </p>
                </div>

                {/* ===== Body ===== */}
                <div className="ship-modal-body">
                    {loading ? (
                        <div className="ship-loading">
                            <div className="ship-spinner" />
                            <p>Loading items...</p>
                        </div>
                    ) : (
                        <div className="ship-items">
                            {items.map((item, idx) => {
                                const isKg =
                                    !item.weight_unit || item.weight_unit === "kg";
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
                                            {isScanned && (
                                                <span className="ship-badge ok">✓</span>
                                            )}
                                            {isRemoved && (
                                                <span className="ship-badge no">✕</span>
                                            )}
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
                                                Est. €
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
                                                    <div className="ship-field">
                                                        <label>
                                                            {isKg
                                                                ? "Actual Weight (kg)"
                                                                : "Actual Quantity"}
                                                        </label>
                                                        <div className="ship-input-wrap">
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                inputMode="decimal"
                                                                placeholder={isKg ? `${item.weight}` : "1"}
                                                                value={
                                                                    isKg
                                                                        ? item.actual_weight
                                                                        : item.actual_quantity
                                                                }
                                                                onChange={(e) =>
                                                                    updateField(
                                                                        item.id,
                                                                        isKg
                                                                            ? "actual_weight"
                                                                            : "actual_quantity",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                autoFocus={idx === 0}
                                                            />
                                                            <span className="ship-unit">
                                                                {isKg ? "kg" : "pcs"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="ship-field">
                                                        <label>Actual Price (€)</label>
                                                        <div className="ship-input-wrap">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                inputMode="decimal"
                                                                placeholder="0.00"
                                                                value={item.actual_unit_price}
                                                                onChange={(e) =>
                                                                    updateField(
                                                                        item.id,
                                                                        "actual_unit_price",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <span className="ship-unit">
                                                                /{isKg ? "kg" : "pcs"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="ship-calc-row">
                                                    <span>Calculated Total:</span>
                                                    <strong>€{calc.toFixed(2)}</strong>
                                                </div>

                                                <div className="ship-item-actions">
                                                    <button
                                                        className="ship-btn-confirm"
                                                        onClick={() => changeStatus(item, "scanned")}
                                                        disabled={
                                                            isKg
                                                                ? !item.actual_weight ||
                                                                !item.actual_unit_price
                                                                : !item.actual_quantity ||
                                                                !item.actual_unit_price
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
                                                                    ? `${item.actual_weight} kg × €${parseFloat(
                                                                        item.actual_unit_price
                                                                    ).toFixed(2)}`
                                                                    : `${item.actual_quantity} pcs × €${parseFloat(
                                                                        item.actual_unit_price
                                                                    ).toFixed(2)}`}
                                                            </span>
                                                            <strong className="ship-item-total">
                                                                €
                                                                {parseFloat(item.actual_total).toFixed(2)}
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
                                                                onClick={() =>
                                                                    changeStatus(item, "removed")
                                                                }
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
                                                                onClick={() =>
                                                                    changeStatus(item, "pending")
                                                                }
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
                            <span>Products (estimated)</span>
                            <span>€{estimatedProductsTotal.toFixed(2)}</span>
                        </div>
                        <div className="ship-total-row">
                            <span>Products (actual)</span>
                            <span className="actual-products">
                                €{actualProductsTotal.toFixed(2)}
                            </span>
                        </div>
                        <div className="ship-total-row">
                            <span>Shipping</span>
                            <span>€{shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="ship-total-row">
                            <span>Tax (7%)</span>
                            <span>€{actualTax.toFixed(2)}</span>
                        </div>
                        <div className="ship-total-row actual">
                            <span>
                                Final Total {isCOD ? "(to collect)" : "(to charge)"}
                            </span>
                            <span>€{finalTotal.toFixed(2)}</span>
                        </div>
                        {!isCOD && hasStripe && (
                            <div className="ship-total-row">
                                <span>Authorized Max</span>
                                <span>€{authorizedMax.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="ship-footer-actions">
                        <button
                            className="ship-btn-ship"
                            onClick={handleConfirmShip}
                            disabled={
                                !allHandled || submitting || (!isCOD && remainingBuffer < 0)
                            }
                        >
                            <span className="material-symbols-outlined">
                                local_shipping
                            </span>
                            {submitting
                                ? "Processing..."
                                : !allHandled
                                    ? `${pendingCount} items remaining`
                                    : !isCOD && remainingBuffer < 0
                                        ? "Amount exceeds limit"
                                        : `Confirm & Ship · €${finalTotal.toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}