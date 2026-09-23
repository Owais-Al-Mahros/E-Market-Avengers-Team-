import "./HomePageHeader.css";
import { useCart } from "../../../context/CartContext.jsx";
import { useState, useEffect, useRef } from "react";
import Cart from "../modals/Cart.jsx";
import { fetchData, searchProduct } from "../../../hooks/useProduct.js";
import { useDebounce } from "../../../hooks/useDebounce.js";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../../DisplayProducts/components/ProductCard.jsx";
import { useFavorite } from "../../../context/FavoriteContext.jsx";
import { useMyInfo } from "../../../context/MyInfoContext.jsx";

function HomePageHeader({ setProducts, setIsSearching, isSearching }) {
  console.count("📌 HomePageHeader");
  const navigate = useNavigate();

  //Favorite list
  const { favorite } = useFavorite();
  const [isFavoriteOpen, setIfFavoriteOpen] = useState(false);

  //My info
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // { Search Variables}
  const [searchResult, setSearchResult] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const serRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchResult([]);
        setShowDropdown(false);
        setLoadingProducts(false);
        return;
      }
      try {
        const result = await searchProduct(debouncedSearchTerm);
        if (result) {
          setSearchResult(result);
          setShowDropdown(true);
          setLoadingProducts(true);
        }
      } catch (error) {
        console.log(error.message);
        setSearchResult([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchSuggestions();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (serRef.current && !serRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const [isMenuOpen, setMenuOpen] = useState("");
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

  // ✅ زر تتبع الطلبات – منطق ذكي للزوار والمسجلين
  const goToOrders = () => {
    // 1. التحقق من وجود آخر طلب في localStorage
    const lastOrder = JSON.parse(localStorage.getItem("lastOrder"));

    // 2. إذا لم يكن هناك طلب نهائياً → انتقل إلى صفحة "لا توجد طلبات"
    if (!lastOrder) {
      navigate("/no-orders");
      return;
    }

    // 3. إذا كان هناك طلب، تحقق من حالته
    const activeStatuses = ["pending", "confirmed", "shipped"];
    if (activeStatuses.includes(lastOrder.status)) {
      // ✅ طلب نشط → اعرض تفاصيله
      navigate(`/Cart&Payments/order-confirmation/${lastOrder.id}`);
    } else {
      // ❌ الطلب منتهي (delivered أو cancelled) → انتقل إلى صفحة "لا توجد طلبات نشطة"
      navigate("/no-orders", {
        state: {
          message: `طلبك السابق (${lastOrder.order_number}) تم ${lastOrder.status === "delivered" ? "توصيله" : "إلغاؤه"}. يمكنك طلب جديد الآن!`,
        },
      });
    }
  };

  return (
    <>
      <header className="header">
        <div>
          <Link to="/" className="logo-container">
            <img src="/logo.png" alt="GreenCart Logo" className="logo-header" />
            <span className="tagline">Shopora</span>
          </Link>
        </div>

        {/* نموذج البحث */}
        <div
          className="search-container-wrapper"
          ref={serRef}
          style={{ position: "relative" }}
        >
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
            <button
              type="submit"
              className="header-search-button"
              disabled={isSearching}
              aria-label="Search"
            >
              <img src="/Search.png" alt="Search" className="search-icon" />
            </button>
          </form>

          {/* {Drop Down List } */}
          {/* القائمة المنسدلة */}
          {showDropdown && (
            <div className="search-dropdown-list">
              {loadingProducts ? (
                <div className="search-loading-state">
                  <span>ٍSearching 🔍</span>
                </div>
              ) : searchResult.length > 0 ? (
                searchResult.map((item) => (
                  <div
                    key={item.id}
                    className="dropdown-card-wrapper"
                    onClick={() => {
                      setShowDropdown(false);
                      setSearchTerm("");
                    }}
                  >
                    <ProductCard
                      id={item.id}
                      name={item.name}
                      image={item.image}
                      category={item.category}
                      price={item.price}
                      weight={item.weight}
                      tax_rate={item.tax_rate}
                      weight_unit={item.weight_unit}
                      total_price={item.total_price}
                      description={item.description}
                      nutritionObject={item.nutrition_facts}
                      storageObject={item.storage_notes}
                      ingredients={item.ingredients}
                    />
                  </div>
                ))
              ) : (
                <div className="search-loading-state">
                  <span>No Product Found ❌</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* الأزرار الجانبية */}
        <div className="header-actions">
          {/* زر تسجيل الدخول / الحساب */}
          <button className="header-login">Login</button>
          <Link to="/login">Go To DashBoard</Link>

          {/* زر السلة مع العداد */}
          <div
            className="header-cart"
            onClick={openCart}
            role="button"
            tabIndex={0}
            aria-label="Open cart"
          >
            <span className="material-symbols-outlined cart-icon">
              shopping_cart
            </span>
            {totalItems > 0 && (
              <span className="counter-of-items">{totalItems}</span>
            )}
          </div>

          <div
            className="profile-menu-container"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              className="material-symbols-outlined person-icon"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              person
            </button>
            {isMenuOpen && (
              <div className="profile-dropdown">
                <Link
                  className="header-orders"
                  to="/HomePage/MyInfo"
                  onClick={() => setIsInfoOpen(true)}
                >
                  <span className="material-symbols-outlined">person</span>
                  <span className="orders-label">My Info</span>
                </Link>
                <Link
                  className="header-orders"
                  to="/HomePage/FavoriteList"
                  onClick={() => setIfFavoriteOpen(true)}
                >
                  <span className="material-symbols-outlined">favorite</span>
                  <span className="orders-label">My Favorite</span>
                  {favorite.length > 0 && (
                    <span className="fav-badge">{favorite.length}</span>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>
        {/* مودال السلة */}
        {isCartOpen && <Cart closeModal={closeCart} />}
      </header>
    </>
  );
}

export default HomePageHeader;
