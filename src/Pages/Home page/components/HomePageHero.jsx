import "./HomePageHero.css";
import heroImage from "../../../assets/hero-image.jpg"; // يمكنك استبدال هذا بالرابط مباشرة

export default function HomePageHero() {
    return (
        <section className="hero-section">
            <div className="hero-grid">
                {/* ===== العمود الأيسر: النص داخل حاوية ===== */}
                <div className="hero-text-wrapper">
                    <div className="hero-text-card">
                        <div className="hero-badge">
                            <span className="badge-dot"></span>
                            Healthy & Fresh
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
                            <button className="hero-btn primary">Shop Now →</button>
                            <button className="hero-btn secondary">Explore</button>
                        </div>

                        <div className="hero-categories">
                            <span className="category-tag">🥬 Vegetables</span>
                            <span className="category-tag">🍎 Fruits</span>
                            <span className="category-tag">🥤 Drinks</span>
                            <span className="category-tag">🥜 Nuts</span>
                        </div>
                    </div>
                </div>

                {/* ===== العمود الأيمن: الصورة ===== */}
                <div className="hero-image-wrapper">
                    <img
                        src={heroImage}
                        alt="Fresh Groceries"
                        className="hero-image"
                    />
                    <div className="floating-card">
                        <span className="floating-icon">🌿</span>
                        <div>
                            <strong>100% Organic</strong>
                            <p>Farm fresh produce</p>
                        </div>
                    </div>
                    <div className="floating-card second">
                        <span className="floating-icon">🚚</span>
                        <div>
                            <strong>Free Delivery</strong>
                            <p>On orders over $50</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
