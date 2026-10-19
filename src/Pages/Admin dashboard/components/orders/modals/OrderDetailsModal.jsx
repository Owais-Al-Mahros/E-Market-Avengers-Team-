import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  formatTotalWeight,
  normalizeUnit,
  isWeightBased,
} from "../../../../../lib/units";
import {
  getItemStatusBadge,
  sortOrderItemsByPriority,
  canUpdateTo,
} from "../../../../../lib/orderStatus";
import "./OrderDetailsModal.css";

export default function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
  onOpenShipModal,
}) {
  const [updating, setUpdating] = useState(false);

  /* ═══════════════════════════════════════════
     Sorted Items (memoized)
     ═══════════════════════════════════════════ */
  const sortedItems = useMemo(() => {
    if (!order?.order_items) return [];
    return sortOrderItemsByPriority(order.order_items);
  }, [order?.order_items]);

  /* ═══════════════════════════════════════════
     Early Return
     ═══════════════════════════════════════════ */
  if (!order) return null;

  /* ═══════════════════════════════════════════
     Calculations
     ═══════════════════════════════════════════ */
  const isRemoved = (item) => item.status === "removed";

  const getEffectiveTotal = (item) => {
    if (item.actual_total != null && item.actual_total !== "") {
      return parseFloat(item.actual_total);
    }
    return parseFloat(item.total_price || 0);
  };

  const getEffectiveWeight = (item) => {
    if (
      item.actual_total_weight != null &&
      item.actual_total_weight !== ""
    ) {
      return parseFloat(item.actual_total_weight);
    }
    return parseFloat(item.total_weight || 0);
  };

  const subtotal = sortedItems
    .filter((item) => !isRemoved(item))
    .reduce((sum, item) => sum + getEffectiveTotal(item), 0);

  const totalWeight = sortedItems
    .filter((item) => !isRemoved(item))
    .reduce((sum, item) => sum + getEffectiveWeight(item), 0);

  const hasActualValues = sortedItems.some(
    (item) => item.status && item.status !== "pending",
  );

  const computedTax = sortedItems
    .filter((item) => !isRemoved(item))
    .reduce((sum, item) => {
      const brutto = getEffectiveTotal(item);
      const rate = parseFloat(item.tax_rate) || 0;
      if (rate <= 0 || brutto <= 0) return sum;
      return sum + (brutto - brutto / (1 + rate / 100));
    }, 0);

  const displayTax =
    parseFloat(order.tax) > 0 ? parseFloat(order.tax) : computedTax;

  /* ═══════════════════════════════════════════
     Handlers
     ═══════════════════════════════════════════ */
  const handleStatusUpdate = async (newStatus) => {
    if (updating) return;
    setUpdating(true);
    try {
      const result = await onUpdateStatus(order.id, newStatus);
      if (result.success) {
        toast.success(`✅ Status: ${newStatus}`);
        onClose();
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  const handleShipClick = () => {
    if (onOpenShipModal) onOpenShipModal(order);
  };

  /* ═══════════════════════════════════════════
     Delivery Info
     ═══════════════════════════════════════════ */
  const getDeliveryUrgency = () => {
    if (!order.delivery_date) return null;

    const deliveryDate = new Date(`${order.delivery_date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (deliveryDate - today) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return { label: "Overdue", class: "overdue" };
    if (diffDays === 0) return { label: "Today", class: "today" };
    if (diffDays === 1) return { label: "Tomorrow", class: "tomorrow" };
    if (diffDays <= 3) return { label: `In ${diffDays} days`, class: "soon" };
    return { label: `In ${diffDays} days`, class: "later" };
  };

  const urgency = getDeliveryUrgency();

  const deliveryDateFormatted = order.delivery_date
    ? new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : null;

  /* ═══════════════════════════════════════════
     Render
     ═══════════════════════════════════════════ */
  return (
    <div className="odm-overlay" onClick={onClose}>
      <div className="odm-modal" onClick={(e) => e.stopPropagation()}>
        {/* ═══ HEADER ═══ */}
        <div className="odm-header">
          <div className="odm-header-left">
            <span className="material-symbols-outlined odm-header-icon">
              receipt_long
            </span>
            <div className="odm-header-info">
              <h2>
                Order
                <span className="odm-order-number">
                  #{order.order_number}
                </span>
              </h2>
              <div className="odm-header-meta">
                <span className={`status-badge status-${order.status}`}>
                  {order.status}
                </span>
                {urgency && (
                  <span className={`odm-urgency odm-urgency-${urgency.class}`}>
                    {urgency.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="odm-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ═══ INFO STRIP ═══ */}
        <div className="odm-info-strip">
          <div className="odm-info-block">
            <span className="material-symbols-outlined">person</span>
            <div>
              <span className="odm-info-label">Customer</span>
              <span className="odm-info-value">
                {order.customer_info?.first_name}{" "}
                {order.customer_info?.last_name}
              </span>
            </div>
          </div>

          <div className="odm-info-block">
            <span className="material-symbols-outlined">call</span>
            <div>
              <span className="odm-info-label">Phone</span>
              <a
                href={`tel:${order.customer_info?.phone}`}
                className="odm-info-value odm-link"
              >
                {order.customer_info?.phone || "—"}
              </a>
            </div>
          </div>

          <div className="odm-info-block odm-info-wide">
            <span className="material-symbols-outlined">location_on</span>
            <div>
              <span className="odm-info-label">Address</span>
              <span className="odm-info-value">
                {order.shipping_address?.street}{" "}
                {order.shipping_address?.house_number},{" "}
                {order.shipping_address?.postal_code}{" "}
                {order.shipping_address?.city}
                {order.shipping_address?.floor && (
                  <span className="odm-info-sub">
                    {" "}
                    · Floor {order.shipping_address.floor}
                    {order.shipping_address.has_elevator
                      ? " (Elevator)"
                      : ""}
                    {order.shipping_address.doorbell_name &&
                      ` · 🔔 ${order.shipping_address.doorbell_name}`}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="odm-info-block">
            <span className="material-symbols-outlined">weight</span>
            <div>
              <span className="odm-info-label">Weight</span>
              <span className="odm-info-value">
                {formatTotalWeight(totalWeight)}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ ✅ PROMINENT DELIVERY BANNER ═══ */}
        {order.delivery_date && (
          <div
            className={`odm-delivery-banner odm-delivery-banner-${urgency?.class || "default"
              }`}
          >
            <div className="odm-delivery-banner-left">
              <span className="material-symbols-outlined odm-delivery-banner-icon">
                event
              </span>
              <div className="odm-delivery-banner-info">
                <span className="odm-delivery-banner-label">
                  Delivery Scheduled
                </span>
                <span className="odm-delivery-banner-date">
                  {deliveryDateFormatted}
                </span>
              </div>
            </div>

            {order.delivery_time && (
              <div className="odm-delivery-banner-time">
                <span className="material-symbols-outlined">alarm</span>
                <span>{order.delivery_time}</span>
              </div>
            )}

            {urgency && (
              <span
                className={`odm-delivery-banner-badge odm-delivery-banner-badge-${urgency.class}`}
              >
                {urgency.label}
              </span>
            )}
          </div>
        )}

        {/* ═══ BODY ═══ */}
        <div className="odm-body">
          {order.shipping_address?.notes && (
            <div className="odm-notes-banner">
              <span className="material-symbols-outlined">sticky_note_2</span>
              <div>
                <span className="odm-notes-label">Customer note:</span>
                <span className="odm-notes-text">
                  {order.shipping_address.notes}
                </span>
              </div>
            </div>
          )}

          {/* PRODUCTS */}
          <div className="odm-products-section">
            <div className="odm-products-header">
              <div className="odm-products-title">
                <span className="material-symbols-outlined">shopping_bag</span>
                <h3>Products</h3>
                <span className="odm-products-count">{sortedItems.length}</span>
              </div>
              <span className="odm-products-hint">Sorted by priority</span>
            </div>

            <div className="odm-table-wrapper">
              <table className="odm-table">
                <thead>
                  <tr>
                    <th className="odm-th-id">Art. No.</th>
                    <th className="odm-th-product">Product</th>
                    <th className="odm-th-qty">Qty</th>
                    <th className="odm-th-price">Unit Price</th>
                    <th className="odm-th-total">Total</th>
                    <th className="odm-th-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="odm-empty-row">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((item) => {
                      const badge = getItemStatusBadge(item.status);
                      const weightBased = isWeightBased(item.weight_unit);
                      const unitLabel = normalizeUnit(item.weight_unit);

                      const effectiveTotal = getEffectiveTotal(item);
                      const effectiveQty =
                        item.actual_quantity ?? item.quantity;

                      // Unit price (Brutto per piece)
                      const qtyNum = parseFloat(effectiveQty) || 1;
                      const unitPrice = effectiveTotal / qtyNum;

                      // Piece weight (actual > original)
                      const pieceWeight =
                        item.actual_piece_weight ??
                        item.weight ??
                        null;

                      return (
                        <tr key={item.id} className={`odm-row-${badge.class}`}>
                          <td>
                            <span className="odm-product-id">
                              #{item.product_number || item.products?.product_number || "—"}
                            </span>
                          </td>
                          <td>
                            <div className="odm-product-cell">
                              <span className="odm-product-name">
                                {item.product_name}
                              </span>
                              {item.substitution_note && (
                                <span className="odm-product-note">
                                  ⇄ {item.substitution_note}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Quantity — number only, no unit */}
                          <td>
                            <span className="odm-qty-badge">
                              {effectiveQty}
                            </span>
                          </td>

                          {/* Unit Price + Weight merged: "€0.37 / 200 g" */}
                          <td>
                            <span className="odm-price-value">
                              €{unitPrice.toFixed(2)}
                              {weightBased && pieceWeight && (
                                <span className="odm-price-weight">
                                  {" / "}
                                  {pieceWeight} {unitLabel}
                                </span>
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="odm-total-value">
                              €{effectiveTotal.toFixed(2)}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`odm-item-status odm-item-status-${badge.class}`}
                            >
                              <span className="odm-item-status-icon">
                                {badge.icon}
                              </span>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALS */}
          <div className="odm-totals-compact">
            <div className="odm-total-item">
              <span className="odm-total-label">
                Subtotal
                {hasActualValues && (
                  <span className="odm-total-badge">adjusted</span>
                )}
              </span>
              <span className="odm-total-val">€{subtotal.toFixed(2)}</span>
            </div>

            <div className="odm-total-item">
              <span className="odm-total-label">Shipping</span>
              <span className="odm-total-val">
                €{parseFloat(order.shipping_cost || 0).toFixed(2)}
              </span>
            </div>

            {parseFloat(order.floor_fee || 0) > 0 && (
              <div className="odm-total-item">
                <span className="odm-total-label">
                  Floor fee
                  <span className="odm-total-sub">
                    (included in shipping)
                  </span>
                </span>
                <span className="odm-total-val">
                  €{parseFloat(order.floor_fee || 0).toFixed(2)}
                </span>
              </div>
            )}

            {displayTax > 0 && (
              <div className="odm-total-item odm-total-tax">
                <span className="odm-total-label">
                  VAT
                  <span className="odm-total-sub">(included)</span>
                </span>
                <span className="odm-total-val">
                  €{displayTax.toFixed(2)}
                </span>
              </div>
            )}

            <div className="odm-total-item odm-total-grand">
              <span className="odm-total-label">Total</span>
              <span className="odm-total-val">
                €{parseFloat(order.total_price || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="odm-footer">
          <div className="odm-footer-status-buttons">
            {canUpdateTo(order.status, "confirmed") && (
              <button
                className="odm-btn odm-btn-confirm"
                onClick={() => handleStatusUpdate("confirmed")}
                disabled={updating}
              >
                <span className="material-symbols-outlined">
                  check_circle
                </span>
                Confirm
              </button>
            )}

            {canUpdateTo(order.status, "shipped") && (
              <button
                className="odm-btn odm-btn-ship"
                onClick={handleShipClick}
                disabled={updating}
              >
                <span className="material-symbols-outlined">
                  local_shipping
                </span>
                Prepare Shipment
              </button>
            )}

            {canUpdateTo(order.status, "delivered") && (
              <button
                className="odm-btn odm-btn-deliver"
                onClick={() => handleStatusUpdate("delivered")}
                disabled={updating}
              >
                <span className="material-symbols-outlined">task_alt</span>
                Delivered
              </button>
            )}

            {canUpdateTo(order.status, "cancelled") && (
              <button
                className="odm-btn odm-btn-cancel"
                onClick={() => handleStatusUpdate("cancelled")}
                disabled={updating}
              >
                <span className="material-symbols-outlined">cancel</span>
                Cancel
              </button>
            )}

            {order.status === "delivered" && (
              <span className="odm-final-status">✅ Delivered</span>
            )}

            {order.status === "cancelled" && (
              <span className="odm-final-status">❌ Cancelled</span>
            )}
          </div>

          <button className="odm-btn odm-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}