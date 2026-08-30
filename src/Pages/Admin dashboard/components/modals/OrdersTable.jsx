// src/Pages/Admin dashboard/components/OrdersTable.jsx
import { useState } from "react";
import OrderDetailsModal from "./OrderDetailsModal";
import "./OrdersTable.css";

export default function OrdersTable({ orders, status, onUpdateStatus, onRefresh }) {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };
    const handleStatusUpdate = async (orderId, newStatus) => {
        const result = await onUpdateStatus(orderId, newStatus);
        if (result.success) {
            onRefresh(); // ✅ تحديث القائمة الحالية
        }
    };
    // حساب الوزن الإجمالي
    const getTotalWeight = (order) => {
        if (!order.order_items || order.order_items.length === 0) return 0;
        return order.order_items.reduce((sum, item) => sum + (item.total_weight || 0), 0);
    };

    // عنوان الصفحة حسب الحالة
    const getTitle = () => {
        const titles = {
            pending: "⏳ Pending Orders",
            confirmed: "✅ Confirmed Orders",
            shipped: "📦 Shipped Orders",
            delivered: "🎉 Delivered Orders",
            cancelled: "❌ Cancelled Orders",
        };
        return titles[status] || "Orders";
    };

    if (orders.length === 0) {
        return (
            <div className="orders-container">
                <div className="orders-header">
                    <h2>{getTitle()}</h2>
                    <button className="btn-refresh" onClick={onRefresh}>
                        <span className="material-symbols-outlined">refresh</span> Refresh
                    </button>
                </div>
                <div className="empty-state">
                    <span className="material-symbols-outlined">inbox</span>
                    <p>No {status} orders found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-container">
            {/* HEADER */}
            <div className="orders-header">
                <h2>{getTitle()}</h2>
                <button className="btn-refresh" onClick={onRefresh}>
                    <span className="material-symbols-outlined">refresh</span> Refresh
                </button>
            </div>

            {/* TABLE */}
            <div className="orders-table-wrapper">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Address</th>
                            <th>Date</th>
                            <th>Weight</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className={`order-row order-row-${order.status}`}>
                                <td>
                                    <button className="order-number-btn" onClick={() => openOrderDetails(order)}>
                                        <span className="order-number">{order.order_number}</span>
                                    </button>
                                </td>
                                <td>
                                    <div className="customer-info">
                                        <span className="customer-name">
                                            {order.customer_info?.first_name} {order.customer_info?.last_name}
                                        </span>
                                        <span className="customer-email">{order.customer_info?.email}</span>
                                        <span className="customer-phone">📞 {order.customer_info?.phone}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="address-info">
                                        <span>{order.shipping_address?.street} {order.shipping_address?.house_number}</span>
                                        <span>{order.shipping_address?.postal_code} {order.shipping_address?.city}</span>
                                        <span className="address-detail">
                                            🏢 Floor {order.shipping_address?.floor}
                                            {order.shipping_address?.has_elevator && " (Elevator)"}
                                        </span>
                                        {order.shipping_address?.doorbell_name && (
                                            <span className="address-detail">🔔 {order.shipping_address?.doorbell_name}</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="order-date">
                                        {new Date(order.created_at).toLocaleDateString()}
                                        <small>{new Date(order.created_at).toLocaleTimeString()}</small>
                                    </div>
                                </td>
                                <td className="order-weight">{getTotalWeight(order).toFixed(1)} kg</td>
                                <td className="order-total">${order.total_price?.toFixed(2)}</td>
                                <td>
                                    <span className={`status-badge status-${order.status}`}>{order.status}</span>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        {status === "pending" && (
                                            <>
                                                <button className="btn-action btn-confirm" onClick={() => handleStatusUpdate(order.id, "confirmed")}>
                                                    ✅ Confirm
                                                </button>
                                                <button className="btn-action btn-cancel" onClick={() => handleStatusUpdate(order.id, "cancelled")}>
                                                    ❌ Cancel
                                                </button>
                                            </>
                                        )}
                                        {status === "confirmed" && (
                                            <>
                                                <button className="btn-action btn-ship" onClick={() => handleStatusUpdate(order.id, "shipped")}>
                                                    📦 Ship
                                                </button>
                                                <button className="btn-action btn-undo" onClick={() => handleStatusUpdate(order.id, "pending")}>
                                                    ↩️ Undo
                                                </button>
                                                <button className="btn-action btn-cancel" onClick={() => handleStatusUpdate(order.id, "cancelled")}>
                                                    ❌ Cancel
                                                </button>
                                            </>

                                        )}
                                        {status === "shipped" && (
                                            <>
                                                <button className="btn-action btn-deliver" onClick={() => handleStatusUpdate(order.id, "delivered")}>
                                                    ✅ Deliver
                                                </button>
                                                <button className="btn-action btn-undo" onClick={() => handleStatusUpdate(order.id, "confirmed")}>
                                                    ↩️ Undo
                                                </button>
                                                <button className="btn-action btn-cancel" onClick={() => handleStatusUpdate(order.id, "cancelled")}>
                                                    ❌ Cancel
                                                </button>
                                            </>
                                        )}
                                        {status === "delivered" && <>
                                            <button className="btn-action btn-undo" onClick={() => handleStatusUpdate(order.id, "shipped")}>
                                                ↩️ Undo
                                            </button>
                                        </>}
                                        {status === "cancelled" && <>
                                            <button className="btn-action btn-undo" onClick={() => handleStatusUpdate(order.id, "confirmed")}>
                                                ↩️ Undo
                                            </button>
                                        </>}

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={closeModal} onUpdateStatus={handleStatusUpdate} />
            )}
        </div>
    );
}