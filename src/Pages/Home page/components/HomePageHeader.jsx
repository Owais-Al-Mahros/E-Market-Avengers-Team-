import "./HomePageHeader.css";
import { useCart } from "../../../context/CartContext.jsx";
import { useState, useEffect } from "react";
import Cart from "../modals/Cart.jsx";
import { fetchData, searchProduct } from "../../../hooks/useProduct.js";
import { useDebounce } from "../../../hooks/useDebounce.js";

function HomePageHeader({ setProducts, setIsSearching, isSearching }) { // ✅ استقبل setIsSearching
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <>
      <div className="header">
        <div className="logo-container">
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>

        <form onSubmit={handleSubmit} className="header-search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="header-search-button" disabled={isSearching}>
            <img src="/Search.png" alt="Search" className="search-icon" />
          </button>
        </form>

        <div className="header-links">
          <button className="header-login">Login</button>
          <div className="header-cart" onClick={openCart} style={{ cursor: "pointer" }}>
            <button className="header-cart-button">
              <img src="/cart.png" alt="Cart" className="header-cart-icon" />
            </button>
            {totalItems > 0 && (
              <span className="counter-of-items">{totalItems}</span>
            )}
          </div>
        </div>
      </div>

      {isCartOpen && <Cart closeModal={closeCart} />}
    </>
  );
}

export default HomePageHeader;

