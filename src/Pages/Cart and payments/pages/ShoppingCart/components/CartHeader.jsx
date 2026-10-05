// src/Pages/Cart and payments/pages/ShoppingCart/components/CartHeader.jsx
import { Link } from "react-router-dom";
import "./CartHeader.css";
import BackButton from "../../../../../components/ui/BackButton";

const STEPS = [
  { id: 1, label: "Warenkorb" },
  { id: 2, label: "Adresse" },
  { id: 3, label: "Liefertermin" },
  { id: 4, label: "Zahlung" },
  { id: 5, label: "Bestellung" },
];

export default function CartHeader({ currentStep }) {
  return (
    <header className="cart-header">
      <div className="cart-header-inner">
        {/* ===== Left: Logo ===== */}
        <Link to="/" className="cart-header-logo">
          <img src="/logo.png" alt="Shopora" className="cart-header-logo-img" />
          <span className="cart-header-brand">Shopora</span>
        </Link>

        {/* ===== Center: Steps ===== */}
        <div className="cart-header-steps">
          {STEPS.map((step, idx) => {
            const isActive = step.id === currentStep;
            const isPast = step.id < currentStep;
            return (
              <div key={step.id} className="cart-header-step">
                <div
                  className={`cart-header-circle ${isActive ? "active" : ""} ${isPast ? "past" : ""
                    }`}
                >
                  {isPast ? "✓" : step.id}
                </div>
                <span
                  className={`cart-header-step-label ${isActive ? "active" : ""}`}
                >
                  {step.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`cart-header-step-line ${isPast ? "past-step" : ""}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ===== Right: Secure ===== */}
        <div className="cart-header-left-container">
          <div className="cart-header-secure">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <span>Sichere Bestellung</span>
          </div>
          <BackButton label={"Back"} />
        </div>
      </div>
    </header>
  );
}
