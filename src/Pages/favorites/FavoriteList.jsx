import { useFavorite } from "../../context/FavoriteContext";
import ProductCard from "../../components/product/ProductCard";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Subscribe from "../../components/layout/Subscribe";
import BackButton from "../../components/ui/BackButton";
import { useNavigate } from "react-router-dom";
import "./FavoriteList.css";

export default function Favorites() {
  const { favorite } = useFavorite();
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="favorites-page">
        <div className="favorites-header">
          <div className="favorites-title-wrap">
            <span className="favorites-badge">Saved Items</span>
            <div className="BackButton-with-title">
              <h1 className="favorites-title">My Favorite Products</h1>
              <BackButton label={"Go Home"} />
            </div>
            <p className="favorites-subtitle">
              {favorite.length > 0
                ? `You have ${favorite.length} saved product${favorite.length > 1 ? "s" : ""}`
                : "Your wishlist is currently empty"}
            </p>
          </div>
        </div>


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
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
      <Subscribe />
      <Footer />
    </>
  );
}
