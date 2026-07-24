import "./ProductCard.css"

function ProductCard(props) {
    return (
        <>
            <div className="Card">
                <h2>{props.name}</h2>
                <p>{props.description}</p>
                <hr />
                <p>{props.price}</p>
                <p></p>
            </div>
        </>
    )
} export default ProductCard
