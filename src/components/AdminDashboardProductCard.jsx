import "./AdminDashboardProductCard.css"

export default function AdminDashboardProductCar(props) {

    return (
        <>
            <div className="Card">
                <h2>{props.name}</h2>
                <p>{props.description}</p>
                <img src={props.image} alt="" />
                <hr />
                <p>{props.category}</p>
                <p>{props.price}</p>
                <div className="EditorTools">
                    <button>Edite</button>
                    <button onClick={() => props.Delete(props.name)}>Deleate</button>
                </div>
            </div>


        </>
    )
}