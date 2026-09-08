import { useState, useEffect } from "react";
import "./ProductCardDetails.css";
import { useCart } from "../../../context/CartContext.jsx"; // ✅ استيراد السياق
import toast from "react-hot-toast"; // ✅ اختياري

export default function ProductCardDetails({
  id,
  name,
  image,
  category,
  price,
  weight,
  tax_rate,
  weight_unit,
  total_price,
  description,
  closeModal,
  nutritionObject,
  storageObject,
  ingredients,
}) {
  const { addToCart } = useCart(); // ✅ جلب دالة الإضافة
  const [quantity, setQuantity] = useState(1); // ✅ كمية المنتج داخل المودال

  // ✅ زيادة الكمية
  const increaseQty = (e) => {
    e.stopPropagation();
    setQuantity((prev) => prev + 1);
  };

  // ✅ نقص الكمية
  const decreaseQty = (e) => {
    e.stopPropagation();
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  // ✅ دالة إضافة المنتج للسلة (مع الكمية المحددة)
  const handleAddToCart = () => {
    addToCart(
      {
        id,
        name,
        price,
        image,
        weight,
        weight_unit,
      },
      quantity
    );

    toast.success(`Added ${quantity} × ${name} to cart!`, {
      duration: 2000,
    });
  };

  // ... تعريف الأقسام (مثل السابق)
  const renderBasicInfo = () => (
    <>
      <div className="section-title">📋 Basic Information</div>
      <div className="product-title">{name}</div>
      <div className="product-price">{price} $</div>
      <div className="details-grid">
        {category && (
          <div>
            <span>Category</span> <span className="body-text">{category}</span>
          </div>
        )}
        {weight && (
          <div>
            <span>Weight</span>{" "}
            <span className="body-text">
              {weight} {weight_unit}
            </span>
          </div>
        )}
        {tax_rate != null && (
          <div>
            <span>Tax</span> <span className="body-text">{tax_rate}%</span>
          </div>
        )}
        {total_price && (
          <div>
            <span>Price includes Tax</span>{" "}
            <span className="body-text">{total_price} $</span>
          </div>
        )}
      </div>
      {description && <div className="product-desc">{description}</div>}
    </>
  );

  const renderNutrition = () => (
    <>
      <div className="section-title">🥗 Nutritional Values</div>
      <div className="nutrition-grid">
        {nutritionObject && Object.keys(nutritionObject).length > 0 ? (
          <div className="nutrition-items">
            <table className="nutrition-table">
              <thead>
                <tr>
                  <th className="items">Nutritional Value</th>
                  <th className="quantity">per 100 ml</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(nutritionObject).map(([key, value]) => (
                  <tr key={key}>
                    <td className="name-of-item">{key}</td>
                    <td className="value-of-item">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ingredients && (
              <div className="ingredients-section">
                <h4>Ingredients : </h4>
                <span>{ingredients}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="empty-message">
            There are no registered nutritional values.
          </p>
        )}
      </div>
    </>
  );

  const renderStorage = () => (
    <>
      <div className="section-title">Storage and Notes 📦</div>
      <div className="storage-content">
        <ul>
          {storageObject &&
            Object.keys(storageObject).length > 0 &&
            Object.entries(storageObject).map(([key, value]) => (
              <div key={key}>
                <li>
                  <span className="body-text">{key}:</span> {value}
                </li>
              </div>
            ))}
        </ul>
      </div>
    </>
  );

  // تحديد الأقسام النشطة
  const hasNutrition =
    ingredients || (nutritionObject && Object.keys(nutritionObject).length > 0);
  const hasStorage = storageObject && Object.keys(storageObject).length > 0;

  const activeSections = [{ id: 0, render: renderBasicInfo }];
  if (hasNutrition) activeSections.push({ id: 1, render: renderNutrition });
  if (hasStorage) activeSections.push({ id: 2, render: renderStorage });

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= activeSections.length) setCurrentIndex(0);
  }, [activeSections.length, currentIndex]);

  const goToSection = (index) => setCurrentIndex(index);
  const currentSection = activeSections[currentIndex];

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={closeModal}>✕</button>

        <div className="product-image-section">
          <img src={image} alt={name} />
        </div>

        <div className="product-details-section">
          <div className="content-area">
            {currentSection && currentSection.render()}
          </div>

          {activeSections.length > 1 && (
            <div className="nav-dots">
              {activeSections.map((section, index) => (
                <button
                  key={section.id}
                  className={`dot ${index === currentIndex ? "active" : ""}`}
                  onClick={() => goToSection(index)}
                />
              ))}
            </div>
          )}

          {/* ✅ تحسين زر الإضافة مع عداد الكمية */}
          <div className="cart-controls">
            <div className="quantity-controls">
              <button onClick={decreaseQty} className="qty-btn">−</button>
              <span className="qty-value">{quantity}</span>
              <button onClick={increaseQty} className="qty-btn">+</button>
            </div>
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              🛒 Add To Cart ({(price * quantity).toFixed(2)} $)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}