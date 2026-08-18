import { useState, useEffect } from "react";
import "./ProductCardDetails.css";

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
  // تعريف جميع الأقسام كدوال مع أسماء واضحة
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
        {ingredients && (
          <div className="ingredients-section">
            <h4>Ingredients : </h4>
            <span>{ingredients}</span>
          </div>
        )}
        {nutritionObject && Object.keys(nutritionObject).length > 0 ? (
          <div className="nutrition-items">
            <h4>Nutritional Values (per 100g)</h4>
            <table className="nutrition-table">
              <thead>
                <tr>
                  <th className="items">Item</th>
                  <th className="quantity">Quantity</th>
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
                <li><span className="body-text">{key}:</span> {value}</li>
              </div>
            ))}
        </ul>
      </div>
    </>
  );

  // تحديد الأقسام النشطة بناءً على البيانات
  const hasNutrition =
    ingredients || (nutritionObject && Object.keys(nutritionObject).length > 0);
  const hasStorage = storageObject && Object.keys(storageObject).length > 0;

  // بناء مصفوفة الأقسام النشطة مع الفهرس الأصلي
  const activeSections = [
    { id: 0, render: renderBasicInfo }, // الأساسي موجود دائماً
  ];
  if (hasNutrition) {
    activeSections.push({ id: 1, render: renderNutrition });
  }
  if (hasStorage) {
    activeSections.push({ id: 2, render: renderStorage });
  }

  // currentSection يمثل الفهرس داخل المصفوفة النشطة (وليس id القسم)
  const [currentIndex, setCurrentIndex] = useState(0);

  // إذا أصبح القسم الحالي غير نشط، نعيد تعيينه إلى 0
  useEffect(() => {
    if (currentIndex >= activeSections.length) {
      setCurrentIndex(0);
    }
  }, [activeSections.length, currentIndex]);

  // دالة تغيير القسم (تستقبل الفهرس في المصفوفة النشطة)
  const goToSection = (index) => {
    setCurrentIndex(index);
  };

  // الحصول على القسم الحالي
  const currentSection = activeSections[currentIndex];

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={closeModal}>
          ✕
        </button>

        <div className="product-image-section">
          <img src={image} alt={name} />
        </div>

        <div className="product-details-section">
          <div className="content-area">
            {currentSection && currentSection.render()}
          </div>

          {/* عرض النقاط فقط إذا كان هناك أكثر من قسم نشط */}
          {activeSections.length > 1 && (
            <div className="nav-dots">
              {activeSections.map((section, index) => (
                <button
                  key={section.id}
                  className={`dot ${index === currentIndex ? "active" : ""}`}
                  onClick={() => goToSection(index)}
                  aria-label={`القسم ${section.id + 1}`}
                />
              ))}
            </div>
          )}

          <button className="add-to-cart-btn">🛒 Add To Cart </button>
        </div>
      </div>
    </div>
  );
}
