import "./HomePageHero.css";
import heroImage from "../../../assets/hero-image-1.png";
import heroImage2 from "../../../assets/hero-image-2.png";
import heroImage3 from "../../../assets/hero-image-3.png";
import { useEffect, useState } from "react";

export default function HomePageHero() {
  const heroImages = [heroImage, heroImage2, heroImage3];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval); // تنظيف الـ Interval عند إغلاق المكون
  }, [heroImages.length]);

  const handleShopNowClick = () => {
    const productsSection = document.getElementById("category-sections");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-grid">
        {/* ===== العمود الأيسر: النصوص والأزرار وتقييم العملاء ===== */}
        <div className="hero-text-wrapper">
          <div className="hero-text-card">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              HEALTHY & FRESH
            </div>

            <h1 className="hero-title">
              <span className="brand-name">Shopora</span>
              <span className="title-line">Fresh Grocery</span>
              <span className="title-highlight">Market</span>
            </h1>

            <p className="hero-description">
              Premium quality fresh produce, delivered to your doorstep.
            </p>

            <div className="hero-buttons">
              <button className="hero-btn primary" onClick={handleShopNowClick}>
                Shop Now →
              </button>
              <button
                className="hero-btn secondary"
                onClick={handleShopNowClick}
              >
                Explore Deals
              </button>
            </div>

            {/* قسم العملاء/التقييم بدلاً من الأوسمة */}
            <div className="hero-social-proof">
              <div className="avatar-group">
                <img src="https://i.pravatar.cc/100?img=1" alt="User" />
                <img src="https://i.pravatar.cc/100?img=2" alt="User" />
                <img src="https://i.pravatar.cc/100?img=3" alt="User" />
              </div>
              <p className="social-proof-text">
                Join <strong>10,000+</strong> happy customers who trust Shopora
                every day
              </p>
            </div>
          </div>
        </div>

        {/* ===== العمود الأوسط: الصورة الرئيسية و dots التنقل ===== */}
        <div className="hero-image-wrapper">
          <img
            src={heroImages[currentIndex]}
            alt="Fresh Groceries"
            className="hero-image fade-effect"
            key={currentIndex}
          />

          <div className="carousel-dots">
            {heroImages.map((_, index) => (
              <span
                key={index}
                className={`dot ${currentIndex === index ? "active" : ""}`}
                onClick={() => setCurrentIndex(index)}
              ></span>
            ))}
          </div>
        </div>

        {/* ===== العمود الأيمن: بطاقات المميزات المزدوجة ===== */}
        <div className="hero-features-wrapper">
          <div className="floating-card">
            <span className="floating-icon">🌿</span>
            <div>
              <strong>100% Organic</strong>
              <p>Farm fresh produce</p>
            </div>
          </div>

          <div className="floating-card">
            <span className="floating-icon">🚚</span>
            <div>
              <strong>Free Delivery</strong>
              <p>On orders over $50</p>
            </div>
          </div>

          <div className="floating-card">
            <span className="floating-icon">🛡️</span>
            <div>
              <strong>Secure Payment</strong>
              <p>100% safe & trusted</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
