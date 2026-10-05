import { useMemo, useState, useEffect, useRef } from "react";
import { searchProduct } from "../../../../api";
import { useDebounce } from "../../../../hooks/useDebounce";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import CartProductCard from "../../components/CartProductCard/CartProductCard";
import { useCart } from "../../../../context/CartContext";
import { useProducts } from "../../../../context/ProductContext";
import { useCategories } from "../../../../context/CategoryContext";
import "./ShoppingCart.css";
import CartHeader from "./components/CartHeader";
import OrderSummary from "../../components/OrderSummary/OrderSummary";
import Footer from "../../../../components/layout/Footer"


export default function ShoppingCart() {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    increaseQty,     // ← من الـ Context
    decreaseQty,
    addToCart,
  } = useCart();
  const { products } = useProducts();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 250);
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

  // ============================================
  // 🔍 البحث — debounced + safe cleanup
  // ============================================
  useEffect(() => {
    const term = debouncedSearchTerm.trim();

    if (!term) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    searchProduct(term)
      .then((results) => {
        if (cancelled) return;
        setSearchResults(results || []);
        setShowDropdown(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Search error:", err?.message);
        setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm]);

  // ============================================
  // 🖱️ إغلاق عند النقر خارجاً
  // ============================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================
  // ➕ إضافة منتج من نتائج البحث
  // ============================================
  const handleAddFromSearch = (product) => {
    const price = parseFloat(product.total_price || product.price) || 0;

    addToCart(
      {
        id: product.id,
        product_number: product.product_number,
        name: product.name,
        image: product.image,
        price: parseFloat(product.price) || 0,
        total_price: price,
        tax_rate: parseFloat(product.tax_rate) || 0,
        weight: product.weight,
        weight_unit: product.weight_unit,
      },
      1
    );

    toast.success(`Added "${product.name}" to cart`, { duration: 1500 });
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
  };

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
        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <CartHeader currentStep={1} />
      <main className="cart-main">
        <h1 className="cart-title">Shopping Cart</h1>

        {/* ===== Search ===== */}
        <div className="cart-search-wrapper" ref={searchRef}>
          <p className="cart-search-text">
            Did you forget something? Search for products and add them to your cart.
          </p>

          <div className="cart-search">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.trim() && setShowDropdown(true)}
            />

            {searchTerm && (
              <button
                type="button"
                className="cart-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}

            <button className="cart-search-btn" aria-label="Search" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {showDropdown && (
            <div className="cart-search-dropdown">
              {isSearching ? (
                <div className="cart-search-state">
                  <div className="cart-search-spinner" />
                  Searching...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="cart-search-state">No products found.</div>
              ) : (
                searchResults.slice(0, 8).map((product) => {
                  const displayPrice =
                    parseFloat(product.total_price || product.price) || 0;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      className="cart-search-result"
                      onClick={() => handleAddFromSearch(product)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="cart-search-result-img"
                        loading="lazy"
                      />

                      <div className="cart-search-result-info">
                        <span className="cart-search-result-name">{product.name}</span>
                        <span className="cart-search-result-price">
                          €{displayPrice.toFixed(2)}
                        </span>
                      </div>

                      <span className="material-symbols-outlined cart-search-result-add">
                        add_circle
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
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
                      total_price={product.total_price}
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

      {/* <CartFooter /> */}
      <Footer />
    </div>
  );
}