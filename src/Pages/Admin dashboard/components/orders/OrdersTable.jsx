import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import html2pdf from "html2pdf.js";
import toast from "react-hot-toast";
import OrderDetailsModal from "./modals/OrderDetailsModal";
import ShipOrderModal from "../../../../components/order/ShipOrderModal";
import Invoice from "../../../../components/invoice/Invoice";
import { processRefund, sendOrderEmail } from "../../../../api/orders";
import { updateBestSellers, decrementBestSellers } from "../../../../lib/bestSellers";
import { formatTotalWeight } from "../../../../lib/units";
import { useLocalStorage } from "../../../../hooks/useLocalStorage";
import { getDeliveryUrgency, formatDeliveryDate, sortByDeliveryUrgency } from "../../../../lib/orderStatus";
import "./OrdersTable.css";
import AssignDriverModal from "./modals/AssignDriverModal";
import { assignDriverToOrder } from "../../../../api/drivers";

export default function OrdersTable({ orders, status, onUpdateStatus, onRefresh }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shipOrderModal, setShipOrderModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [assignDriverOrder, setAssignDriverOrder] = useState(null);
  const [assigningDriver, setAssigningDriver] = useState(false);

  // ✅ حالات فلترة التاريخ
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [datePreset, setDatePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const dateMenuRef = useRef(null);

  const [downloadedInvoices, setDownloadedInvoices] = useLocalStorage("downloaded_invoices", {});
  const [invoiceSnapshot, setInvoiceSnapshot] = useState(null);
  const [invoiceToDownload, setInvoiceToDownload] = useState(null);

  // ✅ إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setShowDateMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ═══════════════════════════════════════════
     Helpers
     ═══════════════════════════════════════════ */
  const getTotalWeight = (order) => {
    if (!order.order_items?.length) return 0;
    return order.order_items.reduce((sum, item) => sum + (item.total_weight || 0), 0);
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

  // ✅ منطق الفلترة
  const filteredAndSortedOrders = useMemo(() => {
    let result = orders;

    if (datePreset !== "all") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (datePreset === "today") {
        result = result.filter(o => new Date(o.created_at) >= now);
      } else if (datePreset === "yesterday") {
        const start = new Date(now);
        start.setDate(start.getDate() - 1);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        result = result.filter(o => {
          const d = new Date(o.created_at);
          return d >= start && d <= end;
        });
      } else if (datePreset === "7days") {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        result = result.filter(o => new Date(o.created_at) >= start);
      } else if (datePreset === "30days") {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        result = result.filter(o => new Date(o.created_at) >= start);
      } else if (datePreset === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        result = result.filter(o => new Date(o.created_at) >= start);
      } else if (datePreset === "custom") {
        if (dateFrom) {
          const start = new Date(dateFrom);
          start.setHours(0, 0, 0, 0);
          result = result.filter(o => new Date(o.created_at) >= start);
        }
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          result = result.filter(o => new Date(o.created_at) <= end);
        }
      }
    }

    return sortByDeliveryUrgency(result);
  }, [orders, datePreset, dateFrom, dateTo]);

  const getFilterLabel = () => {
    if (datePreset === "all") return "Datum filtern";
    if (datePreset === "today") return "Heute";
    if (datePreset === "yesterday") return "Gestern";
    if (datePreset === "7days") return "Letzte 7 Tage";
    if (datePreset === "30days") return "Letzte 30 Tage";
    if (datePreset === "month") return "Dieser Monat";
    if (datePreset === "custom") return "Zeitraum";
    return "Datum";
  };

  const clearFilter = () => {
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
    setShowDateMenu(false);
  };

  /* ═══════════════════════════════════════════
     Download Invoice & Cancel Order Logic (نفس الكود السابق)
     ═══════════════════════════════════════════ */
  const handleDownloadInvoice = async (order) => {
    const loadId = toast.loading("Rechnung wird geladen...");
    const fetchSnapshot = () => supabase.from("invoices").select("snapshot").eq("order_id", order.id).maybeSingle();

    let { data } = await fetchSnapshot();
    if (!data) {
      const { error } = await supabase.rpc("ensure_invoice", { p_order_id: order.id });
      if (error) {
        toast.error("Rechnung konnte nicht erstellt werden.", { id: loadId });
        return;
      }
      ({ data } = await fetchSnapshot());
    }
    if (!data) {
      toast.error("Rechnung nicht gefunden.", { id: loadId });
      return;
    }
    toast.dismiss(loadId);

    setInvoiceSnapshot(data.snapshot);
    setInvoiceToDownload(order);

    setTimeout(() => {
      const element = document.getElementById("invoice-pdf-download");
      if (!element) {
        toast.error("Rechnung konnte nicht geladen werden.");
        setInvoiceToDownload(null);
        setInvoiceSnapshot(null);
        return;
      }

      const toastId = toast.loading("PDF wird erstellt...");
      const invoiceNo = data.snapshot.meta.invoice_number || order.order_number;

      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Rechnung_${invoiceNo}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, // ✅ لا تضع أي إعدادات pagebreak هنا
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true }
      };

      html2pdf().set(opt).from(element).save()
        .then(() => toast.success("Rechnung erfolgreich heruntergeladen!", { id: toastId }))
        .catch((err) => {
          console.error("PDF Error:", err);
          toast.error("Fehler beim Erstellen der PDF.", { id: toastId });
        })
        .finally(() => {
          setInvoiceToDownload(null);
          setInvoiceSnapshot(null);
        });
    }, 300);
  };

  const cancelOrder = useCallback(async (order) => {
    const confirmed = window.confirm(`Cancel order ${order.order_number}?\n\nThe customer will be refunded if payment was made.`);
    if (!confirmed) return { success: false, cancelled: true };

    setProcessingId(order.id);
    const toastId = toast.loading("Cancelling order & processing refund...");

    try {
      const refundResult = await processRefund(order.id);
      if (!refundResult.success) {
        toast.error(refundResult.error || "Refund failed", { id: toastId });
        return { success: false, error: refundResult.error };
      }
      await onUpdateStatus(order.id, "cancelled");
      toast.success("✅ Order cancelled", { id: toastId });
      onRefresh();
      return { success: true };
    } catch (err) {
      console.error("Cancel failed:", err);
      toast.error("Failed to cancel order", { id: toastId });
      return { success: false, error: err.message };
    } finally {
      setProcessingId(null);
    }
  }, [onUpdateStatus, onRefresh]);

  const handleAssignDriver = async (driverId) => {
    if (!assignDriverOrder) return;
    setAssigningDriver(true);
    const toastId = toast.loading("Fahrer wird zugewiesen...");

    try {
      const assignRes = await assignDriverToOrder(assignDriverOrder.id, driverId);
      if (!assignRes.success) throw new Error(assignRes.error);

      const statusRes = await onUpdateStatus(assignDriverOrder.id, "confirmed");
      if (!statusRes?.success) throw new Error(statusRes?.error || "Status fehlgeschlagen");

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

  const changeStatus = useCallback(async (orderId, newStatus) => {
    if (processingId) return { success: false, error: "Busy" };
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: "Order not found" };
    if (newStatus === "cancelled") return cancelOrder(order);

    setProcessingId(orderId);
    const toastId = toast.loading("Updating order...");

    try {
      const result = await onUpdateStatus(orderId, newStatus);
      if (!result?.success) {
        toast.error(result?.error || "Failed to update order", { id: toastId });
        return result;
      }

      if (newStatus === "confirmed" || newStatus === "delivered") {
        const sent = await sendOrderEmail(orderId, newStatus);
        toast.success(sent ? "✅ Status updated & email sent" : "✅ Status updated", { id: toastId });
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
  }, [orders, processingId, onUpdateStatus, onRefresh, cancelOrder]);

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const isBusy = !!processingId;

  return (
    <div className="orders-container">
      {invoiceToDownload && invoiceSnapshot && createPortal(
          <div style={{ position: 'fixed', top: 0, left: 0, width: '800px', zIndex: -9999, opacity: 0.01, pointerEvents: 'none' }}>
          <Invoice snapshot={invoiceSnapshot} showWarnings={false} />
        </div>,
        document.body
      )}

      {/* HEADER */}
      <div className="orders-header">
        <h2>{getTitle()}</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* ✅ زر فلترة التاريخ الاحترافي */}
          <div className="date-filter-container" ref={dateMenuRef}>
            <button 
              className={`btn-date-filter ${datePreset !== 'all' ? 'active' : ''}`}
              onClick={() => setShowDateMenu(!showDateMenu)}
            >
              <span className="material-symbols-outlined">calendar_month</span>
              {getFilterLabel()}
              {datePreset !== 'all' && (
                <span className="material-symbols-outlined btn-date-clear" onClick={(e) => { e.stopPropagation(); clearFilter(); }}>close</span>
              )}
            </button>

            {/* القائمة المنسدلة */}
            {showDateMenu && (
              <div className="date-dropdown-menu">
                <div className="date-preset-list">
                  <button onClick={() => { setDatePreset("all"); setShowDateMenu(false); }} className={datePreset === 'all' ? 'active' : ''}>Alle anzeigen</button>
                  <button onClick={() => { setDatePreset("today"); setShowDateMenu(false); }} className={datePreset === 'today' ? 'active' : ''}>Heute</button>
                  <button onClick={() => { setDatePreset("yesterday"); setShowDateMenu(false); }} className={datePreset === 'yesterday' ? 'active' : ''}>Gestern</button>
                  <button onClick={() => { setDatePreset("7days"); setShowDateMenu(false); }} className={datePreset === '7days' ? 'active' : ''}>Letzte 7 Tage</button>
                  <button onClick={() => { setDatePreset("30days"); setShowDateMenu(false); }} className={datePreset === '30days' ? 'active' : ''}>Letzte 30 Tage</button>
                  <button onClick={() => { setDatePreset("month"); setShowDateMenu(false); }} className={datePreset === 'month' ? 'active' : ''}>Dieser Monat</button>
                </div>
                <div className="date-custom-range">
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Benutzerdefiniert</span>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDatePreset('custom'); }} />
                  <span style={{ textAlign: 'center', fontSize: '12px' }}>bis</span>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDatePreset('custom'); }} />
                </div>
              </div>
            )}
          </div>

          <button className="btn-refresh" onClick={onRefresh} disabled={isBusy}>
            <span className="material-symbols-outlined">refresh</span> Refresh
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="orders-table-wrapper">
        {filteredAndSortedOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <span className="material-symbols-outlined">inbox</span>
            <p>{status === "search" ? "Keine Bestellung gefunden." : "Keine Bestellungen im ausgewählten Zeitraum."}</p>
          </div>
        ) : (
          <table className="orders-table">
            {/* نفس محتوى الجدول السابق */}
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Address</th>
                <th>🚗 Fahrer</th>
                <th className="th-delivery">🚚 Lieferung</th>
                <th>Weight</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedOrders.map((order) => {
                const urgency = getDeliveryUrgency(order);
                return (
                  <tr key={order.id} className={`order-row order-row-${order.status}`}>
                    <td><button className="order-number-btn" onClick={() => openOrderDetails(order)}><span className="order-number">{order.order_number}</span></button></td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{order.customer_info?.first_name} {order.customer_info?.last_name}</span>
                        <span className="customer-email">{order.customer_info?.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="address-info">
                        <span>{order.shipping_address?.street} {order.shipping_address?.house_number}</span>
                        <span>{order.shipping_address?.postal_code} {order.shipping_address?.city}</span>
                      </div>
                    </td>
                    <td>
                      {order.driver ? (
                        <div className="driver-cell">
                          <strong>{order.driver.name || "Fahrer"}</strong>
                        </div>
                      ) : (
                        <span className="driver-unassigned">Nicht zugewiesen</span>
                      )}
                    </td>
                    <td className="td-delivery">
                      <div className="delivery-info">
                        <div className="delivery-date"><span className="delivery-date-value">{formatDeliveryDate(order.delivery_date)}</span></div>
                        {urgency && <span className={`delivery-badge delivery-badge-${urgency.class}`}>{urgency.label}</span>}
                      </div>
                    </td>
                    <td className="order-weight">{formatTotalWeight(getTotalWeight(order))}</td>
                    <td className="order-total">
                    €{(parseFloat(order.total_price) || 0).toFixed(2)}
                  </td>
                    <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                    <td>
                      <div className="actions-cell">
                        {order.status === "pending" && (
                          <>
                            <button className="btn-action btn-confirm" onClick={() => setAssignDriverOrder(order)} disabled={isBusy}>✅ Confirm</button>
                            <button className="btn-action btn-cancel" onClick={() => changeStatus(order.id, "cancelled")} disabled={isBusy}>❌ Cancel</button>
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <>
                            <button className="btn-action btn-ship" onClick={() => setShipOrderModal(order)} disabled={isBusy}>📦 Ship</button>
                            <button className="btn-action btn-cancel" onClick={() => changeStatus(order.id, "cancelled")} disabled={isBusy}>❌ Cancel</button>
                          </>
                        )}
                        {order.status === "shipped" && (
                          <button className="btn-action btn-deliver" onClick={async () => {
                            const result = await changeStatus(order.id, "delivered");
                            if (result?.success) await updateBestSellers(order.id);
                          }} disabled={isBusy}>✅ Deliver</button>
                        )}
                        {order.status === "delivered" && (
                          <button className={`btn-action ${downloadedInvoices[order.id] ? "btn-invoice-downloaded" : "btn-invoice"}`} onClick={() => handleDownloadInvoice(order)} disabled={isBusy}>
                            {downloadedInvoices[order.id] ? "✅ PDF" : "📄 Rechnung"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={closeModal} onUpdateStatus={changeStatus} onOpenShipModal={(order) => { closeModal(); setShipOrderModal(order); }} />}
      {assignDriverOrder && <AssignDriverModal order={assignDriverOrder} onClose={() => setAssignDriverOrder(null)} onConfirm={handleAssignDriver} isConfirming={assigningDriver} />}
      {shipOrderModal && <ShipOrderModal order={shipOrderModal} onClose={() => setShipOrderModal(null)} onSuccess={() => { setShipOrderModal(null); onRefresh(); }} />}
    </div>
  );
}