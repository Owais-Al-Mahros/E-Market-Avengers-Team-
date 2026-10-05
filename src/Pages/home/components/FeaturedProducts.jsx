import { useEffect, useRef, useState, useCallback } from "react";
import { useFeatured } from "../../../context/FeaturedContext";
import ProductCard from "../../../components/product/ProductCard";
import "./FeaturedProducts.css";

const AUTO_DELAY = 4000;   // كل 4 ثوانٍ

export default function FeaturedProducts() {
    const { items, loading } = useFeatured();

    const viewportRef = useRef(null);
    const [index, setIndex] = useState(0);
    const [metrics, setMetrics] = useState({
        cardWidth: 200,
        gap: 20,
        visible: 5,
    });
    const [paused, setPaused] = useState(false);

    /* ═══════════════════════════════════════════
       Measure card width + gap on resize
       ═══════════════════════════════════════════ */
    const measure = useCallback(() => {
        const vp = viewportRef.current;
        if (!vp) return;

        const w = window.innerWidth;
        let visible;
        if (w < 480) visible = 2;
        else if (w < 768) visible = 3;
        else if (w < 1024) visible = 3;
        else if (w < 1200) visible = 4;
        else visible = 5;

        const gap = w < 480 ? 12 : w < 768 ? 16 : 20;
        const vpWidth = vp.clientWidth;
        const cardWidth = (vpWidth - gap * (visible - 1)) / visible;

        setMetrics({ cardWidth, gap, visible });
    }, []);

    useEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    /* ═══════════════════════════════════════════
       Derived
       ═══════════════════════════════════════════ */
    const canSlide = !loading && items.length > metrics.visible;
    const maxIndex = Math.max(0, items.length - metrics.visible);
    const step = metrics.cardWidth + metrics.gap;

    /* Clamp index when visible/maxIndex change (resize) */
    useEffect(() => {
        if (index > maxIndex) setIndex(0);
    }, [index, maxIndex]);

    /* ═══════════════════════════════════════════
       Auto-advance
       ═══════════════════════════════════════════ */
    useEffect(() => {
        if (!canSlide || paused) return;

        const id = setInterval(() => {
            setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, AUTO_DELAY);

        return () => clearInterval(id);
    }, [canSlide, paused, maxIndex]);

    /* ═══════════════════════════════════════════
       Render
       ═══════════════════════════════════════════ */
    if (!loading && items.length === 0) return null;

    return (
        <section className="featured-section">
            <div className="featured-inner">
                {/* ═══ Header ═══ */}
                <header className="featured-header">
                    <div className="featured-title-wrap">
                        <span className="featured-badge">🔥 Ausgewählt</span>
                        <h2 className="featured-title">Empfohlene Produkte</h2>
                        <p className="featured-subtitle">
                            Unsere Auswahl der Woche – handverlesen für Sie.
                        </p>
                    </div>
                </header>

                {/* ═══ Viewport + Track ═══ */}
                {loading ? (
                    <div className="featured-loading">
                        <div className="featured-spinner" />
                    </div>
                ) : (
                    <div
                        className="featured-viewport"
                        ref={viewportRef}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        onTouchStart={() => setPaused(true)}
                        onTouchEnd={() => setPaused(false)}
                    >
                        <div
                            className="featured-track"
                            style={{
                                gap: `${metrics.gap}px`,
                                transform: `translateX(-${index * step}px)`,
                                transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                        >
                            {items.map((product) => (
                                <div
                                    key={product.id}
                                    className="featured-card-slot"
                                    style={{ width: `${metrics.cardWidth}px` }}
                                >
                                    <ProductCard {...product} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ Dots ═══ */}
                {canSlide && (
                    <div className="featured-dots">
                        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`featured-dot ${i === index ? "active" : ""}`}
                                onClick={() => setIndex(i)}
                                aria-label={`Gehe zu Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}