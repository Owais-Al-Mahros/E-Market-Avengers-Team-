import "./AdminDashboardProductCard.css";
import EditProduct from "../models/EditProduct";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function AdminDashboardProductCar(props) {
  const [isEditCArdModalOpen, setIsEditCArdModalOpen] = useState(false);
  const openEditCardModel = () => setIsEditCArdModalOpen(true);
  const closeEditCardModel = () => setIsEditCArdModalOpen(false);

  return (
    <>
      <div className="card-container-admin">
        <div className="image-container-admin">
          <img src={props.image} alt="product" className="image-admin" />
        </div>
        <div className="title-admin">
          <span>{props.name}</span>
        </div>
        <div className="weight-admin">
          <span>
            Weight: {props.weight} {props.weight_unit}
          </span>
          <div className="price">
            <span>{props.price}$</span>
          </div>
        </div>
        <div className="action-admin">
          <button onClick={openEditCardModel} className="edit-button-admin">
            Edit
          </button>
          <button
            onClick={() => props.onDelete(props.id)}
            className="delete-button"
          >
            Delete
          </button>
        </div>
      </div>

      {isEditCArdModalOpen &&
        createPortal(
          <EditProduct
            id={props.id}
            name={props.name}
            image={props.image}
            category={props.category}
            price={props.price}
            weight={props.weight}
            tax_rate={props.tax_rate}
            weight_unit={props.weight_unit}
            total_price={props.total_price}
            nutritionObject={props.nutritionObject}  // 🔥 الكائن الجديد
            storageObject={props.storageObject}       // 🔥 الكائن الجديد
            ingredients={props.ingredients}
            closeModel={closeEditCardModel}
            onUpdate={props.onUpdate}
          />,
          document.body,
        )}
    </>
  );
}
