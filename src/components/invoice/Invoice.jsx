import "./Invoice.css";

/* ══════════════════════════════════════════════════════════
   النسخة النهائية — نفس تصميمك (invoice-box) وأصناف CSS بلا أي تغيير:
   1) الكمية بوحدتها الصحيحة (kg / L / Stk) — كانت تُطبع Stk دائمًا
   2) St.-Nr. و USt-IdNr. كلٌّ بعنوانه + السجل/الشكل القانوني إن وُجدا
   3) "bezahlt" فقط عند captured / paid / الدفع عند الاستلام
   4) تاريخ التسليم بلا إزاحة + تاريخ ووقت الفاتورة بتوقيت برلين
   5) التوصيل المشترك بين A/B سطر واحد مجمَّع
   ══════════════════════════════════════════════════════════ */

const TZ = "Europe/Berlin";

const fmtEur = (val) =>
  (parseFloat(val) || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const fmtNum = (val, decimals = 2) =>
  (parseFloat(val) || 0).toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("de-DE", {
        day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ,
      })
    : "—";

const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("de-DE", {
        hour: "2-digit", minute: "2-digit", timeZone: TZ,
      })
    : "";

// "YYYY-MM-DD" → "DD.MM.YYYY" بدون تحويل منطقة زمنية
const fmtPlainDate = (s) => {
  if (!s) return "—";
  const [y, m, d] = String(s).slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
};

const fmtQty = (line) => {
  const isWeight = line.unit && line.unit !== "Stk";
  const q = parseFloat(line.qty) || 0;
  const decimals = isWeight ? 3 : Number.isInteger(q) ? 0 : 2;
  return `${fmtNum(q, decimals)} ${line.unit || "Stk"}`;
};

const BRAND_LABELS = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  maestro: "Maestro",
  girocard: "girocard",
};

function paymentLabel(p) {
  if (!p) return "Online";
  if (p.method === "cod") return "Barzahlung";
  if (p.method === "transfer" || p.method === "bank") return "Überweisung";
  if (p.type === "card" || p.method === "card" || p.card_brand) {
    const brand = p.card_brand
      ? BRAND_LABELS[String(p.card_brand).toLowerCase()] || String(p.card_brand).toUpperCase()
      : "Karte";
    return p.card_last4 ? `Karte (${brand} •••• ${p.card_last4})` : `Karte (${brand})`;
  }
  if (p.type === "sepa_debit") return "SEPA-Lastschrift";
  return "Online";
}

const isSoleProprietor = (legalForm) => /einzel|e\.\s?k\.|gbr/i.test(legalForm || "");

