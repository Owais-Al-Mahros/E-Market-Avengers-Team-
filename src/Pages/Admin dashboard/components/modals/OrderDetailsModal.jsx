// =============================================
// 3. OrderDetailsModal.jsx (مع حساب subtotal وتحديث الحالة)
// =============================================
import { useState } from "react";
import toast from "react-hot-toast";
import "./OrderDetailsModal.css";

export default function OrderDetailsModal({ order, onClose, onUpdateStatus }) {
    const [updating, setUpdating] = useState(false);

    if (!order) return null;

    // ✅ حساب subtotal من مجموع total_price للمنتجات
    const subtotal = order.order_items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;

    // ✅ حساب الوزن الإجمالي
    const totalWeight = order.order_items?.reduce((sum, item) => sum + (item.total_weight || 0), 0) || 0;

    const handleStatusUpdate = async (newStatus) => {
        if (updating) return;
        setUpdating(true);
        try {
            const result = await onUpdateStatus(order.id, newStatus);
            if (result.success) {
                toast.success(`✅ Order status updated to "${newStatus}"`);
                onClose(); // إغلاق المودال بعد التحديث
            } else {
                toast.error(`Failed to update: ${result.error}`);
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setUpdating(false);
        }
    };

    // ✅ التحقق من إمكانية تغيير الحالة
    const canUpdateTo = (status) => {
        const flow = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["shipped", "cancelled"],
            shipped: ["delivered", "cancelled"],
            delivered: [],
            cancelled: [],
        };
        return flow[order.status]?.includes(status) || false;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* HEADER */}
                <div className="modal-header">
                    <h2>
                        📄 Order Details
                        <span className="modal-order-number">#{order.order_number}</span>
                    </h2>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* BODY */}
                <div className="modal-body">
                    {/* Customer Info */}
                    <div className="modal-section">
                        <h3>👤 Customer Information</h3>
                        <div className="modal-info-grid">
                            <div><span className="label">Name:</span> <span className="value">{order.customer_info?.first_name} {order.customer_info?.last_name}</span></div>
                            <div><span className="label">Phone:</span> <span className="value">{order.customer_info?.phone}</span></div>
                            <div><span className="label">Email:</span> <span className="value">{order.customer_info?.email}</span></div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="modal-section">
                        <h3>📍 Shipping Address</h3>
                        <div className="modal-info-grid">
                            <div><span className="label">Street:</span> <span className="value">{order.shipping_address?.street} {order.shipping_address?.house_number}</span></div>
                            <div><span className="label">City:</span> <span className="value">{order.shipping_address?.city}</span></div>
                            <div><span className="label">Postal Code:</span> <span className="value">{order.shipping_address?.postal_code}</span></div>
                            <div><span className="label">Floor:</span> <span className="value">{order.shipping_address?.floor}{order.shipping_address?.has_elevator ? " (Elevator)" : " (No Elevator)"}</span></div>
                            <div><span className="label">Doorbell:</span> <span className="value">{order.shipping_address?.doorbell_name}</span></div>
                            {order.shipping_address?.apartment && <div><span className="label">Apartment:</span> <span className="value">{order.shipping_address?.apartment}</span></div>}
                            {order.shipping_address?.notes && <div className="full-width"><span className="label">Notes:</span> <span className="value notes-text">{order.shipping_address?.notes}</span></div>}
                        </div>
                    </div>

                    {/* Delivery Schedule */}
                    <div className="modal-section">
                        <h3>🕒 Delivery Schedule</h3>
                        <div className="modal-info-grid">
                            <div><span className="label">Date:</span> <span className="value">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : "Not set"}</span></div>
                            <div><span className="label">Time:</span> <span className="value">{order.delivery_time || "Not set"}</span></div>
                            <div><span className="label">Status:</span> <span className={`status-badge status-${order.status}`}>{order.status}</span></div>
                            <div><span className="label">Total Weight:</span> <span className="value">{totalWeight.toFixed(1)} kg</span></div>
                        </div>
                    </div>

                    {/* ===== ORDER ITEMS ===== */}
                    <div className="modal-section">
                        <h3>🛒 Products Ordered</h3>
                        <div className="order-items-table-wrapper">
                            <table className="order-items-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.order_items && order.order_items.length > 0 ? (
                                        order.order_items.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.product_name || `Product #${item.product_id}`}</td>
                                                <td>{item.quantity}</td>
                                                <td>${item.unit_price?.toFixed(2)}</td>
                                                <td>${item.total_price?.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="empty-items">No products found for this order.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ===== STATUS UPDATE BUTTONS (داخل المودال) ===== */}
                    <div className="modal-section status-update-section">
                        <h3>📌 Update Order Status</h3>
                        <div className="status-update-buttons">
                            {canUpdateTo("confirmed") && (
                                <button
                                    className="btn-action btn-confirm"
                                    onClick={() => handleStatusUpdate("confirmed")}
                                    disabled={updating}
                                >
                                    ✅ Confirm
                                </button>
                            )}
                            {canUpdateTo("shipped") && (
                                <button
                                    className="btn-action btn-ship"
                                    onClick={() => handleStatusUpdate("shipped")}
                                    disabled={updating}
                                >
                                    📦 Ship
                                </button>
                            )}
                            {canUpdateTo("delivered") && (
                                <button
                                    className="btn-action btn-deliver"
                                    onClick={() => handleStatusUpdate("delivered")}
                                    disabled={updating}
                                >
                                    ✅ Deliver
                                </button>
                            )}
                            {canUpdateTo("cancelled") && (
                                <button
                                    className="btn-action btn-cancel"
                                    onClick={() => handleStatusUpdate("cancelled")}
                                    disabled={updating}
                                >
                                    ❌ Cancel
                                </button>
                            )}
                            {!canUpdateTo("confirmed") && !canUpdateTo("shipped") && !canUpdateTo("delivered") && !canUpdateTo("cancelled") && (
                                <span className="status-label final-status">
                                    {order.status === "delivered" ? "✅ Delivered" : "❌ Cancelled"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="modal-totals">
                        <div className="total-row"><span>Subtotal (Products)</span><span>${subtotal.toFixed(2)}</span></div>
                        <div className="total-row"><span>Shipping</span><span>${order.shipping_cost?.toFixed(2)}</span></div>
                        <div className="total-row"><span>Floor Fee</span><span>${order.floor_fee?.toFixed(2)}</span></div>
                        <div className="total-row"><span>Tax</span><span>${order.tax?.toFixed(2)}</span></div>
                        <div className="total-row grand-total"><span>Grand Total</span><span>${order.total_price?.toFixed(2)}</span></div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="modal-footer">
                    <button className="modal-close-btn-bottom" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}