import {
    formatEuro,
    calcNetFromGross,
    calcTaxFromGross,
    buildTaxBreakdown,
} from "../../lib/invoiceHelpers";
import { formatQuantity } from "../../lib/units";
import { useCompany } from "../../context/CompanyContext";
import "./Invoice.css";

/* ══════════════════════════════════════════════════════════
   Helper — عرض الكمية بشكل صحيح
   "1 × 200 g" بدل "1 g"
   ══════════════════════════════════════════════════════════ */
function formatItemQuantity(item) {
    const unit = String(item.weight_unit || "").toLowerCase();
    const isWeightUnit = ["kg", "g", "l", "ml"].includes(unit);

    const qty = item._displayQuantity ?? item.quantity;
    const weight = parseFloat(item.weight);

    // إذا كان المنتج بالوزن وله وزن-وحدة واضح → "1 × 200 g"
    if (isWeightUnit && weight > 0 && weight !== qty) {
        return `${qty} × ${weight} ${item.weight_unit}`;
    }

    return formatQuantity(qty, item.weight_unit);
}

/* ══════════════════════════════════════════════════════════
   Helper — تنسيق توقيت التوصيل
   "08:00:00" → "08:00–10:00 Uhr"
   ══════════════════════════════════════════════════════════ */
function formatDeliveryTime(timeStr) {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const start = `${String(h).padStart(2, "0")}:${m || "00"}`;
    const endHour = (parseInt(h, 10) + 2) % 24;
    const end = `${String(endHour).padStart(2, "0")}:${m || "00"}`;
    return `${start}–${end} Uhr`;
}

