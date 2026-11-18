import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../../../context/CartContext";
import { useCheckout } from "../../../../context/CheckoutContext";
import { useMyInfo } from "../../../../context/MyInfoContext";
import Footer from "../../../../components/layout/Footer";
import CartHeader from "../ShoppingCart/components/CartHeader";
import "./CheckoutPage.css";

const EDGE_FUNCTION_URL = import.meta.env.VITE_EDGE_FUNCTION_URL;

/* \p{L} = أي حرف في أي لغة (ä ö ü ß é والعربية...).
   النمط القديم [a-zA-Z\u0600-\u06FF] كان يحذف الأحرف الألمانية: "Müller" ← "Mller" و"Köln" ← "Kln" */
const NAME_CHARS = /[^\p{L}\s\-'.]/gu;
/* Klingelname يقبل الأرقام أيضًا ("Müller 2. OG")، وكان القديم يحذفها */
const FREE_TEXT_CHARS = /[^\p{L}\p{N}\s\-'./&]/gu;
/* "Hauptstraße 12a" ← الشارع + رقم المنزل. لا يطابق "Straße des 17. Juni" لأنها لا تنتهي برقم */
const STREET_WITH_NUMBER = /^(.*\D)\s+(\d+\s?[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?)$/;

const FIELD_ORDER = [
  "firstName", "lastName", "phone", "email",
  "street", "houseNumber", "postalCode", "city", "floor",
];

const fmt = (n) =>
  (Number(n) || 0).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ============================================
   Field — خارج المكوّن الرئيسي (تعريفه بالداخل يعيد بناء الحقل مع كل ضغطة ويفقده التركيز)
   label مربوط بالحقل (htmlFor/id)، والخطأ مربوط بـ aria-describedby
   ============================================ */
function Field({ name, label, error, hint, ...inputProps }) {
  const id = `chk-${name}`;
  return (
    <div className="chk-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        className={error ? "has-error" : ""}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {error ? (
        <span id={`${id}-error`} className="chk-error" role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <small id={`${id}-hint`} className="chk-hint">
            {hint}
          </small>
        )
      )}
    </div>
  );
}

