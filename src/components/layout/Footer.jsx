import "./Footer.css";
import { Link } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";

/* البيانات في مصفوفات: إضافة رابط/شبكة اجتماعية = سطر واحد بدل كتلة JSX كاملة */
const SOCIAL = [
  { label: "Instagram", href: "https://www.instagram.com/mohamad_rslan_/", icon: "/iconInstagram.png" },
  { label: "Facebook", href: "https://www.facebook.com/Rslan.Nwelaty/", icon: "/iconFacebook.png" },
  { label: "X", href: "https://x.com/MohamadRslan5", icon: "/twitter-x-.webp" },
];

const SERVICE_LINKS = [
  { to: "/faq", label: "FAQ" },
  { to: "/help", label: "Kontakt" },
  { to: "/lieferung-zahlung", label: "Lieferung & Zahlung" },
  { to: "/widerruf", label: "Widerruf" },
];

/* الروابط القانونية في الشريط السفلي (النمط المعتاد)، فتقصر قائمة الخدمة */
const LEGAL_LINKS = [
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
              src="/logo - Copy.png"
              className="footer-logo-icon"
              alt=""
              width="64"
              height="64"
              loading="lazy"
              decoding="async"
            />
            <span className="footer-logo-name">{brand}</span>
          </Link>

          <p className="footer-description">
            {company?.owner_name
              ? `${company.brand_name} · ${company.owner_name}`
              : "Ihr Online-Supermarkt."}
          </p>

          <ul className="footer-social">
            {SOCIAL.map(({ label, href, icon }) => (
              <li key={label}>
                <a
                  href={href}
                  className="footer-social-link"
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={icon} alt="" width="24" height="24" loading="lazy" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ========== Contact ========== */}
        <div className="footer-section">
          <h3 className="footer-section-title">Kontakt</h3>
          <ul className="footer-contact-list">
            {company?.contact_phone && (
              <li className="footer-contact-item">
                <span className="footer-contact-chip">
                  <img src="/phone-call.png" alt="" width="20" height="20" loading="lazy" />
                </span>
                <a href={`tel:${company.contact_phone}`} className="footer-link">
                  {company.contact_phone}
                </a>
              </li>
            )}
            {company?.contact_email && (
              <li className="footer-contact-item">
                <span className="footer-contact-chip">
                  <img src="/email.png" alt="" width="20" height="20" loading="lazy" />
                </span>
                <a href={`mailto:${company.contact_email}`} className="footer-link">
                  {company.contact_email}
                </a>
              </li>
            )}
            {company?.address && (
              <li className="footer-contact-item">
                <span className="footer-contact-chip">
                  <img src="/location-pin.png" alt="" width="20" height="20" loading="lazy" />
                </span>
                <span className="footer-link">
                  {company.address}
                  {company.house_number && ` ${company.house_number}`},{" "}
                  {company.postal_code} {company.city}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* ========== Customer service ========== */}
        <div className="footer-section">
          <h3 className="footer-section-title">Kundenservice</h3>
          <ul className="footer-list">
            {SERVICE_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="footer-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ========== Bottom bar ========== */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} {brand}. Alle Rechte vorbehalten.
        </p>

        <ul className="footer-legal">
          {LEGAL_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} className="footer-link">{label}</Link>
            </li>
          ))}
        </ul>

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
