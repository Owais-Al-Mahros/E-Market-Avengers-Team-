// src/Pages/DisplayProducts/components/subCategory.jsx
import "./subCategory.css";
import BackButton from "./../../../Components/BackButton";
export default function SubCategory({ subcategories, selectSubCat, onSelect }) {
  if (!subcategories || subcategories.length === 0) return null;

  return (
    <div className="subcategory-bar">
      {/* زر "الكل" */}
      <div className="subcategories-group">
        <div
          role="button"
          tabIndex={0}
          className={`subcat-chip ${!selectSubCat ? "active" : ""}`}
          onClick={() => onSelect(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(null);
            }
          }}
        >
          All
        </div>

        {/* الفئات الفرعية */}
        {subcategories.map((sub) => (
          <div
            key={sub.id}
            role="button"
            tabIndex={0}
            className={`subcategories-chip ${
              Number(sub.id) === Number(selectSubCat) ? "active" : ""
            }`}
            onClick={() => onSelect(sub.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(sub.id);
              }
            }}
          >
            {sub.image && (
              <img src={sub.image} alt={sub.name} className="subcategories-chip-img" />
            )}
            <span>{sub.name}</span>
          </div>
        ))}
      </div>
      <div>
        <BackButton label={"Go Home"} />
      </div>
    </div>
  );
}
