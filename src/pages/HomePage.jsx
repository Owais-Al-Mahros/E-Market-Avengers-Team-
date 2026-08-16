import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

import "./HomePage.css";
import ProductCard from "../components/ProductCard";
import HomePageFooter from "../components/HomePageFooter";
import { fetchData } from "../hooks/useProduct.js";

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
        name={product.name}
        description={product.description}
        image={product.image}
        price={product.price}
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
