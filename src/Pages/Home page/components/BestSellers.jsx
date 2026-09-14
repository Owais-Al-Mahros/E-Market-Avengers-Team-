import { useEffect, useState, useRef } from "react";
import { useProducts } from "../../../context/ProductContext";
import ProductCard from "../../DisplayProducts/components/ProductCard";
import "./BestSellers.css";

export default function BestSellers() {
    const { fetchBestSellers } = useProducts();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            const data = await fetchBestSellers(10);
            setProducts(data);
            setLoading(false);
        };
        load();
    }, []);

    const scroll = (direction) => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.clientWidth * 0.8;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    // لا تُعرض إذا لا يوجد منتجات مبيعة
    if (loading) {
        return (
            <section className="bs-section">
                <div className="bs-loading">
                    <div className="bs-spinner" />
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

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

                {/* Scroll Controls */}
                <div className="bs-controls">
                    <button
                        className="bs-nav-btn"
                        onClick={() => scroll("left")}
                        aria-label="Scroll left"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                        className="bs-nav-btn"
                        onClick={() => scroll("right")}
                        aria-label="Scroll right"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Horizontal Scroll */}
            <div className="bs-scroll" ref={scrollRef}>
                <div className="bs-track">
                    {products.map((product, index) => (
                        <div key={product.id} className="bs-card-slot">
                            {/* Rank Badge */}
                            <div className={`bs-rank ${index < 3 ? `bs-rank-${index + 1}` : ""}`}>
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
            </div>
        </section>
    );
}