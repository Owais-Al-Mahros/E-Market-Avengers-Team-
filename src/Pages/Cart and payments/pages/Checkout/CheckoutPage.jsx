import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { useCheckout } from "../../../../context/CheckoutContext";
import toast from "react-hot-toast";
import Footer from "./../../../../Components/Footer";
import CartHeader from "../ShoppingCart/components/CartHeader";
import "./CheckoutPage.css";

const EDGE_FUNCTION_URL = import.meta.env.VITE_EDGE_FUNCTION_URL;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { totalPrice, totalWeight } = useCart();
  const { checkoutData, updateField, updateFields, isAddressComplete } =
    useCheckout();

  const [calculating, setCalculating] = useState(false);
  const [errors, setErrors] = useState({});

  const currentStep = 2; // Address

  // ============================================
  // Input Validation
  // ============================================
  const validateInput = (name, value) => {
    switch (name) {
      case "firstName":
      case "lastName":
      case "city":
      case "doorbellName":
        return value.replace(/[^a-zA-Z\u0600-\u06FF\s\-'.]/g, "");
      case "phone":
        return value.replace(/[^\d+\-\s()]/g, "");
      case "postalCode":
        return value.replace(/\D/g, "").slice(0, 5);
      case "houseNumber":
        return value.replace(/[^\d\w\-\/]/g, "").slice(0, 6);
      case "floor":
        return value.replace(/\D/g, "").slice(0, 2);
      case "apartment":
        return value.replace(/[^\d\w\-]/g, "").slice(0, 6);
      default:
        return value;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = validateInput(name, value);
    updateField(name, cleanValue);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // ============================================
  // حساب الشحن تلقائياً
  // ============================================
  useEffect(() => {
    const {
      street,
      houseNumber,
      postalCode,
      city,
      floor,
      hasElevator,
    } = checkoutData;

    if (!street || !houseNumber || !postalCode || !city) {
      updateField("shippingDetails", null);
      return;
    }

    const timer = setTimeout(() => {
      calculateShipping();
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    checkoutData.street,
    checkoutData.houseNumber,
    checkoutData.postalCode,
    checkoutData.city,
    checkoutData.floor,
    checkoutData.hasElevator,
  ]);

  const calculateShipping = async () => {
    setCalculating(true);
    try {
      const { street, houseNumber, postalCode, city, floor, hasElevator } =
        checkoutData;

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          customerAddress: `${street} ${houseNumber}, ${postalCode} ${city}, Germany`,
          itemsWeight: totalWeight,
          floor: parseInt(floor) || 0,
          hasElevator: hasElevator === "yes",
          cartSubtotal: totalPrice,
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateField("shippingDetails", result);
      } else {
        updateField("shippingDetails", null);
        toast.error(result.error, { id: "shipping-error" });
      }
    } catch (error) {
      console.error("Shipping calculation failed:", error);
      updateField("shippingDetails", null);
    } finally {
      setCalculating(false);
    }
  };

  // ============================================
  // Validation before continue
  // ============================================
  const validateBeforeContinue = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(checkoutData.email)) {
      newErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }

    const phoneDigits = (checkoutData.phone || "").replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      newErrors.phone = "Telefonnummer muss zwischen 8 und 15 Ziffern haben.";
    }

    if (!/^\d{5}$/.test(checkoutData.postalCode)) {
      newErrors.postalCode = "Postleitzahl muss genau 5 Ziffern haben.";
    }

    if (!checkoutData.firstName || !checkoutData.lastName) {
      newErrors.firstName = "Vor- und Nachname sind erforderlich.";
    }

    if (!checkoutData.street || !checkoutData.houseNumber) {
      newErrors.street = "Straße und Hausnummer sind erforderlich.";
    }

    if (!checkoutData.city) {
      newErrors.city = "Stadt ist erforderlich.";
    }

    if (!checkoutData.floor || !checkoutData.doorbellName) {
      newErrors.floor = "Etage und Klingelname sind erforderlich.";
    }

    if (!checkoutData.shippingDetails) {
      newErrors.shipping =
        "Versandkosten konnten nicht berechnet werden. Bitte prüfen Sie Ihre Adresse.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // Continue to DeliveryTime
  // ============================================
  const handleContinue = () => {
    if (!validateBeforeContinue()) {
      toast.error("Bitte korrigieren Sie die markierten Felder.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    toast.success("Adresse gespeichert! Weiter zum Liefertermin...");
    navigate("/Cart&Payments/DeliveryTime");
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div className="chk-container">
      <CartHeader currentStep={currentStep} />

      <main className="chk-main">
        {/* Hero */}
        <div className="chk-hero">
          <span className="chk-hero-badge">📍 Schritt 2 von 4</span>
          <h1>Lieferadresse</h1>
          <p>Bitte geben Sie Ihre Kontakt- und Adressdaten ein.</p>
        </div>

        <div className="chk-form">
          {/* Grid 2x2 */}
          <div className="chk-grid">
            {/* --- Personal Info --- */}
            <div className="chk-section">
              <div className="chk-section-header">
                <div className="chk-section-icon">👤</div>
                <div>
                  <h3>Persönliche Daten</h3>
                  <p className="chk-section-sub">Ihre Kontaktdaten</p>
                </div>
              </div>

              <div className="chk-field">
                <label>Vorname *</label>
                <input
                  type="text"
                  name="firstName"
                  value={checkoutData.firstName}
                  onChange={handleChange}
                  placeholder="Vorname"
                  className={errors.firstName ? "has-error" : ""}
                />
                {errors.firstName && (
                  <span className="chk-error">{errors.firstName}</span>
                )}
              </div>

              <div className="chk-field">
                <label>Nachname *</label>
                <input
                  type="text"
                  name="lastName"
                  value={checkoutData.lastName}
                  onChange={handleChange}
                  placeholder="Nachname"
                  className={errors.lastName ? "has-error" : ""}
                />
                {errors.lastName && (
                  <span className="chk-error">{errors.lastName}</span>
                )}
              </div>

              <div className="chk-field">
                <label>Telefon *</label>
                <input
                  type="tel"
                  name="phone"
                  value={checkoutData.phone}
                  onChange={handleChange}
                  placeholder="+49 …"
                  className={errors.phone ? "has-error" : ""}
                />
                {errors.phone ? (
                  <span className="chk-error">{errors.phone}</span>
                ) : (
                  <small className="chk-hint">📞 Zur Lieferkoordination</small>
                )}
              </div>

              <div className="chk-field">
                <label>E-Mail *</label>
                <input
                  type="email"
                  name="email"
                  value={checkoutData.email}
                  onChange={handleChange}
                  placeholder="E-Mail"
                  className={errors.email ? "has-error" : ""}
                />
                {errors.email && (
                  <span className="chk-error">{errors.email}</span>
                )}
              </div>
            </div>

            {/* --- Address --- */}
            <div className="chk-section">
              <div className="chk-section-header">
                <div className="chk-section-icon">📍</div>
                <div>
                  <h3>Lieferadresse</h3>
                  <p className="chk-section-sub">Wohin soll geliefert werden?</p>
                </div>
              </div>

              <div className="chk-field">
                <label>Straße *</label>
                <input
                  type="text"
                  name="street"
                  value={checkoutData.street}
                  onChange={handleChange}
                  placeholder="Straße"
                  className={errors.street ? "has-error" : ""}
                />
                {errors.street && (
                  <span className="chk-error">{errors.street}</span>
                )}
              </div>

              <div className="chk-inline-row">
                <div className="chk-field">
                  <label>Hausnr. *</label>
                  <input
                    type="text"
                    name="houseNumber"
                    value={checkoutData.houseNumber}
                    onChange={handleChange}
                    placeholder="Nr."
                  />
                </div>
                <div className="chk-field">
                  <label>PLZ *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={checkoutData.postalCode}
                    onChange={handleChange}
                    placeholder="PLZ"
                    className={errors.postalCode ? "has-error" : ""}
                  />
                  {errors.postalCode && (
                    <span className="chk-error">{errors.postalCode}</span>
                  )}
                </div>
              </div>

              <div className="chk-field">
                <label>Stadt *</label>
                <input
                  type="text"
                  name="city"
                  value={checkoutData.city}
                  onChange={handleChange}
                  placeholder="Ort / Stadt"
                  className={errors.city ? "has-error" : ""}
                />
                {errors.city && <span className="chk-error">{errors.city}</span>}
              </div>
            </div>

            {/* --- Access Details --- */}
            <div className="chk-section">
              <div className="chk-section-header">
                <div className="chk-section-icon">🏢</div>
                <div>
                  <h3>Zugangsdetails</h3>
                  <p className="chk-section-sub">
                    Helfen Sie unserem Fahrer, Sie zu finden
                  </p>
                </div>
              </div>

              <div className="chk-inline-row">
                <div className="chk-field">
                  <label>Etage *</label>
                  <input
                    type="number"
                    name="floor"
                    value={checkoutData.floor}
                    onChange={handleChange}
                    placeholder="Etage"
                    className={errors.floor ? "has-error" : ""}
                  />
                </div>
                <div className="chk-field">
                  <label>Wohnung</label>
                  <input
                    type="text"
                    name="apartment"
                    value={checkoutData.apartment}
                    onChange={handleChange}
                    placeholder="Wohnung"
                  />
                </div>
              </div>

              <div className="chk-field">
                <label>Klingelname *</label>
                <input
                  type="text"
                  name="doorbellName"
                  value={checkoutData.doorbellName}
                  onChange={handleChange}
                  placeholder="Name an der Klingel"
                  className={errors.doorbellName ? "has-error" : ""}
                />
                {errors.doorbellName && (
                  <span className="chk-error">{errors.doorbellName}</span>
                )}
              </div>

              <div className="chk-field">
                <label>Aufzug? *</label>
                <select
                  name="hasElevator"
                  value={checkoutData.hasElevator}
                  onChange={handleChange}
                >
                  <option value="no">❌ Kein Aufzug</option>
                  <option value="yes">✅ Mit Aufzug</option>
                </select>
                <small className="chk-hint">
                  💡 Beeinflusst die Etagengebühr
                </small>
              </div>

              <div className="chk-field">
                <label>Notizen (optional)</label>
                <textarea
                  name="deliveryNotes"
                  value={checkoutData.deliveryNotes}
                  onChange={handleChange}
                  placeholder="z.B. 'Bitte leise klingeln'"
                  rows="2"
                />
              </div>
            </div>

            {/* --- Shipping Summary --- */}
            <div className="chk-section chk-shipping-section">
              <div className="chk-section-header">
                <div className="chk-section-icon">🚚</div>
                <div>
                  <h3>Versandkosten</h3>
                  <p className="chk-section-sub">
                    Basierend auf Ihrer Adresse berechnet
                  </p>
                </div>
              </div>

              {!checkoutData.street ? (
                <p className="chk-hint">
                  📍 Bitte geben Sie Ihre Adresse ein, um die Versandkosten zu
                  berechnen.
                </p>
              ) : calculating ? (
                <p className="chk-hint">⏳ Versandkosten werden berechnet...</p>
              ) : checkoutData.shippingDetails ? (
                <div className="shipping-breakdown">
                  <div className="breakdown-row">
                    <span>
                      🚗 Entfernung (
                      {checkoutData.shippingDetails.distance} km)
                    </span>
                    <span>
                      €
                      {checkoutData.shippingDetails.breakdown.distanceCost.toFixed(
                        2
                      )}
                    </span>
                  </div>
                  {checkoutData.shippingDetails.breakdown.weightCost > 0 && (
                    <div className="breakdown-row">
                      <span>⚖️ Gewichtszuschlag</span>
                      <span>
                        €
                        {checkoutData.shippingDetails.breakdown.weightCost.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  )}
                  {checkoutData.shippingDetails.breakdown.floorCost > 0 && (
                    <div className="breakdown-row">
                      <span>
                        🏢 Etagengebühr ({checkoutData.floor} Etagen)
                      </span>
                      <span>
                        €
                        {checkoutData.shippingDetails.breakdown.floorCost.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  )}
                  <div className="breakdown-row total-breakdown">
                    <span>Versand gesamt</span>
                    <span>
                      €{checkoutData.shippingDetails.totalShipping.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="chk-hint" style={{ color: "var(--danger-color)" }}>
                  ❌ Versand konnte nicht berechnet werden. Bitte prüfen Sie Ihre
                  Adresse.
                </p>
              )}

              {errors.shipping && (
                <span className="chk-error">{errors.shipping}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="chk-actions">
            <button
              type="button"
              className="chk-btn-cancel"
              onClick={() => navigate("/Cart&Payments")}
            >
              ← Zurück zum Warenkorb
            </button>
            <button
              type="button"
              className="chk-btn-submit"
              onClick={handleContinue}
              disabled={calculating || !checkoutData.shippingDetails}
            >
              <span className="material-symbols-outlined">arrow_forward</span>
              {calculating ? "Wird berechnet..." : "Weiter zum Liefertermin"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}