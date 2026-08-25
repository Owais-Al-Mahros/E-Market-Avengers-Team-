import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartProductCard from "./components/CartProductCard";
import { useCart } from "../../../context/CartContext";
import "./ShoppingCart.css";

export default function ShoppingCart() {
    const navigate = useNavigate();

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


    const [search, setSearch] = useState("");



    const subTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = 5.99;
    const tax = subTotal * 0.07;
    const total = subTotal + shipping + tax;

    if (cartItems.length === 0) {
        return (
            <div className="bc fh flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-2xl fw-bold tm">Your cart is empty.</p>
                    <Link to="/" className="inline-block mt-4 btn px-6 py-3 rounded-xl fw-bold text-lg">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bc fh min-h-screen">

            {/* ===== NAVBAR ===== */}
            <nav className="fixed top-0 left-0 w-full z-50 bd text-white px-6 py-3 flex justify-between items-center min-h-[72px] border-b-4 bl">
                <div className="flex items-center gap-4">
                    <span className="text-3xl fw-extrabold tn">GreenCart</span>
                    <span className="text-sm tb hidden sm:inline">⚡ Secure Checkout</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/" className="tb hover-tn transition-colors text-lg fw-semibold hidden md:inline">
                        Home
                    </Link>
                    <button className="tc flex items-center justify-center tn hover-tl transition-colors">
                        <span className="material-symbols-outlined text-3xl">call</span>
                    </button>
                </div>
            </nav>

            {/* ===== MAIN CONTENT ===== */}
            <main className="max-w-[1200px] mx-auto px-4 md:px-6 pt-[100px] pb-10">

                {/* ===== HEADER: Search + Continue Shopping ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 className="txl fw-extrabold td">🛒 Shopping Cart</h1>
                    <Link to="/" className="bto tc px-6 py-3 rounded-xl fw-bold text-lg flex items-center gap-2 whitespace-nowrap">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Continue Shopping
                    </Link>
                </div>

                {/* ===== SEARCH BAR ===== */}
                <div className="smr p-4 mb-8 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 text-lg fw-bold td whitespace-nowrap">
                        <span className="material-symbols-outlined tn">search</span>
                        <span>Forgot something?</span>
                    </div>
                    <div className="flex-grow w-full sm:w-auto">
                        <input
                            type="text"
                            className="ip w-full"
                            placeholder="Search for products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn px-6 py-2 rounded-xl fw-bold text-lg whitespace-nowrap">
                        Search
                    </button>
                </div>

                {/* ===== TWO-COLUMN LAYOUT ===== */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* ===== LEFT: PRODUCT LIST ===== */}
                    <div className="Cart-Product-Card">
                        {cartItems.map((product) => <CartProductCard
                            name={product.name}
                            image={product.image}
                            id={product.id}
                            qty={product.quantity}
                            price={product.price}
                            increaseQty={increaseQty}
                            decreaseQty={decreaseQty}
                            removeFromCart={removeFromCart}
                        />)}
                    </div>

                    {/* ===== RIGHT: ORDER SUMMARY ===== */}
                    <div className="w-full lg:w-[380px] flex-shrink-0">
                        <div className="smr p-6 sticky top-[100px] space-y-5">

                            <h2 className="text-xl fw-bold td border-b-2 bl pb-3">📋 Order Summary</h2>

                            <div className="space-y-3 text-lg">
                                <div className="flex justify-between border-b border-l/20 pb-2">
                                    <span className="tm">Items ({cartItems.reduce((s, i) => s + i.qty, 0)})</span>
                                    <span className="fw-bold td">${subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-b border-l/20 pb-2">
                                    <span className="tm">Estimated Shipping</span>
                                    <span className="fw-bold td">${shipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-b border-l/20 pb-2">
                                    <span className="tm">Estimated Tax</span>
                                    <span className="fw-bold td">${tax.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-lime-mid">
                                    <span className="text-xl fw-extrabold td">Total</span>
                                    <span className="txl fw-extrabold tn">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate("/cart/checkout")}
                                className="btn w-full tc py-4 rounded-xl fw-bold text-xl flex items-center justify-center gap-2 mt-4"
                            >
                                <span className="material-symbols-outlined">lock</span>
                                Proceed to Secure Checkout
                            </button>

                            <p className="text-center text-sm tm flex items-center justify-center gap-1 mt-2">
                                <span className="material-symbols-outlined text-sm">verified_user</span>
                                Your information is safe and secure.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* ===== FOOTER ===== */}
            <footer className="bd tb border-t-4 bl py-6 px-6 mt-10">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="fw-bold text-lg tn">GreenCart</p>
                    <div className="flex gap-6 flex-wrap justify-center">
                        <Link to="#" className="hover-tn transition-colors">Security Policy</Link>
                        <Link to="#" className="hover-tn transition-colors">Privacy Help</Link>
                        <Link to="#" className="hover-tn transition-colors">Contact Us</Link>
                    </div>
                    <p className="text-sm tb/70">🔒 Your data is safe.</p>
                </div>
            </footer>

        </div>
    );
}