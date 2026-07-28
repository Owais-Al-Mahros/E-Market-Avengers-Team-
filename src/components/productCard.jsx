import "./ProductCard.css";
import image from "../assets/image.jpg";
import { useState } from "react";

export default function ProductCard(props) {
  const [counter, setCounter] = useState(1);

  return (
    <div className="container">
      <div className="sub-container">
        <h3>{props.name}</h3>
        <p>{props.description}</p>
        <img src={props.image} />
        <div className="sub-container-two">
          <div className="section-one">
            <span className="price"> {props.price}$ </span>
            <span>☆☆☆☆☆</span>
          </div>
          <div className="section-two">
            <button
              onClick={() => setCounter((prev) => prev + 1)}
              className="btn-counter"
              id="btn-increase"
            >
              +
            </button>
            <section className="count">{counter}</section>
            <button
              onClick={() =>
                setCounter((prev) => (prev != 1 ? prev - 1 : prev))
              }
              className="btn-counter"
              id="btn-decrease"
            >
              -
            </button>
          </div>
          <div className="section-three">
            <span className="span-size">SIZE</span>
            <div className="group-size">
              <label>
                <input type="radio" /> XS
              </label>
              <label>
                <input type="radio" /> S
              </label>
              <label>
                <input type="radio" /> M
              </label>
              <label>
                <input type="radio" /> L
              </label>
              <label>
                <input type="radio" /> XL
              </label>
            </div>
          </div>
          <div className="section-four">
            <span className="span-color">COLOR</span>
            <div className="group-color">
              <label>
                <input type="checkbox" className="red"/>
              </label>
              <label>
                <input type="checkbox" className="green"/>
              </label>
              <label>
                <input type="checkbox" className="blue"/>
              </label>
            </div>
          </div>
        </div>
      </div>
      <button className="btn">ADD</button>
    </div>
  );
}
