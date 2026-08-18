import "./EditProduct.css";
import { useState, useMemo } from "react";

export default function EditProduct(props) {
    // ===== البيانات الأساسية =====
    const [productInfo, setProductInfo] = useState({
        id: props.id,
        name: props.name || "",
        price: props.price || 0,
        image: props.image || "",
        category: props.category || "",
        weight: props.weight || "",
        weight_unit: props.weight_unit || "kg",
        tax_rate: props.tax_rate || 0,
        ingredients: props.ingredients || "",
    });

    // ===== تحويل كائن القيم الغذائية إلى مصفوفة =====
    const [nutritionFields, setNutritionFields] = useState(() => {
        const obj = props.nutrition_facts || {};
        return Object.entries(obj).map(([key, value]) => ({ key, value }));
    });

    // ===== تحويل كائن التخزين إلى مصفوفة =====
    const [storageFields, setStorageFields] = useState(() => {
        const obj = props.storage_notes || {};
        return Object.entries(obj).map(([key, value]) => ({ key, value }));
    });

    const [isLoading, setIsLoading] = useState(false);
    const [currentSection, setCurrentSection] = useState(0);

    // ===== حساب السعر الإجمالي =====
    const totalPrice = useMemo(() => {
        const netPrice = parseFloat(productInfo.price) || 0;
        const taxRate = parseFloat(productInfo.tax_rate) || 0;
        return netPrice + (netPrice * taxRate / 100);
    }, [productInfo.price, productInfo.tax_rate]);

    // ===== دوال Nutrition =====
    const addNutritionField = () => {
        setNutritionFields([...nutritionFields, { key: "", value: "" }]);
    };

    const updateNutritionField = (index, field, newValue) => {
        const updated = [...nutritionFields];
        updated[index][field] = newValue;
        setNutritionFields(updated);
    };

    const removeNutritionField = (index) => {
        setNutritionFields(nutritionFields.filter((_, i) => i !== index));
    };

    // ===== دوال Storage =====
    const addStorageField = () => {
        setStorageFields([...storageFields, { key: "", value: "" }]);
    };

    const updateStorageField = (index, field, newValue) => {
        const updated = [...storageFields];
        updated[index][field] = newValue;
        setStorageFields(updated);
    };

    const removeStorageField = (index) => {
        setStorageFields(storageFields.filter((_, i) => i !== index));
    };

    // ===== معالجة التحديث =====
    const handleUpdate = async () => {
        setIsLoading(true);

        const nutritionObject = nutritionFields.reduce((acc, field) => {
            if (field.key.trim()) acc[field.key.trim()] = field.value.trim();
            return acc;
        }, {});

        const storageObject = storageFields.reduce((acc, field) => {
            if (field.key.trim()) acc[field.key.trim()] = field.value.trim();
            return acc;
        }, {});

        const updatedData = {
            ...productInfo,
            total_price: totalPrice,
            nutrition_facts: nutritionObject,
            storage_notes: storageObject,
        };

        const result = await props.onUpdate(productInfo.id, updatedData);
        if (result.success) {
            props.closeModel();
        } else {
            setIsLoading(false);
        }
    };

    // ===== الأقسام الثابتة (جميعها موجودة دائماً) =====
    const sections = [
        // القسم 0: الأساسيات
        () => (
            <div className="green-container">
                <div className="info-row">
                    <div className="info-item">
                        <div>
                            <span className="info-label">Price {productInfo.price} €</span>
                            <input
                                type="number"
                                className="edit-input box-input"
                                value={productInfo.price}
                                onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })}
                                placeholder="Price"
                            />
                        </div>
                        <div>
                            <span className="info-label">Tax Rate %</span>
                            <input
                                type="number"
                                className="edit-input box-input"
                                value={productInfo.tax_rate}
                                onChange={(e) => setProductInfo({ ...productInfo, tax_rate: e.target.value })}
                                placeholder="Tax Rate"
                            />
                        </div>
                        <div>
                            <span className="info-label">Total (incl. tax)</span>
                            <input
                                type="text"
                                className="edit-input box-input disabled-input"
                                value={totalPrice.toFixed(2)}
                                disabled
                            />
                        </div>
                    </div>
                    <div className="info-item">
                        <div>
                            <span className="info-label">Category</span>
                            <input
                                type="text"
                                className="edit-input box-input"
                                value={productInfo.category}
                                onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                                placeholder="Category"
                            />
                        </div>
                        <div>
                            <span className="info-label">Weight</span>
                            <input
                                type="text"
                                className="edit-input box-input"
                                value={productInfo.weight}
                                onChange={(e) => setProductInfo({ ...productInfo, weight: e.target.value })}
                                placeholder="Weight"
                            />
                        </div>
                        <div>
                            <span className="info-label">Weight unit</span>
                            <select
                                className="edit-input box-input unit-select"
                                value={productInfo.weight_unit}
                                onChange={(e) => setProductInfo({ ...productInfo, weight_unit: e.target.value })}
                            >
                                <option value="kg">kg</option>
                                <option value="L">L</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="url-section">
                    <span className="info-label">Image URL</span>
                    <input
                        type="text"
                        className="edit-input url-input"
                        value={productInfo.image}
                        onChange={(e) => setProductInfo({ ...productInfo, image: e.target.value })}
                        placeholder="Enter the image URL"
                    />
                </div>
            </div>
        ),

        // القسم 1: القيم الغذائية (دائماً موجود)
        () => (
            <div className="dynamic-section">
                <div className="section-header">
                    <span className="section-title">🥗 Nutritional Values</span>
                </div>
                {nutritionFields.map((field, index) => (
                    <div key={index} className="dynamic-field-row">
                        <input
                            type="text"
                            className="dynamic-input"
                            placeholder="Energy"
                            value={field.key}
                            onChange={(e) => updateNutritionField(index, "key", e.target.value)}
                        />
                        <input
                            type="text"
                            className="dynamic-input"
                            placeholder="245 kJ"
                            value={field.value}
                            onChange={(e) => updateNutritionField(index, "value", e.target.value)}
                        />
                        <button type="button" className="remove-field-btn" onClick={() => removeNutritionField(index)}>
                            ✕
                        </button>
                    </div>
                ))}
                <button type="button" className="add-field-btn" onClick={addNutritionField}>
                    ➕ Add field
                </button>
                <hr className="hr-separator" />
                <label className="ingredients-input-label">
                    Ingredients
                    <input
                        type="text"
                        className="ingredients-input-box"
                        value={productInfo.ingredients}
                        onChange={(e) => setProductInfo({ ...productInfo, ingredients: e.target.value })}
                        placeholder="Ingredients"
                    />
                </label>
            </div>
        ),

        // القسم 2: التخزين والملاحظات (دائماً موجود)
        () => (
            <div className="dynamic-section">
                <div className="section-header">
                    <span className="section-title">📦 Storage and Notes</span>
                </div>
                {storageFields.map((field, index) => (
                    <div key={index} className="dynamic-field-row">
                        <input
                            type="text"
                            className="dynamic-input"
                            placeholder="Storage"
                            value={field.key}
                            onChange={(e) => updateStorageField(index, "key", e.target.value)}
                        />
                        <input
                            type="text"
                            className="dynamic-input"
                            placeholder="Store in cold place"
                            value={field.value}
                            onChange={(e) => updateStorageField(index, "value", e.target.value)}
                        />
                        <button type="button" className="remove-field-btn" onClick={() => removeStorageField(index)}>
                            ✕
                        </button>
                    </div>
                ))}
                <button type="button" className="add-field-btn" onClick={addStorageField}>
                    ➕ Add field
                </button>
            </div>
        ),
    ];

    return (
        <div className="modal-overlay" onClick={props.closeModel}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="edit-card">
                    <div className="image-section">
                        <img src={productInfo.image} alt={productInfo.name} className="product-image" />
                    </div>

                    <div className="name-section">
                        <input
                            type="text"
                            className="product-name"
                            value={productInfo.name}
                            onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
                            placeholder="Product name"
                        />
                    </div>

                    {/* ✅ النقاط الثلاث تظهر دائماً */}
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
                        <button className="action-btn save-btn" onClick={handleUpdate} disabled={isLoading}>
                            {isLoading ? "⏳ Saving..." : "💾 Save"}
                        </button>
                        <button className="action-btn cancel-btn" onClick={props.closeModel}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}