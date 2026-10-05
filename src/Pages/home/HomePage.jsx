import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import { useCategories } from "../../context/CategoryContext";

import Header from "../../components/layout/Header";
import Hero from "./components/Hero";
import SubHeader from "../../components/layout/SubHeader";
import FeaturesBar from "./components/FeaturesBar";
import HowItWorks from "./components/HowItWorks";
import CategoriesGrid from "./components/CategoriesGrid";
import FeaturedProducts from "./components/FeaturedProducts";

import Subscribe from "../../components/layout/Subscribe";
import Footer from "../../components/layout/Footer";

export default function HomePage() {
  const { categories, loading: categoriesLoading } = useCategories();
  const navigate = useNavigate();

  const handleCategorySelect = (categoryId) => {
    navigate(`/DisplayProducts?categoryId=${categoryId}`);
  };

  return (
    <>
      <Header />
      <SubHeader />
      <Hero />
      <FeaturesBar />
      <FeaturedProducts />
      <div className="category-sections" id="category-sections">
        <h2 className="title-cate">Categories</h2>
        <CategoriesGrid
          categories={categories}
          loading={categoriesLoading}
          onSelect={handleCategorySelect}
        />
      </div>

      <Subscribe />
      <HowItWorks />
      <Footer />
    </>
  );
}