import "./Footer.css";
import { Link, useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";
import { useCompany } from "../../context/CompanyContext";

function Footer() {
  const { categories } = useCategories();
  const navigate = useNavigate();
  const { company } = useCompany();
  const handleCategorySelect = (catId) => {
    navigate(`/DisplayProducts?categoryId=${catId}`);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* ========== Information ========== */}
        <div className="footer-info">
          <div className="footer-logo">
            <img src="/logo.png" className="footer-logo-icon" alt="Shopora" />
            <h2 className="footer-logo-name">
              {company?.brand_name || "Shopora"}
            </h2>
          </div>

          <p className="footer-description">
            {company?.owner_name
              ? `${company.brand_name} · ${company.owner_name}`
              : "Ihr Online-Supermarkt."}
          </p>
          <div className="footer-social">
            <a
              href="https://www.instagram.com/mohamad_rslan_/"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="footer-social-icon"
                src="/iconInstagram.png"
                alt="Instagram"
              />
              <span>Instagram</span>
            </a>
            <a
              href="https://www.facebook.com/Rslan.Nwelaty/"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="footer-social-icon"
                src="/iconFacebook.png"
                alt="Facebook"
              />
              <span>Facebook</span>
            </a>
            <a
              href="https://x.com/MohamadRslan5"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                className="footer-social-icon"
                src="/twitter-x-.webp"
                alt="X"
              />
              <span>X</span>
            </a>
          </div>
        </div>

        {/* ========== Categories ========== */}
        <div className="footer-section">
          <h3 className="footer-section-title">Kontakt</h3>
          <ul className="footer-contact-list">
            {company?.contact_phone && (
              <li className="footer-contact-item">
                <img className="footer-contact-icon" src="/phone-call.png" alt="" />
                <a href={`tel:${company.contact_phone}`} className="footer-link">
                  {company.contact_phone}
                </a>
              </li>
            )}
            {company?.contact_email && (
              <li className="footer-contact-item">
                <img className="footer-contact-icon" src="/email.png" alt="" />
                <a href={`mailto:${company.contact_email}`} className="footer-link">
                  {company.contact_email}
                </a>
              </li>
            )}
            {company?.address && (
              <li className="footer-contact-item">
                <img className="footer-contact-icon" src="/location-pin.png" alt="" />
                <span className="footer-link">
                  {company.address}
                  {company.house_number && ` ${company.house_number}`},
                  {" "}
                  {company.postal_code} {company.city}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* ========== Customer Service ========== */}
        <div className="footer-section">
          <h3 className="footer-section-title">Customer Service</h3>
          <ul className="footer-list">
            <li><Link to="/faq" className="footer-link">FAQ</Link></li>
            <li><Link to="/help" className="footer-link">Kontakt</Link></li>
            <li><Link to="/lieferung-zahlung" className="footer-link">Lieferung & Zahlung</Link></li>
            <li><Link to="/widerruf" className="footer-link">Widerruf</Link></li>
            <li><Link to="/agb" className="footer-link">AGB</Link></li>
            <li><Link to="/datenschutz" className="footer-link">Datenschutz</Link></li>
            <li><Link to="/impressum" className="footer-link">Impressum</Link></li>
          </ul>
        </div>

        {/* ========== Contact ========== */}
        <div className="footer-section">
          <h3 className="footer-section-title">Contact</h3>
          <ul className="footer-contact-list">
            <li className="footer-contact-item">
              <img className="footer-contact-icon" src="/phone-call.png" alt="" />
              <a href="tel:+9639851678464" className="footer-link">
                +963-985-178-464
              </a>
            </li>
            <li className="footer-contact-item">
              <img className="footer-contact-icon" src="/email.png" alt="" />
              <a href="mailto:mdrslannwelaty@gmail.com" className="footer-link">
                mdrslannwelaty@gmail.com
              </a>
            </li>
            <li className="footer-contact-item">
              <img className="footer-contact-icon" src="/location-pin.png" alt="" />
              <a
                href="https://maps.app.goo.gl/2soetBmTHDYJ4ms89?g_st=ic"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                ITE College, Damascus, Syria
              </a>
            </li>
          </ul>
        </div>
      </div>

      <hr className="footer-line" />

      <p className="footer-copyright">
        © {new Date().getFullYear()} Shopora. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;