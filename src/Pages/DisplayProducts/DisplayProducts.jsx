import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../../components/product/ProductCard";
import CategoryCard from "../../components/product/CategoryCard";
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

const MAX_SEARCH_RESULTS = 100;

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

  // الفئة تُقرأ من الـ URL عند التحميل فقط (useState أعلاه). عند التنقّل داخل الصفحة نفسها
  // (من نافذة الفئات في BottomNav مثلًا) يتغير الـ URL ولا تتغير الفئة النشطة. هذا يزامنهما.
  useEffect(() => {
    setActiveCategoryId(initialCategoryId);
    setSelectSubCat(null);
  }, [initialCategoryId]);

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
    // 🎯 Search mode — name فقط (لا product_number)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return products
        .filter((p) => (p.name || "").toLowerCase().includes(term))
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        .slice(0, MAX_SEARCH_RESULTS);
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
  // /DisplayProducts بلا فئة ولا بحث: كانت تعرض "Keine Produkte gefunden" وقائمة الفئات في أسفل الصفحة.
  // الآن تعرض الفئات نفسها في الأعلى كنقطة بداية.
  const isBrowseMode = !searchTerm && !activeCategoryId;
  const isLoading = categoriesLoading || productsLoading || subcategoriesLoading;

  const pageTitle = searchTerm
    ? `Suchergebnisse für „${searchTerm}“`
    : isBrowseMode
      ? "Alle Kategorien"
      : currentCategory?.name || "Produkte";

  const count = filteredProducts.length;
  const countText =
    `${count} ${count === 1 ? "Produkt" : "Produkte"}` +
    (searchTerm && count >= MAX_SEARCH_RESULTS
      ? ` (maximal ${MAX_SEARCH_RESULTS} Treffer angezeigt)`
      : "");

  // نخفي الفئات الفرعية في وضع البحث
  const showSubcategories = !searchTerm && currentSubcategories.length > 0;

  const categoriesGrid = categoriesLoading ? (
    <div className="products-state" role="status">Kategorien werden geladen...</div>
  ) : (
    <div className="display-categories-grid">
      {categories.map((cat) => (
        <CategoryCard
          key={cat.id}
          category={cat}
          onSelect={handleCategorySelect}
          isActive={Number(cat.id) === Number(activeCategoryId) && !searchTerm}
        />
      ))}
    </div>
  );

  return (
    <>
      <StaticHeader />

      <div className="display-back-wrapper">
        <button
          type="button"
          className="display-back-btn"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          <span>Zurück</span>
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

        <div className="products-area" aria-busy={isLoading && !isBrowseMode}>
          {isBrowseMode ? (
            categoriesGrid
          ) : isLoading ? (
            <div className="products-state" role="status">Produkte werden geladen...</div>
          ) : count === 0 ? (
            <div className="products-state">
              <p>
                {searchTerm
                  ? `Keine Produkte für „${searchTerm}“ gefunden.`
                  : "In dieser Kategorie gibt es noch keine Produkte."}
              </p>
              <a className="products-state-link" href="#display-categories">
                Kategorien ansehen
              </a>
            </div>
          ) : (
            <>
              <p className="display-products-count" aria-live="polite">{countText}</p>
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <StaticSubscribe />

      {!isBrowseMode && (
        <div className="category-sections-display" id="display-categories">
          <h2 className="category-sections-display-title">Kategorien</h2>
          {categoriesGrid}
        </div>
      )}

      <StaticFooter />
    </>
  );
}