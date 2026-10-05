import "./CartModal.css";
import { useCart } from "../../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CartItem from "./CartItem.jsx";

export default function Cart({ closeModal }) {
  const navigate = useNavigate();
  const {
    cartItems,
    totalItems,
    totalPrice,
    removeFromCart,
    clearCart,
    increaseQty,
    decreaseQty,
  } = useCart();


  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    toast.success("Proceeding to checkout...");
    navigate("/Cart&Payments");
  };

  return (
    <div className="cart-modal-overlay" onClick={closeModal}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h2>🛒 Your Cart ({totalItems} items)</h2>
          <button className="close-btn" onClick={closeModal}>
            ✕
          </button>
        </div>

        <div className="cart-modal-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "60px" }}
              >
                shopping_bag
              </span>
              <p>Your cart is empty</p>
              <button className="continue-shopping-btn" onClick={closeModal}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onIncrease={increaseQty}
                    onDecrease={decreaseQty}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>

              {/* إجمالي السلة */}
              <div className="cart-summary">
                <div className="cart-total-row">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="cart-total-price">
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
                <button className="checkout-btn" onClick={handleCheckout}>
                  Proceed to Checkout 🚀
                </button>
                <button className="clear-cart-btn" onClick={clearCart}>
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
