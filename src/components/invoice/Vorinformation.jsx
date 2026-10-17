import { useCompany } from "../../context/CompanyContext";
import "./Vorinformation.css";

const fmtNum = (n, decimals = 2) => {
    const num = parseFloat(n) || 0;
    return num
        .toFixed(decimals)
        .replace(".", ",")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const fmtPrice = (n) => fmtNum(n, 2);
const fmtWeight = (n) => fmtNum(n, 3);
const fmtPercent = (n) => fmtNum(n, 1);

const getTaxLetter = (rate) => {
    const r = parseFloat(rate) || 0;
    if (r === 7) return "B";
    if (r === 19) return "A";
    return "C";
};

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

function getCalcLine(item) {
    const unitRaw = String(item.weight_unit || "").toLowerCase();
    const isWeightUnit = ["kg", "g", "l", "ml"].includes(unitRaw);

    const qty =
        parseFloat(item._displayQuantity) || parseFloat(item.quantity) || 0;
    const total = parseFloat(item.total_price) || 0;

    if (qty <= 0 || total <= 0) return "";

    if (isWeightUnit) {
        let displayQty = qty;
        let displayUnit = item.weight_unit;
        let perUnit = total / qty;

        if (unitRaw === "g") {
            displayQty = qty / 1000;
            displayUnit = "kg";
            perUnit = perUnit * 1000;
        } else if (unitRaw === "ml") {
            displayQty = qty / 1000;
            displayUnit = "L";
            perUnit = perUnit * 1000;
        }

        return `${fmtWeight(displayQty)} ${displayUnit} x ${fmtPrice(
            perUnit
        )} EUR/${displayUnit}`;
    }

    const perUnit = total / qty;
    return `${qty} Stk x ${fmtPrice(perUnit)}`;
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
    const floorFee = parseFloat(order.floor_fee || 0);

    const productsTotal = items
        .filter((i) => !i._isRemoved)
        .reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);

    const total = productsTotal + shipping;

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
                taxGroups[key] = {
                    rate,
                    net: 0,
                    tax: 0,
                    gross: 0,
                    letter: getTaxLetter(rate),
                };
            }
            taxGroups[key].net += net;
            taxGroups[key].tax += tax;
            taxGroups[key].gross += gross;
        });

    const taxRows = Object.values(taxGroups).sort((a, b) => a.rate - b.rate);
    const totalNet = taxRows.reduce((s, r) => s + r.net, 0);
    const totalTax = taxRows.reduce((s, r) => s + r.tax, 0);

    const orderDate = order.created_at ? new Date(order.created_at) : new Date();

    const paymentLabel = (() => {
        const m = order.payment_method;
        if (m === "card") return "Kartenzahlung";
        if (m === "cod") return "Bar bei Lieferung";
        if (m === "bank_transfer") return "Banküberweisung";
        return m ? String(m) : "Online Zahlung";
    })();

    const authorizedTotal = total + bufferAmount;

    return (
        <div className="kb-receipt kb-receipt-preview">
            {/* ═══ VORINFORMATION BANNER (إلزامي) ═══ */}
            <div className="kb-vorinfo-banner">
                <div className="kb-vorinfo-header">
                    <span className="kb-vorinfo-icon">ℹ</span>
                    <span className="kb-vorinfo-title">
                        VORINFORMATION — KEINE RECHNUNG
                    </span>
                </div>
                <div className="kb-vorinfo-text">
                    Dieses Schreiben ist eine{" "}
                    <strong>Vorinformation und keine Rechnung</strong> im Sinne
                    des <strong>§ 14 UStG</strong>. Die ordnungsgemäße Rechnung
                    erhalten Sie{" "}
                    <strong>
                        nach vollständiger Bezahlung und Lieferung der Ware
                    </strong>
                    .
                </div>
            </div>

            {/* ═══ HEADER ═══ */}
            <div className="kb-header">
                <div className="kb-brand">
                    {company?.brand_name || "Shopora"}
                </div>
                {company?.address && (
                    <div className="kb-line">
                        {company.address}
                        {company.house_number && ` ${company.house_number}`}
                    </div>
                )}
                {company?.postal_code && (
                    <div className="kb-line">
                        {company.postal_code} {company.city || ""}
                    </div>
                )}
                {company?.contact_phone && (
                    <div className="kb-line">Tel.: {company.contact_phone}</div>
                )}
            </div>

            {/* ═══ DOCUMENT LABEL ═══ */}
            <div className="kb-doclabel">Bestellübersicht</div>

            {/* ═══ PRODUCTS ═══ */}
            <div className="kb-products">
                <div className="kb-eur-row">
                    <span></span>
                    <span className="kb-eur-label">EUR</span>
                </div>

                {items.map((item) => {
                    const calcLine = getCalcLine(item);
                    const itemTotal = parseFloat(item.total_price) || 0;
                    const letter = getTaxLetter(item.tax_rate);
                    const name = String(item.product_name || "").toUpperCase();

                    return (
                        <div key={item.id} className="kb-product">
                            <div className="kb-product-main">
                                <span className="kb-product-name">
                                    {name}
                                    {item.substitution_note && (
                                        <span className="kb-sub-note">
                                            {" "}
                                            (Ersatz)
                                        </span>
                                    )}
                                </span>
                                <span className="kb-product-total">
                                    {fmtPrice(itemTotal)} {letter}
                                </span>
                            </div>

                            {calcLine && (
                                <div className="kb-product-calc">
                                    {calcLine}
                                </div>
                            )}

                            {item._isRemoved && (
                                <div className="kb-product-removed">
                                    Nicht geliefert
                                </div>
                            )}
                        </div>
                    );
                })}

                {shipping > 0 && (
                    <div className="kb-product">
                        <div className="kb-product-main">
                            <span className="kb-product-name">
                                LIEFERGEBÜHR
                            </span>
                            <span className="kb-product-total">
                                {fmtPrice(shipping)}
                            </span>
                        </div>
                        {floorFee > 0 && (
                            <div className="kb-product-calc">
                                davon Etage {fmtPrice(floorFee)} EUR
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ SUMME ═══ */}
            <div className="kb-separator" />
            <div className="kb-summe">
                <span className="kb-summe-label">SUMME</span>
                <span className="kb-summe-currency">EUR</span>
                <span className="kb-summe-value">{fmtPrice(total)}</span>
            </div>
            <div className="kb-double-separator" />

            {/* ═══ PAYMENT ═══ */}
            {showPaymentInfo && (
                <div className="kb-payment">
                    <span className="kb-payment-label">
                        Geg. {paymentLabel}
                    </span>
                    <span className="kb-payment-currency">EUR</span>
                    <span className="kb-payment-value">{fmtPrice(total)}</span>
                </div>
            )}

            {/* ═══ BUFFER ═══ */}
            {showBufferInfo && bufferAmount > 0 && (
                <div className="kb-buffer">
                    <div className="kb-buffer-row">
                        <span>Sicherheitsreserve</span>
                        <span>+{fmtPrice(bufferAmount)} EUR</span>
                    </div>
                    <div className="kb-buffer-row kb-buffer-total">
                        <span>Autorisiert</span>
                        <span>{fmtPrice(authorizedTotal)} EUR</span>
                    </div>
                </div>
            )}

            {afterTotalsSlot}

            {/* ═══ TAX TABLE ═══ */}
            {taxRows.length > 0 && (
                <div className="kb-tax-section">
                    <div className="kb-tax-preview-note">
                        ℹ Voraussichtliche Steuerangaben (unverbindlich)
                    </div>

                    <div className="kb-tax-header">
                        <span className="kb-tax-col-letter">Steuer %</span>
                        <span className="kb-tax-col">Netto</span>
                        <span className="kb-tax-col">Steuer</span>
                        <span className="kb-tax-col">Brutto</span>
                    </div>

                    {taxRows.map((row) => (
                        <div key={row.rate} className="kb-tax-row">
                            <span className="kb-tax-col-letter">
                                {row.letter}= {fmtPercent(row.rate)}%
                            </span>
                            <span className="kb-tax-col">
                                {fmtPrice(row.net)}
                            </span>
                            <span className="kb-tax-col">
                                {fmtPrice(row.tax)}
                            </span>
                            <span className="kb-tax-col">
                                {fmtPrice(row.gross)}
                            </span>
                        </div>
                    ))}

                    <div className="kb-tax-row kb-tax-total">
                        <span className="kb-tax-col-letter">
                            Gesamtbetrag
                        </span>
                        <span className="kb-tax-col">{fmtPrice(totalNet)}</span>
                        <span className="kb-tax-col">{fmtPrice(totalTax)}</span>
                        <span className="kb-tax-col">
                            {fmtPrice(productsTotal)}
                        </span>
                    </div>
                </div>
            )}

            {/* ═══ METADATA ═══ */}
            <div className="kb-meta">
                <div className="kb-meta-row">
                    <span>{fmtDate(orderDate)}</span>
                    <span>{fmtTime(orderDate)}</span>
                </div>
                <div className="kb-meta-row">
                    <span>Bestellnummer: {order.order_number}</span>
                </div>
                {order.delivery_date && (
                    <div className="kb-meta-row">
                        <span>
                            Lieferung:{" "}
                            {fmtDate(`${order.delivery_date}T00:00:00`)}
                            {order.delivery_time &&
                                ` ${order.delivery_time.slice(0, 5)}`}
                        </span>
                    </div>
                )}
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="kb-footer">
                <div className="kb-footer-star">
                    ******************************************
                </div>
                <div className="kb-footer-text">
                    VIELEN DANK FÜR IHRE BESTELLUNG!
                </div>
                <div className="kb-footer-sub">
                    Dies ist <strong>keine Rechnung</strong>. Die
                    ordnungsgemäße Rechnung erhalten Sie nach Abschluss der
                    Lieferung.
                </div>
                <div className="kb-footer-star">
                    ******************************************
                </div>
                <div className="kb-footer-brand">
                    {company?.brand_name || "Shopora"}{" "}
                    {company?.legal_form || "GmbH"}
                </div>
            </div>
        </div>
    );
}