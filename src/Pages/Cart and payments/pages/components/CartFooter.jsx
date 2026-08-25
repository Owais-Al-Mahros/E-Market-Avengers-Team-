import "./CartFooter.css";

export default function CartFooter() {
  return (
    <>
      <div className="container-footer">
        <div className="sub-container-footer">
          <div className="information">
            <div className="logo">
              <img src="/logo.png" className="logo-icon"></img>
              <h1 className="logo-name">E-Market</h1>
            </div>
            <div className="description">
              Your best store where you found anything you want
            </div>
            <div className="social-media">
              <a
                href="https://www.instagram.com/mohamad_rslan_/"
                className="social-link"
              >
                <img
                  className="social-media-logo"
                  src="/iconInstagram.png"
                  alt="Instagram"
                ></img>
                <span className="platForms">instagram</span>
              </a>
              <a
                href="https://www.facebook.com/Rslan.Nwelaty/"
                className="social-link"
              >
                <img
                  className="social-media-logo"
                  src="/iconFacebook.png"
                  alt="facebook"
                ></img>
                <span className="platForms">Facebook</span>
              </a>
              <a href="https://x.com/MohamadRslan5" className="social-link">
                <img
                  className="social-media-logo"
                  src="/twitter-x-.webp"
                  alt="X"
                ></img>
                <span className="platForms">X</span>
              </a>
            </div>
          </div>
          <div className="category">
            <h3 className="subTitles">Prominent categories</h3>
            <ul className="category-list">
              <a href="#" className="category-link">
                <li>Phone</li>
              </a>
              <a href="#" className="category-link">
                <li>IPad</li>
              </a>
              <a href="#" className="category-link">
                <li>Smart Watch</li>
              </a>
              <a href="#" className="category-link">
                <li>Laptops</li>
              </a>
            </ul>
          </div>
          <div className="customer-service">
            <h3 className="subTitles">Customer Service</h3>
            <ul className="service-list">
              <a href="#" className="service-link">
                <li>FAQ</li>
              </a>
              <a href="#" className="service-link">
                <li>Terms Of Use</li>
              </a>
              <a href="#" className="service-link">
                <li>Privacy Policy</li>
              </a>
            </ul>
          </div>
          <div className="contact-us">
            <div className="contact-phone">
              <img className="social-media-logo" src="/phone-call.png"></img>
              <a href="tel:+9639851678464" className="phone-number">
                +963-985-178-464
              </a>
            </div>
            <div className="contact-email">
              <img className="social-media-logo" src="/email.png"></img>
              <a href="mailto:mdrslannwelaty@gmail.com" className="email">
                mdrslannwelaty@gmail.com
              </a>
            </div>
            <div className="contact-location">
              <img className="social-media-logo" src="/location-pin.png"></img>
              <a
                href="https://maps.app.goo.gl/2SoetBmTHDYJ4ms89?g_st=ic"
                target="_blank"
                className="location-link"
              >
                ITE College, Damascus, Syria
              </a>
            </div>
          </div>
        </div>
        <hr className="line"></hr>
      </div>
    </>
  );
}
