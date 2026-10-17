import "./SubHeader.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useCategories } from "../../context/CategoryContext";
import { getLastOrder } from "../../lib/lastOrder";

function SubHomeHeader() {
  const { categories, loading: categoriesLoading } = useCategories();
  const [isCatListOpen, setCatListOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleCategorySelect = (categoryId) => {
    setCatListOpen(false);
    navigate(`/DisplayProducts?categoryId=${categoryId}`);
  };

  const handleTrackOrder = () => {
    const lastOrder = getLastOrder();
    if (!lastOrder) {
      navigate("/track-order");
      return;
    }
    // ✅ FIX #37: كل الحالات تذهب إلى track-order
    navigate("/track-order", {
      state: {
        autoSearch: false,
        prefilledOrder: {
          order_number: lastOrder.order_number,
          email: lastOrder.email,
        },
      },
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCatListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sub-header">
      <div className="sub-header-inner">
        {/* ===== Left: All together ===== */}
        <div className="sub-header-left" ref={dropdownRef}>
          <button
            className={`categories-trigger ${isCatListOpen ? "open" : ""}`}
            onClick={() => setCatListOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined">grid_view</span>
            <span>Alle Kategorien</span>
            <span className={`chevron ${isCatListOpen ? "rotated" : ""}`}>
              <span className="material-symbols-outlined">expand_more</span>
            </span>
          </button>

          {/* ===== Categories Dropdown (Multi-column Grid) ===== */}
          {isCatListOpen && (
            <div className="categories-dropdown">
              <div className="categories-dropdown-header">
                <span className="material-symbols-outlined">category</span>
                <span>Kategorien durchsuchen ({categories.length})</span>
              </div>

              {categoriesLoading ? (
                <div className="categories-loading">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="categories-empty">No categories yet</div>
              ) : (
                <div className="subcategories-grid">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className="subcategory-item"
                      onClick={() => handleCategorySelect(cat.id)}
                    >
                      <div className="subcategory-thumb">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} loading="lazy" />
                        ) : (
                          <span className="material-symbols-outlined">restaurant</span>
                        )}
                      </div>
                      <span className="subcategory-name">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== Nav Items (بجانب All Categories) ===== */}
        <div className="sub-header-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="material-symbols-outlined">home</span>
            <span>Startseite</span>
          </NavLink>

          <button className="nav-item" onClick={handleTrackOrder}>
            <span className="material-symbols-outlined">local_shipping</span>
            <span>Bestellung verfolgen</span>
          </button>

          <NavLink
            to="/help"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="material-symbols-outlined">help</span>
            <span>Hilfe</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default SubHomeHeader;
