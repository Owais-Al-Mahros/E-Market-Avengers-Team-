import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import "./ShopperDashboard.css";

export default function ShopperDashboard() {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [capturing, setCapturing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // ===== جلب الطلبات =====
    const fetchActiveOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .in("status", ["pending", "authorized", "confirmed"])
            .order("created_at", { ascending: false });

        if (error) toast.error("Failed to load orders");
        else setOrders(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchActiveOrders();
    }, []);

    // ===== فتح طلب =====
    const openOrder = async (order) => {
        setSelectedOrder(order);
        setEditingId(null);

        const { data, error } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

        if (error) {
            toast.error("Failed to load items");
            return;
        }

        // ✅ تعيين الحالة الافتراضية للمنتجات
        const normalized = (data || []).map((item) => ({
            ...item,
            status: item.status || "pending",
            actual_weight: item.actual_weight || "",
        }));

        setItems(normalized);
    };

    // ===== حساب الإجمالي =====
    const calculateTotal = (item) => {
        const weight = parseFloat(item.actual_weight) || 0;
        const price = parseFloat(item.unit_price) || 0;
        if (weight > 0) return weight * price;
        return (item.quantity || 0) * price;
    };

    // ===== تحديث الوزن =====
    const updateWeight = (id, value) => {
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, actual_weight: value } : i))
        );
    };

    // ===== تغيير الحالة =====
    const changeStatus = async (item, newStatus) => {
        let updateData = { status: newStatus };

        if (newStatus === "scanned") {
            const total = calculateTotal(item);
            updateData = {
                ...updateData,
                actual_weight: parseFloat(item.actual_weight) || null,
                actual_unit_price: item.unit_price,
                actual_total: total,
                price_difference: total - parseFloat(item.total_price || 0),
                scanned_at: new Date().toISOString(),
            };
        }

        if (newStatus === "removed") {
            updateData = {
                ...updateData,
                actual_weight: null,
                actual_total: 0,
                price_difference: -parseFloat(item.total_price || 0),
            };
        }

        if (newStatus === "pending") {
            updateData = {
                ...updateData,
                actual_weight: "",
                actual_total: null,
                price_difference: null,
                scanned_at: null,
            };
        }

        const { error } = await supabase
            .from("order_items")
            .update(updateData)
            .eq("id", item.id);

        if (error) {
            toast.error("Failed to update");
            return;
        }

        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, ...updateData } : i))
        );
        setEditingId(null);

        if (newStatus === "scanned") toast.success("✓ Item confirmed");
        if (newStatus === "removed") toast.success("Marked as unavailable");
        if (newStatus === "pending") toast.success("Item restored");
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
    const authorizedMax = parseFloat(selectedOrder?.authorized_amount || 0);
    const remainingBuffer = authorizedMax - actualTotal;
    const allHandled = items.every((i) => i.status !== "pending");

    // ===== إتمام التسوق =====
    const finishShopping = async () => {
        if (!allHandled) {
            toast.error("Please confirm all items first");
            return;
        }
        if (remainingBuffer < 0) {
            toast.error("Amount exceeds authorized limit");
            return;
        }
        if (!window.confirm(`Charge €${actualTotal.toFixed(2)} from customer?`))
            return;

        setCapturing(true);
        try {
            await supabase
                .from("orders")
                .update({ total_price: actualTotal, status: "confirmed" })
                .eq("id", selectedOrder.id);

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-payment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({ orderId: selectedOrder.id }),
                }
            );

            const result = await response.json();

            if (result.success) {
                toast.success(`✅ €${result.finalAmount.toFixed(2)} charged`);
                setSelectedOrder(null);
                fetchActiveOrders();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to capture");
        } finally {
            setCapturing(false);
        }
    };

    // ============================================
    // 🎯 شاشة قائمة الطلبات
    // ============================================
    if (!selectedOrder) {
        return (
            <div className="sd-page">
                <div className="sd-list-header">
                    <h2>🛒 Pick Orders</h2>
                    <p>Select an order to start shopping</p>
                </div>

                {loading ? (
                    <div className="sd-empty">Loading...</div>
                ) : orders.length === 0 ? (
                    <div className="sd-empty">
                        <span className="material-symbols-outlined">inbox</span>
                        <p>No active orders</p>
                    </div>
                ) : (
                    <div className="sd-order-list">
                        {orders.map((order) => (
                            <button
                                key={order.id}
                                className="sd-order-item"
                                onClick={() => openOrder(order)}
                            >
                                <div className="sd-order-left">
                                    <span className="sd-order-num">{order.order_number}</span>
                                    <span className="sd-order-cust">
                                        {order.customer_info?.first_name}{" "}
                                        {order.customer_info?.last_name}
                                    </span>
                                </div>
                                <div className="sd-order-right">
                                    <span className="sd-order-amt">
                                        €{parseFloat(order.total_price || 0).toFixed(2)}
                                    </span>
                                    <span className="material-symbols-outlined">
                                        chevron_right
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ============================================
    // 🎯 شاشة الفاتورة
    // ============================================
    const customer = selectedOrder.customer_info || {};
    const address = selectedOrder.shipping_address || {};

    return (
        <div className="sd-page">
            {/* Header */}
            <button className="sd-back" onClick={() => setSelectedOrder(null)}>
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Orders
            </button>

            {/* Customer Info Card */}
            <div className="sd-customer-card">
                <div className="sd-customer-header">
                    <span className="material-symbols-outlined">receipt_long</span>
                    <h2>{selectedOrder.order_number}</h2>
                </div>
                <div className="sd-customer-info">
                    <div className="sd-customer-row">
                        <span>👤</span>
                        <span>
                            {customer.first_name} {customer.last_name}
                        </span>
                    </div>
                    {customer.phone && (
                        <div className="sd-customer-row">
                            <span>📞</span>
                            <span>{customer.phone}</span>
                        </div>
                    )}
                    {address.street && (
                        <div className="sd-customer-row">
                            <span>📍</span>
                            <span>
                                {address.street} {address.house_number}, {address.postal_code}{" "}
                                {address.city}
                                {address.floor && ` · Floor ${address.floor}`}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Items */}
            <div className="sd-items-header">
                <h3>📋 Invoice Items</h3>
                <span className="sd-items-count">{items.length} items</span>
            </div>

            <div className="sd-items">
                {items.map((item, idx) => {
                    const isKg = !item.weight_unit || item.weight_unit === "kg";
                    const calc = calculateTotal(item);
                    const isPending = item.status === "pending" || !item.status;
                    const isScanned = item.status === "scanned";
                    const isRemoved = item.status === "removed";
                    const isEditing = editingId === item.id;
                    const showInput = isPending || isEditing;

                    return (
                        <div
                            key={item.id}
                            className={`sd-item ${isScanned ? "is-scanned" : ""
                                } ${isRemoved ? "is-removed" : ""}`}
                        >
                            {/* Item Header */}
                            <div className="sd-item-head">
                                <span className="sd-item-num">{idx + 1}</span>
                                <div className="sd-item-name">{item.product_name}</div>

                                {/* Status Badge */}
                                {isScanned && <span className="sd-badge ok">✓ Scanned</span>}
                                {isRemoved && <span className="sd-badge no">🚫 Unavailable</span>}
                                {isPending && <span className="sd-badge pending">Pending</span>}
                            </div>

                            {/* Requested Info */}
                            <div className="sd-item-requested">
                                <span>
                                    Requested: <strong>{item.quantity}</strong>
                                    {isKg && item.weight ? ` × ${item.weight} kg` : ""}
                                </span>
                                <span>
                                    Price: <strong>€{parseFloat(item.unit_price).toFixed(2)}</strong>
                                    {isKg ? "/kg" : ""}
                                </span>
                            </div>

                            {/* ===== Input Mode (Pending or Editing) ===== */}
                            {showInput && (
                                <div className="sd-item-edit">
                                    <div className="sd-input-row">
                                        <div className="sd-input-wrap">
                                            <input
                                                type="number"
                                                step="0.001"
                                                inputMode="decimal"
                                                placeholder="0.000"
                                                value={item.actual_weight || ""}
                                                onChange={(e) => updateWeight(item.id, e.target.value)}
                                            />
                                            <span className="sd-unit">{isKg ? "kg" : "pcs"}</span>
                                        </div>
                                        <div className="sd-calc">
                                            <span>Total</span>
                                            <strong>€{calc.toFixed(2)}</strong>
                                        </div>
                                    </div>

                                    <div className="sd-item-actions">
                                        <button
                                            className="sd-btn-confirm"
                                            onClick={() => changeStatus(item, "scanned")}
                                            disabled={!item.actual_weight}
                                        >
                                            <span className="material-symbols-outlined">check</span>
                                            Confirm
                                        </button>
                                        <button
                                            className="sd-btn-unavailable"
                                            onClick={() => changeStatus(item, "removed")}
                                        >
                                            <span className="material-symbols-outlined">block</span>
                                            Not Available
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ===== Final Mode (Scanned or Removed) ===== */}
                            {!showInput && (
                                <div className="sd-item-final">
                                    {isScanned && (
                                        <>
                                            <div className="sd-item-result">
                                                <span className="sd-item-weight">
                                                    {item.actual_weight} {isKg ? "kg" : "pcs"}
                                                </span>
                                                <strong className="sd-item-total">
                                                    €{parseFloat(item.actual_total).toFixed(2)}
                                                </strong>
                                            </div>
                                            <div className="sd-item-actions">
                                                <button
                                                    className="sd-btn-edit"
                                                    onClick={() => setEditingId(item.id)}
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                    Edit
                                                </button>
                                                <button
                                                    className="sd-btn-unavailable"
                                                    onClick={() => changeStatus(item, "removed")}
                                                >
                                                    <span className="material-symbols-outlined">block</span>
                                                    Not Available
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {isRemoved && (
                                        <>
                                            <div className="sd-item-result">
                                                <span className="sd-item-removed-text">
                                                    Not available in store
                                                </span>
                                                <strong className="sd-item-total-zero">€0.00</strong>
                                            </div>
                                            <div className="sd-item-actions">
                                                <button
                                                    className="sd-btn-restore"
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

            {/* Sticky Summary */}
            <div className="sd-summary">
                <div className="sd-summary-rows">
                    <div className="sd-summary-row">
                        <span>Estimated</span>
                        <span>€{estimatedTotal.toFixed(2)}</span>
                    </div>
                    <div className="sd-summary-row actual">
                        <span>Actual</span>
                        <span>€{actualTotal.toFixed(2)}</span>
                    </div>
                    <div className="sd-summary-row">
                        <span>Buffer Remaining</span>
                        <span className={remainingBuffer >= 0 ? "ok" : "bad"}>
                            €{remainingBuffer.toFixed(2)}
                        </span>
                    </div>
                </div>

                <button
                    className="sd-finish"
                    onClick={finishShopping}
                    disabled={!allHandled || capturing}
                >
                    {capturing
                        ? "Processing..."
                        : allHandled
                            ? `🛒 CHARGE €${actualTotal.toFixed(2)}`
                            : `${items.filter((i) => i.status === "pending").length} items remaining`}
                </button>
            </div>
        </div>
    );
}