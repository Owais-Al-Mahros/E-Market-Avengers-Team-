// components/CartItem.jsx
export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
    return (
        <div className="cart-item">
            <img src={item.image} alt={item.name} className="cart-item-image" />

            <div className="cart-item-details">
                <h4>{item.name}</h4>
                <p className="cart-item-price">€{item.total_price.toFixed(2)}</p>

                <div className="cart-item-actions">
                    <div className="qty-controls">
                        <button
                            type="button"
                            onClick={() => onDecrease(item.id)}
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                            type="button"
                            onClick={() => onIncrease(item.id)}
                            aria-label="Increase quantity"
                        >
                            +
                        </button>
                    </div>

                    <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => onRemove(item.id)}
                        aria-label="Remove item"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="cart-item-total">
                €{(item.total_price * item.quantity).toFixed(2)}
            </div>
        </div>
    );
}