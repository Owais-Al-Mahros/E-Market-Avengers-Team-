import "./EditProduct.css";
import { useState, useMemo } from "react";
import { useDynamicFields } from "../../../hooks/useDynamicFields";

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


    const [isLoading, setIsLoading] = useState(false);
    const [currentSection, setCurrentSection] = useState(0);

    const totalPrice = useMemo(() => {
        const netPrice = parseFloat(productInfo.price) || 0;
        const taxRate = parseFloat(productInfo.tax_rate) || 0;
        return netPrice + (netPrice * taxRate / 100);
    }, [productInfo.price, productInfo.tax_rate]);

    const initialNutrition = props.nutritionObject
        ? Object.entries(props.nutritionObject).map(([key, value]) => ({ key, value }))
        : [];

    const initialStorage = props.storageObject
        ? Object.entries(props.storageObject).map(([key, value]) => ({ key, value }))
        : [];

    const nutrition = useDynamicFields(initialNutrition);
    const storage = useDynamicFields(initialStorage);



    // ===== معالجة التحديث =====
    const handleUpdate = async () => {
        setIsLoading(true);


        const updatedData = {
            ...productInfo,
            total_price: totalPrice,
            nutrition_facts: nutrition.toObject(),
            storage_notes: storage.toObject(),
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