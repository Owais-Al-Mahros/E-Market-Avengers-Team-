// src/Pages/DisplayProducts/components/ProductCard.jsx
import "./ProductCard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext.jsx";
import { useFavorite } from "../../context/FavoriteContext.jsx";
import { calculatePriceByKg } from "../../api/index.js";

export default function ProductCard({
  id,
  product_number,
  name,
  image,
  price,
  total_price,
  tax_rate,
  weight,
  weight_unit,
  category,
  description,
  ingredients,
  // ✅ DB field names → internal names
  nutrition_facts: nutritionObject,
  storage_notes: storageObject,
}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorite();
  const isFav = isFavorite(id);

  const [counter, setCounter] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const displayPrice = parseFloat(total_price || price) || 0;
  const pricePerKg = calculatePriceByKg(displayPrice, weight, weight_unit);

  const openDetails = () => {
    navigate(`/DisplayProducts/ProductCardDetails?productId=${id}`);
    window.scrollTo(0, 0);
  };

  const increaseCounter = (e) => {
    e.stopPropagation();
    setCounter((prev) => prev + 1);
  };

  const decreaseCounter = (e) => {
    e.stopPropagation();
    setCounter((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(
      {
        id,
        product_number,
        name,
        image,
        price: parseFloat(price) || 0,
        total_price: displayPrice,
        tax_rate: parseFloat(tax_rate) || 0,
        weight,
        weight_unit,
      },
      counter
    );
    toast.success(`Added ${counter} × ${name} to cart!`, { duration: 2000 });
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    // ✅ نُخزّن بيانات كاملة — FavoriteList يستخدم <ProductCard {...product} />
    toggleFavorite({
      id,
      product_number,
      name,
      image,
      price: parseFloat(price) || 0,
      total_price: displayPrice,
      tax_rate: parseFloat(tax_rate) || 0,
      weight,
      weight_unit,
      category,
      description,
      ingredients,
      nutrition_facts: nutritionObject,
      storage_notes: storageObject,
    });
    toast(isFav ? "Removed from favorites" : "Added to favorites", {
      icon: isFav ? "💔" : "❤️",
    });
  };

  return (
    <div className="product-card" onClick={openDetails}>
      <div className="product-card-image-box">
        <button
          type="button"
          className={`product-card-fav-btn ${isFav ? "active" : ""}`}
          onClick={handleToggleFavorite}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <span className="material-symbols-outlined">favorite</span>
        </button>

        <img
          src={image}
          alt={name || "product"}
          className="product-card-image"
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
          style={{ opacity: isImageLoaded ? 1 : 0 }}
        />
      </div>

      <div className="product-card-title">
        <span>{name}</span>
      </div>

      <div className="product-card-weight">
        <span className="product-card-weight-value">
          {weight} {weight_unit}
        </span>
        <div className="product-card-qty">
          <button
            type="button"
            onClick={decreaseCounter}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="product-card-qty-count">{counter}</span>
          <button
            type="button"
            onClick={increaseCounter}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="product-card-action">
        <div className="product-card-price">
          <span className="product-card-main-price">
            {(displayPrice * counter).toFixed(2)} €
          </span>
          {pricePerKg > 0 && (
            <span className="product-card-price-per-kg">
              ({pricePerKg} € / kg)
            </span>
          )}
        </div>

        <button
          type="button"
          className="product-card-add-btn"
          onClick={handleAddToCart}
        >
          <span>Add to cart</span>
        </button>
      </div>
    </div>
  );
}