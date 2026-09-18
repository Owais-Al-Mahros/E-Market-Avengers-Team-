import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import OrderDetailsModal from "./OrderDetailsModal";
import ShipOrderModal from "./ShipOrderModal";
import { sendOrderEmail } from "../../../../lib/sendEmail";
import "./OrdersTable.css";
import { updateBestSellers } from "../../../../lib/bestSellers";
import { decrementBestSellers } from "../../../../lib/bestSellers";
import { supabase } from "../../../../lib/supabase";
import { formatTotalWeight } from "../../../../lib/units";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
};

export default function OrdersTable({
  orders,
  status,
  onUpdateStatus,
  onRefresh,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shipOrderModal, setShipOrderModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // ============================================
  // Helpers
  // ============================================
  const getTotalWeight = (order) => {
    if (!order.order_items || order.order_items.length === 0) return 0;
    return order.order_items.reduce(
      (sum, item) => sum + (item.total_weight || 0),
      0
    );
  };

  const getTitle = () => {
    const titles = {
      pending: "⏳ Pending Orders",
      confirmed: "✅ Confirmed Orders",
      shipped: "📦 Shipped Orders",
      delivered: "🎉 Delivered Orders",
      cancelled: "❌ Cancelled Orders",
      search: "🔍 Suchergebnisse",
    };
    return titles[status] || "Orders";
  };

  // ============================================
  // Cancel handler
  // ============================================
  const cancelOrder = useCallback(
    async (order) => {
      const confirmed = window.confirm(
        `Cancel order ${order.order_number}?\n\nThe customer will be refunded if payment was made.`
      );
      if (!confirmed) return { success: false, cancelled: true };

      setProcessingId(order.id);
      const toastId = toast.loading("Cancelling order & processing refund...");

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/refund-payment`, {
          method: "POST",
          headers,
          body: JSON.stringify({ orderId: order.id }),
        });
        const refundResult = await res.json();

        if (!refundResult.success) {
          toast.error(refundResult.error || "Refund failed", { id: toastId });
          return { success: false, error: refundResult.error };
        }

        await onUpdateStatus(order.id, "cancelled");

        sendOrderEmail(order.id, "cancelled").catch((err) =>
          console.error("Cancellation email failed:", err)
        );

        if (refundResult.type === "refunded") {
          toast.success(
            `✅ Refunded €${refundResult.amount.toFixed(2)} to customer`,
            { id: toastId, duration: 5000 }
          );
        } else if (refundResult.type === "authorization_cancelled") {
          toast.success("✅ Order cancelled, payment hold released", {
            id: toastId,
          });
        } else {
          toast.success("✅ Order cancelled", { id: toastId });
        }

        onRefresh();
        return { success: true };
      } catch (err) {
        console.error("Cancel failed:", err);
        toast.error("Failed to cancel order", { id: toastId });
        return { success: false, error: err.message };
      } finally {
        setProcessingId(null);
      }
    },
    [onUpdateStatus, onRefresh]
  );

  // ============================================
  // Change status handler
  // ============================================
  const changeStatus = useCallback(
    async (orderId, newStatus) => {
      if (processingId) return { success: false, error: "Busy" };

      const order = orders.find((o) => o.id === orderId);
      if (!order) return { success: false, error: "Order not found" };

      if (newStatus === "cancelled") {
        return cancelOrder(order);
      }

      setProcessingId(orderId);
      const toastId = toast.loading("Updating order...");

      try {
        const result = await onUpdateStatus(orderId, newStatus);

        if (!result?.success) {
          toast.error(result?.error || "Failed to update order", {
            id: toastId,
          });
          return result;
        }

        if (newStatus === "confirmed" || newStatus === "delivered") {
          const sent = await sendOrderEmail(orderId, newStatus);
          toast.success(
            sent
              ? newStatus === "confirmed"
                ? "✅ Order confirmed & email sent"
                : "✅ Order delivered & email sent"
              : "✅ Status updated (email pending)",
            { id: toastId }
          );
        } else {
          toast.success("✅ Status updated", { id: toastId });
        }

        onRefresh();
        return { success: true };
      } catch (err) {
        console.error("Status update failed:", err);
        toast.error("Failed to update order", { id: toastId });
        return { success: false, error: err.message };
      } finally {
        setProcessingId(null);
      }
    },
    [orders, processingId, onUpdateStatus, onRefresh, cancelOrder]
  );

  // ============================================
  // Modal handlers
  // ============================================
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  // ============================================
  // Empty State
  // ============================================
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
          <p>
            {status === "search"
              ? "Keine Bestellung gefunden."
              : `No ${status} orders found.`}
          </p>
        </div>
      </div>
    );
  }

  const isBusy = !!processingId;

  return (
    <div className="orders-container">
      {/* HEADER */}
      <div className="orders-header">
        <h2>{getTitle()}</h2>
        <button className="btn-refresh" onClick={onRefresh} disabled={isBusy}>
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
              <tr
                key={order.id}
                className={`order-row order-row-${order.status}`}
              >
                {/* Order # */}
                <td>
                  <button
                    className="order-number-btn"
                    onClick={() => openOrderDetails(order)}
                  >
                    <span className="order-number">{order.order_number}</span>
                  </button>
                </td>

                {/* Customer */}
                <td>
                  <div className="customer-info">
                    <span className="customer-name">
                      {order.customer_info?.first_name}{" "}
                      {order.customer_info?.last_name}
                    </span>
                    <span className="customer-email">
                      {order.customer_info?.email}
                    </span>
                    <span className="customer-phone">
                      📞 {order.customer_info?.phone}
                    </span>
                  </div>
                </td>

                {/* Address */}
                <td>
                  <div className="address-info">
                    <span>
                      {order.shipping_address?.street}{" "}
                      {order.shipping_address?.house_number}
                    </span>
                    <span>
                      {order.shipping_address?.postal_code}{" "}
                      {order.shipping_address?.city}
                    </span>
                    <span className="address-detail">
                      🏢 Floor {order.shipping_address?.floor}
                      {order.shipping_address?.has_elevator && " (Elevator)"}
                    </span>
                    {order.shipping_address?.doorbell_name && (
                      <span className="address-detail">
                        🔔 {order.shipping_address?.doorbell_name}
                      </span>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td>
                  <div className="order-date">
                    {new Date(order.created_at).toLocaleDateString()}
                    <small>
                      {new Date(order.created_at).toLocaleTimeString()}
                    </small>
                  </div>
                </td>

                {/* Weight */}
                <td className="order-weight">
                  {formatTotalWeight(getTotalWeight(order))}
                </td>

                {/* Total */}
                <td className="order-total">
                  €{parseFloat(order.total_price || 0).toFixed(2)}
                </td>

                {/* Status Badge */}
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </td>

                {/* Actions */}
                <td>
                  <div className="actions-cell">
                    {["pending", "search"].includes(status) &&
                      order.status === "pending" && (
                        <>
                          <button
                            className="btn-action btn-confirm"
                            onClick={() =>
                              changeStatus(order.id, "confirmed")
                            }
                            disabled={isBusy}
                          >
                            ✅ Confirm
                          </button>
                          <button
                            className="btn-action btn-cancel"
                            onClick={() =>
                              changeStatus(order.id, "cancelled")
                            }
                            disabled={isBusy}
                          >
                            ❌ Cancel
                          </button>
                        </>
                      )}

                    {["confirmed", "search"].includes(status) &&
                      order.status === "confirmed" && (
                        <>
                          <button
                            className="btn-action btn-ship"
                            onClick={() => setShipOrderModal(order)}
                            disabled={isBusy}
                          >
                            📦 Ship
                          </button>
                          <button
                            className="btn-action btn-undo"
                            onClick={() => changeStatus(order.id, "pending")}
                            disabled={isBusy}
                          >
                            ↩️ Undo
                          </button>
                          <button
                            className="btn-action btn-cancel"
                            onClick={() =>
                              changeStatus(order.id, "cancelled")
                            }
                            disabled={isBusy}
                          >
                            ❌ Cancel
                          </button>
                        </>
                      )}

                    {["shipped", "search"].includes(status) &&
                      order.status === "shipped" && (
                        <>
                          <button
                            className="btn-action btn-deliver"
                            onClick={async () => {
                              const result = await changeStatus(
                                order.id,
                                "delivered"
                              );
                              if (result?.success) {
                                await updateBestSellers(order.id);
                              }
                            }}
                            disabled={isBusy}
                          >
                            ✅ Deliver
                          </button>
                          <button
                            className="btn-action btn-undo"
                            onClick={() =>
                              changeStatus(order.id, "confirmed")
                            }
                            disabled={isBusy}
                          >
                            ↩️ Undo
                          </button>
                          <button
                            className="btn-action btn-cancel"
                            onClick={() =>
                              changeStatus(order.id, "cancelled")
                            }
                            disabled={isBusy}
                          >
                            ❌ Cancel
                          </button>
                        </>
                      )}

                    {["delivered", "search"].includes(status) &&
                      order.status === "delivered" && (
                        <button
                          className="btn-action btn-undo"
                          onClick={async () => {
                            const result = await changeStatus(
                              order.id,
                              "shipped"
                            );
                            if (result?.success) {
                              await decrementBestSellers(order.id);
                            }
                          }}
                          disabled={isBusy}
                        >
                          ↩️ Undo
                        </button>
                      )}

                    {["cancelled", "search"].includes(status) &&
                      order.status === "cancelled" && (
                        <button
                          className="btn-action btn-undo"
                          onClick={() =>
                            changeStatus(order.id, "confirmed")
                          }
                          disabled={isBusy}
                        >
                          ↩️ Undo
                        </button>
                      )}

                    {isBusy && processingId === order.id && (
                      <span
                        className="row-processing"
                        title="Processing..."
                      >
                        ⏳
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === Modals === */}
      {showModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={closeModal}
          onUpdateStatus={changeStatus}
          onOpenShipModal={(order) => {
            closeModal();
            setShipOrderModal(order);
          }}
        />
      )}

      {shipOrderModal && (
        <ShipOrderModal
          order={shipOrderModal}
          onClose={() => setShipOrderModal(null)}
          onSuccess={() => {
            setShipOrderModal(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}