import './Cart.css';
import { useCart } from "../../../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Cart({ closeModal }) {
    const navigate = useNavigate();
    const {
        cartItems,
        totalItems,
        totalPrice,
        removeFromCart,
        updateQuantity,
        clearCart,
    } = useCart();

    // زيادة الكمية
    const increaseQty = (productId) => {
        const item = cartItems.find((i) => i.id === productId);
        if (item) updateQuantity(productId, item.quantity + 1);
    };

    // نقص الكمية
    const decreaseQty = (productId) => {
        const item = cartItems.find((i) => i.id === productId);
        if (item && item.quantity > 1) {
            updateQuantity(productId, item.quantity - 1);
        } else {
            removeFromCart(productId); // إذا صارت 0 نحذفها
        }
    };

    const getItemTotal = (item) => (item.price * item.quantity).toFixed(2);

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
                {/* رأس المودال */}
                <div className="cart-modal-header">
                    <h2>🛒 Your Cart ({totalItems} items)</h2>
                    <button className="close-btn" onClick={closeModal}>✕</button>
                </div>

                {/* محتوى السلة */}
                <div className="cart-modal-body">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <span className="material-symbols-outlined" style={{ fontSize: "60px" }}>
                                shopping_bag
                            </span>
                            <p>Your cart is empty</p>
                            <button className="continue-shopping-btn" onClick={closeModal}>
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* قائمة المنتجات */}
                            <div className="cart-items-list">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="cart-item">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="cart-item-image"
                                        />
                                        <div className="cart-item-details">
                                            <h4>{item.name}</h4>
                                            <p className="cart-item-price">${item.price.toFixed(2)}</p>
                                            <div className="cart-item-actions">
                                                <div className="qty-controls">
                                                    <button onClick={() => decreaseQty(item.id)}>−</button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => increaseQty(item.id)}>+</button>
                                                </div>
                                                <button
                                                    className="remove-item-btn"
                                                    onClick={() => {
                                                        removeFromCart(item.id);
                                                        toast.success(`Removed ${item.name} from cart`);
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <div className="cart-item-total">
                                            ${getItemTotal(item)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* إجمالي السلة */}
                            <div className="cart-summary">
                                <div className="cart-total-row">
                                    <span>Subtotal ({totalItems} items)</span>
                                    <span className="cart-total-price">${totalPrice.toFixed(2)}</span>
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