import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartProductCard from "../../components/CartProductCard/CartProductCard";
import { useCart } from "../../../../context/CartContext";
import { useProducts } from "../../../../context/ProductContext";
import { useCategories } from "../../../../context/CategoryContext";
import "./ShoppingCart.css";
import CartFooter from "./components/CartFooter";
import CartHeader from "./components/CartHeader";
import OrderSummary from "../../components/OrderSummary/OrderSummary";

const STEPS = [
  { id: 1, label: "Cart" },
  { id: 2, label: "Address" },
  { id: 3, label: "Delivery Date" },
  { id: 4, label: "Payment" },
  { id: 5, label: "Order" },
];

export default function ShoppingCart() {
  const navigate = useNavigate();
  const { cartItems, totalItems, totalPrice, removeFromCart, updateQuantity } = useCart();
  const { products } = useProducts();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");

  const increaseQty = (productId) => {
    const item = cartItems.find((i) => i.id === productId);
    if (item) updateQuantity(productId, item.quantity + 1);
  };

  const decreaseQty = (productId) => {
    const item = cartItems.find((i) => i.id === productId);
    if (item && item.quantity > 1) updateQuantity(productId, item.quantity - 1);
    else removeFromCart(productId);
  };

  // ✅ تجميع المنتجات حسب الفئة
  const groupedItems = useMemo(() => {
    const groups = {};
    cartItems.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      let categoryName = "Other Products";
      if (product?.category_id) {
        const category = categories.find((c) => c.id === product.category_id);
        if (category) categoryName = category.name;
      }
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(item);
    });
    return groups;
  }, [cartItems, products, categories]);

  if (!cartItems) {
    return <div className="cart-loading">Loading cart...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <CartHeader />
        <div className="cart-empty">
          <p className="cart-empty-title">Your cart is empty.</p>
          <Link to="/" className="cart-empty-btn">Start Shopping</Link>
        </div>
        <CartFooter />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <CartHeader currentStep={1} />
      <main className="cart-main">
        <h1 className="cart-title">Shopping Cart</h1>

        {/* ===== Search ===== */}
        <div className="cart-search-wrapper">
          <p className="cart-search-text">
            Did you forget something? Search for products and add them to your cart.
          </p>
          <div className="cart-search">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="cart-search-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ===== Layout ===== */}
        <div className="cart-layout">
          {/* === LEFT === */}
          <div className="cart-products-col">
            {/* Delivery Info */}
            <div className="cart-delivery-info">
              <h3>Pick-up service</h3>
            </div>

            {/* Products by Category */}
            {Object.entries(groupedItems).map(([categoryName, items]) => (
              <div key={categoryName} className="cart-category-group">
                <div className="cart-category-header">
                  <h3 className="cart-category-name">{categoryName}</h3>
                  <div className="cart-category-cols">
                    <span>Unit Price</span>
                    <span>Total</span>
                  </div>
                </div>
                <div className="cart-category-items">
                  {items.map((product, index) => (
                    <CartProductCard
                      key={product.id || index}
                      name={product.name}
                      image={product.image}
                      id={product.id}
                      qty={product.quantity}
                      price={product.price}
                      increaseQty={increaseQty}
                      weight={product.weight}
                      weight_unit={product.weight_unit}
                      decreaseQty={decreaseQty}
                      removeFromCart={removeFromCart}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Bottom Back Button */}
            <div className="cart-bottom-actions">
              <button className="cart-back-btn" onClick={() => navigate("/")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
            </div>
          </div>

          {/* === RIGHT === */}
          <OrderSummary />
        </div>
      </main>

      <CartFooter />
    </div>
  );
}