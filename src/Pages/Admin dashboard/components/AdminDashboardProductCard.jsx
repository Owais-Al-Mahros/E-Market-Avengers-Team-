import "./AdminDashboardProductCard.css";
import EditProduct from "../modals/EditProduct";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function AdminDashboardProductCar(props) {
  const [isEditCArdModalOpen, setIsEditCArdModalOpen] = useState(false);
  const openEditCardModel = () => setIsEditCArdModalOpen(true);
  const closeEditCardModel = () => setIsEditCArdModalOpen(false);
  const [deleteButton, setDeleteButton] = useState(true);
  return (
    <>
      <div className="card-container-admin" onClick={openEditCardModel}>
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
            <span>{props.total_price}€</span>
          </div>
        </div>
        <div className="action-admin">
          {deleteButton && <button
            onClick={(e) => { setDeleteButton(false); e.stopPropagation(); }}
            className="delete-button"> 🗑️ </button>}
          {(!deleteButton) &&
            <div className="action-admin">
              <button
                onClick={(e) => { e.stopPropagation(); props.onDelete(props.id); }}
                className="Confirm-button">Confirm</button>

              <button
                onClick={(e) => { e.stopPropagation(); setDeleteButton(true); }}
                className="Cancel-button">Cancel</button>
            </div>
          }
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
