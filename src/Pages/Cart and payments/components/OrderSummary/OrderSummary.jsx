import { useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { useLocalStorage } from "../../../../hooks/useLocalStorage";
import "./OrderSummary.css";

export default function OrderSummary() {
  const navigate = useNavigate();
  const { totalItems, totalPrice } = useCart();

  // ✅ حفظ الموافقة في localStorage
  const [allowSubstitution, setAllowSubstitution] = useLocalStorage(
    "allowSubstitution",
    true  // ✅ افتراضياً موافق
  );

  return (
    <aside className="order-summary">
      {/* Complete Purchase Button */}
      <button
        className="order-complete-btn"
        onClick={() => navigate("/Cart&Payments/Checkout")}
      >
        Complete Purchase
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

      {/* Total Card */}
      <div className="order-summary-card">
        <div className="order-summary-total">
          <span className="order-total-label">Total</span>
          <span className="order-total-value">€{totalPrice.toFixed(2)}</span>
        </div>
        <p className="order-summary-vat">Prices include VAT</p>

        <div className="order-summary-divider" />

        <div className="order-summary-row">
          <span>({totalItems} products)</span>
          <span>€{totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* ✅ Substitution Agreement Checkbox */}
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
            {allowSubstitution ? "✓ " : ""}Allow similar substitutes
          </span>
          <span className="order-substitution-desc">
            If a product is unavailable, we'll offer a similar item from the
            same category.
          </span>
        </div>
      </label>

      {/* Info Box */}
      <div className="order-info-box">
        <div className="order-info-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
              ? "✅ If a product is unavailable, we'll suggest a similar one."
              : "⚠️ We won't substitute any product without contacting you first."}
          </p>
        </div>
      </div>
    </aside>
  );
}