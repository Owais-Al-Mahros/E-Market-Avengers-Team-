import "./Invoice.css";

const TZ = "Europe/Berlin";

const fmtEur = (val) => {
  const num = parseFloat(val) || 0;
  return num.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
};

const fmtNum = (val, decimals = 2) =>
  (parseFloat(val) || 0).toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  return `${date}, ${time} Uhr`;
};

const fmtPlainDate = (s) => {
  if (!s) return "—";
  const [y, m, d] = String(s).slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
};

const BRAND_LABELS = {
  visa: "Visa", mastercard: "Mastercard", amex: "American Express", maestro: "Maestro", girocard: "girocard",
};

function paymentLabel(p) {
  if (!p) return "—";
  if (p.method === "cod") return "Barzahlung bei Lieferung";
  if (p.method === "transfer" || p.method === "bank") return "Überweisung";
  if (p.type === "card" || p.method === "card" || p.card_brand) {
    const brand = p.card_brand ? BRAND_LABELS[String(p.card_brand).toLowerCase()] || String(p.card_brand).toUpperCase() : "Karte";
    return p.card_last4 ? `${brand} ${p.card_last4}` : ` (${brand})`;
  }
  if (p.type === "sepa_debit") return "SEPA-Lastschrift";
  return "Online-Zahlung";
}

