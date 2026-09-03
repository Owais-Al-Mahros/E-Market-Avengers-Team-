import './HomePage.css';
import ProductCard from "./components/ProductCard.jsx";
import HomePageFooter from "./components/HomePageFooter.jsx";
import HomePageHeader from "./components/HomePageHeader.jsx";
import HomePageHero from "./components/HomePageHero";

import { useProducts } from "../../context/ProductContext.jsx";
import { useState } from "react";

function HomePage() {
  const { products, loading, setProducts } = useProducts();
  const [isSearching, setIsSearching] = useState(false);


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
      <h2>Products</h2>
      <div className="Products">{renderProducts()}</div>

      <HomePageFooter />
    </>
  );
}

export default HomePage;