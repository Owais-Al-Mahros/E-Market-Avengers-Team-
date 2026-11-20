import "./Footer.css";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";

/* كل الصفحات في صف أفقي واحد: خدمة العملاء ثم القانونية */
const PAGE_LINKS = [
  { to: "/faq", label: "FAQ" },
  { to: "/help", label: "Kontakt" },
  { to: "/lieferung-zahlung", label: "Lieferung & Zahlung" },
  { to: "/widerruf", label: "Widerruf" },
  { to: "/agb", label: "AGB" },
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/impressum", label: "Impressum" },
];

const scrollToTop = () => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
};

function Footer() {
  const { company } = useCompany();
  const brand = company?.brand_name || "Shopora";

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* ========== Brand ========== */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo" aria-label={`${brand} – Startseite`}>
            <img
              src="/logo.png"
              className="footer-logo-icon"
              alt=""
              width="64"
              height="64"
              loading="lazy"
              decoding="async"
            />
            <span className="footer-logo-name">{brand}</span>
          </Link>
        </div>

        {/* ========== Contact (E-Mail فقط، بدون رقم الهاتف) ========== */}
        {company?.contact_email && (
          <div className="footer-section">
            <h3 className="footer-section-title">Kontakt</h3>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <span className="footer-contact-chip">
                  <img src="/email.png" alt="" width="20" height="20" loading="lazy" />
                </span>
                <a href={`mailto:${company.contact_email}`} className="footer-link footer-link-lg">
                  {company.contact_email}
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* ========== Pages: صف أفقي ========== */}
      <nav className="footer-nav" aria-label="Seiten">
        <ul className="footer-nav-list">
          {PAGE_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} className="footer-link">{label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ========== Bottom bar ========== */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} {brand}. Alle Rechte vorbehalten.
        </p>

        <button
          type="button"
          className="footer-top-btn"
          onClick={scrollToTop}
          aria-label="Nach oben"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

    </footer>
  );
}

export default Footer;