import { useState, useMemo, useEffect, memo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../DisplayProducts/components/ProductCard";
import HomePageHeader from "../Home page/components/HomePageHeader";
import Footer from "./../../Components/Footer";
import SubCategory from "./components/subCategory";
import Subscribe from "../../Components/Subscribe";
import { useCategories } from "../../context/CategoryContext";
import { useProducts } from "../../context/ProductContext";
import { useSubcategories } from "../../context/SubcategoryContext";
import "./DisplayProducts.css";

const StaticHeader = memo(HomePageHeader);
const StaticFooter = memo(Footer);
const StaticSubscribe = memo(Subscribe);

function DisplayProducts() {
  console.count("🎯 DisplayProducts");

  // ✅ نقرأ categoryId من URL مرة واحدة فقط عند أول فتح
  const [searchParams] = useSearchParams();
  const initialCategoryId = searchParams.get("categoryId");

  const { categories, loading: categoriesLoading } = useCategories();
  const { products, loading: productsLoading } = useProducts();
  const { subcategories, loading: subcategoriesLoading } = useSubcategories();

  // ✅ كل الفلترة في state محلي — لا URL، لا navigate
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);
  const [selectSubCat, setSelectSubCat] = useState(null);

  // ✅ الفئة الحالية
  const currentCategory = useMemo(() => {
    if (!activeCategoryId) return null;
    return categories.find((c) => Number(c.id) === Number(activeCategoryId));
  }, [categories, activeCategoryId]);

  // ✅ الفئات الفرعية للفئة النشطة
  const currentSubcategories = useMemo(() => {
    if (!activeCategoryId) return [];
    return subcategories.filter(
      (sub) => Number(sub.category_id) === Number(activeCategoryId)
    );
  }, [subcategories, activeCategoryId]);

  // ✅ فلترة المنتجات — تماماً مثل filteredProducts في Dashboard
  const filteredProducts = useMemo(() => {
    if (!activeCategoryId) return [];

    return products
      .filter((p) => Number(p.category_id) === Number(activeCategoryId))
      .filter((p) =>
        selectSubCat ? Number(p.subcategory_id) === Number(selectSubCat) : true
      )
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [products, activeCategoryId, selectSubCat]);

  // ✅ تغيير الفئة الرئيسية — state فقط
  const handleCategorySelect = useCallback((id) => {
    setActiveCategoryId(id);
    setSelectSubCat(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ✅ تغيير الفئة الفرعية — state فقط
  const handleSubCategorySelect = useCallback((subId) => {
    setSelectSubCat((prev) =>
      Number(prev) === Number(subId) ? null : subId
    );
  }, []);

  const isLoadingContexts =
    categoriesLoading || productsLoading || subcategoriesLoading;

  const categoryName = currentCategory?.name || "Products";

  return (
    <>
      <StaticHeader />

      <div className="display-products-page">
        <h1>{categoryName}</h1>

        <SubCategory
          subcategories={currentSubcategories}
          selectSubCat={selectSubCat}
          onSelect={handleSubCategorySelect}
        />

        <div className="products-area">
          {isLoadingContexts ? (
            <div className="loading">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty">No products found.</div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  image={product.image}
                  category={product.category}
                  price={product.price}
                  weight={product.weight}
                  tax_rate={product.tax_rate}
                  weight_unit={product.weight_unit}
                  total_price={product.total_price}
                  description={product.description}
                  nutritionObject={product.nutrition_facts}
                  storageObject={product.storage_notes}
                  ingredients={product.ingredients}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <StaticSubscribe />

      <div className="category-sections-display">
        <h2>Categories</h2>
        <div className="categories-grid-display">
          {categoriesLoading ? (
            <p>Loading categories...</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className={`category-card-display ${Number(cat.id) === Number(activeCategoryId) ? "active" : ""
                  }`}
                onClick={() => handleCategorySelect(cat.id)}
              >
                <img
                  src={cat.image}
                  className="category-image-display"
                  alt={cat.name}
                />
                <h2 className="category-name-display">{cat.name}</h2>
              </div>
            ))
          )}
        </div>
      </div>

      <StaticFooter />
    </>
  );
}

export default DisplayProducts;