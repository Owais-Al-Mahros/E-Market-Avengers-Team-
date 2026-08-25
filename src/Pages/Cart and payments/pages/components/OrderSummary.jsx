import React from "react";
import { useCart } from "../../../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./OrderSummary.css";

function OrderSummary() {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  const subTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = 5.99;
  const tax = subTotal * 0.07;
  const total = subTotal + shipping + tax;
  const totalQuantity = cartItems.reduce((i, item) => i + item.quantity, 0);
  return (
    <div className="order-summary-container">
      <div className="order-summary-card">
        <h2 className="order-summary-title">📋 Order Summary</h2>

        <div className="order-summary-details">
          <div className="order-summary-row border-bottom sub-title">
            <span>Name</span>
            <span>Quantity</span>
            <span>Price</span>
          </div>
          {/* Items Count & Subtotal */}
          <div className="border-bottom">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="order-summary-row-sub border-bottom"
              >
                <span className="order-summary-label col-name">
                  {item.name}
                </span>
                <span className="col-qty">{item.quantity}</span>
                <span className="col-price order-summary-value">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Shipping */}
          <div className="order-summary-row border-bottom">
            <span className="order-summary-label">Estimated Shipping</span>
            <span className="order-summary-value">${shipping.toFixed(2)}</span>
          </div>

          {/* Tax */}
          <div className="order-summary-row border-bottom">
            <span className="order-summary-label">Estimated Tax</span>
            <span className="order-summary-value">${tax.toFixed(2)}</span>
          </div>

          {/* Total Price */}
          <div className="order-summary-row order-summary-total-row">
            <span className="order-summary-total-label order-total-text">
              Total
            </span>
            <span className="order-summary-total-items">{totalQuantity}</span>
            <span className="order-summary-total-value order-summary-total-price">
              ${total.toFixed(2)}
            </span>
          </div>
          {/* {Note} */}
          <div className="order-summary-row note">
            <span>The price doesn't include delivery</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={() => navigate("/cart/checkout")}
          className="order-summary-checkout-btn"
        >
          <span className="material-symbols-outlined">lock</span>
          Proceed to Secure Checkout
        </button>

        {/* Security / Trust Badge */}
        <p className="order-summary-security-note">
          <span className="material-symbols-outlined security-icon">
            verified_user
          </span>
          Your information is safe and secure.
        </p>
      </div>
    </div>
  );
}

export default OrderSummary;
