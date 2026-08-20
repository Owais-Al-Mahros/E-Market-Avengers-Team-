import "./ProductCard.css";
import { useState } from "react";
import ProductCardDetails from "../models/ProductCardDetails.jsx";
import { createPortal } from "react-dom";

export default function ProductCard(props) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const openDetails = () => {
    setIsDetailsOpen(true);
  };
  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

  return (
    <>
      <div className="card-container" onClick={openDetails}>
        <div className="image-container">
          <img src={props.image} alt="product" className="image" />
        </div>
        <div className="title">
          <span>{props.name}</span>
        </div>
        <div className="weight">
          <span>
            Weight: {props.weight} {props.weight_unit}
          </span>
        </div>
        <div className="action">
          <div className="price">
            <span>{props.price}$</span>
          </div>
          <button className="add-button" onClick={(e) => e.stopPropagation()}>
            <img src="/cart.png" className="add-icon" alt="cart" />
            <span>Add to cart</span>
          </button>
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
            nutritionObject={props.nutritionObject}  // 🔥 الكائن الجديد
            storageObject={props.storageObject}       // 🔥 الكائن الجديد
            ingredients={props.ingredients}
          />,
          document.body
        )}
    </>
  );
}