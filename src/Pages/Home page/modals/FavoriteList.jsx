import { useFavorite } from "../../../context/FavoriteContext";
import ProductCard from "../../DisplayProducts/components/ProductCard";
import HomePageHeader from "../components/HomePageHeader";
import Footer from "../../../Components/Footer";
import Subscribe from "../../../Components/Subscribe";
import BackButton from "../../../Components/BackButton";
import { useNavigate } from "react-router-dom";
import "./FavoriteList.css";

export default function Favorites() {
  const { favorite } = useFavorite();
  const navigate = useNavigate();

  return (
    <>
      <HomePageHeader />
      <div className="favorites-page">
        <div className="favorites-header">
          <div className="favorites-title-wrap">
            <span className="favorites-badge">Saved Items</span>
            <h1 className="favorites-title">My Favorite Products</h1>
            <p className="favorites-subtitle">
              {favorite.length > 0
                ? `You have ${favorite.length} saved product${favorite.length > 1 ? "s" : ""}`
                : "Your wishlist is currently empty"}
            </p>
          </div>
        </div>
        <BackButton label={"Go Home"} />

        {favorite.length === 0 ? (
          <div className="favorites-empty">
            <div className="empty-icon-wrap">
              <span className="material-symbols-outlined empty-icon">
                favorite_border
              </span>
            </div>
            <h2>No Favorites Yet!</h2>
            <p>
              Explore our store, tap the heart icon on any product, and keep
              track of everything you love right here.
            </p>
            <button
              className="browse-products-btn"
              onClick={() => navigate("/")}
            >
              <span className="material-symbols-outlined">shopping_bag</span>
              Browse Products
            </button>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorite.map((product) => (
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
                product_number={product.product_number}
              />
            ))}
          </div>
        )}
      </div>
      <Subscribe />
      <Footer />
    </>
  );
}