export default function Invoice({ snapshot, showWarnings = false }) {
  if (!snapshot) return <div className="rechnung-container">Rechnung wird geladen...</div>;

  const { meta = {}, seller = {}, customer = {}, lines = [], tax_rows = [], totals = {}, payment = {}, warnings = [] } = snapshot;

  // ✅ فصل الأسطر: المنتجات والـ Pfand في الجدول، والشحن يذهب للمجموع فقط
  const tableLines = lines.filter((l) => l.kind !== "shipping");
  const shippingLines = lines.filter((l) => l.kind === "shipping");

  const shippingTotal = shippingLines.reduce((s, l) => s + (parseFloat(l.gross) || 0), 0);
  
  // ✅ حساب إجمالي الضريبة الخاصة بالشحن فقط
  const shippingTaxTotal = shippingLines.reduce((sum, l) => {
    const gross = parseFloat(l.gross) || 0;
    const rate = parseFloat(l.rate) || 0;
    const tax = gross - (gross / (1 + rate / 100));
    return sum + tax;
  }, 0);
    const productsTotal = tableLines.filter((l) => l.kind === "item").reduce((s, l) => s + (parseFloat(l.gross) || 0), 0);
  const depositTotal = tableLines.filter((l) => l.kind === "deposit").reduce((s, l) => s + (parseFloat(l.gross) || 0), 0);

  const isPaid = ["captured", "paid", "succeeded", "authorized"].includes(payment.status) || !!payment.paid_at;

  return (
    <div className="rechnung-container" id="invoice-pdf-download" data-invoice-number={meta.invoice_number || ""}>
      {showWarnings && warnings.length > 0 && (
        <div data-html2canvas-ignore="true" style={{ background: "#fee2e2", color: "#991b1b", padding: 10, marginBottom: 20, borderRadius: 8 }}>
          <strong>⚠️ Achtung (nur intern):</strong>
          <ul>{warnings.map((w, i) => <li key={i}>{w.code}</li>)}</ul>
        </div>
      )}

      {/* HEADER */}
      <div className="rechnung-header">
        <div>
          <div className="rechnung-brand">{seller.name}</div>
          <div className="rechnung-brand-sub">{seller.legal_form}</div>
        </div>
        <div className="rechnung-header-right">
          <div className="rechnung-title">RECHNUNG</div>
          <div className="rechnung-number">Nr. {meta.invoice_number}</div>
        </div>
      </div>

      {/* COMPANY & CUSTOMER */}
      <div className="rechnung-company">
        <div>
          <div className="rechnung-company-label">Verkäufer</div>
          <div className="rechnung-company-name">{seller.name}</div>
          {seller.owner_name && <div className="rechnung-company-line">{seller.owner_name}</div>}
          <div className="rechnung-company-line">{seller.address}</div>
          <div className="rechnung-company-line">{seller.postal_code} {seller.city}</div>
        </div>
        <div>
          <div className="rechnung-company-label">Steuerliche Angaben</div>
          {seller.tax_number && <div className="rechnung-company-line">St.-Nr.: <strong>{seller.tax_number}</strong></div>}
          {seller.vat_id && <div className="rechnung-company-line">USt-IdNr.: <strong>{seller.vat_id}</strong></div>}
        </div>
      </div>

      <div className="rechnung-meta-section">
        <div>
          <div className="rechnung-section-label">Rechnungsempfänger</div>
          <div className="rechnung-customer-name">{customer.name}</div>
          <div className="rechnung-customer-line">{customer.street}</div>
          <div className="rechnung-customer-line">{customer.postal_code} {customer.city}</div>
        </div>
        <div className="rechnung-dates">
          <div className="rechnung-date-row"><span>Rechnungsdatum:</span> <strong>{fmtDateTime(meta.issued_at)}</strong></div>
          <div className="rechnung-date-row"><span>Lieferdatum:</span> <strong>{fmtPlainDate(meta.delivery_date)}</strong></div>
          <div className="rechnung-date-row"><span>Bestellnummer:</span> <strong>#{meta.order_number}</strong></div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="rechnung-table">
        <thead>
          <tr>
            <th className="rc-col-num">Pos.</th>
            <th className="rc-col-desc">Bezeichnung</th>
            <th className="rc-col-qty">Menge</th>
            <th className="rc-col-rate">MwSt.</th>
            <th className="rc-col-gross">Brutto</th>
          </tr>
        </thead>
        <tbody>
          {tableLines.map((line, idx) => {
            const rate = parseFloat(line.rate) || 0;
            const isWeight = line.unit !== "Stk";

            // ✅ سطر الـ Pfand (يُعرض تحت المنتج مباشرة وبخط أصغر)
            if (line.kind === "deposit") {
              const unitPrice = line.qty > 0 ? (parseFloat(line.gross) / line.qty) : 0;
              return (
                <tr key={`dep-${idx}`} className="rc-row-deposit">
                  <td className="rc-col-num"></td>
                  <td className="rc-col-desc" style={{ paddingLeft: '24px', fontStyle: 'italic', color: '#4b5563' }}>
                    Pfandartikel
                  </td>
                  <td className="rc-col-qty">
                    {line.qty} * {fmtNum(unitPrice)}
                  </td>
                  <td className="rc-col-rate">{line.code} · {fmtNum(rate, 0)}%</td>
                  <td className="rc-col-gross">{fmtEur(line.gross)}</td>
                </tr>
              );
            }

            // ✅ سطر المنتج العادي
            const qtyText = isWeight ? `${fmtNum(line.qty, 3)} ${line.unit}` : `${fmtNum(line.qty, Number.isInteger(line.qty) ? 0 : 2)} Stk`;
            const calcText = isWeight ? `${fmtNum(line.unit_price)} EUR/${line.unit}` : `${fmtNum(line.unit_price)} EUR/Stk`;

            return (
              <tr key={`item-${idx}`}>
                <td className="rc-col-num">{idx + 1}</td>
                <td className="rc-col-desc">
                  <div className="rc-product-name">
                    {line.name}
                    {line.status === "substituted" && " (Ersatzartikel)"}
                  </div>
                  {calcText && <div className="rc-product-calc">{calcText}</div>}
                </td>
                <td className="rc-col-qty">{qtyText}</td>
                <td className="rc-col-rate">{line.code} · {fmtNum(rate, 0)}%</td>
                <td className="rc-col-gross rc-strong">{fmtEur(line.gross)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="rechnung-totals">
        <div className="rc-total-row">
          <span>Zwischensumme (Artikel)</span>
          <span>{fmtEur(productsTotal)}</span>
        </div>
        
        {depositTotal > 0 && (
          <div className="rc-total-row">
            <span>zzgl. Pfand</span>
            <span>{fmtEur(depositTotal)}</span>
          </div>
        )}
        
                {shippingTotal > 0 && (
          <>
            <div className="rc-total-row">
              <span>zzgl. Versandkosten</span>
              <span>{fmtEur(shippingTotal)}</span>
            </div>
            {/* ✅ عرض قيمة الضريبة على التوصيل بشكل صريح */}
            <div className="rc-total-row rc-total-tax" style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '-4px' }}>
              <span style={{ paddingLeft: '10px' }}>davon MwSt. auf Versand</span>
              <span>{fmtEur(shippingTaxTotal)}</span>
            </div>
          </>
        )}

        {/* جدول الضريبة (الذي يضم ضريبة الشحن والمنتجات معاً) */}
        {tax_rows.map((row, i) => (
          <div key={i} className="rc-total-row rc-total-tax">
            <span>zzgl. MwSt. {row.code} {fmtNum(row.rate, 0)}%</span>
            <span>{fmtEur(row.tax)}</span>
          </div>
        ))}
        
        <div className="rc-total-row rc-total-grand">
          <span>Gesamtbetrag (Brutto)</span>
          <span>{fmtEur(totals.gross)}</span>
        </div>
      </div>

      {/* TAX BREAKDOWN */}
      <div className="rechnung-tax-section">
        <div className="rc-tax-title">Umsatzsteuer-Aufschlüsselung</div>
        <table className="rechnung-tax-table">
          <thead>
            <tr><th>Satz</th><th>Netto</th><th>Steuer</th><th>Brutto</th></tr>
          </thead>
          <tbody>
            {tax_rows.map((row, i) => (
              <tr key={i}>
                <td>{row.code} = {fmtNum(row.rate, 0)}%</td>
                <td>{fmtEur(row.net)}</td>
                <td>{fmtEur(row.tax)}</td>
                <td>{fmtEur(row.gross)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rechnung-muted" style={{ fontSize: 11, marginTop: 6 }}>
        </div>
      </div>

      {/* PAYMENT */}
      <div className="rechnung-payment">
        <div className="rc-payment-row">
          <span className="rc-payment-label">Zahlungsart:</span>
          <span className="rc-payment-value">{paymentLabel(payment)}</span>
        </div>
        {payment.paid_at && (
          <div className="rc-payment-row">
            <span className="rc-payment-label">Zahlungsdatum:</span>
            <span className="rc-payment-value">{fmtDateTime(payment.paid_at)}</span>
          </div>
        )}
        <div className="rc-payment-row">
          <span className="rc-payment-label">Zahlungsstatus:</span>
          <span className={`rc-payment-status ${isPaid ? "rc-paid" : ""}`}>
            {isPaid ? "✓ Zahlung erfolgt" : "Offen"}
          </span>
        </div>
      </div>

      <div className="rechnung-footer">
        Vielen Dank für Ihren Einkauf bei <strong>{seller.name}</strong>!
      </div>
    </div>
  );
}