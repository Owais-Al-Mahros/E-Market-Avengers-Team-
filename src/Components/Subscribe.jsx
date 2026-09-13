import React from "react";
import { useNavigate } from "react-router-dom";
import "./Subscribe.css";

function Subscribe() {
  const navigate = useNavigate();

  return (
    <section className="signin-banner-container">
      <div className="signin-banner-content">
        <div className="signin-banner-text">
          <span className="signin-badge">🎁 Exclusive Offers Await</span>
          <h2>Join Shopora Today & Unlock Special Perks!</h2>
          <p>
            Create an account or sign in to get access to personalized discounts, 
            fast checkout, and instant order tracking.
          </p>
        </div>

        <div className="signin-banner-actions">
          <button 
            className="btn-banner-login" 
            onClick={() => navigate("/login")}
          >
            Sign In / Register &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}

export default Subscribe;