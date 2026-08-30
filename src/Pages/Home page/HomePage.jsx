import { Link } from "react-router-dom";
import './HomePage.css';
import ProductCard from "./components/ProductCard.jsx";
import HomePageFooter from "./components/HomePageFooter.jsx";
import HomePageHeader from "./components/HomePageHeader.jsx";
import { useProducts } from "../../context/ProductContext.jsx"
function HomePage() {
  // const storedAdmin = localStorage.getItem("isAdmin")

  const { products, loading } = useProducts();

  const renderProducts = () => {
    if (loading) {
      return (<h1>...loading products</h1>);
    }
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
      <HomePageHeader />
      <h2>Products</h2>
      <div className="Products">{renderProducts()}</div>
      <Link to="/login">Go To DashBoard</Link>
      <HomePageFooter />
      {/* <Link to={storedAdmin == "true" ? "/dashboard" : "/login"}>Go To DashBoard</Link> */}
    </>
  );
}

export default HomePage;
