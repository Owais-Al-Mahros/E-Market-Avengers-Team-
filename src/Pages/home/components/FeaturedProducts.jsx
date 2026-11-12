import { useCallback, useEffect, useRef, useState } from "react";
import { useFeatured } from "../../../context/FeaturedContext";
import ProductCard from "../../../components/product/ProductCard";
import "./FeaturedProducts.css";

const AUTO_DELAY = 4000; // كل 4 ثوانٍ

const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* المسافة بين بداية بطاقة وبداية التي تليها (عرض البطاقة + الـ gap).
   تُقاس من الـ DOM نفسه، فلا نكرر نقاط التوقف الموجودة في الـ CSS. */
const getStep = (el) =>
    el.children.length > 1 ? el.children[1].offsetLeft - el.children[0].offsetLeft : 0;

export default function FeaturedProducts() {
    const { items, loading } = useFeatured();

    const viewportRef = useRef(null);
    const [index, setIndex] = useState(0);   // البطاقة الظاهرة أولًا (من التمرير الفعلي)
    const [pages, setPages] = useState(1);   // عدد مواضع التوقف الممكنة
    const [paused, setPaused] = useState(false);

    const goTo = useCallback((i) => {
        const vp = viewportRef.current;
        if (!vp) return;
        vp.scrollTo({
            left: i * getStep(vp),
            behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
    }, []);

    /* عدد الصفحات = مدى التمرير ÷ الخطوة. يُعاد حسابه عند تغيّر حجم الإطار */
    useEffect(() => {
        const vp = viewportRef.current;
        if (!vp) return;

        const update = () => {
            const step = getStep(vp);
            setPages(step ? Math.round((vp.scrollWidth - vp.clientWidth) / step) + 1 : 1);
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(vp);
        return () => ro.disconnect();
    }, [loading, items.length]);

    /* المتصفح هو من يتحكم بالتمرير (سحب/لمس/لوحة مفاتيح)، ونحن فقط نقرأ الموضع */
    const handleScroll = (e) => {
        const vp = e.currentTarget;
        const step = getStep(vp);
        if (step) setIndex(Math.round(vp.scrollLeft / step));
    };

    const canSlide = pages > 1;

    /* تدوير تلقائي. index ضمن الاعتماديات: أي تمرير يدوي يعيد العدّاد من الصفر
       فلا يتعارض التدوير مع إصبع المستخدم */
    useEffect(() => {
        if (!canSlide || paused || prefersReducedMotion()) return;

        const id = setInterval(
            () => goTo(index >= pages - 1 ? 0 : index + 1),
            AUTO_DELAY
        );
        return () => clearInterval(id);
    }, [canSlide, paused, index, pages, goTo]);

    if (!loading && items.length === 0) return null;

    return (
        <section className="featured-section">
            <div className="featured-inner">
                <header className="featured-header">
                    <div className="featured-title-wrap">
                        <span className="featured-badge">🔥 Ausgewählt</span>
                        <h2 className="featured-title">Empfohlene Produkte</h2>
                        <p className="featured-subtitle">
                            Unsere Auswahl der Woche – handverlesen für Sie.
                        </p>
                    </div>
                </header>

                {loading ? (
                    <div className="featured-loading">
                        <div className="featured-spinner" />
                    </div>
                ) : (
                    <div
                        className="featured-viewport"
                        ref={viewportRef}
                        tabIndex={0}
                        aria-label="Empfohlene Produkte"
                        onScroll={handleScroll}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        onTouchStart={() => setPaused(true)}
                        onTouchEnd={() => setPaused(false)}
                        onFocus={() => setPaused(true)}
                        onBlur={() => setPaused(false)}
                    >
                        {items.map((product) => (
                            <div key={product.id} className="featured-card-slot">
                                <ProductCard {...product} />
                            </div>
                        ))}
                    </div>
                )}

                {canSlide && (
                    <div className="featured-dots">
                        {Array.from({ length: pages }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`featured-dot ${i === index ? "active" : ""}`}
                                onClick={() => goTo(i)}
                                aria-label={`Gehe zu Slide ${i + 1}`}
                                aria-current={i === index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
