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
            <span className="favorites-badge">Gespeicherte Artikel</span>
            <div className="BackButton-with-title">
              <h1 className="favorites-title">Meine Favoriten</h1>
              <BackButton label={"Startseite"} />
            </div>
            <p className="favorites-subtitle">
              {favorite.length > 0
                ? `Sie haben ${favorite.length} gespeicherte${favorite.length > 1 ? " Produkte" : "s Produkt"}`
                : "Ihre Merkliste ist derzeit leer"}
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
            <h2>Noch keine Favoriten!</h2>
            <p>
              Entdecken Sie unseren Shop, tippen Sie auf das Herz-Symbol bei einem Produkt und behalten Sie hier alles im Blick, was Ihnen gefällt.
            </p>
            <button
              className="browse-products-btn"
              onClick={() => navigate("/")}
            >
              <span className="material-symbols-outlined">shopping_bag</span>
              Jetzt einkaufen
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