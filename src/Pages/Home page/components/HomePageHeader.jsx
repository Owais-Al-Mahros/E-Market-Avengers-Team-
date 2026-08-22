import "./HomePageHeader.css";

function HomePageHeader() {
  return (
    <>
      <div className="header">
        <div className="logo-container">
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>
        <div className="header-search">
          <input type="text" placeholder="Search products..." />
          <button className="header-search-button">
            <img src="/Search.png" alt="Search" className="search-icon" />
          </button>
        </div>

        <div className="header-links">
          <button className="header-login">Login</button>
          <div className="header-cart">
            <button className="header-cart-button">
              <img src="/cart.png" alt="Cart" className="header-cart-icon" />
            </button>
            <span className="counter-of-items">0</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePageHeader;
