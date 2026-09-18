import {
    formatEuro,
    calcLineNet,
    calcLineTax,
    buildTaxBreakdown,
} from "../../../lib/invoiceHelpers";
import { formatQuantity, normalizeUnit } from "../../../lib/units";
import "./OrderDetailsView.css";

export default function OrderDetailsView({ order }) {
    if (!order) return null;

    const items = order.order_items || [];
    const shipping = parseFloat(order.shipping_cost || 0);
    const productsTotal = items.reduce(
        (sum, item) => sum + parseFloat(item.total_price || 0),
        0
    );
    const total = productsTotal + shipping;

    // ============================================
    // تفصيل الضريبة حسب النسبة
    // ============================================
    const taxBreakdown = buildTaxBreakdown(items);

    // ============================================
    // تنسيق التاريخ
    // ============================================
    const orderDate = order.created_at
        ? new Date(order.created_at)
        : new Date();

    return (
        <div className="invoice-container">
            {/* ============ HEADER — رأس الفاتورة ============ */}
            <div className="invoice-header">
                <div className="invoice-header-left">
                    <div className="invoice-brand">
                        <span className="material-symbols-outlined invoice-brand-icon">
                            storefront
                        </span>
                        <div>
                            <h2 className="invoice-brand-name">Shopora</h2>
                            <p className="invoice-brand-sub">Supermarkt</p>
                        </div>
                    </div>
                </div>
                <div className="invoice-header-right">
                    <div className="invoice-label">QUITTUNG</div>
                    <div className="invoice-number">#{order.order_number}</div>
                </div>
            </div>

            {/* ============ META — بيانات الطلب ============ */}
            <div className="invoice-meta">
                <div className="invoice-meta-item">
                    <span className="invoice-meta-label">Beleg-Nr.:</span>
                    <span className="invoice-meta-value">#{order.order_number}</span>
                </div>
                <div className="invoice-meta-item">
                    <span className="invoice-meta-label">Datum:</span>
                    <span className="invoice-meta-value">
                        {orderDate.toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                        })}{" "}
                        {orderDate.toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
                {order.delivery_date && (
                    <div className="invoice-meta-item">
                        <span className="invoice-meta-label">Lieferung:</span>
                        <span className="invoice-meta-value">
                            {new Date(order.delivery_date).toLocaleDateString("de-DE")}
                            {order.delivery_time && ` · ${order.delivery_time}`}
                        </span>
                    </div>
                )}
            </div>

            {/* ============ CUSTOMER ============ */}
            <div className="invoice-customer">
                <div className="invoice-customer-title">
                    <span className="material-symbols-outlined">person</span>
                    Kunde
                </div>
                <div className="invoice-customer-body">
                    {order.customer_info?.first_name} {order.customer_info?.last_name}
                    <br />
                    {order.customer_info?.email}
                    {order.customer_info?.phone && (
                        <>
                            <br />
                            {order.customer_info.phone}
                        </>
                    )}
                </div>
            </div>

            {/* ============ ITEMS — جدول المنتجات ============ */}
            <table className="invoice-table">
                <thead>
                    <tr>
                        <th className="inv-col-num">#</th>
                        <th className="inv-col-product">Produkt</th>
                        <th className="inv-col-qty">Menge</th>
                        <th className="inv-col-net">Netto</th>
                        <th className="inv-col-rate">MwSt.</th>
                        <th className="inv-col-tax">Steuer</th>
                        <th className="inv-col-gross">Brutto</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="invoice-empty">
                                Keine Produkte
                            </td>
                        </tr>
                    ) : (
                        items.map((item, index) => {
                            const rate = parseFloat(item.tax_rate) || 0;
                            const grossLine = parseFloat(item.total_price) || 0;
                            const netLine = calcLineNet(item);
                            const taxLine = calcLineTax(item);

                            return (
                                <tr key={item.id}>
                                    <td className="inv-col-num">{index + 1}</td>
                                    <td className="inv-col-product">
                                        <span className="invoice-product-name">
                                            {item.product_name}
                                        </span>
                                        {item.product_number && (
                                            <span className="invoice-product-number">
                                                Art.-Nr. {item.product_number}
                                            </span>
                                        )}
                                    </td>
                                    <td className="inv-col-qty">
                                        {formatQuantity(item.quantity, item.weight_unit)}
                                    </td>
                                    <td className="inv-col-net">{formatEuro(netLine)}</td>
                                    <td className="inv-col-rate">
                                        <span
                                            className={`invoice-tax-badge invoice-tax-badge-${rate}`}
                                        >
                                            {rate}%
                                        </span>
                                    </td>
                                    <td className="inv-col-tax">{formatEuro(taxLine)}</td>
                                    <td className="inv-col-gross invoice-gross-line">
                                        {formatEuro(grossLine)}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* ============ TOTALS ============ */}
            <div className="invoice-totals">
                <div className="invoice-total-row">
                    <span>Zwischensumme (Brutto)</span>
                    <span>{formatEuro(productsTotal)}</span>
                </div>
                <div className="invoice-total-row">
                    <span>Versand</span>
                    <span>{formatEuro(shipping)}</span>
                </div>
                <div className="invoice-total-row invoice-total-grand">
                    <span>Gesamtbetrag</span>
                    <span>{formatEuro(total)}</span>
                </div>
            </div>

            {/* ============ TAX BREAKDOWN — تفصيل الضريبة ============ */}
            <div className="invoice-tax-section">
                <div className="invoice-tax-title">
                    <span className="material-symbols-outlined">receipt</span>
                    MwSt. Aufschlüsselung
                </div>
                <div className="invoice-tax-grid">
                    {taxBreakdown.map((group) => (
                        <div key={group.rate} className="invoice-tax-card">
                            <div className="invoice-tax-header">
                                <span
                                    className={`invoice-tax-badge invoice-tax-badge-${group.rate}`}
                                >
                                    {group.rate}%
                                </span>
                                <span className="invoice-tax-category">
                                    {group.rate === 7
                                        ? "Ermäßigt (Lebensmittel)"
                                        : group.rate === 19
                                            ? "Regelsatz"
                                            : "Sonderfall"}
                                </span>
                            </div>
                            <div className="invoice-tax-details">
                                <div className="invoice-tax-detail-row">
                                    <span>Netto:</span>
                                    <span>{formatEuro(group.net)}</span>
                                </div>
                                <div className="invoice-tax-detail-row invoice-tax-detail-highlight">
                                    <span>MwSt. {group.rate}%:</span>
                                    <span>{formatEuro(group.tax)}</span>
                                </div>
                                <div className="invoice-tax-detail-row invoice-tax-detail-total">
                                    <span>Brutto:</span>
                                    <span>{formatEuro(group.gross)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="invoice-tax-note">
                    <span className="material-symbols-outlined">info</span>
                    <span>
                        Alle Preise sind Endpreise und enthalten die gesetzliche
                        Umsatzsteuer. Die Aufschlüsselung zeigt den Nettoanteil und die
                        enthaltene MwSt.
                    </span>
                </div>
            </div>

            {/* ============ WARNING — § 312g Abs. 2 Nr. 2 BGB ============ */}
            <div className="invoice-warning-banner">
                <span className="material-symbols-outlined">warning</span>
                <div>
                    <strong>Hinweis:</strong>{" "}
                    Frischeprodukte (Obst, Gemüse, Fleisch, Fisch) sind gemäß{" "}
                    <strong>§ 312g Abs. 2 Nr. 2 BGB</strong> vom Widerrufsrecht
                    ausgeschlossen.
                </div>
            </div>

            {/* ============ PAYMENT ============ */}
            <div className="invoice-payment">
                <div className="invoice-payment-row">
                    <span className="invoice-payment-label">Zahlungsart:</span>
                    <span className="invoice-payment-value">
                        {order.payment_method === "cod"
                            ? "💵 Barzahlung bei Lieferung"
                            : order.payment_method === "bank"
                                ? "🏦 Banküberweisung"
                                : "💳 Kartenzahlung"}
                    </span>
                </div>
                <div className="invoice-payment-row">
                    <span className="invoice-payment-label">Zahlungsstatus:</span>
                    <span
                        className={`invoice-payment-status invoice-payment-status-${order.payment_status}`}
                    >
                        {order.payment_status || "ausstehend"}
                    </span>
                </div>
            </div>

            {/* ============ FOOTER ============ */}
            <div className="invoice-footer">
                Vielen Dank für Ihren Einkauf!
            </div>
        </div>
    );
}