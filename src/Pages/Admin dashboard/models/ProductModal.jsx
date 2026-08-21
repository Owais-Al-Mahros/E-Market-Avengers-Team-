import "./ProductModal.css";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useDynamicFields } from "../../../hooks/useDynamicFields";

export default function ProductModal({ closeModel, onProductAdded }) {
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState({
    name: "",
    price: "",
    image: "",
    category: "",
    weight: "",
    weight_unit: "kg", // kg أو L
  });
  const [taxRate, setTaxRate] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [ingredients, setIngredients] = useState("");

  const [currentSection, setCurrentSection] = useState(0);



  const nutrition = useDynamicFields([]);
  const storage = useDynamicFields([]);

  useEffect(() => {
    const priceNum = parseFloat(productInfo.price) || 0;
    const tax = (priceNum * taxRate) / 100;
    setTotalPrice(priceNum + tax);
  }, [productInfo.price, taxRate]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const closeTheModal = () => {
    setProductInfo({
      name: "",
      price: "",
      image: "",
      category: "",
      weight: "",
      weight_unit: "kg",
    });
    setTaxRate(0);
    setTotalPrice(0);
    nutrition.resetFields();
    storage.resetFields();
    closeModel();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const nutritionObject = nutrition.toObject();
    const storageObject = storage.toObject();

    try {
      const finalPrice = parseFloat(productInfo.price) || 0;
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            name: productInfo.name.trim(),
            price: finalPrice,
            total_price: totalPrice,
            tax_rate: taxRate,
            image: productInfo.image.trim() || null,
            category: productInfo.category.trim() || null,
            weight: productInfo.weight ? parseFloat(productInfo.weight) : null,
            weight_unit: productInfo.weight_unit || "kg",

            nutrition_facts: nutritionObject,   // 🔥 الكائن الجديد
            storage_notes: storageObject,       // 🔥 الكائن الجديد
            ingredients: ingredients,
          },
        ])
        .select();

      if (error) throw error;
      if (onProductAdded) onProductAdded();
      closeTheModal();
    } catch (error) {
      setLoading(false);
      alert(`There is an error: ${error.message}`);
    }
  };

  const sections = [
    () => (<>
      <div className="green-container">
        <div className="info-row">
          {/* المربع الكبير */}
          <div className="info-item large-item">
            <div className="vertical-group">
              <div className="field-group">
                <span className="info-label">Net Price</span>
                <span className="info-value">
                  {productInfo.price || "0"} €
                </span>
                <input
                  type="number"
                  className="edit-input box-input"
                  value={productInfo.price}
                  onChange={(e) =>
                    setProductInfo({
                      ...productInfo,
                      price: e.target.value,
                    })
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
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  placeholder="Tax %"
                />
              </div>

              <div className="field-group total-group">
                <span className="info-label">Total (incl. tax)</span>
                <span className="info-value total-value">
                  {totalPrice.toFixed(2)} €
                </span>
                <input
                  type="text"
                  className="edit-input box-input disabled-input"
                  value={totalPrice.toFixed(2)}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* العمود الأيمن (الفئة + الوزن) */}
          <div className="info-item category-item">
            <div className="vertical-group weghit-category">
              <div className="field-group">
                <span className="info-label">Category</span>
                <input
                  type="text"
                  className="edit-input box-input"
                  value={productInfo.category}
                  onChange={(e) =>
                    setProductInfo({
                      ...productInfo,
                      category: e.target.value,
                    })
                  }
                  placeholder="Category"
                  required
                />
              </div>

              <div className="field-group">
                <span className="info-label">Weight</span>
                <div className="weight-group">
                  <input
                    type="number"
                    className="edit-input box-input weight-input"
                    value={productInfo.weight}
                    onChange={(e) =>
                      setProductInfo({
                        ...productInfo,
                        weight: e.target.value,
                      })
                    }
                    placeholder="0.0"
                    step="0.01"
                  />
                  <select
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

        {/* رابط الصورة */}
        <div className="url-section">
          <span className="info-label">Image URL</span>
          <input
            type="text"
            className="edit-input url-input"
            value={productInfo.image}
            onChange={(e) =>
              setProductInfo({ ...productInfo, image: e.target.value })
            }
            placeholder="Enter image URL"
            required
          />
        </div>
      </div>
    </>),
    () => (
      <div className="dynamic-section">
        <div className="section-header">
          <span className="section-title">🥗 Nutritional Values</span>

        </div>
        {nutrition.fields.map((field, index) => (
          <div key={index} className="dynamic-field-row">
            <input
              type="text"
              placeholder="Energy"
              value={field.key}
              onChange={(e) => nutrition.updateField(index, 'key', e.target.value)}
            />
            <input
              type="text"
              placeholder="245 for 1kg"
              value={field.value}
              onChange={(e) => nutrition.updateField(index, 'value', e.target.value)}
            />
            <button onClick={() => nutrition.removeField(index)}>✕</button>
          </div>
        ))}
        <button onClick={nutrition.addField}>➕ Add field</button>
        <hr className="hr-separator" />
        <label className="ingredients-input-label"> Ingredients
          <input
            type="text"
            className="ingredients-input-box"
            value={ingredients}
            onChange={(e) =>
              setIngredients(
                e.target.value,
              )
            }
            placeholder="Ingredients"
          /></label>

      </div>
    ),

    () => (<div className="dynamic-section">
      <div className="section-header">
        <span className="section-title">📦 Storage and Notes</span>
      </div>
      {storage.fields.map((field, index) => (
        <div key={index} className="dynamic-field-row">
          <input
            type="text"
            placeholder="Storge"
            value={field.key}
            onChange={(e) => storage.updateField(index, 'key', e.target.value)}
          />
          <input
            type="text"
            placeholder="save in cold place"
            value={field.value}
            onChange={(e) => storage.updateField(index, 'value', e.target.value)}
          />
          <button onClick={() => storage.removeField(index)}>✕</button>
        </div>
      ))}
      <button onClick={storage.addField}>➕ Add field</button>
    </div>)]

  return (
    <div className="modal-overlay" onClick={closeTheModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="edit-card">
          <div className="image-section">
            <div className="placeholder-image">
              <span>📷</span>
            </div>
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
              <div className="content-area">
                {sections[currentSection]()}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="action-btn save-btn"
                disabled={loading}
              >
                {loading ? "⏳ Adding..." : "➕ Add"}
              </button>
              <button
                type="button"
                className="action-btn cancel-btn"
                onClick={closeModel}
                disabled={loading}
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
