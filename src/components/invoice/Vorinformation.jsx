import { useCompany } from "../../context/CompanyContext";
import "./Vorinformation.css";

const fmtNum = (n, decimals = 2) => {
    const num = parseFloat(n) || 0;
    return num.toFixed(decimals).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const fmtPrice = (n) => fmtNum(n, 2);
const fmtWeight = (n) => fmtNum(n, 3);

const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function getCalcLine(item) {
    const unitRaw = String(item.weight_unit || "").toLowerCase();
    const isWeightUnit = ["kg", "g", "l", "ml"].includes(unitRaw);

    const qty = parseFloat(item.actual_quantity ?? item.quantity) || 1;
    const total = parseFloat(item.total_price) || 0;
    const unitWeight = parseFloat(item.weight) || 0;

    if (qty <= 0 || total <= 0) return "";

    if (isWeightUnit) {
        let totalWeight = parseFloat(item.actual_total_weight) || 0;
        if (totalWeight <= 0 && unitWeight > 0) {
            totalWeight = unitWeight * qty;
        }

        if (totalWeight > 0) {
            let displayQty = totalWeight;
            let displayUnit = item.weight_unit;
            let perUnit = total / totalWeight;

            if (unitRaw === "g") {
                displayQty = totalWeight / 1000;
                displayUnit = "kg";
                perUnit = perUnit * 1000;
            } else if (unitRaw === "ml") {
                displayQty = totalWeight / 1000;
                displayUnit = "L";
                perUnit = perUnit * 1000;
            }

            if (qty > 1 && unitWeight > 0) {
                return `${qty} × ${fmtWeight(unitWeight)} ${item.weight_unit} (${fmtWeight(displayQty)} ${displayUnit} × ${fmtPrice(perUnit)} €/${displayUnit})`;
            }
            return `${fmtWeight(displayQty)} ${displayUnit} × ${fmtPrice(perUnit)} €/${displayUnit}`;
        }
    }

    const perUnit = total / qty;
    return `${qty} Stk × ${fmtPrice(perUnit)} €`;
}

export default function Vorinformation({
    order,
    items = [],
    showPaymentInfo = true,
    showBufferInfo = false,
    bufferAmount = 0,
    afterTotalsSlot = null,
}) {
    const { company } = useCompany();
    if (!order) return null;

    const shipping = parseFloat(order.shipping_cost || 0);
    const productsTotal = items
        .filter((i) => !i._isRemoved)
        .reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);

    const total = productsTotal + shipping;
    const authorizedTotal = total + bufferAmount;

    const paymentLabel = (() => {
        const m = order.payment_method;
        if (m === "card") return "Kreditkarte (Stripe)";
        if (m === "cod") return "Barzahlung bei Lieferung";
        if (m === "bank_transfer") return "Banküberweisung";
        return m ? String(m) : "Online Zahlung";
    })();

    return (
        <div className="vo-container">
            {/* ═══ HEADER ═══ */}
            <div className="vo-header">
                <div>
                    <h2 className="vo-title">Bestellübersicht</h2>
                    <p className="vo-subtitle">Bestellung <strong>#{order.order_number}</strong></p>
                </div>
                <div className="vo-brand">
                    {company?.brand_name || "Shopora"}
                </div>
            </div>

            {/* ═══ ITEMS (Clean List) ═══ */}
            <div className="vo-items-list">
                {items.map((item) => {
                    const calcLine = getCalcLine(item);
                    const itemTotal = parseFloat(item.total_price) || 0;

                    return (
                        <div key={item.id} className={`vo-item ${item._isRemoved ? "is-removed" : ""}`}>
                            <div className="vo-item-info">
                                <span className="vo-item-name">
                                    {item.product_name}
                                    {item.substitution_note && <span className="vo-item-sub"> (Ersatz)</span>}
                                </span>

                                {item._isRemoved ? (
                                    <span className="vo-item-removed-text">Nicht geliefert</span>
                                ) : (
                                    calcLine && <span className="vo-item-meta">{calcLine}</span>
                                )}
                            </div>

                            <div className="vo-item-price">
                                {fmtPrice(itemTotal)} €
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ TOTALS ═══ */}
            <div className="vo-totals">
                <div className="vo-row">
                    <span>Zwischensumme (Produkte)</span>
                    <span>{fmtPrice(productsTotal)} €</span>
                </div>

                {shipping > 0 && (
                    <div className="vo-row">
                        <span>Versandkosten</span>
                        <span>{fmtPrice(shipping)} €</span>
                    </div>
                )}

                <div className="vo-row vo-row-subtotal">
                    <span>Gesamtsumme</span>
                    <strong>{fmtPrice(total)} €</strong>
                </div>

                {showBufferInfo && bufferAmount > 0 && (
                    <div className="vo-row vo-row-buffer">
                        <span>Sicherheitsreserve (Gewicht)</span>
                        <span>+{fmtPrice(bufferAmount)} €</span>
                    </div>
                )}

                <div className="vo-row vo-row-grand">
                    <span>{showBufferInfo && bufferAmount > 0 ? "Autorisierter Betrag" : "Gesamtsumme"}</span>
                    <strong>{fmtPrice(authorizedTotal)} €</strong>
                </div>
            </div>

            {afterTotalsSlot}

            {/* ═══ PAYMENT & DELIVERY ═══ */}
            <div className="vo-meta-grid">
                {showPaymentInfo && (
                    <div className="vo-meta-card">
                        <span className="vo-meta-label">Zahlungsart</span>
                        <span className="vo-meta-value">{paymentLabel}</span>
                    </div>
                )}

                {order.delivery_date && (
                    <div className="vo-meta-card">
                        <span className="vo-meta-label">Liefertermin</span>
                        <span className="vo-meta-value">
                            {fmtDate(`${order.delivery_date}T00:00:00`)}
                            {order.delivery_time && ` · ${order.delivery_time.slice(0, 5)} Uhr`}
                        </span>
                    </div>
                )}
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="vo-footer">
                <span className="material-symbols-outlined">verified_user</span>
                <p>Sichere Zahlungsabwicklung. Alle Preise inkl. gesetzlicher MwSt.</p>
            </div>
        </div>
    );
}