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

const fmtTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function Invoice({ order, items = [] }) {
    const { company } = useCompany();
    if (!order) return null;

    const customer = order.customer_info || {};
    const address = order.shipping_address || {};

    // Filter active items
    const activeItems = items.filter((i) => !i._isRemoved);

    // Calculate totals
    const productsTotal = activeItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
    const depositTotal = activeItems.reduce((sum, item) => {
        const d = parseFloat(item.deposit_amount) || 0;
        const q = parseFloat(item.quantity) || 1;
        return sum + d * q;
    }, 0);

    const shipping = parseFloat(order.shipping_cost || 0);
    const grandTotal = productsTotal + depositTotal + shipping;

    // Tax Breakdown (A = 7%, B = 19%) - Dynamic grouping based on actual rates
    const taxGroups = {};

    // Add Products to Tax Groups
    activeItems.forEach((item) => {
        const rate = parseFloat(item.tax_rate) || 0;
        const gross = parseFloat(item.total_price) || 0;
        if (rate > 0 && gross > 0) {
            const net = gross / (1 + rate / 100);
            const key = String(rate);
            if (!taxGroups[key]) taxGroups[key] = { rate, net: 0, tax: 0, gross: 0 };
            taxGroups[key].net += net;
            taxGroups[key].tax += gross - net;
            taxGroups[key].gross += gross;
        }
    });

    // Add Deposits to Tax Groups
    activeItems.forEach((item) => {
        const d = parseFloat(item.deposit_amount) || 0;
        const q = parseFloat(item.quantity) || 1;
        const dGross = d * q;
        if (dGross > 0) {
            const dRate = parseFloat(item.deposit_tax_rate) || parseFloat(item.tax_rate) || 0;
            if (dRate > 0) {
                const dNet = dGross / (1 + dRate / 100);
                const key = String(dRate);
                if (!taxGroups[key]) taxGroups[key] = { rate: dRate, net: 0, tax: 0, gross: 0 };
                taxGroups[key].net += dNet;
                taxGroups[key].tax += dGross - dNet;
                taxGroups[key].gross += dGross;
            }
        }
    });

    // ❌ REMOVED SHIPPING FROM TAX GROUPS (As requested by user)

    const taxRows = Object.values(taxGroups).sort((a, b) => a.rate - b.rate);
    const totalNet = taxRows.reduce((s, r) => s + r.net, 0);

    const paymentDate = order.delivered_at || order.updated_at || new Date();

    return (
        <div className="receipt-container" id="invoice-pdf-download">
            {/* ═══ HEADER ═══ */}
            <div className="receipt-header">
                <div className="receipt-brand">{company?.brand_name || "Shopora"}</div>
                <div>{company?.legal_form || "GmbH"}</div>
                <div>{company?.owner_name}</div>
                <div>{company?.address} {company?.house_number}</div>
                <div>{company?.postal_code} {company?.city}</div>
                <div className="receipt-mt">USt-IdNr.: {company?.vat_id || "DE000000000"}</div>
            </div>

            <div className="receipt-line">--------------------------------------------------</div>

            {/* ═══ META ═══ */}
            <div className="receipt-meta">
                <div className="receipt-row">
                    <span>Beleg-Nr.:</span>
                    <span>{order.order_number}</span>
                </div>
                <div className="receipt-row">
                    <span>Datum:</span>
                    <span>{fmtDate(order.created_at)} {fmtTime(order.created_at)}</span>
                </div>
            </div>

            <div className="receipt-line">--------------------------------------------------</div>

            {/* ═══ ITEMS ═══ */}
            <div className="receipt-items">
                {activeItems.map((item, idx) => {
                    const qty = parseFloat(item.actual_quantity ?? item.quantity) || 0;
                    const total = parseFloat(item.total_price) || 0;
                    const unitPrice = qty > 0 ? total / qty : 0;
                    const depositAmt = parseFloat(item.deposit_amount) || 0;

                    return (
                        <div key={item.id} className="receipt-item-block">
                            <div className="receipt-item-name">{item.product_name}</div>

                            <div className="receipt-row">
                                {/* ✅ عرض الكمية × السعر فقط، بدون الوزن */}
                                <span>{fmt(qty, qty % 1 === 0 ? 0 : 2)} Stk x {fmt(unitPrice)} EUR</span>
                                <span>{fmt(total)} EUR</span>
                            </div>

                            {depositAmt > 0 && (
                                <div className="receipt-row receipt-deposit">
                                    <span>Pfandartikel {fmt(qty, 0)} * {fmt(depositAmt)}</span>
                                    <span>{fmt(depositAmt * qty)} EUR</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="receipt-line">--------------------------------------------------</div>

            {/* ═══ SUMME ═══ */}
            <div className="receipt-totals">
                <div className="receipt-row">
                    <span>Zwischensumme (Produkte)</span>
                    <span>{fmt(productsTotal)} EUR</span>
                </div>

                {depositTotal > 0 && (
                    <div className="receipt-row">
                        <span>+ Pfand</span>
                        <span>{fmt(depositTotal)} EUR</span>
                    </div>
                )}

                {shipping > 0 && (
                    <div className="receipt-row">
                        <span>+ Versandkosten</span>
                        <span>{fmt(shipping)} EUR</span>
                    </div>
                )}

                <div className="receipt-row receipt-summe" style={{ marginTop: '8px', borderTop: '1px dashed #000', paddingTop: '8px' }}>
                    <span>SUMME EUR</span>
                    <span>{fmt(grandTotal)}</span>
                </div>

                <div className="receipt-row">
                    <span>Geg. {order.payment_method === "card" ? "Kartenzahlung" : order.payment_method === "cod" ? "Barzahlung" : "Überweisung"}</span>
                    <span>{fmt(grandTotal)}</span>
                </div>
            </div>

            <div className="receipt-line">--------------------------------------------------</div>

            {/* ═══ TAX BREAKDOWN ═══ */}
            <div className="receipt-tax-section">
                <div className="receipt-tax-header">
                    <span>Steuer %</span>
                    <span>Netto</span>
                    <span>Steuer</span>
                    <span>Brutto</span>
                </div>
                {taxRows.map((row) => (
                    <div key={row.rate} className="receipt-tax-row">
                        <span>{row.rate}%</span>
                        <span>{fmt(row.net)}</span>
                        <span>{fmt(row.tax)}</span>
                        <span>{fmt(row.gross)}</span>
                    </div>
                ))}
                <div className="receipt-tax-row receipt-tax-total">
                    <span>Produkte</span>
                    <span>{fmt(totalNet)}</span>
                    <span>{fmt(productsTotal + depositTotal - totalNet)}</span>
                    <span>{fmt(productsTotal + depositTotal)}</span>
                </div>
            </div>

            <div className="receipt-line">--------------------------------------------------</div>

            {/* ═══ CUSTOMER ═══ */}
            <div className="receipt-meta receipt-customer">
                <div className="receipt-mt">Kunde:</div>
                <div>{customer.first_name} {customer.last_name}</div>
                <div>{address.street} {address.house_number}</div>
                <div>{address.postal_code} {address.city}</div>
            </div>

            <div className="receipt-line">--------------------------------------------------</div>

            {/* ═══ FOOTER & LEGAL ═══ */}
            <div className="receipt-footer">
                <div className="receipt-thanks">Vielen Dank für Ihren Einkauf!</div>
                <div className="receipt-legal">
                    Gemäß § 14 UStG ist diese Rechnung für die steuerliche Erfassung gültig.
                    Der Rechnungsbetrag wurde bereits beglichen.
                </div>
                <div className="receipt-mt">
                    Zahlungsstatus: ✓ BEZAHLT am {fmtDate(paymentDate)} um {fmtTime(paymentDate)} Uhr
                </div>
                <div className="receipt-mt">
                    Tel. Nr.: {company?.contact_phone || "0152..."}<br />
                    {company?.contact_email}
                </div>
            </div>
        </div>
    );
}