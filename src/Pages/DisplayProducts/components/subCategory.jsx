// src/Pages/DisplayProducts/components/subCategory.jsx
import "./subCategory.css";

export default function SubCategory({ subcategories, selectSubCat, onSelect }) {
  if (!subcategories || subcategories.length === 0) return null;

  const isAllActive = !selectSubCat;

  return (
    <div className="subcategory-bar">
      <div className="subcategories-group">
        <button
          type="button"
          className={`subcategories-chip ${isAllActive ? "active" : ""}`}
          onClick={() => onSelect(null)}
        >
          <span>All</span>
        </button>

        {subcategories.map((sub) => {
          const isActive = Number(sub.id) === Number(selectSubCat);
          return (
            <button
              key={sub.id}
              type="button"
              className={`subcategories-chip ${isActive ? "active" : ""}`}
              onClick={() => onSelect(sub.id)}
            >
              {sub.image && (
                <img
                  src={sub.image}
                  alt={sub.name}
                  className="subcategories-chip-img"
                  loading="lazy"
                />
              )}
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}