// src/Pages/Home page/HomePage.jsx
import "./HomePage.css";
import { Link, useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext.jsx";
import HomePageFooter from "./components/HomePageFooter.jsx";
import HomePageHeader from "./components/HomePageHeader.jsx";
import HomePageHero from "./components/HomePageHero";
import { useState } from "react";
import Subscribe from "../../Components/Subscribe.jsx";
import SubHomeHeader from "./components/SubHomeHeader.jsx";
import FeaturesBar from "./components/FeaturesBar.jsx";
function HomePage() {
  const { categories, loading: categoriesLoading } = useCategories();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);


  const handleCategorySelect = (categoryId) => {
    navigate(`/DisplayProducts?categoryId=${categoryId}`);
  };

  return (
    <>
      <HomePageHeader
        setIsSearching={setIsSearching}
        isSearching={isSearching}
      />
      <SubHomeHeader />
      <HomePageHero />

      {/* {FeaturesBar} */}
      <FeaturesBar />

      <div className="category-sections" id="category-sections">
        <h2>Categories</h2>
        <div className="categories-grid">
          {categoriesLoading ? (
            <p>Loading categories...</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => handleCategorySelect(cat.id)}
              >
                <img
                  src={cat.image}
                  className="category-image"
                  alt={cat.name}
                />
                <h2 className="category-name">{cat.name}</h2>
              </div>
            ))
          )}
        </div>
      </div>
      <Subscribe />
      <HomePageFooter />
    </>
  );
}

export default HomePage;
