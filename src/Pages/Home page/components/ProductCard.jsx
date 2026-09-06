import "./ProductCard.css";
import { useState } from "react";
import ProductCardDetails from "../modals/ProductCardDetails.jsx";
import { createPortal } from "react-dom";
import { useCart } from "../../../context/CartContext.jsx";
import toast from "react-hot-toast";

export default function ProductCard(props) {
  const { addToCart } = useCart();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [counter, setCounter] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false); // 👈 حالة تتبع تحميل الصورة

  const openDetails = () => setIsDetailsOpen(true);
  const closeDetails = () => setIsDetailsOpen(false);

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

  return (
    <>
      <div className="card-container" onClick={openDetails}>
        <div
          className="image-container"
          style={{
            backgroundColor: isImageLoaded ? "transparent" : "#f0f0f0", // خلفية رمادية خفيفة أثناء التحميل
            minHeight: "150px",
          }}
        >
          <img
            src={props.image}
            alt={props.name || "product"}
            className="image"
            loading="lazy"
            onLoad={() => setIsImageLoaded(true)} // 👈 عند اكتمال التحميل
            style={{
              opacity: isImageLoaded ? 1 : 0,
              transition: "opacity 0.4s ease-in-out", // تأثير ظهوري ناعم
            }}
          />
        </div>
        <div className="title">
          <span>{props.name}</span>
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
            <span>{(props.price * counter).toFixed(2)}€</span>
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

      {isDetailsOpen &&
        createPortal(
          <ProductCardDetails
            id={props.id}
            name={props.name}
            image={props.image}
            category={props.category}
            price={props.price}
            weight={props.weight}
            tax_rate={props.tax_rate}
            weight_unit={props.weight_unit}
            total_price={props.total_price}
            description={props.description}
            closeModal={closeDetails}
            nutritionObject={props.nutritionObject}
            storageObject={props.storageObject}
            ingredients={props.ingredients}
          />,
          document.body,
        )}
    </>
  );
}