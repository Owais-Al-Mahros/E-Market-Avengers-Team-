import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import "./CheckoutPage.css";
import CheckoutPageFooter from "../../components/CheckoutPageFooter/CheckoutPageFooter";
import CartHeader from "../ShoppingCart/components/CartHeader";
import DeliveryTime from "../../modals/DeliveryTime";

const EDGE_FUNCTION_URL = import.meta.env.VITE_EDGE_FUNCTION_URL;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, totalPrice, totalWeight, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingDetails, setShippingDetails] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // ✅ الخطوة الحالية للهيدر
  const [currentStep, setCurrentStep] = useState(2);

  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    floor: "",
    apartment: "",
    doorbellName: "",
    hasElevator: "no",
    deliveryDate: "",
    deliveryTime: "",
    deliveryNotes: "",
  });
  // ============================================
  // ✅ التحقق من صحة المدخلات حسب نوع الحقل
  // ============================================
  const validateInput = (name, value) => {
    switch (name) {
      case "firstName":
      case "lastName":
      case "city":
      case "doorbellName":
        // حروف عربية وإنجليزية ومسافات وشرطات فقط
        return value.replace(/[^a-zA-Z\u0600-\u06FF\s\-'.]/g, "");

      case "phone":
        // أرقام و + و - و مسافات فقط
        return value.replace(/[^\d+\-\s()]/g, "");

      case "postalCode":
        // أرقام فقط، بحد أقصى 5 خانات (ألمانيا)
        return value.replace(/\D/g, "").slice(0, 5);

      case "houseNumber":
        // أرقام وحروف (مثل: 12a، 5b)
        return value.replace(/[^\d\w\-\/]/g, "").slice(0, 6);

      case "floor":
        // أرقام فقط، بحد أقصى رقمين
        return value.replace(/\D/g, "").slice(0, 2);

      case "apartment":
        // أرقام وحروف فقط
        return value.replace(/[^\d\w\-]/g, "").slice(0, 6);

      case "email":
        // لا قيود (سيتم التحقق عند الإرسال)
        return value;

      default:
        return value;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = validateInput(name, value);
    setCustomer((prev) => ({ ...prev, [name]: cleanValue }));
  };


  // ============================================
  // ✅ تحديث الخطوة تلقائياً حسب تقدم المستخدم
  // ============================================
  useEffect(() => {
    const addressComplete =
      customer.street &&
      customer.houseNumber &&
      customer.postalCode &&
      customer.city;

    const deliveryComplete = customer.deliveryDate && customer.deliveryTime;
    const shippingComplete = shippingDetails !== null;

    if (shippingComplete && deliveryComplete && addressComplete) {
      setCurrentStep(4); // Payment
    } else if (deliveryComplete && addressComplete) {
      setCurrentStep(3); // Delivery Date
    } else {
      setCurrentStep(2); // Address
    }
  }, [
    customer.street,
    customer.houseNumber,
    customer.postalCode,
    customer.city,
    customer.deliveryDate,
    customer.deliveryTime,
    shippingDetails,
  ]);

  // ============================================
  // ✅ حساب الشحن تلقائياً عند اكتمال العنوان
  // ============================================
  useEffect(() => {
    if (
      !customer.street ||
      !customer.houseNumber ||
      !customer.postalCode ||
      !customer.city
    ) {
      setShippingDetails(null);
      return;
    }

    const timer = setTimeout(() => {
      calculateShipping();
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customer.street,
    customer.houseNumber,
    customer.postalCode,
    customer.city,
    customer.floor,
    customer.hasElevator,
  ]);

  const calculateShipping = async () => {
    setCalculating(true);
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          customerAddress: `${customer.street} ${customer.houseNumber}, ${customer.postalCode} ${customer.city}, Germany`,
          itemsWeight: totalWeight,
          floor: parseInt(customer.floor) || 0,
          hasElevator: customer.hasElevator === "yes",
          cartSubtotal: totalPrice,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShippingDetails(result);
      } else {
        setShippingDetails(null);
        toast.error(result.error, { id: "shipping-error" });
      }
    } catch (error) {
      console.error("Shipping calculation failed:", error);
      setShippingDetails(null);
    } finally {
      setCalculating(false);
    }
  };

  // ============================================
  // ✅ التكاليف: نستخدم القيم من السيرفر
  // ============================================
  const subTotal = totalPrice;
  const shipping = shippingDetails?.totalShipping || 0;
  const tax = subTotal * 0.07;
  const total = subTotal + shipping + tax;

  // ============================================
  // إنشاء رقم طلب فريد
  // ============================================
  const generateOrderNumber = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${date}-${random}`;
  };

  // ============================================
  // تأكيد الطلب وحفظه في قاعدة البيانات
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ===== ✅ تحقق من صيغة البريد الإلكتروني =====
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // ===== ✅ تحقق من رقم الهاتف =====
    const phoneDigits = customer.phone.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      toast.error("Please enter a valid phone number (8-15 digits).");
      return;
    }

    // ===== ✅ تحقق من الرمز البريدي الألماني (5 أرقام) =====
    if (!/^\d{5}$/.test(customer.postalCode)) {
      toast.error("Postal code must be exactly 5 digits (German format).");
      return;
    }

    // ===== باقي التحققات الأصلية =====
    if (!customer.firstName || !customer.lastName) {
      toast.error("Please fill in your first and last name.");
      return;
    }
    if (!customer.street || !customer.houseNumber) {
      toast.error("Please fill in street and house number.");
      return;
    }
    if (!customer.city) {
      toast.error("Please fill in your city.");
      return;
    }
    if (!customer.floor || !customer.doorbellName) {
      toast.error("Please fill in access details (floor and doorbell name).");
      return;
    }
    if (!customer.deliveryDate || !customer.deliveryTime) {
      toast.error("Please select a delivery date and time.");
      return;
    }
    if (!shippingDetails) {
      toast.error("Please wait for shipping calculation or check your address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customer_id: null,
        order_number: generateOrderNumber(),
        status: "pending",
        order_date: new Date().toISOString(),

        customer_info: {
          first_name: customer.firstName,
          last_name: customer.lastName,
          phone: customer.phone,
          email: customer.email,
        },

        shipping_address: {
          street: customer.street,
          house_number: customer.houseNumber,
          postal_code: customer.postalCode,
          city: customer.city,
          floor: customer.floor,
          apartment: customer.apartment || "",
          doorbell_name: customer.doorbellName,
          has_elevator: customer.hasElevator === "yes",
          notes: customer.deliveryNotes || "",
          distance_km: shippingDetails.distance,
          breakdown: {
            distance_cost: shippingDetails.breakdown.distanceCost,
            weight_cost: shippingDetails.breakdown.weightCost,
            floor_cost: shippingDetails.breakdown.floorCost,
          },
        },

        shipping_cost: shippingDetails.totalShipping,
        floor_fee: shippingDetails.breakdown.floorCost,
        tax: tax,
        total_price: total,

        payment_method: "cod",
        delivery_date: customer.deliveryDate,
        delivery_time: customer.deliveryTime,

        coupon_code: null,
        discount_type: null,
        discount_value: null,
        discount_amount: 0,
      };

      // 1. إدراج الطلب
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw new Error(orderError.message);

      // 2. إدراج بنود الطلب
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        product_name: item.name,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        weight: item.weight || null,
        total_weight: (item.weight || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);

      // 3. الحفظ في localStorage والانتقال
      if (order) {
        localStorage.setItem(
          "lastOrder",
          JSON.stringify({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
          })
        );

        const orderHistory = JSON.parse(localStorage.getItem("orderHistory") || "[]");
        const exists = orderHistory.some((o) => o.id === order.id);
        if (!exists) {
          orderHistory.push({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            created_at: order.created_at,
          });
          localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
        }

        toast.success(`✅ Order ${order.order_number} submitted successfully!`);
        clearCart();
        navigate(`/Cart&Payments/order-confirmation/${order.id}`);
      }
    } catch (error) {
      console.error("❌ Order submission failed:", error);
      toast.error(`Failed to submit order: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="chk-container">
      <CartHeader currentStep={currentStep} />

      <main className="chk-main">
        {/* ===== Hero ===== */}
        <div className="chk-hero">
          <span className="chk-hero-badge">🔒 Secure Checkout</span>
          <h1>Complete Your Order</h1>
          <p>Fill in your details to finalize your purchase.</p>
        </div>

        <form className="chk-form" onSubmit={handleSubmit}>
          {/* ============================================
              🎯 Grid 2x2 من البطاقات
          ============================================ */}
          <div className="chk-grid">
            {/* --- Personal Info --- */}
            <div className="chk-section">
              <div className="chk-section-header">
                <div className="chk-section-icon">👤</div>
                <div>
                  <h3>Personal Info</h3>
                  <p className="chk-section-sub">Your contact details</p>
                </div>
              </div>
              <div className="chk-field">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={customer.firstName}
                  onChange={handleChange}
                  placeholder="Vorname"
                  required
                />
              </div>
              <div className="chk-field">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={customer.lastName}
                  onChange={handleChange}
                  placeholder="Nachname"
                  required
                />
              </div>
              <div className="chk-field">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={customer.phone}
                  onChange={handleChange}
                  placeholder="+49 …"
                  required
                />
                <small className="chk-hint">📞 For delivery coordination</small>
              </div>
              <div className="chk-field">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={customer.email}
                  onChange={handleChange}
                  placeholder="E-Mail"
                  required
                />
              </div>
            </div>

            {/* --- Address --- */}
            <div className="chk-section">
              <div className="chk-section-header">
                <div className="chk-section-icon">📍</div>
                <div>
                  <h3>Delivery Address</h3>
                  <p className="chk-section-sub">Where to deliver your order</p>
                </div>
              </div>
              <div className="chk-field">
                <label>Street *</label>
                <input
                  type="text"
                  name="street"
                  value={customer.street}
                  onChange={handleChange}
                  placeholder="Straße"
                  required
                />
              </div>
              <div className="chk-inline-row">
                <div className="chk-field">
                  <label>House No. *</label>
                  <input
                    type="text"
                    name="houseNumber"
                    value={customer.houseNumber}
                    onChange={handleChange}
                    placeholder="Nr."
                    required
                  />
                </div>
                <div className="chk-field">
                  <label>Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={customer.postalCode}
                    onChange={handleChange}
                    placeholder="PLZ"
                    required
                  />
                </div>
              </div>
              <div className="chk-field">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={customer.city}
                  onChange={handleChange}
                  placeholder="Ort / Stadt"
                  required
                />
              </div>
            </div>

            {/* --- Access Details --- */}
            <div className="chk-section">
              <div className="chk-section-header">
                <div className="chk-section-icon">🏢</div>
                <div>
                  <h3>Access Details</h3>
                  <p className="chk-section-sub">Help our driver find your door</p>
                </div>
              </div>
              <div className="chk-inline-row">
                <div className="chk-field">
                  <label>Floor *</label>
                  <input
                    type="number"
                    name="floor"
                    value={customer.floor}
                    onChange={handleChange}
                    placeholder="Etage"
                    required
                  />
                </div>
                <div className="chk-field">
                  <label>Apartment</label>
                  <input
                    type="text"
                    name="apartment"
                    value={customer.apartment}
                    onChange={handleChange}
                    placeholder="Wohnung"
                  />
                </div>
              </div>
              <div className="chk-field">
                <label>Doorbell Name *</label>
                <input
                  type="text"
                  name="doorbellName"
                  value={customer.doorbellName}
                  onChange={handleChange}
                  placeholder="Name an der Klingel"
                  required
                />
              </div>
              <div className="chk-field">
                <label>Elevator? *</label>
                <select
                  name="hasElevator"
                  value={customer.hasElevator}
                  onChange={handleChange}
                  required
                >
                  <option value="no">❌ No Elevator</option>
                  <option value="yes">✅ Has Elevator</option>
                </select>
                <small className="chk-hint">💡 Affects floor fee</small>
              </div>
            </div>

            {/* --- Delivery Time --- */}
            <div className="chk-section">
              <div className="chk-section-header">
                <div className="chk-section-icon">🕒</div>
                <div>
                  <h3>Delivery Time</h3>
                  <p className="chk-section-sub">Choose your preferred slot</p>
                </div>
              </div>
              <DeliveryTime
                onSelect={(time) => {
                  setCustomer((prev) => ({
                    ...prev,
                    deliveryDate: time.date,
                    deliveryTime: time.start,
                  }));
                }}
              />
              {customer.deliveryDate && customer.deliveryTime && (
                <div className="chk-selected-time">
                  ✅ <strong>{customer.deliveryDate}</strong> · <strong>{customer.deliveryTime}</strong>
                </div>
              )}
            </div>
          </div>

          {/* ============================================
              🚚 Shipping Summary (Full Width)
          ============================================ */}
          <div className="chk-section chk-shipping-section">
            <div className="chk-section-header">
              <div className="chk-section-icon">🚚</div>
              <div>
                <h3>Shipping Summary</h3>
                <p className="chk-section-sub">Calculated based on your address</p>
              </div>
            </div>

            {!customer.street ? (
              <p className="chk-hint">📍 Please enter your address above to calculate shipping.</p>
            ) : calculating ? (
              <p className="chk-hint">⏳ Calculating shipping costs...</p>
            ) : shippingDetails ? (
              <div className="shipping-breakdown">
                <div className="breakdown-row">
                  <span>🚗 Distance ({shippingDetails.distance} km)</span>
                  <span>€{shippingDetails.breakdown.distanceCost.toFixed(2)}</span>
                </div>
                {shippingDetails.breakdown.weightCost > 0 && (
                  <div className="breakdown-row">
                    <span>⚖️ Extra weight fee</span>
                    <span>€{shippingDetails.breakdown.weightCost.toFixed(2)}</span>
                  </div>
                )}
                {shippingDetails.breakdown.floorCost > 0 && (
                  <div className="breakdown-row">
                    <span>🏢 Floor fee ({customer.floor} floors)</span>
                    <span>€{shippingDetails.breakdown.floorCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="breakdown-row total-breakdown">
                  <span>Total Shipping</span>
                  <span>€{shippingDetails.totalShipping.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="chk-hint" style={{ color: "var(--danger-color)" }}>
                ❌ Shipping could not be calculated. Please check your address.
              </p>
            )}
          </div>

          {/* ============================================
              Actions (Full Width)
          ============================================ */}
          <div className="chk-actions">
            <button
              type="button"
              className="chk-btn-cancel"
              onClick={() => navigate("/Cart&Payments")}
            >
              ← Back to Cart
            </button>
            <button
              type="submit"
              className="chk-btn-submit"
              disabled={isSubmitting || !shippingDetails || calculating}
            >
              <span className="material-symbols-outlined">lock</span>
              {isSubmitting
                ? "Submitting..."
                : calculating
                  ? "Calculating..."
                  : "Confirm Order"}
            </button>
          </div>

          {!shippingDetails && customer.street && !calculating && (
            <p className="chk-final-status error">
              ❌ Please check your address before continuing
            </p>
          )}
        </form>
      </main>

      <CheckoutPageFooter />
    </div>
  );
}