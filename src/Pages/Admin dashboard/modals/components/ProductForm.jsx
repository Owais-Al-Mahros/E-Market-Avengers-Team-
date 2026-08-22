
import { useState, useMemo, useEffect } from "react";
import { useDynamicFields } from "../../../../hooks/useDynamicFields";
import "./ProductForm.css"; // يمكنك دمج الـ CSS من الملفين
import { useCategories } from "../../../../context/CategoryContext";

export default function ProductForm({
    // بيانات المنتج (تأتي من الـ state أو الـ props)
    initialProductInfo = {},
    onSubmit,        // دالة تُستدعى عند الحفظ (تستقبل البيانات)
    isLoading = false,
    submitLabel = "Save",
    title = "Product Form",
    closeModel,
}) {
    // دمج البيانات الأولية مع القيم الافتراضية
    const [productInfo, setProductInfo] = useState({
        name: "",
        price: "",
        image: "",
        category: "",
        weight: "",
        weight_unit: "kg",
        tax_rate: 0,
        ingredients: "",
        ...initialProductInfo,
    });

    const [currentSection, setCurrentSection] = useState(0);
    const { categories, loading, addCategory } = useCategories();

    // تحويل الكائنات الأولية للحقول الديناميكية (إن وجدت)
    const initialNutrition = initialProductInfo.nutrition_facts
        ? Object.entries(initialProductInfo.nutrition_facts).map(([k, v]) => ({ key: k, value: v }))
        : [];

    const initialStorage = initialProductInfo.storage_notes
        ? Object.entries(initialProductInfo.storage_notes).map(([k, v]) => ({ key: k, value: v }))
        : [];

    const nutrition = useDynamicFields(initialNutrition);
    const storage = useDynamicFields(initialStorage);

    // حساب السعر الإجمالي
    const totalPrice = useMemo(() => {
        const priceNum = parseFloat(productInfo.price) || 0;
        const taxRate = parseFloat(productInfo.tax_rate) || 0;
        return priceNum + (priceNum * taxRate / 100);
    }, [productInfo.price, productInfo.tax_rate]);

    // التحكم بالتمرير عند فتح المودال
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = "auto"; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = {
            ...productInfo,
            total_price: totalPrice,
            nutrition_facts: nutrition.toObject(),
            storage_notes: storage.toObject(),
        };
        await onSubmit(dataToSubmit);
    };

    // الأقسام الثلاثة (نفس الكود تماماً مع تعديل بسيط)
    const sections = [
        // القسم 0: الأساسيات (يحتوي على جميع الـ Inputs)
        () => (
            <div className="green-container">
                <div className="info-row">
                    {/* العمود الأيسر: السعر، الضريبة، الإجمالي */}
                    <div className="info-item large-item">
                        <div className="vertical-group">
                            {/* 1. حقل السعر */}
                            <div className="field-group">
                                <span className="info-label">Net Price</span>
                                <span className="info-value">{productInfo.price || "0"} €</span>
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

                            {/* 2. حقل الضريبة */}
                            <div className="field-group">
                                <span className="info-label">Tax Rate %</span>
                                <input
                                    type="number"
                                    className="edit-input box-input"
                                    value={productInfo.tax_rate}
                                    onChange={(e) =>
                                        setProductInfo({ ...productInfo, tax_rate: Number(e.target.value) })
                                    }
                                    placeholder="Tax %"
                                />
                            </div>

                            {/* 3. حقل الإجمالي (معطل) */}
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

                    {/* العمود الأيمن: الفئة، الوزن */}
                    <div className="info-item category-item">
                        <div className="vertical-group weghit-category">
                            {/* 4. حقل الفئة */}
                            <div className="field-group">
                                <span className="info-label">Category</span>
                                <select
                                    required
                                    className="edit-input box-input unit-select"
                                    value={productInfo.category}
                                    onChange={(e) =>
                                        setProductInfo({ ...productInfo, category: e.target.value })
                                    }
                                >
                                    {categories.map((category) => {
                                        return <option value={category.name}>
                                            {category.name}</option>
                                    })
                                    }

                                </select>
                            </div>

                            {/* 5. حقل الوزن + وحدة الوزن */}
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
                                            setProductInfo({ ...productInfo, weight_unit: e.target.value })
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

                {/* 6. حقل رابط الصورة */}
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
        ),
        () => ( // القسم الثاني: القيم الغذائية
            <div className="dynamic-section">
                <div className="section-header">
                    <span className="section-title">🥗 Nutritional Values</span>
                </div>
                {nutrition.fields.map((field, index) => (
                    <div className="dynamic-field-row">
                        <input
                            type="text"
                            className="dynamic-input"    // ✅
                            placeholder="Energy"
                            value={field.key}
                            onChange={(e) => nutrition.updateField(index, 'key', e.target.value)}
                        />
                        <input
                            type="text"
                            className="dynamic-input"    // ✅
                            placeholder="245 for 1kg"
                            value={field.value}
                            onChange={(e) => nutrition.updateField(index, 'value', e.target.value)}
                        />
                        <button type="button" className="remove-field-btn" onClick={() => nutrition.removeField(index)}>
                            ✕
                        </button>
                    </div>
                ))}
                <button type="button" onClick={nutrition.addField}>➕ Add field</button>
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
        () => ( // القسم الثالث: التخزين
            <div className="dynamic-section">
                <div className="section-header">
                    <span className="section-title">📦 Storage and Notes</span>
                </div>
                {storage.fields.map((field, index) => (
                    <div className="dynamic-field-row">
                        <input
                            type="text"
                            className="dynamic-input"    // ✅
                            placeholder="Energy"
                            value={field.key}
                            onChange={(e) => nutrition.updateField(index, 'key', e.target.value)}
                        />
                        <input
                            type="text"
                            className="dynamic-input"    // ✅
                            placeholder="245 for 1kg"
                            value={field.value}
                            onChange={(e) => nutrition.updateField(index, 'value', e.target.value)}
                        />
                        <button type="button" className="remove-field-btn" onClick={() => nutrition.removeField(index)}>
                            ✕
                        </button>
                    </div>
                ))}
                <button type="button" onClick={storage.addField}>➕ Add field</button>
            </div>
        ),
    ];

    return (
        <div className="modal-overlay" onClick={closeModel}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="edit-card">
                    <div className="image-section">
                        <img src={productInfo.image || "/placeholder.png"} alt="product" className="product-image" />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="name-section">
                            <input
                                type="text"
                                className="product-name"
                                value={productInfo.name}
                                onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })}
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
                            <button type="submit" className="action-btn save-btn" disabled={isLoading}>
                                {isLoading ? "⏳ Saving..." : submitLabel}
                            </button>
                            <button type="button" className="action-btn cancel-btn" onClick={closeModel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}