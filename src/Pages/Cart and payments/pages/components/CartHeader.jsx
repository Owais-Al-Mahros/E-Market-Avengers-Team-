// import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "./CartHeader.css";

function CartHeader() {
  const [search, setSearch] = useState("");

  return (
    <>
      <nav className="cart-header-container">
        <div className="cart-header-right">
          <Link to="/" className="link">
            <span>E-Market</span>
          </Link>
        </div>
        <div className="cart-search-container">
          <div className="">
            <span className="material-symbols-outlined">search</span>
            <span className="forget-text">Forgot something?</span>
          </div>
          <div className="search-input-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search for products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-search">Search</button>
        </div>
        <div className="cart-header-left">
          <Link to="/" className="link">
            <span className="material-symbols-outlined ">arrow_back</span>
            Continue Shopping
          </Link>
        </div>
      </nav>
    </>
  );
}
export default CartHeader;