function SectionHeader({ icon, title, sub }) {
  return (
    <div className="chk-section-header">
      <div className="chk-section-icon" aria-hidden="true">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p className="chk-section-sub">{sub}</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { totalPrice, totalWeight, cartItems } = useCart();
  const { checkoutData, updateField, updateFields } = useCheckout();
  const { info } = useMyInfo();

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
        return value.replace(NAME_CHARS, "");
      case "doorbellName":
        return value.replace(FREE_TEXT_CHARS, "");
      case "phone":
        return value.replace(/[^\d+\-\s()]/g, "");
      case "postalCode":
        return value.replace(/\D/g, "").slice(0, 5);
      case "houseNumber":
        return value.replace(/[^\d\w\-/]/g, "").slice(0, 6);
      case "floor":
        return value.replace(/\D/g, "").slice(0, 2);
      case "apartment":
        return value.replace(/[^\d\w-]/g, "").slice(0, 6);
      default:
        return value;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateField(name, validateInput(name, value));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // إزالة الفراغات عند مغادرة الحقل
  // + إن عبّأ المتصفح "Hauptstraße 12a" كاملًا في حقل الشارع (autofill) نفصل الرقم تلقائيًا.
  // على blur فقط وليس أثناء الكتابة: وإلا ينقسم "Straße des 17" قبل أن يكمل المستخدم اسم الشارع.
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const trimmed = value.trim();

    if (name === "street" && !checkoutData.houseNumber) {
      const m = trimmed.match(STREET_WITH_NUMBER);
      if (m) {
        updateFields({
          street: m[1].trim(),
          houseNumber: m[2].replace(/\s+/g, "").slice(0, 6),
        });
        setErrors((prev) => ({ ...prev, street: null, houseNumber: null }));
        return;
      }
    }

    if (value !== trimmed) updateField(name, trimmed);
  };

  // ============================================
  // ✨ Apply Saved Info — بضغطة زر
  // ============================================
  const handleUseSavedInfo = () => {
    const fieldKeys = [
      "firstName", "lastName", "email", "phone",
      "street", "houseNumber", "postalCode", "city",
      "floor", "apartment", "doorbellName", "hasElevator",
    ];

    const hasAnyValue = fieldKeys.some(
      (key) => info?.[key] && info[key] !== "" && info[key] !== "no"
    );

    if (!hasAnyValue) {
      toast.error("Keine gespeicherten Daten vorhanden. Bitte zuerst im Konto speichern.", {
        duration: 3500,
      });
      return;
    }

    const fieldsToApply = {};
    fieldKeys.forEach((key) => {
      if (info[key] !== undefined && info[key] !== null && info[key] !== "") {
        fieldsToApply[key] = info[key];
      }
    });

    updateFields(fieldsToApply);
    setErrors({});

    toast.success("Gespeicherte Daten übernommen! Sie können jedes Feld ändern.", {
      icon: "✨",
      duration: 3000,
    });
  };

  // ============================================
  // حساب الشحن تلقائيًا
  // الطلب القديم كان بلا إلغاء: إن تغيّر العنوان بسرعة قد يصل رد قديم بعد الجديد فيظهر سعر خاطئ.
  // AbortController يلغي الطلب السابق عند كل تغيير (وعند مغادرة الصفحة).
  // ============================================
  useEffect(() => {
    const { street, houseNumber, postalCode, city, floor, hasElevator } = checkoutData;

    if (!street || !houseNumber || !postalCode || !city) {
      updateField("shippingDetails", null);
      setCalculating(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            customerAddress: `${street} ${houseNumber}, ${postalCode} ${city}, Germany`,
            // الخادم يحسب الوزن والمجموع من قاعدة البيانات اعتمادًا على (id, quantity) فقط
            items: cartItems.map(({ id, quantity }) => ({ id, quantity })),
            floor: parseInt(floor) || 0,
            hasElevator: hasElevator === "yes",
            cartSubtotal: totalPrice,
          }),
        });

        const result = await response.json();
        if (controller.signal.aborted) return;

        if (result.success) {
          updateField("shippingDetails", result);
        } else {
          updateField("shippingDetails", null);
          toast.error(result.error, { id: "shipping-error" });
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Shipping calculation failed:", error);
        updateField("shippingDetails", null);
      } finally {
        if (!controller.signal.aborted) setCalculating(false);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    checkoutData.street,
    checkoutData.houseNumber,
    checkoutData.postalCode,
    checkoutData.city,
    checkoutData.floor,
    checkoutData.hasElevator,
    totalPrice,
    totalWeight,
    cartItems,
  ]);

  // ============================================
  // Validation before continue
  // ============================================
  const validateBeforeContinue = () => {
    const newErrors = {};
    const d = checkoutData;

    if (!d.firstName) newErrors.firstName = "Vorname ist erforderlich.";
    if (!d.lastName) newErrors.lastName = "Nachname ist erforderlich.";

    if ((d.phone || "").replace(/\D/g, "").length < 8 || (d.phone || "").replace(/\D/g, "").length > 15) {
      newErrors.phone = "Telefonnummer muss zwischen 8 und 15 Ziffern haben.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
      newErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }

    if (!d.street) newErrors.street = "Straße ist erforderlich.";
    if (!d.houseNumber) newErrors.houseNumber = "Hausnummer ist erforderlich.";

    if (!/^\d{5}$/.test(d.postalCode)) {
      newErrors.postalCode = "Postleitzahl muss genau 5 Ziffern haben.";
    }

    if (!d.city) newErrors.city = "Stadt ist erforderlich.";
    if (!d.floor) newErrors.floor = "Etage ist erforderlich.";

    if (!d.shippingDetails) {
      newErrors.shipping =
        "Versandkosten konnten nicht berechnet werden. Bitte prüfen Sie Ihre Adresse.";
    }

    setErrors(newErrors);
    return newErrors;
  };

  // يقود المستخدم إلى أول حقل خاطئ (بدل الصعود لأعلى الصفحة وتركه يبحث عنه)
  const focusFirstError = (errs) => {
    const first = FIELD_ORDER.find((n) => errs[n]);
    const el = document.getElementById(first ? `chk-${first}` : "chk-shipping");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (first) el.focus({ preventScroll: true });
  };

  // ============================================
  // Continue to DeliveryTime (زر الإرسال أو Enter داخل أي حقل)
  // ============================================
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateBeforeContinue();

    if (Object.keys(errs).length > 0) {
      toast.error("Bitte korrigieren Sie die markierten Felder.");
      focusFirstError(errs);
      return;
    }

    toast.success("Adresse gespeichert! Weiter zum Liefertermin...");
    navigate("/Cart&Payments/DeliveryTime");
  };

  // ============================================
  // Render
  // ============================================
  const shipping = checkoutData.shippingDetails;
  const b = shipping?.breakdown ?? {};
  const bind = (name) => ({
    value: checkoutData[name] ?? "",
    onChange: handleChange,
    onBlur: handleBlur,
    error: errors[name],
  });

  return (
    <div className="chk-container">
      <CartHeader currentStep={currentStep} />

      <main className="chk-main">
        <div className="chk-hero">
          <span className="chk-hero-badge">📍 Schritt 2 von 4</span>
          <h1>Lieferadresse</h1>
          <p>Bitte geben Sie Ihre Kontakt- und Adressdaten ein.</p>
        </div>

        {/* <form>: Enter يتابع، ومدير كلمات المرور/التعبئة التلقائية يتعرف على النموذج */}
        <form className="chk-form" noValidate onSubmit={handleSubmit}>
          <div className="chk-saved-info-bar">
            <span className="material-symbols-outlined" aria-hidden="true">bookmark</span>
            <span className="chk-saved-info-text">
              Zeit sparen – übernehmen Sie Ihre gespeicherten Daten mit einem Klick
            </span>
            <button type="button" className="chk-use-saved-btn" onClick={handleUseSavedInfo}>
              <span className="material-symbols-outlined" aria-hidden="true">auto_fix_high</span>
              Gespeicherte Daten übernehmen
            </button>
          </div>

          <div className="chk-grid">
            {/* --- Personal Info --- */}
            <section className="chk-section">
              <SectionHeader icon="👤" title="Persönliche Daten" sub="Ihre Kontaktdaten" />

              <Field
                name="firstName" label="Vorname *" placeholder="Vorname"
                autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" required
                {...bind("firstName")}
              />
              <Field
                name="lastName" label="Nachname *" placeholder="Nachname"
                autoComplete="family-name" autoCapitalize="words" enterKeyHint="next" required
                {...bind("lastName")}
              />
              <Field
                name="phone" label="Telefon *" type="tel" placeholder="+49 …"
                autoComplete="tel" inputMode="tel" enterKeyHint="next" required
                hint="📞 Zur Lieferkoordination"
                {...bind("phone")}
              />
              <Field
                name="email" label="E-Mail *" type="email" placeholder="E-Mail"
                autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                enterKeyHint="next" required
                {...bind("email")}
              />
            </section>

            {/* --- Address --- */}
            <section className="chk-section">
              <SectionHeader icon="📍" title="Lieferadresse" sub="Wohin soll geliefert werden?" />

              <Field
                name="street" label="Straße *" placeholder="Straße"
                autoComplete="address-line1" autoCapitalize="words" enterKeyHint="next" required
                {...bind("street")}
              />

              <div className="chk-inline-row">
                <Field
                  name="houseNumber" label="Hausnr. *" placeholder="Nr."
                  autoComplete="off" enterKeyHint="next" required
                  {...bind("houseNumber")}
                />
                <Field
                  name="postalCode" label="PLZ *" placeholder="PLZ"
                  autoComplete="postal-code" inputMode="numeric" maxLength={5}
                  enterKeyHint="next" required
                  {...bind("postalCode")}
                />
              </div>

              <Field
                name="city" label="Stadt *" placeholder="Ort / Stadt"
                autoComplete="address-level2" autoCapitalize="words" enterKeyHint="next" required
                {...bind("city")}
              />
            </section>

            {/* --- Access Details --- */}
            <section className="chk-section">
              <SectionHeader
                icon="🏢"
                title="Zugangsdetails"
                sub="Helfen Sie unserem Fahrer, Sie zu finden"
              />

              <div className="chk-inline-row">
                {/* type="number" ← text+inputMode: number يقبل e/+/- ويتغير بعجلة الفأرة */}
                <Field
                  name="floor" label="Etage *" placeholder="Etage"
                  autoComplete="off" inputMode="numeric" enterKeyHint="next" required
                  {...bind("floor")}
                />
                <Field
                  name="apartment" label="Wohnung" placeholder="Wohnung"
                  autoComplete="off" enterKeyHint="next"
                  {...bind("apartment")}
                />
              </div>

              <Field
                name="doorbellName" label="Klingelname" placeholder="Name an der Klingel"
                autoComplete="off" autoCapitalize="words" enterKeyHint="done"
                {...bind("doorbellName")}
              />

              <div className="chk-field">
                <label htmlFor="chk-hasElevator">Aufzug? *</label>
                <select
                  id="chk-hasElevator"
                  name="hasElevator"
                  value={checkoutData.hasElevator}
                  onChange={handleChange}
                  aria-describedby="chk-hasElevator-hint"
                >
                  <option value="no">❌ Kein Aufzug</option>
                  <option value="yes">✅ Mit Aufzug</option>
                </select>
                <small id="chk-hasElevator-hint" className="chk-hint">
                  💡 Beeinflusst die Etagengebühr
                </small>
              </div>
            </section>

            {/* --- Shipping Summary --- */}
            <section
              id="chk-shipping"
              className="chk-section chk-shipping-section"
              aria-live="polite"
              aria-busy={calculating}
            >
              <SectionHeader
                icon="🚚"
                title="Versandkosten"
                sub="Basierend auf Ihrer Adresse berechnet"
              />

              {!checkoutData.street ? (
                <p className="chk-hint">
                  📍 Bitte geben Sie Ihre Adresse ein, um die Versandkosten zu berechnen.
                </p>
              ) : calculating ? (
                <p className="chk-hint">⏳ Versandkosten werden berechnet...</p>
              ) : shipping ? (
                <div className="shipping-breakdown">
                  <div className="breakdown-row">
                    <span>🚗 Entfernung ({shipping.distance} km)</span>
                    <span>{fmt(b.distanceCost)} €</span>
                  </div>
                  {b.weightCost > 0 && (
                    <div className="breakdown-row">
                      <span>⚖️ Gewichtszuschlag</span>
                      <span>{fmt(b.weightCost)} €</span>
                    </div>
                  )}
                  {b.floorCost > 0 && (
                    <div className="breakdown-row">
                      <span>🏢 Etagengebühr ({checkoutData.floor} Etagen)</span>
                      <span>{fmt(b.floorCost)} €</span>
                    </div>
                  )}
                  <div className="breakdown-row total-breakdown">
                    <span>Versand gesamt</span>
                    <span>{fmt(shipping.totalShipping)} €</span>
                  </div>
                </div>
              ) : (
                <p className="chk-hint chk-hint--error">
                  ❌ Versand konnte nicht berechnet werden. Bitte prüfen Sie Ihre Adresse.
                </p>
              )}

              {errors.shipping && (
                <span className="chk-error" role="alert">{errors.shipping}</span>
              )}
            </section>
          </div>

          {/* Actions — على الجوال: شريط ثابت أسفل الشاشة يعرض الإجمالي وزر المتابعة */}
          <div className="chk-actions">
            {shipping && (
              <div className="chk-actions-total">
                <span>Versand gesamt</span>
                <strong>{fmt(shipping.totalShipping)} €</strong>
              </div>
            )}
            <button
              type="button"
              className="chk-btn-cancel"
              onClick={() => navigate("/Cart&Payments")}
              aria-label="Zurück zum Warenkorb"
            >
              <span aria-hidden="true">←</span>
              <span className="chk-btn-cancel-label">Zurück zum Warenkorb</span>
            </button>
            <button
              type="submit"
              className="chk-btn-submit"
              disabled={calculating || !shipping}
            >
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              {calculating ? "Wird berechnet..." : "Weiter zum Liefertermin"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}