import "./HomePage.css";
import ProductCard from "./components/ProductCard.jsx";
import HomePageFooter from "./components/HomePageFooter.jsx";
import HomePageHeader from "./components/HomePageHeader.jsx";
import HomePageHero from "./components/HomePageHero";
import CategorySection from "./components/CategorySection.jsx";

import { useProducts } from "../../context/ProductContext.jsx";
import { useCategories } from "../../context/CategoryContext.jsx";
import { useState } from "react";

function HomePage() {
  const { products, loading, setProducts } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const [isSearching, setIsSearching] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const selectedCategory = categories.find(
    (cat) => cat.id === selectedCategoryId,
  );

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId((prevId) =>
      prevId === categoryId ? null : categoryId,
    );
  };

  const renderProducts = () => {
    if (loading || isSearching) {
      return <h1>...loading products</h1>;
    }
    return products.map((product) => (
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
        nutritionObject={product.nutrition_facts}
        storageObject={product.storage_notes}
        ingredients={product.ingredients}
      />
    ));
  };

  return (
    <>
      {/* ✅ تمرير setProducts من السياق مباشرة */}
      <HomePageHeader
        setProducts={setProducts}
        setIsSearching={setIsSearching}
        isSearching={isSearching}
      />
      <HomePageHero />
      {/* <div className="Products" id="products">
        {renderProducts()}
      </div> */}
      <div className="category-sections" id="category-sections">
        <h2>Categories</h2>
        <div className="categories-grid">
          {categoriesLoading ? (
            <p>Loading categories...</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className={`category-card ${
                  selectedCategoryId === cat.id ? "active" : ""
                }`}
                onClick={() => handleCategorySelect(cat.id)}
              >
                <img
                  src={cat.image}
                  className="category-image"
                  alt={cat.name}
                />
                <h2>{cat.name}</h2>
              </div>
            ))
          )}
        </div>
        {selectedCategory && (
          <div className="selected-category-section">
            <CategorySection
              categoryId={selectedCategory.id}
              categoryName={selectedCategory.name}
            />
          </div>
        )}
      </div>
      <HomePageFooter />
    </>
  );
}
export default HomePage;
