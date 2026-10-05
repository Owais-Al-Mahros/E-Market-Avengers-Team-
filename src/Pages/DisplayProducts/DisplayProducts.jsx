import { useState, useMemo, useCallback, memo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../../components/product/ProductCard";
import SubCategory from "./components/subCategory";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Subscribe from "../../components/layout/Subscribe";
import { useCategories } from "../../context/CategoryContext";
import { useProducts } from "../../context/ProductContext";
import { useSubcategories } from "../../context/SubcategoryContext";
import "./DisplayProducts.css";

const StaticHeader = memo(Header);
const StaticFooter = memo(Footer);
const StaticSubscribe = memo(Subscribe);

export default function DisplayProducts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategoryId = searchParams.get("categoryId");
  const searchTerm = (searchParams.get("search") || "").trim();

  const { categories, loading: categoriesLoading } = useCategories();
  const { products, loading: productsLoading } = useProducts();
  const { subcategories, loading: subcategoriesLoading } = useSubcategories();

  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [selectSubCat, setSelectSubCat] = useState(null);

  // ============================================
  // Current category (only in category mode)
  // ============================================
  const currentCategory = useMemo(() => {
    if (!activeCategoryId) return null;
    return categories.find((c) => Number(c.id) === Number(activeCategoryId));
  }, [categories, activeCategoryId]);

  const currentSubcategories = useMemo(() => {
    if (!activeCategoryId) return [];
    return subcategories.filter(
      (sub) => Number(sub.category_id) === Number(activeCategoryId)
    );
  }, [subcategories, activeCategoryId]);

  // ============================================
  // Filtered products — search mode OR category mode
  // ============================================
  const filteredProducts = useMemo(() => {
    // 🎯 Search mode — حد 100 منتج
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const isNumeric = /^\d+$/.test(term);

      return products
        .filter((p) => {
          if (isNumeric) {
            return String(p.product_number || "").includes(term);
          }
          return (p.name || "").toLowerCase().includes(term);
        })
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        .slice(0, 100);            // ← ✅ الحد الأقصى
    }

    // 📂 Category mode — لا حد
    if (!activeCategoryId) return [];

    return products
      .filter((p) => Number(p.category_id) === Number(activeCategoryId))
      .filter((p) =>
        selectSubCat ? Number(p.subcategory_id) === Number(selectSubCat) : true
      )
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [products, activeCategoryId, selectSubCat, searchTerm]);

  // ============================================
  // Handlers
  // ============================================
  const handleCategorySelect = useCallback(
    (id) => {
      // إذا كنا في وضع البحث → اذهب لصفحة الفئة (لتحديث URL)
      if (searchTerm) {
        navigate(`/DisplayProducts?categoryId=${id}`);
        return;
      }
      setActiveCategoryId(id);
      setSelectSubCat(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchTerm, navigate]
  );

  const handleSubCategorySelect = useCallback((subId) => {
    setSelectSubCat((prev) =>
      Number(prev) === Number(subId) ? null : subId
    );
  }, []);

  // ============================================
  // Derived values
  // ============================================
  const isLoading = categoriesLoading || productsLoading || subcategoriesLoading;
  const pageTitle = searchTerm
    ? `Search results for "${searchTerm}"`
    : currentCategory?.name || "Products";

  // نخفي الفئات الفرعية في وضع البحث
  const showSubcategories = !searchTerm && currentSubcategories.length > 0;

  return (
    <>
      <StaticHeader />

      <div className="display-back-wrapper">
        <button
          type="button"
          className="display-back-btn"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back</span>
        </button>
      </div>

      <div className="display-products-page">
        <h1 className="display-products-title">{pageTitle}</h1>

        {showSubcategories && (
          <SubCategory
            subcategories={currentSubcategories}
            selectSubCat={selectSubCat}
            onSelect={handleSubCategorySelect}
          />
        )}

        <div className="products-area">
          {isLoading ? (
            <div className="products-state">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="products-state">No products found.</div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <StaticSubscribe />

      <div className="category-sections-display">
        <h2 className="category-sections-display-title">Categories</h2>

        {categoriesLoading ? (
          <div className="products-state">Loading categories...</div>
        ) : (
          <div className="display-categories-grid">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`display-category-card ${Number(cat.id) === Number(activeCategoryId) && !searchTerm
                  ? "active"
                  : ""
                  }`}
                onClick={() => handleCategorySelect(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCategorySelect(cat.id);
                  }
                }}
              >
                {cat.image && (
                  <img
                    src={cat.image}
                    className="display-category-image"
                    alt={cat.name}
                  />
                )}
                <span className="display-category-name">{cat.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <StaticFooter />
    </>
  );
}