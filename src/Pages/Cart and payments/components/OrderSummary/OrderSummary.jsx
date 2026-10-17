import { useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { useLocalStorage } from "../../../../hooks/useLocalStorage";
import { formatEuro } from "../../../../lib/format";
import "./OrderSummary.css";

export default function OrderSummary() {
  const navigate = useNavigate();
  const { totalItems, totalPrice } = useCart();

  const [allowSubstitution, setAllowSubstitution] = useLocalStorage(
    "allowSubstitution",
    true
  );

  return (
    <aside className="order-summary">
      {/* ═══ Complete Purchase Button ═══ */}
      <button
        className="order-complete-btn"
        onClick={() => navigate("/Cart&Payments/Checkout")}
      >
        Zur Kasse gehen
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14M12 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ═══ Total Card ═══ */}
      <div className="order-summary-card">
        <div className="order-summary-total">
          <span className="order-total-label">Gesamt</span>
          <span className="order-total-value">
            {formatEuro(totalPrice)}
          </span>
        </div>
        <p className="order-summary-vat">
          Preise inkl. MwSt.
        </p>

        <div className="order-summary-divider" />

        <div className="order-summary-row">
          <span>
            ({totalItems}{" "}
            {totalItems === 1 ? "Produkt" : "Produkte"})
          </span>
          <span>{formatEuro(totalPrice)}</span>
        </div>
      </div>

      {/* ═══ Substitution Checkbox ═══ */}
      <label
        className={`order-substitution-box ${allowSubstitution ? "checked" : ""
          }`}
      >
        <input
          type="checkbox"
          checked={allowSubstitution}
          onChange={(e) => setAllowSubstitution(e.target.checked)}
        />
        <div className="order-substitution-content">
          <span className="order-substitution-title">
            {allowSubstitution ? "✓ " : ""}
            Ersatzartikel erlauben
          </span>
          <span className="order-substitution-desc">
            Falls ein Produkt nicht verfügbar ist, bieten wir einen
            ähnlichen Artikel aus derselben Kategorie an.
          </span>
        </div>
      </label>

      {/* ═══ Info Box ═══ */}
      <div className="order-info-box">
        <div className="order-info-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="order-info-text">
          <p>
            {allowSubstitution
              ? "✅ Falls ein Produkt nicht verfügbar ist, schlagen wir ein ähnliches vor."
              : "⚠️ Wir ersetzen keine Produkte ohne Ihre Zustimmung."}
          </p>
        </div>
      </div>
    </aside>
  );
}