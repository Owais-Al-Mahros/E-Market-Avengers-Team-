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

  // ✅ دالة إضافة المنتج للسلة
  const handleAddToCart = (e) => {
    e.stopPropagation(); // منع فتح تفاصيل المنتج

    // إضافة المنتج مع الكمية المحددة
    addToCart({
      id: props.id,
      name: props.name,
      price: props.price,
      image: props.image,
      weight: props.weight,
      weight_unit: props.weight_unit,
      // يمكن إضافة أي بيانات أخرى تحتاجها
    }, counter); // الكمية المحددة من العداد

    // رسالة تأكيد (اختياري)
    toast.success(`Added ${counter} × ${props.name} to cart!`, {
      duration: 2000,
    });
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
          <div>
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
          {/* ✅ زر الإضافة للسلة */}
          <button className="add-button" onClick={handleAddToCart}>
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
            nutritionObject={props.nutritionObject}
            storageObject={props.storageObject}
            ingredients={props.ingredients}
          />,
          document.body
        )}
    </>
  );
}