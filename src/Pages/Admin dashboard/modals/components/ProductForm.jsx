import { useState, useMemo, useEffect, useRef } from "react";
import { useDynamicFields } from "../../../../hooks/useDynamicFields";
import "./ProductForm.css";
import { useCategories } from "../../../../context/CategoryContext";
import { useSubcategories } from "../../../../context/SubcategoryContext";
export default function ProductForm({
  initialProductInfo = {},
  onSubmit,
  isLoading = false,
  submitLabel = "Save",
  title = "Product Form",
  closeModel,
}) {
  const [productInfo, setProductInfo] = useState({
    name: "",
    price: "",
    image: "",
    category_id: "",      // ✅ بدلاً من category (النص)
    subcategory_id: "",   // ✅ للفئة الفرعية
    weight: "",
    weight_unit: "kg",
    tax_rate: 0,
    ingredients: "",
    ...initialProductInfo,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(productInfo.image || "");
  const fileInputRef = useRef(null);

  const handleCameraClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // تحديث المعاينة فوراً لو المستخدم كتب أو غيّر الرابط بالـ URL Input
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setProductInfo({ ...productInfo, image: url });
    setSelectedFile(null); // إلغاء إرفاق الملف إن وجد والاعتماد على الرابط
    setPreviewUrl(url);
  };

  const [currentSection, setCurrentSection] = useState(0);
  const { categories } = useCategories();
  const { subcategories } = useSubcategories();

  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category_id === parseInt(productInfo.category_id)
  );
  const initialNutrition = initialProductInfo.nutrition_facts
    ? Object.entries(initialProductInfo.nutrition_facts).map(([k, v]) => ({
      key: k,
      value: v,
    }))
    : [];

  const initialStorage = initialProductInfo.storage_notes
    ? Object.entries(initialProductInfo.storage_notes).map(([k, v]) => ({
      key: k,
      value: v,
    }))
    : [];

  const nutrition = useDynamicFields(initialNutrition);
  const storage = useDynamicFields(initialStorage);

  const totalPrice = useMemo(() => {
    const priceNum = parseFloat(productInfo.price) || 0;
    const taxRate = parseFloat(productInfo.tax_rate) || 0;
    return priceNum + (priceNum * taxRate) / 100;
  }, [productInfo.price, productInfo.tax_rate]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...productInfo,
      total_price: totalPrice,
      nutrition_facts: nutrition.toObject(),
      storage_notes: storage.toObject(),
      category_id: parseInt(productInfo.category_id) || null, // ✅ تحويل إلى int
      subcategory_id: parseInt(productInfo.subcategory_id) || null, // ✅ تحويل إلى int
    };
    await onSubmit(dataToSubmit, selectedFile);
  };

  const sections = [
    () => (
      <div className="green-container">
        <div className="info-row">
          <div className="info-item large-item">
            <div className="vertical-group">
              <div className="field-group">
                <span className="info-label">Net Price</span>
                <input
                  type="number"
                  className="edit-input box-input"
                  value={productInfo.price}
                  onChange={(e) =>
                    setProductInfo({ ...productInfo, price: e.target.value })
                  }
                  placeholder="Net Price"
                  required
                />
              </div>

              <div className="field-group">
                <span className="info-label">Tax Rate %</span>
                <input
                  type="number"
                  className="edit-input box-input"
                  value={productInfo.tax_rate}
                  onChange={(e) =>
                    setProductInfo({
                      ...productInfo,
                      tax_rate: Number(e.target.value),
                    })
                  }
                  placeholder="Tax %"
                />
              </div>

              <div className="field-group total-group">
                <span className="info-label">Total (incl. tax)</span>
                <span className="info-value total-value">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          <div className="info-item category-item-weight-add">
            <div className="vertical-group weghit-category">
              <div className="field-group">
                <span className="info-label">Category</span>
                <select
                  required
                  className="edit-input box-input unit-select"
                  value={productInfo.category_id}
                  onChange={(e) => {
                    setProductInfo({
                      ...productInfo,
                      category_id: e.target.value,
                      subcategory_id: "", // إعادة تعيين الفئة الفرعية عند تغيير الفئة
                    });
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <span className="info-label">Subcategory</span>
                <select
                  className="edit-input box-input unit-select"
                  value={productInfo.subcategory_id}
                  onChange={(e) =>
                    setProductInfo({ ...productInfo, subcategory_id: e.target.value })
                  }
                  disabled={!productInfo.category_id} // تعطيل إذا لم يتم اختيار فئة
                >
                  <option value="">Select Subcategory</option>
                  {filteredSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <span className="info-label">Weight</span>
                <div className="weight-group">
                  <input
                    type="number"
                    className="edit-input box-input weight-input"
                    value={productInfo.weight}
                    onChange={(e) =>
                      setProductInfo({ ...productInfo, weight: e.target.value })
                    }
                    placeholder="0.0"
                    step="0.01"
                  />
                  <select
                    required
                    className="edit-input box-input unit-select"
                    value={productInfo.weight_unit}
                    onChange={(e) =>
                      setProductInfo({
                        ...productInfo,
                        weight_unit: e.target.value,
                      })
                    }
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 رجعنا حقل الـ Image URL مع الحفاظ على الربط التلقائي */}
        <div className="url-section">
          <span className="info-label">Image URL</span>
          <input
            type="text"
            className="edit-input url-input"
            value={productInfo.image}
            onChange={handleImageUrlChange}
            placeholder="Enter image URL or select via camera"
          />
        </div>
      </div>
    ),
    () => (
      <div className="dynamic-section">
        <div className="section-header">
          <span className="section-title">🥗 Nutritional Values</span>
        </div>
        {nutrition.fields.map((field, index) => (
          <div key={index} className="dynamic-field-row">
            <input
              type="text"
              className="dynamic-input"
              placeholder="Energy"
              value={field.key}
              onChange={(e) =>
                nutrition.updateField(index, "key", e.target.value)
              }
            />
            <input
              type="text"
              className="dynamic-input"
              placeholder="245 for 1kg"
              value={field.value}
              onChange={(e) =>
                nutrition.updateField(index, "value", e.target.value)
              }
            />
            <button
              type="button"
              className="remove-field-btn"
              onClick={() => nutrition.removeField(index)}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={nutrition.addField}>
          ➕ Add field
        </button>
        <hr className="hr-separator" />
        <label className="ingredients-input-label">
          Ingredients
          <input
            type="text"
            className="ingredients-input-box"
            value={productInfo.ingredients}
            onChange={(e) =>
              setProductInfo({ ...productInfo, ingredients: e.target.value })
            }
            placeholder="Ingredients"
          />
        </label>
      </div>
    ),
    () => (
      <div className="dynamic-section">
        <div className="section-header">
          <span className="section-title">📦 Storage and Notes</span>
        </div>
        {storage.fields.map((field, index) => (
          <div key={index} className="dynamic-field-row">
            <input
              type="text"
              className="dynamic-input"
              placeholder="Energy"
              value={field.key}
              onChange={(e) =>
                storage.updateField(index, "key", e.target.value)
              }
            />
            <input
              type="text"
              className="dynamic-input"
              placeholder="245 for 1kg"
              value={field.value}
              onChange={(e) =>
                storage.updateField(index, "value", e.target.value)
              }
            />
            <button
              type="button"
              className="remove-field-btn"
              onClick={() => storage.removeField(index)}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={storage.addField}>
          ➕ Add field
        </button>
      </div>
    ),
  ];

  return (
    <div className="modal-overlay" onClick={closeModel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="edit-card">
          <div className="container-of-product-image">
            {previewUrl ? (
              <img
                className="image-of-product-dashboard"
                src={previewUrl}
                alt="Product"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "#a0aec0" }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "32px" }}
                >
                  image
                </span>
              </div>
            )}

            <button
              className="icon-of-image-dashboard"
              type="button"
              onClick={handleCameraClick}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "22px" }}
              >
                photo_camera
              </span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="name-section">
              <input
                type="text"
                className="product-name"
                value={productInfo.name}
                onChange={(e) =>
                  setProductInfo({ ...productInfo, name: e.target.value })
                }
                placeholder="Product name"
                required
              />
            </div>

            <div className="nav-dots">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`dot ${i === currentSection ? "active" : ""}`}
                  onClick={() => setCurrentSection(i)}
                />
              ))}
            </div>

            <div className="product-details-section">
              <div className="content-area">{sections[currentSection]()}</div>
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="action-btn save-btn"
                disabled={isLoading}
              >
                {isLoading ? "⏳ Saving..." : submitLabel}
              </button>
              <button
                type="button"
                className="action-btn cancel-btn"
                onClick={closeModel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
