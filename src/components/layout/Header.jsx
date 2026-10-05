import "./Header.css";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useFavorite } from "../../context/FavoriteContext.jsx";
import { searchProduct } from "../../api/index.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import SearchSuggestionCard from "../product/SearchSuggestionCard.jsx";
import Cart from "../cart/CartModal.jsx";

export default function HomePageHeader() {
  const navigate = useNavigate();
  const { favorite } = useFavorite();
  const { totalItems } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const serRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  // ============================================
  // Search suggestions (debounced)
  // ============================================
  useEffect(() => {
    const term = debouncedSearchTerm.trim();

    if (!term) {
      setSearchResult([]);
      setShowDropdown(false);
      setLoadingProducts(false);
      return;
    }

    let cancelled = false;
    setLoadingProducts(true);

    searchProduct(term)
      .then((result) => {
        if (cancelled) return;
        setSearchResult(result || []);
        setShowDropdown(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Search error:", err?.message);
        setSearchResult([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm]);

  // ============================================
  // Close on outside click
  // ============================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (serRef.current && !serRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================
  // Handlers
  // ============================================
  const handleSelectProduct = (productId) => {
    setShowDropdown(false);
    setSearchTerm("");
    navigate(`/DisplayProducts/ProductCardDetails?productId=${productId}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (term) {
      setShowDropdown(false);
      navigate(`/DisplayProducts?search=${encodeURIComponent(term)}`);
    }
  };

  const handleShowAll = () => {
    const term = searchTerm.trim();
    if (term) {
      setShowDropdown(false);
      navigate(`/DisplayProducts?search=${encodeURIComponent(term)}`);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResult([]);
    setShowDropdown(false);
  };

  return (
    <header className="header">
      <Link to="/" className="logo-container">
        <img src="/logo.png" alt="Shopora Logo" className="logo-header" />
        <span className="tagline">Shopora</span>
      </Link>

      <div className="search-container-wrapper" ref={serRef}>
        <form onSubmit={handleSubmit} className="header-search">
          <input
            type="text"
            placeholder="Search Products ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!showDropdown) setShowDropdown(true);
            }}
            aria-label="Search products"
          />

          {searchTerm && (
            <button
              type="button"
              className="header-search-clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}

          <button
            type="submit"
            className="header-search-button"
            disabled={loadingProducts}
            aria-label="Search"
          >
            <img src="/Search.png" alt="Search" className="search-icon" />
          </button>
        </form>

        {showDropdown && (
          <div className="search-dropdown-container">
            <div className="search-dropdown-list">
              {loadingProducts ? (
                <div className="search-loading-state">
                  <span>Searching...</span>
                </div>
              ) : searchResult.length > 0 ? (
                searchResult.map((item) => (
                  <SearchSuggestionCard
                    key={item.id}
                    product={item}
                    onClick={handleSelectProduct}
                  />
                ))
              ) : (
                <div className="search-loading-state">
                  <span>No Product Found</span>
                </div>
              )}
            </div>

            {searchResult.length > 0 && !loadingProducts && (
              <div className="search-dropdown-footer">
                <button
                  type="button"
                  className="search-dropdown-show-all"
                  onClick={handleShowAll}
                >
                  Show all search results
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header-actions">
        <Link to="/login" className="header-dashboard-link">
          Go To Dashboard
        </Link>

        <Link to="/my-info" className="header-profile-link" aria-label="My Info">
          <span className="material-symbols-outlined person-icon">person</span>
        </Link>

        <Link
          to="/favorites"
          className="header-favorites"
          aria-label="Open favorites"
        >
          <span className="material-symbols-outlined heart-icon">favorite</span>
          {favorite.length > 0 && (
            <span className="counter-of-favorites">{favorite.length}</span>
          )}
        </Link>

        <button
          type="button"
          className="header-cart"
          onClick={() => setIsCartOpen(true)}
          aria-label="Open cart"
        >
          <span className="material-symbols-outlined cart-icon">
            shopping_cart
          </span>
          {totalItems > 0 && (
            <span className="counter-of-items">{totalItems}</span>
          )}
        </button>
      </div>

      {isCartOpen && <Cart closeModal={() => setIsCartOpen(false)} />}
    </header>
  );
}