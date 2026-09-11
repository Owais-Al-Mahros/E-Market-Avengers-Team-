import "./SubHomeHeader.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useCategories } from "../../../context/CategoryContext";

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
    const lastOrder = JSON.parse(localStorage.getItem("lastOrder") || "null");
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
          message: `Your previous order (${lastOrder.order_number}) was ${lastOrder.status === "delivered" ? "delivered" : "cancelled"
            }. You can place a new order now!`,
        },
      });
    }
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
            <span>All Categories</span>
            <span className={`chevron ${isCatListOpen ? "rotated" : ""}`}>
              <span className="material-symbols-outlined">expand_more</span>
            </span>
          </button>

          {/* ===== Categories Dropdown (Multi-column Grid) ===== */}
          {isCatListOpen && (
            <div className="categories-dropdown">
              <div className="categories-dropdown-header">
                <span className="material-symbols-outlined">category</span>
                <span>Browse Categories ({categories.length})</span>
              </div>

              {categoriesLoading ? (
                <div className="categories-loading">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="categories-empty">No categories yet</div>
              ) : (
                <div className="categories-grid">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      className="category-item"
                      onClick={() => handleCategorySelect(cat.id)}
                    >
                      <div className="category-thumb">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} loading="lazy" />
                        ) : (
                          <span className="material-symbols-outlined">
                            restaurant
                          </span>
                        )}
                      </div>
                      <span className="category-name">{cat.name}</span>
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
            <span>Home</span>
          </NavLink>

          <button className="nav-item" onClick={handleTrackOrder}>
            <span className="material-symbols-outlined">local_shipping</span>
            <span>Track Order</span>
          </button>

          <NavLink
            to="/help"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="material-symbols-outlined">help</span>
            <span>Help</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default SubHomeHeader;