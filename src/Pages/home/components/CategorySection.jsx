import { useMemo, useRef } from "react";
import { useProducts } from "../../../context/ProductContext.jsx";
import ProductCard from "../../../components/product/ProductCard";
import "./CategorySection.css";

export default function CategorySection({ categoryId, categoryName }) {
  const { products, loading } = useProducts();
  const scrollRef = useRef(null);

  const categoryProducts = useMemo(
    () => products.filter((p) => p.category_id === categoryId),
    [products, categoryId]
  );

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

  if (categoryProducts.length === 0) {
    return (
      <div className="cat-empty">
        <span className="material-symbols-outlined">inbox</span>
        <p>No products in this category.</p>
      </div>
    );
  }

  return (
    <div className="cat-section">
      <div className="cat-header">
        <h3 className="cat-title">
          <span className="cat-icon">📦</span>
          {categoryName}
          <span className="cat-count">{categoryProducts.length}</span>
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

      <div className="cat-scroll" ref={scrollRef}>
        <div className="cat-track">
          {categoryProducts.map((product) => (
            <div className="cat-card-slot" key={product.id}>
              <ProductCard {...product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}