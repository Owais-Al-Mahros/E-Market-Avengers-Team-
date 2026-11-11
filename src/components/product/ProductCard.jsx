import "./ProductCard.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext.jsx";
import { useFavorite } from "../../context/FavoriteContext.jsx";
import { calculatePriceByKg, getBaseUnitLabel } from "../../api/index.js";
import { formatEuro, formatWeight } from "../../lib/format";

export default function ProductCard({
  id,
  product_number,
  name,
  image,
  price,
  total_price,
  tax_rate,
  weight,
  weight_unit,
  gross_weight,
  deposit_amount,
  deposit_tax_rate,
  category,
  description,
  ingredients,
  nutrition_facts: nutritionObject,
  storage_notes: storageObject,
}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorite();
  const isFav = isFavorite(id);

  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const displayPrice = parseFloat(total_price || price) || 0;
  const pricePerBase = calculatePriceByKg(displayPrice, weight, weight_unit);
  const baseUnit = getBaseUnitLabel(weight_unit);
  const deposit = parseFloat(deposit_amount) || 0;
  const depositRate = parseFloat(deposit_tax_rate) || parseFloat(tax_rate) || 0;

  const openDetails = () => {
    navigate(`/DisplayProducts/ProductCardDetails?productId=${id}`);
    window.scrollTo(0, 0);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    try {
      addToCart(
        {
          id,
          product_number,
          name,
          image,
          price: parseFloat(price) || 0,
          total_price: displayPrice,
          tax_rate: parseFloat(tax_rate) || 0,
          weight,
          weight_unit,
          gross_weight,
          deposit_amount: deposit,
          deposit_tax_rate: depositRate,
        },
        1 // ✅ إضافة قطعة واحدة عند الضغط على الزر (مثل REWE)
      );
      toast.success(`${name} hinzugefügt`, { duration: 1500 });
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Fehler beim Hinzufügen");
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    try {
      toggleFavorite({
        id,
        product_number,
        name,
        image,
        price: parseFloat(price) || 0,
        total_price: displayPrice,
        tax_rate: parseFloat(tax_rate) || 0,
        weight,
        weight_unit,
        gross_weight,
        deposit_amount: deposit,
        deposit_tax_rate: depositRate,
        category,
        description,
        ingredients,
        nutrition_facts: nutritionObject,
        storage_notes: storageObject,
      });
    } catch (err) {
      console.error("Favorite error:", err);
    }
  };

  return (
    <div className="rewe-card" onClick={openDetails}>
      {/* 1. منطقة الصورة */}
      <div className="rewe-image-box">
        <button
          type="button"
          className={`rewe-fav-btn ${isFav ? "active" : ""}`}
          onClick={handleToggleFavorite}
          aria-label="Favorit"
        >
          <span className="material-symbols-outlined">favorite</span>
        </button>

        

        <img
          src={image || "https://via.placeholder.com/150?text=Kein+Bild"}
          alt={name || "Produkt"}
          className="rewe-image"
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setIsImageLoaded(true)}
          style={{ opacity: isImageLoaded ? 1 : 0 }}
        />
      </div>

      {/* 2. تفاصيل المنتج */}
      <div className="rewe-info">
        <h3 className="rewe-title">{name}</h3>
        
        <div className="rewe-meta">
          {formatWeight(weight, weight_unit)}
          {pricePerBase > 0 && baseUnit && (
            <span className="rewe-price-per-kg">
              {" "}(1 {baseUnit} = {pricePerBase} €)
            </span>
          )}
        </div>
        
        {/* عرض الـ Pfand إن وجد */}
        {deposit > 0 && (
          <div className="rewe-deposit">zzgl. {formatEuro(deposit)} Pfand</div>
        )}
      </div>

      {/* 3. السعر وزر الإضافة */}
      <div className="rewe-footer">
        <div className="rewe-price">{formatEuro(displayPrice)}</div>
        <button 
          type="button" 
          className="rewe-add-btn" 
          onClick={handleAddToCart}
          aria-label="In den Warenkorb"
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="material-symbols-outlined plus-icon">add</span>
        </button>
      </div>
    </div>
  );
}