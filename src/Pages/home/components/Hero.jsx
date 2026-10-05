import "./Hero.css";
import { useEffect, useState } from "react";
import heroImage1 from "../../../assets/hero-image-1.png";
import heroImage2 from "../../../assets/hero-image-2.png";
import heroImage3 from "../../../assets/hero-image-3.png";
import heroImage4 from "../../../assets/hero-image-4.png";
import heroImage5 from "../../../assets/hero-image-5.png";

const HERO_IMAGES = [
  heroImage1,
  heroImage4,
  heroImage2,
  heroImage5,
  heroImage3,
];

const HERO_FEATURES = [
  { icon: "🌿", title: "Vegetables", subtitle: "Fresh daily" },
  { icon: "🍓", title: "Fruits", subtitle: "Sweet & ripe" },
  { icon: "🥤", title: "Drinks", subtitle: "Cold & fresh" },
  { icon: "🥜", title: "Nuts", subtitle: "Premium quality" },
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);

  // ✅ تنظيف الصورة السابقة بعد انتهاء الحركة
  useEffect(() => {
    if (prevIndex === null) return;
    const t = setTimeout(() => setPrevIndex(null), 1000);
    return () => clearTimeout(t);
  }, [prevIndex]);

  // ✅ تدوير تلقائي كل 5 ثوانٍ
  useEffect(() => {
    const i = setInterval(() => {
      setPrevIndex(currentIndex);
      setCurrentIndex((v) => (v + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(i);
  }, [currentIndex]);

  const handleShopNowClick = () => {
    document
      .getElementById("category-sections")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDotClick = (i) => {
    if (i === currentIndex) return;
    setPrevIndex(currentIndex);
    setCurrentIndex(i);
  };

  return (
    <section className="hero-section">
      {/* ============================================
          Background Images (Slider)
      ============================================ */}
      <div className="hero-bg">
        {prevIndex !== null && (
          <img
            key={`out-${prevIndex}-${currentIndex}`}
            src={HERO_IMAGES[prevIndex]}
            alt=""
            className="hero-bg-img hero-bg-out"
          />
        )}
        <img
          key={`in-${currentIndex}`}
          src={HERO_IMAGES[currentIndex]}
          alt="Shopora fresh groceries"
          className={`hero-bg-img ${prevIndex !== null ? "hero-bg-in" : "hero-bg-static"
            }`}
        />
      </div>

      {/* ============================================
          Green Gradient Overlay
      ============================================ */}
      <div className="hero-overlay" aria-hidden="true" />

      {/* ============================================
          Content
      ============================================ */}
      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span>Groceries, Drinks & More</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-dark">Your Fresh</span>
            <span className="hero-title-green">Groceries Delivered</span>
          </h1>

          <p className="hero-description">
            Premium quality fresh produce, delivered straight to your
            doorstep.
          </p>

          <button
            type="button"
            className="hero-cta"
            onClick={handleShopNowClick}
          >
            <span>Shop Now</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>

          <div className="hero-features">
            {HERO_FEATURES.map((f) => (
              <div key={f.title} className="hero-feature-item">
                <span className="hero-feature-icon">{f.icon}</span>
                <div className="hero-feature-text">
                  <strong>{f.title}</strong>
                  <span>{f.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}