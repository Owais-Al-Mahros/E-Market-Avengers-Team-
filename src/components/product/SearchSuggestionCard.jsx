import "./SearchSuggestionCard.css";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext.jsx";
import { calculatePriceByKg, getBaseUnitLabel } from "../../api";
import { formatEuro, formatWeight } from "../../lib/format";
import { formatPackHeadline, isProductUnitBased } from "../../lib/units";

export default function SearchSuggestionCard({ product, onClick }) {
    // ✅ أضفنا product_number هنا
    const { id, product_number, name, image, price, total_price, weight, weight_unit, product_type, pack_pieces, piece_weight } = product;
    const isPiece = isProductUnitBased({ product_type }) && !(Number(pack_pieces) > 1);
    const packHeadline = formatPackHeadline({ pack_pieces, piece_weight, weight_unit });
    const { addToCart } = useCart();

    const displayPrice = parseFloat(total_price || price) || 0;
    const pricePerBase = calculatePriceByKg(displayPrice, weight, weight_unit);
    const baseUnit = getBaseUnitLabel(weight_unit);
    const deposit = parseFloat(product.deposit_amount) || 0;

    const handleRowClick = () => onClick(id);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(id);
        }
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        try {
            addToCart(
                {
                    id, product_number, name, image,
                    price: parseFloat(price) || 0,
                    total_price: displayPrice,
                    weight, weight_unit,
                    gross_weight: product.gross_weight,
                    deposit_amount: deposit,
                    deposit_tax_rate: parseFloat(product.deposit_tax_rate) || 0,
                },
                1
            );
            toast.success(`${name} zum Warenkorb hinzugefügt`, { duration: 1500 });
        } catch (err) {
            console.error("Add to cart error:", err);
            toast.error("Fehler beim Hinzufügen");
        }
    };

    return (
        <div
            className="search-suggestion-row"
            onClick={handleRowClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`${name} anzeigen`}
        >
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

            <div className="search-suggestion-info">
                <span className="search-suggestion-name">{name}</span>
                {(weight || isPiece) && (
                    <span className="search-suggestion-meta">
                        {isPiece ? "1 Stück" : packHeadline || formatWeight(weight, weight_unit)}
                        {!isPiece && !packHeadline && pricePerBase > 0 && baseUnit &&
                            ` (1 ${baseUnit} = ${pricePerBase} €)`}
                        {deposit > 0 && ` · +${formatEuro(deposit)} Pfand`}
                    </span>
                )}
            </div>

            <div className="search-suggestion-price-box">
                <span className="search-suggestion-price">
                    {formatEuro(displayPrice)}
                </span>

                <button
                    type="button"
                    className="search-suggestion-add-btn"
                    onClick={handleAddToCart}
                    aria-label={`${name} zum Warenkorb hinzufügen`}
                >
                    <span className="material-symbols-outlined">shopping_cart</span>
                    <span className="material-symbols-outlined plus-icon">add</span>
                </button>
            </div>
        </div>
    );
}