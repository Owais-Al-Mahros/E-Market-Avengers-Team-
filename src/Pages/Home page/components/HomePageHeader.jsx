import "./HomePageHeader.css";
import { useCart } from "../../../context/CartContext.jsx"; // ✅ استيراد السياق
import { useState } from "react";
import Cart from "../modals/Cart.jsx"; // ✅ سننشئه قريباً

function HomePageHeader() {
  const { totalItems } = useCart(); // ✅ جلب العدد الإجمالي
  const [isCartOpen, setIsCartOpen] = useState(false); // ✅ حالة فتح المودال

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

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

          {/* ✅ أيقونة السلة مع العداد */}
          <div className="header-cart" onClick={openCart} style={{ cursor: "pointer" }}>
            <button className="header-cart-button">
              <img src="/cart.png" alt="Cart" className="header-cart-icon" />
            </button>
            {/* ✅ العداد يظهر فقط إذا كان هناك منتجات */}
            {totalItems > 0 && (
              <span className="counter-of-items">{totalItems}</span>
            )}
          </div>
        </div>
      </div>

      {/* ✅ مودال السلة */}
      {isCartOpen && <Cart closeModal={closeCart} />}
    </>
  );
}

export default HomePageHeader;