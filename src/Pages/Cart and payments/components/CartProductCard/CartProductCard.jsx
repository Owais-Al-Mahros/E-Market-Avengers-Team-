import "./CartProductCard.css";

export default function CartProductCard(props) {
    const { id, name, image, qty, price, weight, weight_unit, increaseQty, decreaseQty, removeFromCart } = props;

    const unitPrice = parseFloat(price) || 0;
    const totalPrice = unitPrice * qty;
    const itemWeight = parseFloat(weight) || 0;
    const totalWeight = itemWeight * qty;

    return (
        <div className="cart-product-row">
            {/* Image */}
            <div className="cart-product-image-wrapper">
                <img src={image} alt={name} className="cart-product-image" loading="lazy" />
            </div>

            {/* Name + Weight */}
            <div className="cart-product-info">
                <span className="cart-product-name">{name}</span>
                {itemWeight > 0 && (
                    <span className="cart-product-weight">
                        ⚖️ {itemWeight} {weight_unit || "kg"} × {qty} = {totalWeight.toFixed(2)} {weight_unit || "kg"}
                    </span>
                )}
            </div>

            {/* Quantity + Trash */}
            <div className="cart-product-qty">
                <button
                    className="cart-qty-trash"
                    onClick={() => removeFromCart(id)}
                    title="Remove"
                    aria-label="Remove from cart"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                <div className="cart-qty-controls">
                    <button onClick={() => decreaseQty(id)} aria-label="Decrease">−</button>
                    <span>{qty}</span>
                    <button onClick={() => increaseQty(id)} aria-label="Increase">+</button>
                </div>
            </div>

            {/* Unit Price */}
            <div className="cart-product-unit-price">
                €{unitPrice.toFixed(2)}
            </div>

            {/* Total Price */}
            <div className="cart-product-total">
                €{totalPrice.toFixed(2)}
            </div>
        </div>
    );
}