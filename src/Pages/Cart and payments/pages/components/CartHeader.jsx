import { useState } from "react";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useCart } from "../../../../context/CartContext";
import { searchProduct } from "../../../../hooks/useProduct"; // دالة البحث
import ProductCard from "../../../Home page/components/ProductCard";
import "./CartHeader.css";

function CartHeader() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    // direct search
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchProduct(searchTerm);
      setSearchResults(results || []);
      setShowDropdown(true);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
  return (
    <>
      <nav className="cart-header-container">
        <div className="cart-header-right">
          <Link to="/" className="link">
            <span>E-Market</span>
          </Link>
        </div>
        <div className="cart-search-container">
          <div className="">
            <span className="material-symbols-outlined">search</span>
            <span className="forget-text">Forgot something?</span>
          </div>
          <div className="search-input-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchTerm.trim() && setShowDropdown(true)}
            />
          </div>
          <button className="btn-search">Search</button>
          {showDropdown && (
            <>
            <div
            className="search-overlay" 
              onClick={() => {
                setShowDropdown(false);
                setSearchTerm("");
              }}
            />
              <div className="search-dropdown" ref={searchRef}>
                {isSearching ? (
                  <div className="">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <ProductCard
                      key={product.id}
                      name={product.name}
                      image={product.image}
                      id={product.id}
                      qty={product.quantity}
                      price={product.price}
                      increaseQty={increaseQty}
                      decreaseQty={decreaseQty}
                    />
                  ))
                ) : (
                  <div className="">No products found.</div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="cart-header-left">
          <Link to="/" className="link">
            <span className="material-symbols-outlined ">arrow_back</span>
            Continue Shopping
          </Link>
        </div>
      </nav>
    </>
  );
}
export default CartHeader;
