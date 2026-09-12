import "./subCategory.css";

function SubCategory({ subcategories, selectSubCat, setSelectSubCat }) {
  if (!subcategories || subcategories.length === 0) return null;

  return (
    <div className="subCategories-section">
      <div className="subCategories-grid">
        <div
          className={`subCategory-card ${selectSubCat === null ? "active" : ""}`}
          onClick={() => setSelectSubCat(null)}
        >
          <div className="subCategory-image">All</div>
          <h3>All Products</h3>
        </div>

        {subcategories.map((subCat) => (
          <div
            key={subCat.id}
            className={`subCategory-card ${selectSubCat === subCat.id ? "active" : ""}`}
            onClick={() => setSelectSubCat(subCat.id)}
          >
            {subCat.image ? (
              <img
                src={subCat.image}
                alt={subCat.name}
                className="subCategory-image"
              />
            ) : (
              <div className="subCategory-image">{subCat.name[0]}</div>
            )}
            <h3>{subCat.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SubCategory;
