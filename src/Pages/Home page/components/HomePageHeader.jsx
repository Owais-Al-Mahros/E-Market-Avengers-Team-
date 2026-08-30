import "./HomePageHeader.css";
import { useCart } from "../../../context/CartContext.jsx"; // ✅ استيراد السياق
import { useState } from "react";
import Cart from "../modals/Cart.jsx"; // ✅ سننشئه قريباً
import { fetchData, searchProduct  } from "../../../hooks/useProduct.js"; // دالة البحث 

function HomePageHeader( { setProducts }) {
  const { totalItems } = useCart(); // ✅ جلب العدد الإجمالي
  const [isCartOpen, setIsCartOpen] = useState(false); // ✅ حالة فتح المودال
  const [searchTerm , setSearchTerm ] = useState('')

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const handleSearch = async(e) =>{
    e.preventDefault()
    if(!searchTerm.trim()) {
      const allProducts = await fetchData("products")
      if(setProducts) setProducts(allProducts)
        return
    }
    
    const result = await searchProduct(searchTerm)

    if(setProducts)
      setProducts(result)
  }

  return (
    <>
      <div className="header">
        <div className="logo-container">
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>

        <form onSubmit={handleSearch} className="header-search">
          <input type="text"
           placeholder="Search products..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="header-search-button">
            <img src="/Search.png" alt="Search" className="search-icon" />
          </button>
        </form>

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