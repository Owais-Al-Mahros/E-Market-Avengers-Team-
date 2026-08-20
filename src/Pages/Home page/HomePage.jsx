import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { useEffect, useState } from "react";

import "./HomePage.css";
import ProductCard from "./components/ProductCard.jsx";
import HomePageFooter from "./components/HomePageFooter.jsx";
import { fetchData } from "../../hooks/useProduct.js";

function HomePage() {
  // const storedAdmin = localStorage.getItem("isAdmin")
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const productsFromDataBase = await fetchData("products");
    setProducts(productsFromDataBase);
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  const renderProducts = () => {
    return products.map((product, index) => (
      <ProductCard
        key={product.id}
        id={product.id}
        name={product.name}
        image={product.image}
        category={product.category}
        price={product.price}
        weight={product.weight}
        tax_rate={product.tax_rate}
        weight_unit={product.weight_unit}
        total_price={product.total_price}
        description={product.description}
        nutritionObject={product.nutrition_facts}  // 🔥 الكائن الجديد
        storageObject={product.storage_notes}       // 🔥 الكائن الجديد
        ingredients={product.ingredients}
      />
    ));
  };

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

      <h2>Products</h2>
      <div className="Products">{renderProducts()}</div>

      <Link to="/login">Go To DashBoard</Link>
      <HomePageFooter />
      {/* <Link to={storedAdmin == "true" ? "/dashboard" : "/login"}>Go To DashBoard</Link> */}
    </>
  );
}

export default HomePage;
