// src/Pages/DisplayProducts/components/ProductCard.jsx
import "./ProductCard.css";
import { useState } from "react";
// import { createPortal } from "react-dom";
import { useCart } from "../../../context/CartContext.jsx";
import toast from "react-hot-toast";
import { calculatePriceByKg } from "../../../hooks/useProduct.js";
import { useNavigate } from "react-router-dom";
import { useFavorite } from "../../../context/FavoriteContext.jsx";

export default function ProductCard(props) {
  console.count(`🃏 ProductCard #${props.id}`);
  const navigate = useNavigate();

  //favorite
  const { toggleFavorite, isFavorite } = useFavorite();
  const isFav = isFavorite(props.id);

  const handelToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite({
      id: props.id,
      name: props.name,
      image: props.image,
      price: props.price,
    });
    if (isFav) {
      toast("Removed from favorites", { icon: "💔" });
    } else {
      toast.success("Added to favorites", { icon: "❤️" });
    }
  };

  const { addToCart } = useCart();
  const [counter, setCounter] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const openDetails = (propsId) => {
    navigate(`/DisplayProducts/ProductCardDetails?ProductId=${propsId}`);
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
        id: props.id,
        name: props.name,
        price: props.price,
        image: props.image,
        weight: props.weight,
        weight_unit: props.weight_unit,
      },
      counter,
    );

    toast.success(`Added ${counter} × ${props.name} to cart!`, {
      duration: 2000,
    });
  };

  const pricePerKg = calculatePriceByKg(
    props.price,
    props.weight,
    props.weight_unit,
  );

  console.log(
    props.name,
    "Price:",
    props.price,
    "Weight:",
    props.weight,
    "Unit:",
    props.weight_unit,
    "PerKg:",
    pricePerKg,
  );
  return (
    <>
      <div
        className="card-container"
        onClick={() => {
          openDetails(props.id);
        }}
      >
        <div
          className="image-container"
          style={{
            backgroundColor: isImageLoaded ? "transparent" : "#f0f0f0",
          }}
        >
          <button
            className={`favorite-heart-btn ${isFav ? "active" : ""}`}
            onClick={handelToggleFavorite}
            aria-label="Toggle Favorite"
          >
            <span className="material-symbols-outlined">favorite</span>
          </button>
          <img
            src={props.image}
            alt={props.name || "product"}
            className="image"
            loading="lazy"
            onLoad={() => setIsImageLoaded(true)}
            style={{
              opacity: isImageLoaded ? 1 : 0,
            }}
          />
        </div>
        <div className="title">
          <span>{props.name}</span>
          {/* <span>{props.product_number}</span> */}
        </div>
        <div className="weight">
          <span className="num-weight">
            Weight: {props.weight} {props.weight_unit}
          </span>
          <div className="increase-decrease-button">
            <button className="increase-button" onClick={increaseCounter}>
              +
            </button>
            <span className="counter-of-products">{counter}</span>
            <button className="decrease-button" onClick={decreaseCounter}>
              -
            </button>
          </div>
        </div>
        <div className="action">
          <div className="price">
            <span className="main-price">
              {(props.price * counter).toFixed(2)}€
            </span>
            {pricePerKg > 0 && (
              <span className="price-per-kg">({pricePerKg}€ / kg)</span>
            )}
          </div>
          <div className="add-btn-container">
            <button className="add-button" onClick={handleAddToCart}>
              <img
                src="/cart.png"
                className="add-icon"
                alt="cart"
                loading="lazy"
              />
              <span>Add to cart</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
