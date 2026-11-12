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
  { icon: "🌿", title: "Gemüse", subtitle: "Täglich frisch" },
  { icon: "🍓", title: "Obst", subtitle: "Süß & reif" },
  { icon: "🥤", title: "Getränke", subtitle: "Kalt & frisch" },
  { icon: "🥜", title: "Nüsse", subtitle: "Premium-Qualität" },
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

  // ✅ تحميل الصورة التالية مسبقًا: بدونه تُطلب (≈300KB) لحظة بدء حركة الدخول، فتظهر فراغًا على الشبكات البطيئة
  useEffect(() => {
    const img = new Image();
    img.src = HERO_IMAGES[(currentIndex + 1) % HERO_IMAGES.length];
  }, [currentIndex]);

  // ✅ تدوير تلقائي كل 5 ثوانٍ (يتوقف لمن فعّل "تقليل الحركة")
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
          fetchPriority={currentIndex === 0 ? "high" : undefined}
          decoding="async"
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
            <span>Lebensmittel, Getränke & mehr</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-dark">Ihre frischen</span>
            <span className="hero-title-green">Lebensmittel geliefert</span>
          </h1>

          <p className="hero-description">
            Frische Produkte in Premium-Qualität — direkt vor Ihre
            Haustür geliefert.
          </p>

          <button
            type="button"
            className="hero-cta"
            onClick={handleShopNowClick}
          >
            <span>Jetzt einkaufen</span>
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