export default function Invoice({ snapshot }) {
  if (!snapshot) {
    return <div className="invoice-box">Rechnung wird erstellt. Bitte laden Sie die Seite in einem Moment neu.</div>;
  }

  const {
    meta = {},
    seller = {},
    customer = {},
    lines = [],
    tax_rows = [],
    totals = {},
    payment = {},
  } = snapshot;

  // المجاميع
  const productsTotal = lines.filter((l) => l.kind === "item").reduce((s, l) => s + (parseFloat(l.gross) || 0), 0);
  const depositsTotal = lines.filter((l) => l.kind === "deposit").reduce((s, l) => s + (parseFloat(l.gross) || 0), 0);

  // التوصيل: سطر واحد مجمَّع (قد يكون موزّعًا على A/B)
  const shippingLines = lines.filter((l) => l.kind === "shipping");
  const shippingTotal = shippingLines.reduce((s, l) => s + (parseFloat(l.gross) || 0), 0);
  const shippingCodes = [...new Set(shippingLines.map((l) => l.code))].join("/");

  const isPaid = ["captured", "paid"].includes(payment.status) || payment.method === "cod";

  const soleProp = isSoleProprietor(seller.legal_form);
  const sellerName = [seller.name, !soleProp ? seller.legal_form : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div id="invoice-pdf-download" className="invoice-box" data-invoice-number={meta.invoice_number || ""}>

      {/* 1. الرأس */}
      <table className="inv-header">
        <tbody>
          <tr>
            <td>
              <h1 className="brand">Shopora</h1>
              <div className="slogan">DEIN EINKAUF. DIREKT GELIEFERT.</div>
            </td>
            <td className="text-right">
              <div className="title">RECHNUNG</div>
              <div className="meta">{meta.invoice_number}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <hr className="divider" />

      {/* 2. العناوين */}
      <table className="inv-addresses">
        <tbody>
          <tr>
            <td width="50%">
              <div className="label">RECHNUNG VON</div>
              <div className="bold">{sellerName}</div>
              {seller.owner_name && (
                <div>{soleProp ? "Inhaber" : "Geschäftsführer"}: {seller.owner_name}</div>
              )}
              <div>{seller.address}</div>
              <div>{seller.postal_code} {seller.city}</div>
              <div className="mt-10">
                {seller.tax_number && <div>Steuernummer: {seller.tax_number}</div>}
                {seller.vat_id && <div>USt-IdNr.: {seller.vat_id}</div>}
                {(seller.register_court || seller.register_number) && (
                  <div>{[seller.register_court, seller.register_number].filter(Boolean).join(", ")}</div>
                )}
              </div>
            </td>
            <td width="50%">
              <div className="label">RECHNUNG AN</div>
              <div className="bold">{customer.name}</div>
              <div>{customer.street}</div>
              <div>{customer.postal_code} {customer.city}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 3. التواريخ */}
      <table className="inv-dates">
        <tbody>
          <tr>
            <td width="50%">
              <div className="label">Rechnungsdatum</div>
              <div className="bold">
                {fmtDate(meta.issued_at)}{fmtTime(meta.issued_at) && `, ${fmtTime(meta.issued_at)} Uhr`}
              </div>
            </td>
            <td width="50%">
              <div className="label">Lieferdatum</div>
              <div className="bold">{fmtPlainDate(meta.delivery_date)}</div>
            </td>
          </tr>
          <tr>
            <td width="50%">
              <div className="label">Bestellnummer</div>
              <div className="bold">{meta.order_number}</div>
            </td>
            <td width="50%"></td>
          </tr>
        </tbody>
      </table>

      {/* 4. جدول المنتجات */}
      <table className="inv-table">
        <thead>
          <tr>
            <th width="50%">ARTIKEL</th>
            <th width="15%" className="text-center">MENGE</th>
            <th width="15%" className="text-right">EINZEL</th>
            <th width="20%" className="text-right">GESAMT</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => {
            if (line.kind === "item") {
              const isWeight = line.unit && line.unit !== "Stk";
              return (
                <tr key={i} className="row-item">
                  <td>
                    {line.name}
                    {line.status === "substituted" && " (Ersatzartikel)"}
                  </td>
                  <td className="text-center">{fmtQty(line)}</td>
                  <td className="text-right">
                    {fmtEur(line.unit_price)}{isWeight ? `/${line.unit}` : ""}
                  </td>
                  <td className="text-right bold">
                    {fmtEur(line.gross)} <span className="tax-code">{line.code}</span>
                  </td>
                </tr>
              );
            }

            if (line.kind === "deposit") {
              const unitPrice = line.qty > 0 ? parseFloat(line.gross) / line.qty : 0;
              return (
                <tr key={i} className="row-deposit">
                  <td>Pfand · {fmtNum(line.qty, Number.isInteger(line.qty) ? 0 : 2)} × {fmtEur(unitPrice)}</td>
                  <td className="text-center">{fmtNum(line.qty, Number.isInteger(line.qty) ? 0 : 2)} Stk</td>
                  <td className="text-right">{fmtEur(unitPrice)}</td>
                  <td className="text-right bold">
                    {fmtEur(line.gross)} <span className="tax-code">{line.code}</span>
                  </td>
                </tr>
              );
            }

            return null; // التوصيل يُعرض مرة واحدة بعد الحلقة
          })}

          {/* التوصيل — سطر واحد مجمَّع */}
          {shippingLines.length > 0 && (
            <tr className="row-shipping">
              <td>
                Lieferung
                {shippingLines.length > 1 && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    anteilig: {shippingLines.map((l) => `${l.code} ${fmtEur(l.gross)}`).join(" · ")}
                  </div>
                )}
              </td>
              <td className="text-center">1</td>
              <td className="text-right">{fmtEur(shippingTotal)}</td>
              <td className="text-right bold">
                {fmtEur(shippingTotal)} <span className="tax-code">{shippingCodes}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 5. المجاميع والضرائب */}
      <table className="inv-summary-wrapper">
        <tbody>
          <tr>
            <td width="55%">
              <table className="inv-summary-table">
                <tbody>
                  <tr>
                    <td colSpan={3} className="text-left">Warenwert inkl. Pfand</td>
                    <td className="text-right">{fmtEur(productsTotal + depositsTotal)}</td>
                  </tr>
                  {shippingTotal > 0 && (
                    <tr>
                      <td colSpan={3} className="text-left">Lieferung</td>
                      <td className="text-right">{fmtEur(shippingTotal)}</td>
                    </tr>
                  )}
                  <tr className="grand-total">
                    <td colSpan={3} className="text-left">GESAMTBETRAG</td>
                    <td className="text-right">{fmtEur(totals.gross)}</td>
                  </tr>

                  <tr>
                    <td colSpan={4} className="tax-title">UMSATZSTEUER</td>
                  </tr>

                  <tr className="tax-headers">
                    <td className="text-left">Steuergruppe</td>
                    <td className="text-right">Netto</td>
                    <td className="text-right">USt.</td>
                    <td className="text-right">Brutto</td>
                  </tr>

                  {tax_rows.map((row, i) => (
                    <tr key={i}>
                      <td className="text-left">{row.code} = {fmtNum(row.rate, 0)} %</td>
                      <td className="text-right">{fmtEur(row.net)}</td>
                      <td className="text-right">{fmtEur(row.tax)}</td>
                      <td className="text-right">{fmtEur(row.gross)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 6. الدفع والتذييل */}
        <div className="footer-thanks">
          Vielen Dank für deinen Einkauf!
        </div>
    </div>
  );
}
