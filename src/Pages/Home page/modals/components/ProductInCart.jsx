import "./ProductInCart.css"

function ProductInCart(props) {
    return (
        <div className="card-container">
            <div className="image-container" onClick={openDetails}>
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
                    <span>{props.price}€</span>
                </div>s
                <button className="add-button" onClick={(e) => e.stopPropagation()}>
                    <img src="/cart.png" className="add-icon" alt="cart" />
                    <span>Add to cart</span>
                </button>
            </div>
        </div>
    )
}

export default ProductInCart