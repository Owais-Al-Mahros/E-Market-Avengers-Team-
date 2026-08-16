import "./AdminDashboardProductCard.css"
import image from "../assets/image.jpg"
import EditProduct from "./productModal/EditProduct";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function AdminDashboardProductCar(props) {

    const [isEditCArdModalOpen, setIsEditCArdModalOpen] = useState(false);
    const openEditCardModel = () => setIsEditCArdModalOpen(true);
    const closeEditCardModel = () => setIsEditCArdModalOpen(false);

    return (
        <>
            <div className="Card">
                <h2>{props.name}</h2>
                <img src={props.image} alt="" />
                <hr />
                <p>{props.category}</p>
                <p>{props.price}</p>
                <div className="EditorTools">
                    <button onClick={openEditCardModel}>Edite</button>
                    <button onClick={() => props.onDelete(props.id)}>Deleate</button>
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
                            closeModel={closeEditCardModel}
                            onUpdate={props.onUpdate}



                        />
                        , document.body)

                }
            </div>


        </>
    )
}