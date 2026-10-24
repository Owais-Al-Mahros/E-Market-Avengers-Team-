import "./ProductDetails.css";
import { useState, useEffect, memo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext.jsx";
import { useFavorite } from "../../context/FavoriteContext.jsx";
import { getProductById, getProductsByCategory, calculatePriceByKg } from "../../api/index.js";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Subscribe from "../../components/layout/Subscribe";
import ProductCard from "../../components/product/ProductCard";
import { formatEuro, formatWeight } from "../../lib/format";

const StaticHeader = memo(Header);
const StaticFooter = memo(Footer);
const StaticSubscribe = memo(Subscribe);

export default function ProductCardDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get("productId") || searchParams.get("id");

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorite();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const isFav = product ? isFavorite(product.id) : false;

  // ============================================
  // Load product
  // ============================================
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getProductById(productId).then((result) => {
      if (cancelled) return;
      if (result?.success) setProduct(result.data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // ============================================
  // Load related
  // ============================================
  useEffect(() => {
    if (!product?.category_id) return;

    let cancelled = false;
    getProductsByCategory(product.category_id, product.id).then((res) => {
      if (cancelled) return;
      if (res.success) setRelatedProducts(res.data || []);
    });

    return () => {
      cancelled = true;
    };
  }, [product]);

  // ============================================
  // Loading / Not found
  // ============================================
  if (loading) {
    return (
      <>
        <StaticHeader />
        <div className="product-page-state">Loading product...</div>
        <StaticFooter />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <StaticHeader />
        <div className="product-page-state">
          <p>Product not found.</p>
        </div>
        <StaticFooter />
      </>
    );
  }

  // ============================================
  // Destructure
  // ============================================
  const {
    id = "",
    name = "",
    image = "",
    price = 0,
    total_price = 0,
    weight = "",
    weight_unit = "",
    description = "",
    nutrition_facts: nutritionObject = {},
    storage_notes: storageObject = {},
    ingredients = "",
  } = product;

  const displayPrice = parseFloat(total_price || price) || 0;
  const finalCategory = product?.categories?.name;
  const pricePerKg = calculatePriceByKg(displayPrice, weight, weight_unit);

  const hasNutrition =
    ingredients || (nutritionObject && Object.keys(nutritionObject).length > 0);
  const hasStorage = storageObject && Object.keys(storageObject).length > 0;

  // ============================================
  // Handlers
  // ============================================
  const decreaseQty = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  const increaseQty = () => setQuantity((prev) => prev + 1);

  const handleAddToCart = () => {
    addToCart(
      {
        id,
        name,
        product_number,
        image,
        weight,
        weight_unit,
        price: displayPrice,
        total_price: displayPrice,
      },
      quantity
    );

    toast.success(`${quantity} × ${name} zum Warenkorb hinzugefügt!`, { duration: 2000 });
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      id,
      name,
      image,
      price: parseFloat(price) || 0,
      total_price: displayPrice,
      weight,
      weight_unit,
      description,
      ingredients,
      nutrition_facts: nutritionObject,
      storage_notes: storageObject,
    });
    toast(isFav ? "Aus Favoriten entfernt" : "Zu Favoriten hinzugefügt", {
      icon: isFav ? "💔" : "❤️",
    });
  };

  return (
    <>
      <StaticHeader />

      <div className="product-page-container">
        {/* ============================================
            Top action bar — Back + Go Home (side by side)
        ============================================ */}
        <div className="product-detail-actions">
          <button className="product-back-btn" onClick={() => navigate(-1)}>
            ← Zurück
          </button>
          <button className="product-back-btn" onClick={() => navigate("/")}>
            🏠 Startseite
          </button>
        </div>

        {/* ============================================
            Main layout — image + info (REWE-style)
        ============================================ */}
        <div className="product-main-layout">
          <div className="product-img-box">
            <img src={image} alt={name} />
          </div>

          <div className="product-info-box">
            <h1 className="main-product-title">{name}</h1>

            {finalCategory && (
              <p className="product-brand">
                <span className="brand-name">{finalCategory}</span>
              </p>
            )}

            <div className="main-product-price">{formatEuro(displayPrice)}</div>

            {weight && (
              <p className="product-unit-info">
                {formatWeight(weight, weight_unit)}
                {pricePerKg > 0 && ` (1 kg = ${pricePerKg} €)`}
              </p>
            )}
            {/* ===== Actions row ===== */}
            <div className="product-actions-row">
              <button
                type="button"
                className={`product-fav-btn ${isFav ? "active" : ""}`}
                onClick={handleToggleFavorite}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                <span className="material-symbols-outlined">favorite</span>
              </button>

              <div className="quantity-picker">
                <button type="button" onClick={decreaseQty} aria-label="Decrease">
                  −
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={increaseQty} aria-label="Increase">
                  +
                </button>
              </div>

              <button type="button" className="checkout-add-btn" onClick={handleAddToCart}>
                <span className="material-symbols-outlined">shopping_cart</span>
                In den Warenkorb ({formatEuro(displayPrice * quantity)})
              </button>
            </div>
          </div>
        </div>


        {description &&
          <section className="detail-section-card">
            <h2 className="detail-section-title">Produktbeschreibung</h2>
            <p className="product-description">{description}</p>
          </section>}

        {/* ============================================
            Article details
        ============================================ */}
        {(finalCategory || weight) && (
          <section className="detail-section-card">
            <h2 className="detail-section-title">Artikeldetails</h2>

            <dl className="article-details">
              {finalCategory && (
                <>
                  <dt>Kategorie</dt>
                  <dd>{finalCategory}</dd>
                </>
              )}
              {weight && (
                <>
                  <dt>Gewicht</dt>
                  <dd>
                    {weight} {weight_unit}
                  </dd>
                </>
              )}
            </dl>
          </section>
        )}

        {/* ============================================
            Nutrition
        ============================================ */}
        {hasNutrition && (
          <section className="detail-section-card">
            <h2 className="detail-section-title">
              Nährwerte & Zutaten
            </h2>

            {Object.keys(nutritionObject).length > 0 && (
              <table className="page-nutrition-table">
                <thead>
                  <tr>
                    <th>Nährwert</th>
                    <th>{product.nutrition_basis || "pro 100 g"}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(nutritionObject).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {ingredients && (
              <div className="page-ingredients">
                <h3>Zutaten</h3>
                <p>{ingredients}</p>
              </div>
            )}
          </section>
        )}

        {/* ============================================
            Storage
        ============================================ */}
        {hasStorage && (
          <section className="detail-section-card">
            <h2 className="detail-section-title">Lagerung & Hinweise</h2>
            <ul className="storage-list-page">
              {Object.entries(storageObject).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <StaticSubscribe />

      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2 className="related-products-title">
            Produkte aus derselben Kategorie
          </h2>
          <div className="related-products">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      )}

      <StaticFooter />
    </>
  );
}