import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import ShipOrderModal from "../../../../components/order/ShipOrderModal";
import { processRefund, sendOrderEmail } from "../../../../api/orders";
import { updateBestSellers, decrementBestSellers } from "../../../../lib/bestSellers";
import { formatTotalWeight } from "../../../../lib/units";
import {
  getDeliveryUrgency,
  formatDeliveryDate,
  sortByDeliveryUrgency,
} from "../../../../lib/orderStatus";
import "./OrdersTable.css";
import AssignDriverModal from "./modals/AssignDriverModal";
import { assignDriverToOrder } from "../../../../api/drivers";

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
  const [assignDriverOrder, setAssignDriverOrder] = useState(null);
  const [assigningDriver, setAssigningDriver] = useState(false);

  /* ═══════════════════════════════════════════
     Helpers
     ═══════════════════════════════════════════ */
  const getTotalWeight = (order) => {
    if (!order.order_items?.length) return 0;
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

  const sortedOrders = useMemo(
    () => sortByDeliveryUrgency(orders),
    [orders]
  );

  /* ═══════════════════════════════════════════
     Cancel Order
     ═══════════════════════════════════════════ */
  const cancelOrder = useCallback(
    async (order) => {
      const confirmed = window.confirm(
        `Cancel order ${order.order_number}?\n\nThe customer will be refunded if payment was made.`
      );
      if (!confirmed) return { success: false, cancelled: true };

      setProcessingId(order.id);
      const toastId = toast.loading("Cancelling order & processing refund...");

      try {
        const refundResult = await processRefund(order.id);

        if (!refundResult.success) {
          toast.error(refundResult.error || "Refund failed", {
            id: toastId,
          });
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

  const handleAssignDriver = async (driverId) => {
    if (!assignDriverOrder) return;
    setAssigningDriver(true);

    const toastId = toast.loading("Fahrer wird zugewiesen...");

    try {
      // 1. أسند السائق
      const assignRes = await assignDriverToOrder(assignDriverOrder.id, driverId);
      if (!assignRes.success) throw new Error(assignRes.error);

      // 2. غيّر الحالة إلى confirmed
      const statusRes = await onUpdateStatus(assignDriverOrder.id, "confirmed");
      if (!statusRes?.success) throw new Error(statusRes?.error || "Status fehlgeschlagen");

      // 3. أرسل إيميل التأكيد
      await sendOrderEmail(assignDriverOrder.id, "confirmed").catch(() => { });

      toast.success("✅ Fahrer zugewiesen & Bestellung bestätigt", { id: toastId });
      setAssignDriverOrder(null);
      onRefresh();
    } catch (err) {
      toast.error(err.message || "Fehler", { id: toastId });
    } finally {
      setAssigningDriver(false);
    }
  };
  /* ═══════════════════════════════════════════
     Change Status
     ═══════════════════════════════════════════ */
  const changeStatus = useCallback(
    async (orderId, newStatus) => {
      if (processingId) return { success: false, error: "Busy" };

      const order = orders.find((o) => o.id === orderId);
      if (!order) return { success: false, error: "Order not found" };

      if (newStatus === "cancelled") return cancelOrder(order);

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

  /* ═══════════════════════════════════════════
     Modal handlers
     ═══════════════════════════════════════════ */
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  /* ═══════════════════════════════════════════
     Empty State
     ═══════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════
     Render
     ═══════════════════════════════════════════ */
  return (
    <div className="orders-container">
      {/* HEADER */}
      <div className="orders-header">
        <h2>{getTitle()}</h2>
        <button
          className="btn-refresh"
          onClick={onRefresh}
          disabled={isBusy}
        >
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
              {/* <th>🚗 Fahrer</th> */}
              <th className="th-delivery">🚚 Lieferung</th>
              <th>Weight</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((order) => {
              const urgency = getDeliveryUrgency(order);

              return (
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
                      <span className="order-number">
                        {order.order_number}
                      </span>
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
                        {order.shipping_address?.has_elevator &&
                          " (Elevator)"}
                      </span>
                      {order.shipping_address?.doorbell_name && (
                        <span className="address-detail">
                          🔔 {order.shipping_address.doorbell_name}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* <td>
                    {order.driver ? (
                      <div className="driver-cell">
                        <div className="driver-cell-head">
                          <span className="material-symbols-outlined">person</span>
                          <strong>{order.driver.name || "Fahrer"}</strong>
                        </div>
                        {order.driver.phone ? (
                          <a
                            href={`tel:${order.driver.phone}`}
                            className="driver-phone-btn"
                            title={`Anrufen: ${order.driver.phone}`}
                          >
                            <span className="material-symbols-outlined">call</span>
                            {order.driver.phone}
                          </a>
                        ) : (
                          <span className="driver-phone-missing">Kein Telefon</span>
                        )}
                      </div>
                    ) : (
                      <span className="driver-unassigned">
                        <span className="material-symbols-outlined">person_off</span>
                        Nicht zugewiesen
                      </span>
                    )}
                  </td> */}
                  {/* Delivery */}
                  <td className="td-delivery">
                    <div className="delivery-info">
                      <div className="delivery-date">
                        <span className="material-symbols-outlined">
                          event
                        </span>
                        <span className="delivery-date-value">
                          {formatDeliveryDate(order.delivery_date)}
                        </span>
                      </div>

                      {order.delivery_time && (
                        <div className="delivery-time">
                          <span className="material-symbols-outlined">
                            schedule
                          </span>
                          <span>{order.delivery_time}</span>
                        </div>
                      )}

                      {urgency && (
                        <span
                          className={`delivery-badge delivery-badge-${urgency.class}`}
                        >
                          {urgency.label}
                        </span>
                      )}
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

                  {/* Status */}
                  <td>
                    <span
                      className={`status-badge status-${order.status}`}
                    >
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
                              // onClick={() => setAssignDriverOrder(order)}  // ← جديد: افتح Modal
                              onClick={() =>
                                changeStatus(order.id, "Confirm")
                              }
                              dis
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
                              onClick={() =>
                                changeStatus(order.id, "pending")
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
              );
            })}
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
      {/* {assignDriverOrder && (
        <AssignDriverModal
          order={assignDriverOrder}
          onClose={() => setAssignDriverOrder(null)}
          onConfirm={handleAssignDriver}
          isConfirming={assigningDriver}
        />
      )} */}

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