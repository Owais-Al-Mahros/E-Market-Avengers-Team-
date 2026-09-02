import "./HomePageHeader.css";
import { useCart } from "../../../context/CartContext.jsx";
import { useState, useEffect } from "react";
import Cart from "../modals/Cart.jsx";
import { fetchData, searchProduct } from "../../../hooks/useProduct.js";
import { useDebounce } from "../../../hooks/useDebounce.js";
import Logo from "../../../assets/Logo.jpg";
import { Link, useNavigate } from "react-router-dom";

function HomePageHeader({ setProducts, setIsSearching, isSearching }) {
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const performSearch = async (term) => {
    if (setIsSearching) setIsSearching(true);
    try {
      if (!term.trim()) {
        const allProducts = await fetchData("products");
        if (setProducts) setProducts(allProducts);
        return;
      }
      const result = await searchProduct(term);
      if (setProducts) setProducts(result);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      if (setIsSearching) setIsSearching(false);
    }
  };

  useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  // زر تتبع الطلبات – نستخدم useNavigate للتوجيه
  const goToOrders = () => {
    navigate("/orders"); // سيتم إنشاء هذه الصفحة لاحقاً
  };

  return (
    <>
      <header className="header">
        <div className="logo-container">
          <Link to="/">
            <img src={Logo} alt="GreenCart Logo" className="logo" />
          </Link>
          <span className="tagline">Shopora</span>
        </div>

        {/* نموذج البحث */}
        <form onSubmit={handleSubmit} className="header-search">
          <input
            type="text"
            placeholder="Search Products ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search products"
          />
          <button
            type="submit"
            className="header-search-button"
            disabled={isSearching}
            aria-label="Search"
          >
            <img src="/Search.png" alt="Search" className="search-icon" />
          </button>
        </form>

        {/* الأزرار الجانبية */}
        <div className="header-actions">
          {/* زر تسجيل الدخول / الحساب */}
          <button className="header-login">Login</button>

          {/* زر طلباتي – جديد */}
          <button className="header-orders" onClick={goToOrders} aria-label="My Orders">
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="orders-label">My Orders</span>
          </button>

          {/* زر السلة مع العداد */}
          <div className="header-cart" onClick={openCart} role="button" tabIndex={0} aria-label="Open cart">
            <span className="material-symbols-outlined cart-icon">shopping_cart</span>
            {totalItems > 0 && (
              <span className="counter-of-items">{totalItems}</span>
            )}
          </div>
        </div>
      </header>

      {/* مودال السلة */}
      {isCartOpen && <Cart closeModal={closeCart} />}
    </>
  );
}

export default HomePageHeader;