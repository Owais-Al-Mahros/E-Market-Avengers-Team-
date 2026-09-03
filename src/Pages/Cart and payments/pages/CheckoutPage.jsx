import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import "./CheckoutPage.css";
import CheckoutPageFooter from "./components/CheckoutPageFooter";
import CheckoutPageHeader from "./components/CheckoutPageHeader";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, totalPrice, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customer, setCustomer] = useState({
    // شخصي
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    // عنوان
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    // وصول
    floor: "",
    apartment: "",
    doorbellName: "",
    hasElevator: "no", // "yes" or "no"
    // وقت
    deliveryDate: "",
    deliveryTime: "",
    deliveryNotes: "",
  });

  // ===== دوال التغيير =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  // ===== حساب التكاليف =====
  const subTotal = totalPrice;
  const shipping = 5.99;
  const tax = subTotal * 0.07;
  const floorFee = parseFloat(customer.floor || 0) * 1.5;
  const total = subTotal + shipping + tax + floorFee;

  // ===== إنشاء رقم طلب فريد =====
  const generateOrderNumber = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${date}-${random}`;
  };

  // ===== تأكيد الطلب وحفظه في قاعدة البيانات =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من الحقول الإلزامية (نفسها)
    if (
      !customer.firstName ||
      !customer.lastName ||
      !customer.phone ||
      !customer.email
    ) {
      toast.error("Please fill in all required personal fields.");
      return;
    }
    if (
      !customer.street ||
      !customer.houseNumber ||
      !customer.postalCode ||
      !customer.city
    ) {
      toast.error("Please fill in all required address fields.");
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

    setIsSubmitting(true);

    try {
      // 1. بناء كائن بيانات الطلب (مطابق لأسماء الأعمدة في قاعدة البيانات)
      const orderData = {
        customer_id: null, // سيُربط لاحقاً بحساب العميل
        order_number: generateOrderNumber(),
        status: "pending", // ✅ مهم جداً: ينتظر موافقة الأدمن
        order_date: new Date().toISOString(), // ✅ تاريخ الطلب (يمكن أن يكون نفس created_at)

        // ✅ معلومات العميل (JSONB)
        customer_info: {
          first_name: customer.firstName,
          last_name: customer.lastName,
          phone: customer.phone,
          email: customer.email,
        },

        // ✅ عنوان التوصيل (JSONB)
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
        },

        // ✅ التكاليف
        shipping_cost: shipping,
        floor_fee: floorFee,
        tax: tax,
        total_price: total,

        // ✅ الدفع والتوصيل
        payment_method: "cod",
        delivery_date: customer.deliveryDate,
        delivery_time: customer.deliveryTime,

        // ✅ الكوبونات (فارغة حالياً)
        coupon_code: null,
        discount_type: null,
        discount_value: null,
        discount_amount: 0,
      };

      // 2. إدراج الطلب في جدول orders
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error("❌ Order insertion error:", orderError);
        throw new Error(orderError.message);
      }

      // 3. بناء بيانات بنود الطلب (order_items)
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

      // 4. إدراج بنود الطلب
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("❌ Order items insertion error:", itemsError);
        throw new Error(itemsError.message);
      }

      // 5. نجاح العملية
      toast.success(`✅ Order ${order.order_number} submitted successfully!`);
      console.log(
        "📦 Order Data being sent:",
        JSON.stringify(orderData, null, 2),
      );
      clearCart();
      navigate(`/Cart&Payments/order-confirmation/${order.id}`);
    } catch (error) {
      console.error("❌ Order submission failed:", error);
      toast.error(`Failed to submit order: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="chk-container">
      {/* ===== NAVBAR ===== */}
        <CheckoutPageHeader />

      {/* ===== MAIN ===== */}
      <main className="chk-main">
        {/* ===== HEADER ===== */}
        <div className="chk-header">
          <h1>📋 Complete Your Order</h1>
          <p>
            Fill in your details below. All fields marked with * are required.
          </p>
        </div>

        {/* ===== PROGRESS BAR ===== */}
        <div className="chk-progress">
          <span className="chk-step active">🛒 Cart</span>
          <span className="chk-step active">📝 Details</span>
          <span className="chk-step">💳 Payment</span>
          <span className="chk-step">✅ Confirmation</span>
        </div>

        {/* ===== TWO-COLUMN LAYOUT ===== */}
        <div className="chk-layout">
          {/* ===== LEFT: FORM ===== */}
          <form className="chk-form" onSubmit={handleSubmit}>
            {/* --- Personal Info --- */}
            <div className="chk-section">
              <h3>👤 Personal Information</h3>
              <div className="chk-row">
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
              </div>
              <div className="chk-row">
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
                  <small className="chk-hint">
                    📞 For delivery coordination
                  </small>
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
            </div>

            {/* --- Delivery Address --- */}
            <div className="chk-section">
              <h3>📍 Delivery Address</h3>
              <div className="chk-row">
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
                <div className="chk-field">
                  <label>House No. *</label>
                  <input
                    type="text"
                    name="houseNumber"
                    value={customer.houseNumber}
                    onChange={handleChange}
                    placeholder="Hausnummer"
                    required
                  />
                </div>
              </div>
              <div className="chk-row">
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
            </div>

            {/* --- Access Details --- */}
            <div className="chk-section">
              <h3>🏢 Access Details</h3>
              <div className="chk-row">
                <div className="chk-field">
                  <label>Floor *</label>
                  <input
                    type="number"
                    name="floor"
                    value={customer.floor}
                    onChange={handleChange}
                    placeholder="Etage (e.g., 3)"
                    required
                  />
                  <small className="chk-hint">
                    💡 €1.50 per floor will be added
                  </small>
                </div>
                <div className="chk-field">
                  <label>Apartment (optional)</label>
                  <input
                    type="text"
                    name="apartment"
                    value={customer.apartment}
                    onChange={handleChange}
                    placeholder="Wohnungsnummer"
                  />
                </div>
              </div>
              <div className="chk-row">
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
                    <option value="no">❌ No</option>
                    <option value="yes">✅ Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* --- Delivery Time --- */}
            <div className="chk-section">
              <h3>🕒 Delivery Time</h3>
              <div className="chk-row">
                <div className="chk-field">
                  <label>Delivery Date *</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={customer.deliveryDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="chk-field">
                  <label>Delivery Time *</label>
                  <input
                    type="time"
                    name="deliveryTime"
                    value={customer.deliveryTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="chk-field chk-full">
                <label>Delivery Notes (optional)</label>
                <textarea
                  name="deliveryNotes"
                  value={customer.deliveryNotes}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Eingang befindet sich hinter dem Gebäude. Bitte bei Müller klingeln."
                ></textarea>
              </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="chk-actions">
              <button
                type="button"
                className="chk-btn-cancel"
                onClick={() => navigate("/cart")}
              >
                ← Back to Cart
              </button>
              <button
                type="submit"
                className="chk-btn-submit"
                disabled={isSubmitting}
              >
                <span className="material-symbols-outlined">lock</span>
                {isSubmitting ? "Submitting..." : "Confirm Order 🚀"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <CheckoutPageFooter />
    </div>
  );
}
