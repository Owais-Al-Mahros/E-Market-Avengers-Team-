import { useCompany } from "../../context/CompanyContext";
import "./Invoice.css";

/* ══════════════════════════════════════════════════════════
   🧮 German Number Formatters
   ══════════════════════════════════════════════════════════ */
const fmt = (n, decimals = 2) => {
    const num = parseFloat(n) || 0;
    return num
        .toFixed(decimals)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const fmtEur = (n) => `${fmt(n, 2)} €`;
const fmtWeight = (n) => fmt(n, 3);
const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

function getCalcLine(item) {
    const unitRaw = String(item.weight_unit || "").toLowerCase();
    const isWeightUnit = ["kg", "g", "l", "ml"].includes(unitRaw);
    const qty =
        parseFloat(item._displayQuantity) || parseFloat(item.quantity) || 0;
    const total = parseFloat(item.total_price) || 0;
    if (qty <= 0 || total <= 0) return "";

    if (isWeightUnit) {
        let dq = qty,
            du = item.weight_unit,
            pu = total / qty;
        if (unitRaw === "g") {
            dq = qty / 1000;
            du = "kg";
            pu *= 1000;
        } else if (unitRaw === "ml") {
            dq = qty / 1000;
            du = "L";
            pu *= 1000;
        }
        return `${fmtWeight(dq)} ${du} × ${fmt(pu)} €/${du}`;
    }
    return `${qty} Stk × ${fmt(total / qty)} €`;
}

/* ══════════════════════════════════════════════════════════
   🧾 INVOICE — Formale Rechnung (§14 UStG)
   Only for DELIVERED orders
   ══════════════════════════════════════════════════════════ */
export default function Invoice({ order, items = [] }) {
    const { company } = useCompany();
    if (!order) return null;

    const shipping = parseFloat(order.shipping_cost || 0);
    const productsTotal = items
        .filter((i) => !i._isRemoved)
        .reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
    const grandTotal = productsTotal + shipping;

    /* ═══ Tax breakdown ═══ */
    const taxGroups = {};
    items
        .filter((i) => !i._isRemoved)
        .forEach((item) => {
            const rate = parseFloat(item.tax_rate) || 0;
            const gross = parseFloat(item.total_price) || 0;
            const net = rate > 0 ? gross / (1 + rate / 100) : gross;
            const tax = gross - net;
            const key = String(rate);
            if (!taxGroups[key]) {
                taxGroups[key] = { rate, net: 0, tax: 0, gross: 0 };
            }
            taxGroups[key].net += net;
            taxGroups[key].tax += tax;
            taxGroups[key].gross += gross;
        });

    const taxRows = Object.values(taxGroups).sort((a, b) => a.rate - b.rate);
    const totalNet = taxRows.reduce((s, r) => s + r.net, 0);
    const totalTax = taxRows.reduce((s, r) => s + r.tax, 0);

    /* ═══ Metadata ═══ */
    const orderDate = order.created_at ? new Date(order.created_at) : new Date();
    const deliveryDate = order.delivered_at || order.updated_at;
    const invoiceNumber =
        order.invoice_number ||
        `RE-${orderDate.getFullYear()}-${String(order.id).slice(-6)}`;
    const invoiceDate = order.invoiced_at || deliveryDate || orderDate;

    const customer = order.customer_info || {};
    const address = order.shipping_address || {};

    return (
        <div className="rechnung-container" id="invoice-pdf-download">
            {/* ═══ HEADER ═══ */}
            <div className="rechnung-header">
                <div className="rechnung-header-left">
                    <div className="rechnung-brand">
                        {company?.brand_name || "Shopora"}
                    </div>
                    <div className="rechnung-brand-sub">
                        {company?.legal_form || "GmbH"}
                    </div>
                </div>
                <div className="rechnung-header-right">
                    <div className="rechnung-title">RECHNUNG</div>
                    <div className="rechnung-number">Nr. {invoiceNumber}</div>
                </div>
            </div>

            {/* ═══ COMPANY LEGAL DATA ═══ */}
            <div className="rechnung-company">
                <div>
                    <div className="rechnung-company-label">Verkäufer</div>
                    <div className="rechnung-company-name">
                        {company?.brand_name}
                    </div>
                    <div className="rechnung-company-line">
                        {company?.owner_name}
                    </div>
                    <div className="rechnung-company-line">
                        {company?.address}
                        {company?.house_number && ` ${company.house_number}`}
                    </div>
                    <div className="rechnung-company-line">
                        {company?.postal_code} {company?.city}
                    </div>
                    <div className="rechnung-company-line">
                        {company?.country || "Deutschland"}
                    </div>
                </div>
                <div>
                    <div className="rechnung-company-label">
                        Steuerliche Angaben
                    </div>
                    {company?.vat_id && (
                        <div className="rechnung-company-line">
                            USt-IdNr.: <strong>{company.vat_id}</strong>
                        </div>
                    )}
                    {company?.register_number && (
                        <div className="rechnung-company-line">
                            HR: {company.register_number}
                        </div>
                    )}
                    {company?.contact_email && (
                        <div className="rechnung-company-line">
                            {company.contact_email}
                        </div>
                    )}
                    {company?.contact_phone && (
                        <div className="rechnung-company-line">
                            Tel.: {company.contact_phone}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ CUSTOMER + META ═══ */}
            <div className="rechnung-meta-section">
                <div className="rechnung-customer">
                    <div className="rechnung-section-label">
                        Rechnungsempfänger
                    </div>
                    <div className="rechnung-customer-name">
                        {customer.first_name} {customer.last_name}
                    </div>
                    <div className="rechnung-customer-line">
                        {address.street} {address.house_number}
                    </div>
                    <div className="rechnung-customer-line">
                        {address.postal_code} {address.city}
                    </div>
                    <div className="rechnung-customer-line rechnung-muted">
                        {customer.email}
                    </div>
                </div>

                <div className="rechnung-dates">
                    <div className="rechnung-date-row">
                        <span>Rechnungsnummer:</span>
                        <strong>{invoiceNumber}</strong>
                    </div>
                    <div className="rechnung-date-row">
                        <span>Rechnungsdatum:</span>
                        <strong>{fmtDate(invoiceDate)}</strong>
                    </div>
                    {order.delivery_date && (
                        <div className="rechnung-date-row">
                            <span>Lieferdatum:</span>
                            <strong>
                                {fmtDate(`${order.delivery_date}T00:00:00`)}
                                {order.delivery_time &&
                                    ` · ${order.delivery_time.slice(0, 5)}`}
                            </strong>
                        </div>
                    )}
                    <div className="rechnung-date-row">
                        <span>Bestellnummer:</span>
                        <strong>#{order.order_number}</strong>
                    </div>
                </div>
            </div>

            {/* ═══ ITEMS TABLE ═══ */}
            <table className="rechnung-table">
                <thead>
                    <tr>
                        <th className="rc-col-num">Pos.</th>
                        <th className="rc-col-desc">Bezeichnung</th>
                        <th className="rc-col-qty">Menge</th>
                        <th className="rc-col-net">Netto</th>
                        <th className="rc-col-rate">MwSt.</th>
                        <th className="rc-col-tax">Steuer</th>
                        <th className="rc-col-gross">Brutto</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="rc-empty">
                                Keine Positionen
                            </td>
                        </tr>
                    ) : (
                        items.map((item, idx) => {
                            const rate = parseFloat(item.tax_rate) || 0;
                            const gross = parseFloat(item.total_price) || 0;
                            const net =
                                rate > 0 ? gross / (1 + rate / 100) : gross;
                            const tax = gross - net;
                            const calcLine = getCalcLine(item);

                            return (
                                <tr
                                    key={item.id}
                                    className={
                                        item._isRemoved ? "rc-row-removed" : ""
                                    }
                                >
                                    <td className="rc-col-num">{idx + 1}</td>
                                    <td className="rc-col-desc">
                                        <div className="rc-product-name">
                                            {item.product_name}
                                            {item.substitution_note && (
                                                <span className="rc-sub-note">
                                                    {" "}
                                                    (Ersatz)
                                                </span>
                                            )}
                                        </div>
                                        {calcLine && (
                                            <div className="rc-product-calc">
                                                {calcLine}
                                            </div>
                                        )}
                                        {item._isRemoved && (
                                            <div className="rc-removed-note">
                                                Nicht geliefert
                                            </div>
                                        )}
                                    </td>
                                    <td className="rc-col-qty">
                                        {item._displayQuantity ??
                                            item.quantity}
                                    </td>
                                    <td className="rc-col-net">
                                        {rate > 0 ? fmtEur(net) : "—"}
                                    </td>
                                    <td className="rc-col-rate">
                                        {rate > 0 ? `${rate}%` : "—"}
                                    </td>
                                    <td className="rc-col-tax">
                                        {rate > 0 ? fmtEur(tax) : "—"}
                                    </td>
                                    <td className="rc-col-gross rc-strong">
                                        {fmtEur(gross)}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* ═══ TOTALS ═══ */}
            <div className="rechnung-totals">
                <div className="rc-total-row">
                    <span>Zwischensumme (Netto)</span>
                    <span>{fmtEur(totalNet)}</span>
                </div>
                {taxRows.map((row) => (
                    <div key={row.rate} className="rc-total-row rc-total-tax">
                        <span>zzgl. MwSt. {row.rate}%</span>
                        <span>{fmtEur(row.tax)}</span>
                    </div>
                ))}
                <div className="rc-total-row">
                    <span>Versandkosten</span>
                    <span>{fmtEur(shipping)}</span>
                </div>
                <div className="rc-total-row rc-total-grand">
                    <span>Gesamtbetrag (Brutto)</span>
                    <span>{fmtEur(grandTotal)}</span>
                </div>
            </div>

            {/* ═══ TAX BREAKDOWN ═══ */}
            {taxRows.length > 0 && (
                <div className="rechnung-tax-section">
                    <div className="rc-tax-title">
                        Umsatzsteuer-Aufschlüsselung
                    </div>
                    <table className="rechnung-tax-table">
                        <thead>
                            <tr>
                                <th>Satz</th>
                                <th>Netto</th>
                                <th>Steuer</th>
                                <th>Brutto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxRows.map((row) => (
                                <tr key={row.rate}>
                                    <td>{row.rate}%</td>
                                    <td>{fmtEur(row.net)}</td>
                                    <td>{fmtEur(row.tax)}</td>
                                    <td>{fmtEur(row.gross)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ═══ PAYMENT INFO ═══ */}
            <div className="rechnung-payment">
                <div className="rc-payment-row">
                    <span className="rc-payment-label">Zahlungsart:</span>
                    <span className="rc-payment-value">
                        {order.payment_method === "card"
                            ? "Kreditkarte (Stripe)"
                            : order.payment_method === "cod"
                                ? "Barzahlung bei Lieferung"
                                : order.payment_method === "bank_transfer"
                                    ? "Banküberweisung"
                                    : order.payment_method || "—"}
                    </span>
                </div>
                <div className="rc-payment-row">
                    <span className="rc-payment-label">Zahlungsstatus:</span>
                    <span className="rc-payment-status rc-paid">
                        ✓ Bezahlt am {fmtDate(deliveryDate)}
                    </span>
                </div>
            </div>

            {/* ═══ LEGAL NOTICE ═══ */}
            <div className="rechnung-legal">
                <strong>Zahlungshinweis:</strong> Der Rechnungsbetrag wurde
                bereits beglichen. Diese Rechnung dient als Zahlungsnachweis.
                Gemäß § 14 UStG ist diese Rechnung für die steuerliche
                Erfassung gültig.
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="rechnung-footer">
                Vielen Dank für Ihren Einkauf bei{" "}
                <strong>{company?.brand_name}</strong>!
                <div className="rechnung-footer-sub">
                    Diese Rechnung wurde elektronisch erstellt und ist ohne
                    Unterschrift gültig.
                </div>
            </div>
        </div>
    );
}