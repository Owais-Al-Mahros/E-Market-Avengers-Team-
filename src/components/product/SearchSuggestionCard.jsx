// src/Pages/Home page/components/SearchSuggestionCard.jsx
import "./SearchSuggestionCard.css";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext.jsx";
import { calculatePriceByKg } from "../../api";

export default function SearchSuggestionCard({ product, onClick }) {
    const { id, name, image, price, total_price, weight, weight_unit } = product;
    const { addToCart } = useCart();

    const displayPrice = parseFloat(total_price || price) || 0;
    const pricePerKg = calculatePriceByKg(displayPrice, weight, weight_unit);

    const handleRowClick = () => onClick(id);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(id);
        }
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(
            {
                id,
                name,
                image,
                price: parseFloat(price) || 0,
                total_price: displayPrice,
                weight,
                weight_unit,
            },
            1
        );
        toast.success(`Added ${name} to cart`, { duration: 1500 });
    };

    return (
        <div
            className="search-suggestion-row"
            onClick={handleRowClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`View ${name}`}
        >
            {/* Image */}
            <div className="search-suggestion-image-box">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="search-suggestion-image"
                        loading="lazy"
                    />
                ) : (
                    <span className="material-symbols-outlined search-suggestion-placeholder">
                        image
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="search-suggestion-info">
                <span className="search-suggestion-name">{name}</span>
                {weight && (
                    <span className="search-suggestion-meta">
                        {weight} {weight_unit}
                        {pricePerKg > 0 && ` (1 ${weight_unit} = ${pricePerKg} €)`}
                    </span>
                )}
            </div>

            {/* Price + Add */}
            <div className="search-suggestion-price-box">
                <span className="search-suggestion-price">
                    {displayPrice.toFixed(2)} €
                </span>
                <button
                    type="button"
                    className="search-suggestion-add-btn"
                    onClick={handleAddToCart}
                    aria-label={`Add ${name} to cart`}
                >
                    <span className="material-symbols-outlined">add_shopping_cart</span>
                </button>
            </div>
        </div>
    );
}