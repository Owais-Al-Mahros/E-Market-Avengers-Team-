import "./SubHomeHeader.css";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useCategories } from "../../../context/CategoryContext";
import { useNavigate } from "react-router-dom";

function SubHomeHeader() {
  const { categories, loading: categoriesLoading } = useCategories();
  const [isCatListOpen, setCatListOpen] = useState("");
  const navigate = useNavigate();

  const handleCategorySelect = (categoryId) => {
    navigate(`/DisplayProducts?categoryId=${categoryId}`);
  };
  return (
    <nav className="sub-Header-container">
      <button
        className="material-symbols-outlined list-icon"
        onMouseEnter={() => setCatListOpen(true)}
        onMouseLeave={() => setCatListOpen(false)}
        onClick={() => setCatListOpen((prev) => !prev)}
      >
        list
        <span>All Categories</span>
      </button>
      {isCatListOpen && (
        <div className="categories-list">
          {categoriesLoading ? (
            <p>Loading categories...</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => handleCategorySelect(cat.id)}
              >
                <img
                  src={cat.image}
                  className="category-image"
                  alt={cat.name}
                />
                <h2 className="category-name">{cat.name}</h2>
              </div>
            ))
          )}
        </div>
      )}
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span className="material-symbols-outlined icon-in-sub-header">
          home
        </span>
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/truck-order"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span className="material-symbols-outlined icon-in-sub-header-truck ">
          local_shipping
        </span>
        <span className="">Track order</span>
      </NavLink>

      <NavLink
        to="/help"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span className="material-symbols-outlined icon-in-sub-header">
          help
        </span>
        <span className="label-sun-header ">Help</span>
      </NavLink>
    </nav>
  );
}
export default SubHomeHeader;
