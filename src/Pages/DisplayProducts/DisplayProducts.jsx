// src/Pages/DisplayProducts/DisplayProducts.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import ProductCard from "../DisplayProducts/components/ProductCard";
import HomePageHeader from "../Home page/components/HomePageHeader";
import HomePageFooter from "../Home page/components/HomePageFooter";
import SubCategory from "./components/subCategory";
import Subscribe from "../../Components/Subscribe";
import { useCategories } from "../../context/CategoryContext";
import { useNavigate } from "react-router-dom";

import "./DisplayProducts.css";

function DisplayProducts() {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();

  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  const [subcategories, setSubcategories] = useState([]);
  const [selectSubCat, setSelectSubCat] = useState(null);

  const handleCategorySelect = (categoryId) => {
    navigate(`/DisplayProducts?categoryId=${categoryId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) {
        setLoading(false);
        setProducts([]);
        setCategoryName("Products");
        return;
      }

      const numCategoryID = Number(categoryId);

      setLoading(true);
      setSelectSubCat(null);
      try {
        // 1. جلب اسم الفئة
        const { data: categoryData, error: catErr } = await supabase
          .from("categories")
          .select("name")
          .eq("id", numCategoryID)
          .single();

        if (catErr) console.error("Category error:", catErr);
        setCategoryName(categoryData?.name || "Products");

        // 2. جلب الفئات الفرعية
        const { data: subCatData } = await supabase
          .from("subcategories")
          .select("*")
          .eq("category_id", numCategoryID);
        setSubcategories(subCatData || []);

        // 3. جلب المنتجات الخاصة بهذه الفئة
        const { data: prodData } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", numCategoryID)
          .order("name");

        setProducts(prodData || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  // فلترة المنتجات بناءً على الفئة الفرعية
  const filterProducts = selectSubCat
    ? products.filter(
        (pro) => Number(pro.subcategory_id) === Number(selectSubCat),
      )
    : products;

  return (
    <>
      <HomePageHeader />
      <div className="display-products-page">
        <h1>{categoryName}</h1>

        <SubCategory
          subcategories={subcategories}
          selectSubCat={selectSubCat}
          setSelectSubCat={setSelectSubCat}
        />

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : filterProducts.length === 0 ? (
          <div className="empty">No products found.</div>
        ) : (
          <div className="products-grid">
            {filterProducts.map((product) => (
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
      <Subscribe />
      {/* { Category Section} */}
      <div className="category-sections-display">
        <h2>Categories</h2>
        <div className="categories-grid-display">
          {categoriesLoading ? (
            <p>Loading categories...</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="category-card-display"
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
      <HomePageFooter />
    </>
  );
}

export default DisplayProducts;
