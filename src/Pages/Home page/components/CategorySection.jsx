// src/Pages/Home page/components/CategorySection.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import ProductCard from "../../DisplayProducts/components/ProductCard.jsx";
import "./CategorySection.css";

export default function CategorySection({ categoryId, categoryName }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId)
        .order("name");

      if (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    if (categoryId) {
      fetchProductsByCategory();
    }
  }, [categoryId]);

  if (loading) {
    return (
      <div className="category-products-loading">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="category-products-empty">
        <span className="material-symbols-outlined">inbox</span>
        <p>No products found in this category.</p>
      </div>
    );
  }

  return (
    <div className="category-products">
      <h3 className="category-products-title">
        <span className="category-icon">📦</span>
        {categoryName}
      </h3>
      <div className="category-products-grid">
        {products.map((product) => (
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
    </div>
  );
}