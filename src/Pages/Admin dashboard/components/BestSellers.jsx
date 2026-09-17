import { useEffect, useState } from "react";
import { useProducts } from "../../../context/ProductContext";
import ProductCard from "../../DisplayProducts/components/ProductCard";
import "./BestSellers.css";

export default function BestSellers() {
  const { fetchBestSellers } = useProducts();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [countBS, setCountBS] = useState(5);
  useEffect(() => {
    const load = async () => {
      const data = await fetchBestSellers(countBS);
      setProducts(data);
      setLoading(false);
    };
    load();
  }, [countBS]);

  // لا تُعرض إذا لا يوجد منتجات مبيعة
  if (loading && products.length === 0) {
    return (
      <section className="bs-section">
        <div className="bs-loading">
          <div className="bs-spinner" />
        </div>
      </section>
    );
  }

  return (
    <section className="bs-section">
      {/* Header */}
      <div className="bs-header">
        <div className="bs-title-wrap">
          <span className="bs-badge">🔥 Trending</span>
          <h2 className="bs-title">Best Sellers</h2>
          <p className="bs-subtitle">
            Most popular products our customers love
          </p>
        </div>
        <div className="bs-controls">
          <div className="bs-limit-box">
            <span className="bs-limit-label">Show:</span>
            <input
              type="number"
              min="1"
              max="20"
              value={countBS}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val > 0) setCountBS(val);
              }}
              className="bs-limit-input"
            />
            <span className="bs-limit-text">Products</span>
          </div>
        </div>
      </div>

      <div className="bs-flex-container">
        {products.map((product, index) => (
          <div key={product.id} className="bs-card-slot">
            {/* Rank Badge */}
            <div
              className={`bs-rank ${index < 3 ? `bs-rank-${index + 1}` : ""}`}
            >
              #{index + 1}
            </div>

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
    </section>
  );
}
