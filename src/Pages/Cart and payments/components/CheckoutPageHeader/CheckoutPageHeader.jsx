import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext.jsx";
import { searchProduct } from "../../../../hooks/useProduct.js";
import ProductCard from "../../../DisplayProducts/components/ProductCard.jsx";
import "./CheckoutPageHeader.css";

function CheckoutPageHeader() {
  const { cartItems, updateQuantity, removeFromCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
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

  const decreaseQty = (productId) => {
    const item = cartItems.find((i) => i.id === productId);
    if (item && item.quantity > 1) {
      updateQuantity(productId, item.quantity - 1);
    } else {
      removeFromCart(productId);
    }
  };

  // 4. زر تتبع الطلبات
  const goToOrders = () => {
    const lastOrder = JSON.parse(localStorage.getItem("lastOrder"));

    if (!lastOrder) {
      navigate("/no-orders");
      return;
    }

    const activeStatuses = ["pending", "confirmed", "shipped"];
    if (activeStatuses.includes(lastOrder.status)) {
      navigate(`/Cart&Payments/order-confirmation/${lastOrder.id}`);
    } else {
      navigate("/no-orders", {
        state: {
          message: `Your last order (${lastOrder.order_number}) Done ${lastOrder.status === "delivered" ? "Order it" : "Cancelled"
            }. you can place a new order now!`,
        },
      });
    }
  };

  return (
    <header className="header">
      <div className="logo-container">
        <Link to="/">
          <img src="./Logo.jpg" alt="Shopora Logo" className="logo" />
        </Link>
        <span className="tagline">Shopora</span>
      </div>

      <div className="header-search">
        <div className="">
          {/* <span className="forget-text">Forgot something?</span> */}
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
        <button
          className="header-search-button"
          disabled={isSearching}
          aria-label="Search"
        >
          {" "}
          <span className="material-symbols-outlined">search</span>
        </button>
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

      <div className="header-actions">
        <button className="header-login">Login</button>
        <Link to="/login">Go To DashBoard</Link>

        <button
          className="header-orders"
          onClick={goToOrders}
          aria-label="My Orders"
        >
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="orders-label">My Orders</span>
        </button>
      </div>
    </header>
  );
}

export default CheckoutPageHeader;
