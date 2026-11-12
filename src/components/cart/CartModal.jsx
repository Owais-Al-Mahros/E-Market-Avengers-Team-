import "./CartModal.css";
import { useCart } from "../../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CartItem from "./CartItem.jsx";
import { formatEuro } from "../../lib/format";

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
      toast.error("Ihr Warenkorb ist leer.");
      return;
    }
    navigate("/Cart&Payments");
  };

  return (
    <div className="cart-modal-overlay" onClick={closeModal}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="cart-modal-header">
          <div className="cart-header-title">
            <span className="material-symbols-outlined">shopping_cart</span>
            <h2>Warenkorb ({totalItems})</h2>
          </div>
          <button className="close-btn" onClick={closeModal} aria-label="Schließen">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="cart-modal-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon-wrapper">
                <span className="material-symbols-outlined empty-icon">shopping_bag</span>
              </div>
              <h3>Ihr Warenkorb ist leer</h3>
              <p>Entdecken Sie unsere Produkte und füllen Sie Ihren Warenkorb.</p>
              <button className="continue-shopping-btn" onClick={closeModal}>
                Weiter einkaufen
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

              {/* Summary */}
              <div className="cart-summary">
                <div className="cart-total-row">
                  <span>Zwischensumme ({totalItems} Artikel)</span>
                  <span className="cart-total-price">{formatEuro(totalPrice)}</span>
                </div>
                <button className="checkout-btn" onClick={handleCheckout}>
                  Zur Kasse gehen
                </button>
                <button className="clear-cart-btn" onClick={clearCart}>
                  Warenkorb leeren
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}