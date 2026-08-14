import "./AdminDashboardProductCard.css"
import image from "../assets/image.jpg"

export default function AdminDashboardProductCar(props) {

    return (
        <>
            <div className="Card">
                <h2>{props.name}</h2>
                <p className="description">{props.description}</p>
                <img src={props.image} alt="" />
                <hr />
                <p>{props.category}</p>
                <p>{props.price}</p>
                <div className="EditorTools">
                    <button onClick={props.Edit}>Edite</button>
                    <button onClick={() => props.onDelete(props.id)}>Deleate</button>
                </div>
            </div>


        </>
    )
}