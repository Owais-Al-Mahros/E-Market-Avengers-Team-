import "./ProductCard.css";
import { useState } from "react";

export default function ProductCard(props) {
  const [counter, setCounter] = useState(1);

  return (
    <div className="card-container">
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
        <button className="add-button">
          <img src="/cart.png" className="add-icon"></img>
          <span>Add to cart</span>
        </button>
      </div>
    </div>
  );
}
