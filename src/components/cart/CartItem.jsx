import { formatEuro } from "../../lib/format";

export default function CartItem({ item, onIncrease, onDecrease, onRemove }) {
    return (
        <div className="cart-item">
            <div className="cart-item-image-wrapper">
                <img src={item.image} alt={item.name} className="cart-item-image" loading="lazy" />
            </div>

            <div className="cart-item-details">
                <h4 className="cart-item-name">{item.name}</h4>
                <p className="cart-item-price">{formatEuro(item.total_price)}</p>

                <div className="cart-item-actions">
                    <div className="qty-controls">
                        <button
                            type="button"
                            onClick={() => onDecrease(item.id)}
                            aria-label="Menge verringern"
                        >
                            −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                            type="button"
                            onClick={() => onIncrease(item.id)}
                            aria-label="Menge erhöhen"
                        >
                            +
                        </button>
                    </div>

                    <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => onRemove(item.id)}
                        aria-label="Artikel entfernen"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>

            <div className="cart-item-total">
                {formatEuro(item.total_price * item.quantity)}
            </div>
        </div>
    );
}