import { useState, useMemo } from "react";
import { useFaq } from "../../context/FaqContext";
import {
    FAQ_CATEGORIES,
    filterFaqBySearch,
} from "../../lib/faqHelpers";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Subscribe from "../../components/layout/Subscribe";
import "./FaqPage.css";

export default function FaqPage() {
    const { items, loading, error } = useFaq();
    const [search, setSearch] = useState("");
    const [openId, setOpenId] = useState(null);

    /* ═══════════════════════════════════════════
       تجميع الأسئلة حسب الفئات — مرتبة كالسلة
       ═══════════════════════════════════════════ */
    const groupedFaq = useMemo(() => {
        const filtered = filterFaqBySearch(items, search);

        // بناء mapping: { general: [...], delivery: [...] }
        const buckets = {};
        filtered.forEach((item) => {
            const key = item.category || "general";
            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(item);
        });

        // ترتيب المجموعات حسب FAQ_CATEGORIES + تجاهل الفارغة
        return FAQ_CATEGORIES
            .map((cat) => ({
                category: cat,
                items: buckets[cat.key] || [],
            }))
            .filter((group) => group.items.length > 0);
    }, [items, search]);

    const totalVisible = groupedFaq.reduce(
        (sum, g) => sum + g.items.length,
        0
    );

    const toggleItem = (id) => {
        setOpenId((prev) => (prev === id ? null : id));
    };

    return (
        <>
            <Header />

            <main className="faq-page">
                {/* ═══ Hero ═══ */}
                <section className="faq-hero">
                    <span className="faq-badge">💬 Hilfe-Center</span>
                    <h1>Häufige Fragen</h1>
                    <p>
                        Antworten auf die wichtigsten Fragen zu Bestellung, Lieferung
                        und mehr.
                    </p>

                    <div className="faq-search">
                        <span className="material-symbols-outlined">search</span>
                        <input
                            type="text"
                            placeholder="Suchen Sie nach einem Thema..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Suche löschen"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}
                    </div>
                </section>

                {/* ═══ Content ═══ */}
                <section className="faq-content">
                    {loading ? (
                        <div className="faq-state">
                            <div className="faq-spinner" />
                            <p>Wird geladen...</p>
                        </div>
                    ) : error ? (
                        <div className="faq-state faq-state-error">
                            <span className="material-symbols-outlined">error</span>
                            <p>{error}</p>
                        </div>
                    ) : totalVisible === 0 ? (
                        <div className="faq-state">
                            <span className="material-symbols-outlined">search_off</span>
                            <p>Keine Fragen gefunden.</p>
                        </div>
                    ) : (
                        <div className="faq-groups">
                            {groupedFaq.map(({ category, items: catItems }) => (
                                <article key={category.key} className="faq-group">
                                    {/* ═══ Group Header ═══ */}
                                    <header className="faq-group-header">
                                        <div className="faq-group-icon">
                                            <span className="material-symbols-outlined">
                                                {category.icon}
                                            </span>
                                        </div>
                                        <div className="faq-group-info">
                                            <h2 className="faq-group-title">
                                                {category.label}
                                            </h2>
                                            <span className="faq-group-count">
                                                {catItems.length}{" "}
                                                {catItems.length === 1 ? "Frage" : "Fragen"}
                                            </span>
                                        </div>
                                    </header>

                                    {/* ═══ Group Items ═══ */}
                                    <div className="faq-group-items">
                                        {catItems.map((item) => {
                                            const isOpen = openId === item.id;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`faq-item ${isOpen ? "is-open" : ""
                                                        }`}
                                                >
                                                    <button
                                                        type="button"
                                                        className="faq-question"
                                                        onClick={() => toggleItem(item.id)}
                                                        aria-expanded={isOpen}
                                                    >
                                                        <span className="faq-q-text">
                                                            {item.question}
                                                        </span>
                                                        <span className="material-symbols-outlined faq-chevron">
                                                            {isOpen
                                                                ? "expand_less"
                                                                : "expand_more"}
                                                        </span>
                                                    </button>

                                                    <div className="faq-answer-wrap">
                                                        <p className="faq-answer">{item.answer}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* ═══ CTA ═══ */}
                <section className="faq-cta">
                    <span className="material-symbols-outlined">support_agent</span>
                    <div>
                        <strong>Noch Fragen offen?</strong>
                        <p>Schreiben Sie uns – wir antworten schnellstmöglich.</p>
                    </div>
                    <a href="/help" className="faq-cta-btn">
                        Zum Kontaktformular
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </a>
                </section>
            </main>

            <Subscribe />
            <Footer />
        </>
    );
}