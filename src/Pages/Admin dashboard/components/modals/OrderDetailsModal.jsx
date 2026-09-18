import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import "./OrderDetailsModal.css";
import {
  formatTotalWeight,
  formatQuantity,
  normalizeUnit,
  isWeightBased,
} from "../../../../lib/units";

export default function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
  onOpenShipModal,
}) {
  const [updating, setUpdating] = useState(false);

  // ============================================
  // ✅ useMemo قبل أي Early Return (قواعد React Hooks)
  // ============================================
  const sortedItems = useMemo(() => {
    if (!order?.order_items) return [];

    const priority = {
      pending: 0,
      scanned: 1,
      substituted: 2,
      removed: 3,
    };

    return [...order.order_items].sort((a, b) => {
      const aP = priority[a.status] ?? 4;
      const bP = priority[b.status] ?? 4;
      if (aP !== bP) return aP - bP;
      return (b.total_weight || 0) - (a.total_weight || 0);
    });
  }, [order?.order_items]);

  // ============================================
  // ✅ Early Return بعد كل الـ Hooks
  // ============================================
  if (!order) return null;

  // ============================================
  // الحسابات
  // ============================================
  const subtotal = sortedItems.reduce(
    (sum, item) => sum + parseFloat(item.total_price || 0),
    0
  );

  const totalWeight = sortedItems.reduce(
    (sum, item) => sum + parseFloat(item.total_weight || 0),
    0
  );

  const actualTotal = sortedItems.reduce((sum, item) => {
    if (item.actual_total != null) {
      return sum + parseFloat(item.actual_total);
    }
    return sum + parseFloat(item.total_price || 0);
  }, 0);

  const hasActualValues = sortedItems.some(
    (item) => item.actual_total != null || item.status !== "pending"
  );

  // ============================================
  // Status flow
  // ============================================
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
    if (onOpenShipModal) {
      onOpenShipModal(order);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { icon: "⏳", label: "Pending", class: "pending" },
      scanned: { icon: "✓", label: "OK", class: "scanned" },
      substituted: { icon: "⇄", label: "Sub.", class: "substituted" },
      removed: { icon: "✕", label: "Removed", class: "removed" },
    };
    return map[status] || { icon: "•", label: status, class: "default" };
  };

  // ============================================
  // حساب الأيام المتبقية للتسليم
  // ============================================
  const getDeliveryUrgency = () => {
    if (!order.delivery_date) return null;
    const deliveryDate = new Date(order.delivery_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (deliveryDate - today) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return { label: "⚠️ Überfällig!", class: "overdue" };
    if (diffDays === 0) return { label: "🔥 Heute!", class: "today" };
    if (diffDays === 1) return { label: "⚡ Morgen", class: "tomorrow" };
    if (diffDays <= 3)
      return { label: `📅 In ${diffDays} Tagen`, class: "soon" };
    return { label: `📅 In ${diffDays} Tagen`, class: "later" };
  };

  const urgency = getDeliveryUrgency();

  return (
    <div className="odm-overlay" onClick={onClose}>
      <div className="odm-modal" onClick={(e) => e.stopPropagation()}>
        {/* ============ HEADER ============ */}
        <div className="odm-header">
          <div className="odm-header-left">
            <span className="material-symbols-outlined odm-header-icon">
              receipt_long
            </span>
            <div className="odm-header-info">
              <h2>
                Bestellung
                <span className="odm-order-number">#{order.order_number}</span>
              </h2>
              <div className="odm-header-meta">
                <span className={`status-badge status-${order.status}`}>
                  {order.status}
                </span>
                {urgency && (
                  <span
                    className={`odm-urgency odm-urgency-${urgency.class}`}
                  >
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

        {/* ============ COMPACT INFO STRIP ============ */}
        <div className="odm-info-strip">
          <div className="odm-info-block">
            <span className="material-symbols-outlined">person</span>
            <div>
              <span className="odm-info-label">Kunde</span>
              <span className="odm-info-value">
                {order.customer_info?.first_name}{" "}
                {order.customer_info?.last_name}
              </span>
            </div>
          </div>

          <div className="odm-info-block">
            <span className="material-symbols-outlined">call</span>
            <div>
              <span className="odm-info-label">Telefon</span>
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
              <span className="odm-info-label">Adresse</span>
              <span className="odm-info-value">
                {order.shipping_address?.street}{" "}
                {order.shipping_address?.house_number},{" "}
                {order.shipping_address?.postal_code}{" "}
                {order.shipping_address?.city}
                {order.shipping_address?.floor && (
                  <span className="odm-info-sub">
                    {" "}
                    · Etage {order.shipping_address.floor}
                    {order.shipping_address.has_elevator ? " (Aufzug)" : ""}
                    {order.shipping_address.doorbell_name &&
                      ` · 🔔 ${order.shipping_address.doorbell_name}`}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="odm-info-block">
            <span className="material-symbols-outlined">event</span>
            <div>
              <span className="odm-info-label">Lieferung</span>
              <span className="odm-info-value">
                {order.delivery_date
                  ? new Date(order.delivery_date).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })
                  : "—"}
                {order.delivery_time && (
                  <span className="odm-info-sub">
                    {" "}
                    · {order.delivery_time}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="odm-info-block">
            <span className="material-symbols-outlined">weight</span>
            <div>
              <span className="odm-info-label">Gewicht</span>
              <span className="odm-info-value">
                {formatTotalWeight(totalWeight)}
              </span>
            </div>
          </div>
        </div>

        {/* ============ BODY ============ */}
        <div className="odm-body">
          {order.shipping_address?.notes && (
            <div className="odm-notes-banner">
              <span className="material-symbols-outlined">
                sticky_note_2
              </span>
              <div>
                <span className="odm-notes-label">Kundennotiz:</span>
                <span className="odm-notes-text">
                  {order.shipping_address.notes}
                </span>
              </div>
            </div>
          )}

          {/* ============ PRODUCTS ============ */}
          <div className="odm-products-section">
            <div className="odm-products-header">
              <div className="odm-products-title">
                <span className="material-symbols-outlined">
                  shopping_bag
                </span>
                <h3>Produkte</h3>
                <span className="odm-products-count">
                  {sortedItems.length}
                </span>
              </div>
              <span className="odm-products-hint">
                Nach Priorität sortiert
              </span>
            </div>

            <div className="odm-table-wrapper">
              <table className="odm-table">
                <thead>
                  <tr>
                    <th className="odm-th-id">Art.-Nr.</th>
                    <th className="odm-th-product">Produktname</th>
                    <th className="odm-th-qty">Menge</th>
                    <th className="odm-th-weight">Gewicht</th>
                    <th className="odm-th-price">Einzelpreis</th>
                    <th className="odm-th-total">Gesamt</th>
                    <th className="odm-th-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="odm-empty-row">
                        Keine Produkte gefunden
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((item) => {
                      const badge = getStatusBadge(item.status);

                      // ✅ منطق موحّد للوحدات
                      const weightBased = isWeightBased(item.weight_unit);
                      const unitLabel = normalizeUnit(item.weight_unit);

                      return (
                        <tr
                          key={item.id}
                          className={`odm-row-${badge.class}`}
                        >
                          <td>
                            <span className="odm-product-id">
                              #{item.product_number || "—"}
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

                          {/* ✅ Menge — يعرض "1.5 kg" / "500 g" / "3 Stk" */}
                          <td>
                            <span className="odm-qty-badge">
                              {formatQuantity(
                                item.quantity,
                                item.weight_unit
                              )}
                            </span>
                          </td>

                          {/* ✅ Gewicht — يعرض "1.5 kg" أو "—" */}
                          <td>
                            <span className="odm-weight-value">
                              {item.weight != null && item.weight !== ""
                                ? formatQuantity(
                                  item.weight,
                                  item.weight_unit
                                )
                                : "—"}
                            </span>
                          </td>

                          {/* ✅ Einzelpreis — يعرض "/kg" أو "/L" أو "/Stk" */}
                          <td>
                            <span className="odm-price-value">
                              €
                              {parseFloat(item.unit_price || 0).toFixed(2)}
                              {weightBased && (
                                <small className="odm-price-unit">
                                  /{unitLabel}
                                </small>
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="odm-total-value">
                              €
                              {parseFloat(item.total_price || 0).toFixed(2)}
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

          {/* ============ TOTALS ============ */}
          <div className="odm-totals-compact">
            <div className="odm-total-item">
              <span className="odm-total-label">Zwischensumme</span>
              <span className="odm-total-val">
                €{subtotal.toFixed(2)}
              </span>
            </div>
            <div className="odm-total-item">
              <span className="odm-total-label">Versand</span>
              <span className="odm-total-val">
                €{parseFloat(order.shipping_cost || 0).toFixed(2)}
              </span>
            </div>
            <div className="odm-total-item">
              <span className="odm-total-label">Etage</span>
              <span className="odm-total-val">
                €{parseFloat(order.floor_fee || 0).toFixed(2)}
              </span>
            </div>

            {/* ✅ MwSt. — العنوان صار عام بدون نسبة ثابتة */}
            <div className="odm-total-item">
              <span className="odm-total-label">MwSt.</span>
              <span className="odm-total-val">
                €{parseFloat(order.tax || 0).toFixed(2)}
              </span>
            </div>

            {hasActualValues && Math.abs(actualTotal - subtotal) > 0.01 && (
              <div className="odm-total-item odm-total-adjusted">
                <span className="odm-total-label">⚖️ Angepasst</span>
                <span className="odm-total-val">
                  €{actualTotal.toFixed(2)}
                </span>
              </div>
            )}
            <div className="odm-total-item odm-total-grand">
              <span className="odm-total-label">Gesamt</span>
              <span className="odm-total-val">
                €{parseFloat(order.total_price || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <div className="odm-footer">
          <div className="odm-footer-status-buttons">
            {canUpdateTo("confirmed") && (
              <button
                className="odm-btn odm-btn-confirm"
                onClick={() => handleStatusUpdate("confirmed")}
                disabled={updating}
              >
                <span className="material-symbols-outlined">
                  check_circle
                </span>
                Bestätigen
              </button>
            )}

            {canUpdateTo("shipped") && (
              <button
                className="odm-btn odm-btn-ship"
                onClick={handleShipClick}
                disabled={updating}
              >
                <span className="material-symbols-outlined">
                  local_shipping
                </span>
                Versand vorbereiten
              </button>
            )}

            {canUpdateTo("delivered") && (
              <button
                className="odm-btn odm-btn-deliver"
                onClick={() => handleStatusUpdate("delivered")}
                disabled={updating}
              >
                <span className="material-symbols-outlined">task_alt</span>
                Zugestellt
              </button>
            )}

            {canUpdateTo("cancelled") && (
              <button
                className="odm-btn odm-btn-cancel"
                onClick={() => handleStatusUpdate("cancelled")}
                disabled={updating}
              >
                <span className="material-symbols-outlined">cancel</span>
                Stornieren
              </button>
            )}

            {!canUpdateTo("confirmed") &&
              !canUpdateTo("shipped") &&
              !canUpdateTo("delivered") &&
              !canUpdateTo("cancelled") && (
                <span className="odm-final-status">
                  {order.status === "delivered"
                    ? "✅ Zugestellt"
                    : "❌ Storniert"}
                </span>
              )}
          </div>

          <button className="odm-btn odm-btn-close" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}