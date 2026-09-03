import "./AdminDashboardProductCard.css";
import EditProduct from "../modals/EditProduct";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function AdminDashboardProductCar(props) {
  const [isEditCArdModalOpen, setIsEditCArdModalOpen] = useState(false);
  const openEditCardModel = () => setIsEditCArdModalOpen(true);
  const closeEditCardModel = () => setIsEditCArdModalOpen(false);
  // const [deleteButton, setDeleteButton] = useState(true);
  return (
    <>
      <div className="card-container-admin" onClick={openEditCardModel}>
        <div className="image-container-admin-dashboard">
          <img src={props.image} alt="product" className="image-admin-dashboard" />
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
          {/* ✅ زر حذف بسيط يستدعي التنبيه المؤكد مباشرة مع اسم المنتج */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onDelete(props.id, props.name);
            }}
            className="delete-button"
          >
            🗑️
          </button>
        </div>
      </div>

      {isEditCArdModalOpen &&
        createPortal(
          <EditProduct
            id={props.id}
            name={props.name}
            image={props.image}
            category_id={Number(props.category_id) || null}
            subcategory_id={Number(props.subcategory_id) || null}
            price={props.price}
            weight={props.weight}
            tax_rate={props.tax_rate}
            weight_unit={props.weight_unit}
            total_price={props.total_price}
            nutritionObject={props.nutritionObject}
            storageObject={props.storageObject}
            ingredients={props.ingredients}
            closeModel={closeEditCardModel}
            onUpdate={props.onUpdate}
          />,
          document.body,
        )}
    </>
  );
}
