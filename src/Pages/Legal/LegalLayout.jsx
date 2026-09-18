import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CartHeader from "../Cart and payments/pages/ShoppingCart/components/CartHeader";
import Footer from "../../Components/Footer";
import "./LegalLayout.css";

const LEGAL_PAGES = [
    { path: "/agb", title: "AGB", icon: "📜" },
    { path: "/impressum", title: "Impressum", icon: "🏢" },
    { path: "/datenschutz", title: "Datenschutz", icon: "🔒" },
    { path: "/widerruf", title: "Widerruf", icon: "↩️" },
    { path: "/lieferung-zahlung", title: "Lieferung & Zahlung", icon: "🚚" },
];

export default function LegalLayout({ title, subtitle, children, sections = [] }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState("");
    const [tocOpen, setTocOpen] = useState(false);

    // ===== Scroll Spy (رصد القسم النشط) =====
    useEffect(() => {
        if (!sections.length) return;

        const handleScroll = () => {
            const scrollPos = window.scrollY + 150;
            for (let i = sections.length - 1; i >= 0; i--) {
                const el = document.getElementById(sections[i].id);
                if (el && el.offsetTop <= scrollPos) {
                    setActiveSection(sections[i].id);
                    return;
                }
            }
            setActiveSection(sections[0]?.id || "");
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [sections]);

    // ===== العودة لأعلى عند تغيير الصفحة =====
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [location.pathname]);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            const y = el.offsetTop - 100;
            window.scrollTo({ top: y, behavior: "smooth" });
            setTocOpen(false);
        }
    };

    return (
        <div className="legal-page">
            <CartHeader currentStep={null} />

            <main className="legal-main">
                {/* ===== Hero ===== */}
                <div className="legal-hero">
                    <div className="legal-hero-inner">
                        <span className="legal-hero-badge">⚖️ Legal Document</span>
                        <h1>{title}</h1>
                        {subtitle && <p>{subtitle}</p>}
                        <span className="legal-updated">
                            Last updated:{" "}
                            {new Date().toLocaleDateString("de-DE")}
                        </span>
                    </div>
                </div>

                <div className="legal-layout">
                    {/* ===== Sidebar ===== */}
                    <aside className="legal-sidebar">
                        {/* زر PDF */}
                        <button
                            className="legal-pdf-btn"
                            onClick={() => window.print()}
                        >
                            <span className="material-symbols-outlined">download</span>
                            Als PDF speichern
                        </button>

                        {/* الفهرس (Desktop) */}
                        {sections.length > 0 && (
                            <>
                                <div className="legal-toc">
                                    <h3>
                                        <span className="material-symbols-outlined">list</span>
                                        Inhalt
                                    </h3>
                                    <ul>
                                        {sections.map((s) => (
                                            <li key={s.id}>
                                                <button
                                                    className={`legal-toc-link ${activeSection === s.id ? "active" : ""
                                                        }`}
                                                    onClick={() => scrollToSection(s.id)}
                                                >
                                                    {s.title}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* زر الفهرس (Mobile) */}
                                <button
                                    className="legal-toc-mobile-btn"
                                    onClick={() => setTocOpen((p) => !p)}
                                >
                                    <span className="material-symbols-outlined">
                                        {tocOpen ? "close" : "list"}
                                    </span>
                                    {tocOpen ? "Inhalt schließen" : "Inhalt anzeigen"}
                                </button>
                            </>
                        )}

                        {/* التنقل بين الصفحات */}
                        <div className="legal-nav">
                            <h3>
                                <span className="material-symbols-outlined">folder_open</span>
                                Weitere Dokumente
                            </h3>
                            <ul>
                                {LEGAL_PAGES.filter(
                                    (p) => p.path !== location.pathname
                                ).map((p) => (
                                    <li key={p.path}>
                                        <button
                                            className="legal-nav-link"
                                            onClick={() => navigate(p.path)}
                                        >
                                            <span>{p.icon}</span>
                                            <span>{p.title}</span>
                                            <span className="material-symbols-outlined">
                                                chevron_right
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* ===== Content ===== */}
                    <article className="legal-content">{children}</article>
                </div>
            </main>

            <Footer />
        </div>
    );
}