export default function Invoice({
    order,
    items = [],
    variant = "receipt",              // "preview" | "receipt"
    showTaxBreakdown = true,
    showAdjustmentNotice = false,
    showWarningBanner = false,
    showPaymentInfo = false,
    showBufferInfo = false,
    bufferAmount = 0,
    afterTotalsSlot = null,
    footerSlot = null,
}) {
    const { company } = useCompany();

    if (!order) return null;

    const shipping = parseFloat(order.shipping_cost || 0);
    const productsTotal = items.reduce(
        (sum, item) => sum + parseFloat(item.total_price || 0),
        0
    );
    const total = productsTotal + shipping;

    const taxBreakdown = showTaxBreakdown
        ? buildTaxBreakdown(items.filter((i) => !i._isRemoved))
        : [];

    const hasAdjustments = items.some((i) => i._isAdjusted);

    /* ✅ التسميات — Preview = Bestellübersicht، Receipt = Rechnung */
    const isPreview = variant === "preview";
    const docLabel = isPreview ? "Bestellübersicht" : "Rechnung";
    const totalLabel = isPreview ? "Zu zahlender Betrag" : "Gesamtbetrag";
    const authorizedTotal = total + bufferAmount;

    const orderDate = order.created_at ? new Date(order.created_at) : new Date();

    return (
        <div className="invoice-container">
            {/* ═══════════════════════════════════════════
                HEADER
            ═══════════════════════════════════════════ */}
            <div className="invoice-header">
                <div className="invoice-header-left">
                    <div className="invoice-brand">
                        <span className="material-symbols-outlined invoice-brand-icon">
                            storefront
                        </span>
                        <div>
                            <h2 className="invoice-brand-name">
                                {company?.brand_name || "Shopora"}
                            </h2>
                            <p className="invoice-brand-sub">Supermarkt</p>
                        </div>
                    </div>
                </div>
                <div className="invoice-header-right">
                    <div className="invoice-label">{docLabel}</div>
                    <div className="invoice-number">
                        {isPreview
                            ? `Bestellung #${order.order_number}`
                            : order.invoice_number
                                ? `Rechnung ${order.invoice_number}`
                                : `Bestellung #${order.order_number}`}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════
    META
═══════════════════════════════════════════ */}
            <div className="invoice-meta">
                {/* ✅ Bestellnummer — يظهر دائمًا */}
                <div className="invoice-meta-item">
                    <span className="invoice-meta-label">Bestellnummer:</span>
                    <span className="invoice-meta-value">#{order.order_number}</span>
                </div>

                {/* ✅ Rechnungsnummer — فقط في الفاتورة النهائية */}
                {!isPreview && order.invoice_number && (
                    <div className="invoice-meta-item invoice-meta-invoice">
                        <span className="invoice-meta-label">Rechnungsnummer:</span>
                        <span className="invoice-meta-value">
                            {order.invoice_number}
                        </span>
                    </div>
                )}

                {/* ✅ Rechnungsdatum — فقط في الفاتورة النهائية */}
                {!isPreview && order.invoiced_at && (
                    <div className="invoice-meta-item">
                        <span className="invoice-meta-label">Rechnungsdatum:</span>
                        <span className="invoice-meta-value">
                            {new Date(order.invoiced_at).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                )}

                {/* Datum — تاريخ الإنشاء (للـ Preview) */}
                {isPreview && (
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
                )}

                {/* Liefertermin */}
                {order.delivery_date && (
                    <div className="invoice-meta-item">
                        <span className="invoice-meta-label">Liefertermin:</span>
                        <span className="invoice-meta-value">
                            {new Date(`${order.delivery_date}T00:00:00`).toLocaleDateString(
                                "de-DE",
                                { day: "2-digit", month: "2-digit", year: "numeric" }
                            )}
                            {order.delivery_time && ` · ${formatDeliveryTime(order.delivery_time)}`}
                        </span>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════
                COMPANY LEGAL DATA (§14 UStG)
            ═══════════════════════════════════════════ */}
            {company && (
                <div className="invoice-company">
                    <div className="invoice-company-col">
                        <span className="invoice-company-label">Verkäufer</span>
                        <strong className="invoice-company-name">
                            {company.brand_name || "Shopora"}
                        </strong>
                        {company.owner_name && (
                            <span className="invoice-company-line">
                                Inhaber: {company.owner_name}
                            </span>
                        )}
                        {company.legal_form && (
                            <span className="invoice-company-line">
                                {company.legal_form}
                            </span>
                        )}
                        <span className="invoice-company-line">
                            {company.address}
                            {company.house_number && ` ${company.house_number}`}
                        </span>
                        <span className="invoice-company-line">
                            {company.postal_code} {company.city}
                        </span>
                        {company.country && (
                            <span className="invoice-company-line">
                                {company.country}
                            </span>
                        )}
                    </div>

                    <div className="invoice-company-col">
                        <span className="invoice-company-label">
                            Steuerliche Angaben
                        </span>
                        {company.vat_id && (
                            <span className="invoice-company-line">
                                USt-IdNr.: <strong>{company.vat_id}</strong>
                            </span>
                        )}
                        {company.register_number && (
                            <span className="invoice-company-line">
                                Handelsregister: {company.register_number}
                            </span>
                        )}
                        {company.contact_email && (
                            <span className="invoice-company-line">
                                E-Mail: {company.contact_email}
                            </span>
                        )}
                        {company.contact_phone && (
                            <span className="invoice-company-line">
                                Tel.: {company.contact_phone}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                CUSTOMER
            ═══════════════════════════════════════════ */}
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

            {/* ═══════════════════════════════════════════
                ITEMS TABLE
            ═══════════════════════════════════════════ */}
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
                            const netLine = calcNetFromGross(grossLine, rate);
                            const taxLine = calcTaxFromGross(grossLine, rate);
                            const displayQty = formatItemQuantity(item);

                            return (
                                <tr
                                    key={item.id}
                                    className={item._isRemoved ? "invoice-row-removed" : ""}
                                >
                                    <td className="inv-col-num">{index + 1}</td>

                                    <td className="inv-col-product">
                                        <span className="invoice-product-name">
                                            {item.product_name}
                                            {item._isAdjusted && !item._isRemoved && (
                                                <span className="invoice-adjusted-badge">
                                                    ⚖️
                                                </span>
                                            )}
                                        </span>
                                        {item.product_number && (
                                            <span className="invoice-product-number">
                                                Art.-Nr. {item.product_number}
                                            </span>
                                        )}
                                        {item._isRemoved && (
                                            <span className="invoice-removed-label">
                                                Nicht geliefert
                                            </span>
                                        )}
                                        {item.substitution_note && (
                                            <span className="invoice-sub-note">
                                                ⇄ {item.substitution_note}
                                            </span>
                                        )}
                                    </td>

                                    <td className="inv-col-qty">
                                        {item._isRemoved ? "—" : displayQty}
                                    </td>

                                    <td className="inv-col-net">
                                        {rate > 0 ? formatEuro(netLine) : "—"}
                                    </td>

                                    <td className="inv-col-rate">
                                        {rate > 0 ? (
                                            <span
                                                className={`invoice-tax-badge invoice-tax-badge-${rate}`}
                                            >
                                                {rate}%
                                            </span>
                                        ) : (
                                            <span className="invoice-tax-badge invoice-tax-badge-0">
                                                —
                                            </span>
                                        )}
                                    </td>

                                    <td className="inv-col-tax">
                                        {rate > 0 ? formatEuro(taxLine) : "—"}
                                    </td>

                                    <td className="inv-col-gross invoice-gross-line">
                                        {formatEuro(grossLine)}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* ═══════════════════════════════════════════
                ADJUSTMENT NOTICE
            ═══════════════════════════════════════════ */}
            {showAdjustmentNotice && hasAdjustments && (
                <div className="invoice-adjustment-notice">
                    <span className="material-symbols-outlined">info</span>
                    <span>
                        <strong>Hinweis:</strong> Einige Artikel wurden nach dem Einkauf
                        gewogen/angepasst. Die Endpreise entsprechen der tatsächlich
                        gelieferten Menge.
                    </span>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                TOTALS
            ═══════════════════════════════════════════ */}
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
                    <span>{totalLabel}</span>
                    <span>{formatEuro(total)}</span>
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                BUFFER INFO (preview only)
            ═══════════════════════════════════════════ */}
            {showBufferInfo && bufferAmount > 0 && (
                <div className="invoice-buffer-info">
                    <div className="invoice-buffer-header">
                        <span className="material-symbols-outlined">info</span>
                        <strong>Sicherheitsreserve (kein Aufpreis)</strong>
                    </div>
                    <div className="invoice-buffer-row">
                        <span>Vorübergehend reserviert</span>
                        <span>+{formatEuro(bufferAmount)}</span>
                    </div>
                    <div className="invoice-buffer-divider" />
                    <div className="invoice-buffer-row total">
                        <span>Autorisierter Gesamtbetrag</span>
                        <span>{formatEuro(authorizedTotal)}</span>
                    </div>
                </div>
            )}

            {afterTotalsSlot}

            {/* ═══════════════════════════════════════════
                TAX BREAKDOWN
            ═══════════════════════════════════════════ */}
            {showTaxBreakdown && taxBreakdown.length > 0 && (
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
            )}

            {footerSlot}

            {/* ═══════════════════════════════════════════
                WARNING BANNER (§312g)
            ═══════════════════════════════════════════ */}
            {showWarningBanner && (
                <div className="invoice-warning-banner">
                    <span className="material-symbols-outlined">warning</span>
                    <div>
                        <strong>Hinweis:</strong> Für schnell verderbliche Waren kann
                        gemäß <strong>§ 312g Abs. 2 Nr. 2 BGB</strong> kein Widerrufsrecht
                        bestehen. Die vollständige Widerrufsbelehrung finden Sie unter{" "}
                        <a href="/widerruf">Widerrufsbelehrung</a>.
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                PAYMENT INFO
            ═══════════════════════════════════════════ */}
            {showPaymentInfo && (
                <div className="invoice-payment">
                    <div className="invoice-payment-row">
                        <span className="invoice-payment-label">Zahlungsart:</span>
                        <span className="invoice-payment-value">
                            {order.payment_method === "card"
                                ? "💳 Kreditkarte"
                                : order.payment_method === "cod"
                                    ? "💵 Barzahlung bei Lieferung"
                                    : order.payment_method === "bank_transfer"
                                        ? "🏦 Banküberweisung"
                                        : order.payment_method
                                            ? `💳 ${order.payment_method}`
                                            : "⏳ Ausstehend"}
                        </span>
                    </div>
                    <div className="invoice-payment-row">
                        <span className="invoice-payment-label">Zahlungsstatus:</span>
                        <span
                            className={`invoice-payment-status invoice-payment-status-${order.payment_status || "pending"
                                }`}
                        >
                            {order.payment_status === "authorized"
                                ? "Autorisiert"
                                : order.payment_status === "paid" ||
                                    order.payment_status === "captured"
                                    ? "Bezahlt"
                                    : order.payment_status === "refunded"
                                        ? "Erstattet"
                                        : order.payment_status === "cod_pending"
                                            ? "Bei Lieferung"
                                            : "Ausstehend"}
                        </span>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════ */}
            <div className="invoice-footer">
                {isPreview
                    ? "Dies ist noch keine Rechnung. Die endgültige Rechnung erhalten Sie nach Abschluss der Lieferung."
                    : "Vielen Dank für Ihren Einkauf!"}
            </div>
        </div>
    );
}