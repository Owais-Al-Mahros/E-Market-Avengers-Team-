import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import "./CheckoutPage.css";

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { cartItems, totalPrice, clearCart } = useCart();

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

    // ===== حساب التكاليف (مؤقتة) =====
    const subTotal = totalPrice;
    const shipping = 5.99;
    const tax = subTotal * 0.07;
    const floorFee = parseFloat(customer.floor || 0) * 1.5;
    const total = subTotal + shipping + tax + floorFee;

    // ===== تأكيد الطلب (سيتم ربطه لاحقاً) =====
    const handleSubmit = (e) => {
        e.preventDefault();
        alert("✅ Order submitted! (Data will be saved to database later)");
        console.log("📦 Customer Data:", customer);
        console.log("🛒 Cart Items:", cartItems);
        console.log("💰 Total:", total);
        // clearCart(); // سيتم تفعيله لاحقاً
        // navigate("/order-confirmation");
    };

    return (
        <div className="chk-container">

            {/* ===== NAVBAR ===== */}
            <nav className="chk-navbar">
                <div className="chk-nav-left">
                    <span className="chk-brand">GreenCart</span>
                    <span className="chk-brand-sub">⚡ Secure Checkout</span>
                </div>
                <div className="chk-nav-right">
                    <Link to="/" className="chk-nav-link">Home</Link>
                    <button className="chk-nav-btn">
                        <span className="material-symbols-outlined">call</span>
                    </button>
                </div>
            </nav>

            {/* ===== MAIN ===== */}
            <main className="chk-main">

                {/* ===== HEADER ===== */}
                <div className="chk-header">
                    <h1>📋 Complete Your Order</h1>
                    <p>Fill in your details below. All fields marked with * are required.</p>
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
                                    <label>First Name</label>
                                    <input type="text" name="firstName" value={customer.firstName} onChange={handleChange} placeholder="Vorname" required />
                                </div>
                                <div className="chk-field">
                                    <label>Last Name</label>
                                    <input type="text" name="lastName" value={customer.lastName} onChange={handleChange} placeholder="Nachname" required />
                                </div>
                            </div>
                            <div className="chk-row">
                                <div className="chk-field">
                                    <label>Phone</label>
                                    <input type="tel" name="phone" value={customer.phone} onChange={handleChange} placeholder="+49 …" required />
                                    <small className="chk-hint">📞 For delivery coordination</small>
                                </div>
                                <div className="chk-field">
                                    <label>Email</label>
                                    <input type="email" name="email" value={customer.email} onChange={handleChange} placeholder="E-Mail" required />
                                </div>
                            </div>
                        </div>

                        {/* --- Delivery Address --- */}
                        <div className="chk-section">
                            <h3>📍 Delivery Address</h3>
                            <div className="chk-row">
                                <div className="chk-field">
                                    <label>Street</label>
                                    <input type="text" name="street" value={customer.street} onChange={handleChange} placeholder="Straße" required />
                                </div>
                                <div className="chk-field">
                                    <label>House No</label>
                                    <input type="text" name="houseNumber" value={customer.houseNumber} onChange={handleChange} placeholder="Hausnummer" required />
                                </div>
                            </div>
                            <div className="chk-row">
                                <div className="chk-field">
                                    <label>Postal Code</label>
                                    <input type="text" name="postalCode" value={customer.postalCode} onChange={handleChange} placeholder="PLZ" required />
                                </div>
                                <div className="chk-field">
                                    <label>City</label>
                                    <input type="text" name="city" value={customer.city} onChange={handleChange} placeholder="Ort / Stadt" required />
                                </div>
                            </div>
                        </div>

                        {/* --- Access Details --- */}
                        <div className="chk-section">
                            <h3>🏢 Access Details</h3>
                            <div className="chk-row">
                                <div className="chk-field">
                                    <label>Floor</label>
                                    <input type="number" name="floor" value={customer.floor} onChange={handleChange} placeholder="Etage (e.g., 3)" required />
                                    <small className="chk-hint">💡 €1.50 per floor will be added</small>
                                </div>
                                <div className="chk-field">
                                    <label>Apartment (optional)</label>
                                    <input type="text" name="apartment" value={customer.apartment} onChange={handleChange} placeholder="Wohnungsnummer" />
                                </div>
                            </div>
                            <div className="chk-row">
                                <div className="chk-field">
                                    <label>Doorbell Name</label>
                                    <input type="text" name="doorbellName" value={customer.doorbellName} onChange={handleChange} placeholder="Name an der Klingel" required />
                                </div>
                                <div className="chk-field">
                                    <label>Elevator?</label>
                                    <select name="hasElevator" value={customer.hasElevator} onChange={handleChange} required>
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
                                    <label>Delivery Date</label>
                                    <input type="date" name="deliveryDate" value={customer.deliveryDate} onChange={handleChange} required />
                                </div>
                                <div className="chk-field">
                                    <label>Delivery Time</label>
                                    <input type="time" name="deliveryTime" value={customer.deliveryTime} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="chk-field chk-full">
                                <label>Delivery Notes (optional)</label>
                                <textarea name="deliveryNotes" value={customer.deliveryNotes} onChange={handleChange} rows="2" placeholder="Eingang befindet sich hinter dem Gebäude. Bitte bei Müller klingeln."></textarea>
                            </div>
                        </div>

                        {/* --- Action Buttons --- */}
                        <div className="chk-actions">
                            <button type="button" className="chk-btn-cancel" onClick={() => navigate("/cart")}>
                                ← Back to Cart
                            </button>
                            <button type="submit" className="chk-btn-submit">
                                <span className="material-symbols-outlined">lock</span>
                                Confirm Order 🚀
                            </button>
                        </div>
                    </form>

                    {/* ===== RIGHT: ORDER SUMMARY ===== */}
                    <div className="chk-summary">
                        <div className="chk-summary-card">
                            <h2>📋 Order Summary</h2>

                            <div className="chk-summary-items">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="chk-summary-item">
                                        <span>{item.name} × {item.quantity}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <hr />

                            <div className="chk-summary-totals">
                                <div className="chk-total-row">
                                    <span>Subtotal</span>
                                    <span>${subTotal.toFixed(2)}</span>
                                </div>
                                <div className="chk-total-row">
                                    <span>Shipping</span>
                                    <span>${shipping.toFixed(2)}</span>
                                </div>
                                <div className="chk-total-row">
                                    <span>Tax (7%)</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="chk-total-row chk-highlight">
                                    <span>Floor Fee ({customer.floor || 0} floors)</span>
                                    <span>+ ${floorFee.toFixed(2)}</span>
                                </div>
                                <div className="chk-total-row chk-grand-total">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <p className="chk-secure">
                                <span className="material-symbols-outlined">verified_user</span>
                                Secured &amp; encrypted
                            </p>
                        </div>
                    </div>

                </div>
            </main>

            {/* ===== FOOTER ===== */}
            <footer className="chk-footer">
                <p>GreenCart © 2024 — Secure Checkout</p>
                <div className="chk-footer-links">
                    <Link to="#">Security Policy</Link>
                    <Link to="#">Privacy Help</Link>
                    <Link to="#">Contact Us</Link>
                </div>
            </footer>

        </div>
    );
}