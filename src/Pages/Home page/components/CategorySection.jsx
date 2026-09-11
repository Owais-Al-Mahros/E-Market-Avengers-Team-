import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import ProductCard from "../../DisplayProducts/components/ProductCard.jsx";
import "./CategorySection.css";

export default function CategorySection({ categoryId, categoryName }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId)
        .order("name");

      if (error) {
        console.error(error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    if (categoryId) fetchProductsByCategory();
  }, [categoryId]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="cat-loading">
        <div className="cat-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="cat-empty">
        <span className="material-symbols-outlined">inbox</span>
        <p>No products in this category.</p>
      </div>
    );
  }

  return (
    <div className="cat-section">
      {/* Header */}
      <div className="cat-header">
        <h3 className="cat-title">
          <span className="cat-icon">📦</span>
          {categoryName}
          <span className="cat-count">{products.length}</span>
        </h3>

        <div className="cat-nav">
          <button className="cat-nav-btn" onClick={() => scroll("left")}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="cat-nav-btn" onClick={() => scroll("right")}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div className="cat-scroll" ref={scrollRef}>
        <div className="cat-track">
          {products.map((product) => (
            <div className="cat-card-slot" key={product.id}>
              <ProductCard
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}