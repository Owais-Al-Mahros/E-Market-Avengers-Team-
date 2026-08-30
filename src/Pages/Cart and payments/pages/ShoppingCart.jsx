import { Link } from "react-router-dom";
import CartProductCard from "./components/CartProductCard";
import { useCart } from "../../../context/CartContext";
import "./ShoppingCart.css";
import CartFooter from "./components/CartFooter";
import CartHeader from "./components/CartHeader";
import OrderSummary from "./components/OrderSummary";

export default function ShoppingCart() {

    const {
        cartItems,
        totalItems,
        totalPrice,
        removeFromCart,
        updateQuantity,
        clearCart,
    } = useCart();

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
    if (cartItems.length === 0) {
        return (
            <div className="bc fh flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-2xl fw-bold tm">Your cart is empty.</p>
                    <Link
                        to="/"
                        className="inline-block mt-4 btn px-6 py-3 rounded-xl fw-bold text-lg"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bc fh min-h-screen">
            {/* ===== NAVBAR ===== */}
            <CartHeader />

            {/* ===== MAIN CONTENT ===== */}
            <main className="max-w-[1200px] mx-auto px-4 md:px-6 pt-[100px] pb-10">
                {/* ===== HEADER: Search + Continue Shopping ===== */}
                {/* ===== TWO-COLUMN LAYOUT ===== */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* ===== LEFT: PRODUCT LIST ===== */}
                    <div className="Cart-Product-Card">
                        {cartItems.map((product) => (
                            <CartProductCard
                                name={product.name}
                                image={product.image}
                                id={product.id}
                                qty={product.quantity}
                                price={product.price}
                                increaseQty={increaseQty}
                                decreaseQty={decreaseQty}
                                removeFromCart={removeFromCart}
                            />
                        ))}
                    </div>

                    {/* ===== RIGHT: ORDER SUMMARY ===== */}
                    <OrderSummary />
                </div>
            </main>

            {/* ===== FOOTER ===== */}
            <CartFooter />
        </div>
    );
}
