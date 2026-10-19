import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Subscribe.css";

function Subscribe() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // ينقل المستخدم لصفحة الأسئلة الشائعة مع كلمة البحث
      navigate(`/faq?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/faq");
    }
  };

  return (
    <section className="signin-banner-container">
      <div className="signin-banner-content">
        {/* طبقة التدرج الأخضر فوق الصورة لضمان وضوح النص */}
        <div className="signin-banner-overlay"></div>

        {/* المحتوى الذي يظهر فوق الصورة */}
        <div className="signin-banner-text">
          <h2>Wir sind für dich da!</h2>
          <p>
            Hier findest du schnell Antworten, hilfreiche Informationen und
            kannst uns direkt kontaktieren.
          </p>

          <form className="signin-banner-search" onSubmit={handleSearch}>
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Thema oder Frage eingeben..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-btn">
              <span className="material-symbols-outlined">search</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Subscribe;