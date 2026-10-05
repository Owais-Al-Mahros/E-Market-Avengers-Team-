import { useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../../../../lib/supabase";
import { useCategories } from "../../../../../context/CategoryContext";
import { useSubcategories } from "../../../../../context/SubcategoryContext";
import { useDynamicFields } from "../../../../../hooks/useDynamicFields";
import {
    addProduct as addProductAPI,
    updateProduct as updateProductAPI,
    uploadProductImage,
} from "../../../../../api";
import "./ProductFormPage.css";

/* ═══════════════════════════════════════════
   Defaults
   ═══════════════════════════════════════════ */
const EMPTY_FORM = {
    name: "",
    price: "",
    tax_rate: 7,
    weight: "",
    weight_unit: "kg",
    category_id: "",
    subcategory_id: "",
    product_number: "",
    description: "",
    ingredients: "",
    image: "",
    nutrition_basis: "100 g",
    product_type: "unit_based",   // ← جديد
};

const TAX_PRESETS = [7, 19, 0];

export default function ProductFormPage({ mode = "new", product = null, onBack, onSaved }) {
    const isEdit = mode === "edit";
    const { categories } = useCategories();
    const { subcategories } = useSubcategories();

    // ═══════════════════════════════════════════
    // Form State
    // ═══════════════════════════════════════════
    const [form, setForm] = useState(() =>
        isEdit && product
            ? {
                name: product.name || "",
                price: product.price ?? "",
                tax_rate: product.tax_rate ?? 7,
                weight: product.weight ?? "",
                weight_unit: product.weight_unit || "kg",
                category_id: product.category_id || "",
                subcategory_id: product.subcategory_id || "",
                product_number: product.product_number ?? "",
                description: product.description || "",
                ingredients: product.ingredients || "",
                image: product.image || "",
                nutrition_basis: product.nutrition_basis || "pro 100 g",
                product_type: product.product_type || "unit_based",
            }
            : { ...EMPTY_FORM }
    );

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(isEdit ? product?.image || "" : "");
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const formTopRef = useRef(null);

    // ═══════════════════════════════════════════
    // Dynamic Fields
    // ═══════════════════════════════════════════
    const nutrition = useDynamicFields(
        isEdit && product?.nutrition_facts
            ? Object.entries(product.nutrition_facts).map(([k, v]) => ({ key: k, value: v }))
            : []
    );
    const storage = useDynamicFields(
        isEdit && product?.storage_notes
            ? Object.entries(product.storage_notes).map(([k, v]) => ({ key: k, value: v }))
            : []
    );

    // ═══════════════════════════════════════════
    // Derived
    // ═══════════════════════════════════════════
    const filteredSubs = useMemo(
        () => subcategories.filter((s) => Number(s.category_id) === Number(form.category_id)),
        [subcategories, form.category_id]
    );

    const totalPrice = useMemo(() => {
        const p = parseFloat(form.price) || 0;
        const t = parseFloat(form.tax_rate) || 0;
        return p + (p * t) / 100;
    }, [form.price, form.tax_rate]);

    const hasImage = Boolean(selectedFile) || Boolean(form.image.trim());

    // ═══════════════════════════════════════════
    // Handlers
    // ═══════════════════════════════════════════
    const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setSelectedFile(null);
        setPreviewUrl("");
        nutrition.resetFields();
        storage.resetFields();
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ═══════════════════════════════════════════
    // Validation
    // ═══════════════════════════════════════════
    const validate = () => {
        if (!hasImage) return "Product image is required";
        if (!form.name.trim()) return "Name is required";
        if (!form.product_number) return "Product Number is required";
        if (!form.category_id) return "Category is required";
        if (form.price === "" || isNaN(parseFloat(form.price))) return "Price is required";
        if (form.weight === "" || isNaN(parseFloat(form.weight))) return "Weight is required";
        return null;
    };

    // ═══════════════════════════════════════════
    // Submit
    // ═══════════════════════════════════════════
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ═══ Validation ═══
        const err = validate();
        if (err) return toast.error(err);

        setSaving(true);
        const toastId = toast.loading(isEdit ? "Updating product..." : "Creating product...");

        try {
            // ═══ تحقق من عدم تكرار رقم المنتج ═══
            const { data: existing } = await supabase
                .from("products")
                .select("id")
                .eq("product_number", Number(form.product_number))
                .maybeSingle();

            if (existing && (!isEdit || existing.id !== product?.id)) {
                throw new Error(`Product Number ${form.product_number} is already in use`);
            }

            // ═══ ارفع الصورة إن وُجد ملف ═══
            let imageUrl = form.image;
            if (selectedFile) {
                const up = await uploadProductImage(selectedFile);
                if (!up.success) throw new Error(up.error);
                imageUrl = up.publicUrl;
            }

            // ═══ جهّز البيانات ═══
            const payload = {
                name: form.name.trim(),
                image: imageUrl || null,
                description: form.description.trim() || null,
                price: parseFloat(form.price) || 0,
                total_price: +totalPrice.toFixed(2),
                tax_rate: parseFloat(form.tax_rate) || 0,
                weight: parseFloat(form.weight) || 0,
                weight_unit: form.weight_unit,
                category_id: Number(form.category_id),
                subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
                product_number: Number(form.product_number),
                ingredients: form.ingredients.trim() || null,
                nutrition_facts: nutrition.toObject(),
                storage_notes: storage.toObject(),
                nutrition_basis: form.nutrition_basis?.trim() || null,
                product_type: form.product_type || "unit_based",
            };

            // ═══ نفّذ العملية ═══
            const res = isEdit
                ? await updateProductAPI(product.id, payload)
                : await addProductAPI(payload);

            if (!res.success) throw new Error(res.error);

            // ═══ نجح ═══
            if (isEdit) {
                toast.success("Product updated successfully", { id: toastId });
                onSaved?.(); // تعديل → عُد للقائمة
            } else {
                // إضافة → أفرغ الفورم وابقَ في الصفحة
                toast.success(`✅ "${payload.name}" added successfully`, {
                    id: toastId,
                    duration: 4000,
                });
                resetForm();
                // ارجع لأعلى الصفحة
                formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to save product", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    // ═══════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════
    return (
        <div className="pf-page" ref={formTopRef}>
            {/* Header */}
            <div className="pf-header">
                <button type="button" className="pf-back-btn" onClick={onBack}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Products
                </button>

                <div className="pf-header-title">
                    <span className="material-symbols-outlined">
                        {isEdit ? "edit" : "add_box"}
                    </span>
                    <h2>{isEdit ? "Edit Product" : "Add New Product"}</h2>
                </div>
            </div>

            <form className="pf-form" onSubmit={handleSubmit} noValidate>
                {/* ═══════════ Row 1: Image + Basic Info ═══════════ */}
                <div className="pf-row pf-row-2">
                    {/* Image Card */}
                    {/* ═══ Product Type — جديد ═══ */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">tune</span>
                            Produkt-Typ
                        </h3>

                        <p className="pf-hint">
                            Legt fest, wie der Preis berechnet wird.
                        </p>

                        <div className="pf-type-options">
                            <button
                                type="button"
                                className={`pf-type-btn ${form.product_type === "unit_based" ? "active" : ""}`}
                                onClick={() => setField("product_type", "unit_based")}
                            >
                                <span className="material-symbols-outlined">inventory_2</span>
                                <div>
                                    <strong>Stückware (Verpackt)</strong>
                                    <small>Preis pro Stück/Verpackung</small>
                                </div>
                            </button>

                            <button
                                type="button"
                                className={`pf-type-btn ${form.product_type === "weight_based" ? "active" : ""}`}
                                onClick={() => setField("product_type", "weight_based")}
                            >
                                <span className="material-symbols-outlined">scale</span>
                                <div>
                                    <strong>Gewichtsware</strong>
                                    <small>Preis pro kg (Obst, Gemüse, Fleisch)</small>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">info</span>
                            Basic Information
                        </h3>

                        <div className="pf-field">
                            <label>Product Name *</label>
                            <input
                                type="text"
                                className="pf-input"
                                value={form.name}
                                onChange={(e) => setField("name", e.target.value)}
                                placeholder="e.g., Fresh Apples"
                            />
                        </div>

                        <div className="pf-grid-2">
                            <div className="pf-field">
                                <label>Product Number *</label>
                                <input
                                    type="number"
                                    className="pf-input"
                                    value={form.product_number}
                                    onChange={(e) => setField("product_number", e.target.value)}
                                    placeholder="e.g., 1001"
                                    min="1"
                                />
                            </div>

                            <div className="pf-field">
                                <label>Category *</label>
                                <select
                                    className="pf-input"
                                    value={form.category_id}
                                    onChange={(e) => {
                                        setField("category_id", e.target.value);
                                        setField("subcategory_id", "");
                                    }}
                                >
                                    <option value="">Select category...</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pf-field">
                            <label>Subcategory</label>
                            <select
                                className="pf-input"
                                value={form.subcategory_id}
                                onChange={(e) => setField("subcategory_id", e.target.value)}
                                disabled={!form.category_id || filteredSubs.length === 0}
                            >
                                <option value="">
                                    {!form.category_id
                                        ? "Select a category first"
                                        : filteredSubs.length === 0
                                            ? "No subcategories available"
                                            : "None"}
                                </option>
                                {filteredSubs.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pf-field">
                            <label>Description</label>
                            <textarea
                                className="pf-input pf-textarea"
                                value={form.description}
                                onChange={(e) => setField("description", e.target.value)}
                                placeholder="Short description of the product (optional)..."
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════ Row 2: Pricing + Weight ═══════════ */}
                <div className="pf-row pf-row-2">
                    {/* Pricing */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">euro</span>
                            Pricing
                        </h3>

                        <div className="pf-field">
                            <label>Net Price (€) *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="pf-input"
                                value={form.price}
                                onChange={(e) => setField("price", e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        {/* ✅ Tax Rate — input حر */}
                        <div className="pf-field">
                            <label>Tax Rate (%)</label>
                            <div className="pf-tax-row">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    className="pf-input"
                                    value={form.tax_rate}
                                    onChange={(e) => setField("tax_rate", e.target.value)}
                                    placeholder="e.g., 7"
                                />
                                <div className="pf-tax-chips">
                                    {TAX_PRESETS.map((rate) => (
                                        <button
                                            key={rate}
                                            type="button"
                                            className={`pf-tax-chip ${Number(form.tax_rate) === rate ? "active" : ""}`}
                                            onClick={() => setField("tax_rate", rate)}
                                        >
                                            {rate}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pf-total-box">
                            <span>Total (incl. tax)</span>
                            <strong>€{totalPrice.toFixed(2)}</strong>
                        </div>
                    </div>

                    {/* Weight */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">scale</span>
                            Weight & Unit
                        </h3>

                        <div className="pf-grid-2">
                            <div className="pf-field">
                                <label>Weight *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pf-input"
                                    value={form.weight}
                                    onChange={(e) => setField("weight", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="pf-field">
                                <label>Unit</label>
                                <select
                                    className="pf-input"
                                    value={form.weight_unit}
                                    onChange={(e) => setField("weight_unit", e.target.value)}
                                >
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="L">L</option>
                                    <option value="ml">ml</option>
                                    <option value="Stk">Stk</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Row 3: Nutrition ═══════════ */}
                <div className="pf-card">
                    <h3 className="pf-card-title">
                        <span className="material-symbols-outlined">nutrition</span>
                        Nutrition Facts
                    </h3>
                    <div className="pf-field">
                        <label>Nutrition Basis (as displayed to customer)</label>
                        <input
                            type="text"
                            className="pf-input"
                            value={form.nutrition_basis || ""}
                            onChange={(e) => setField("nutrition_basis", e.target.value)}
                            placeholder="pro 100 g"
                        />
                        <small className="pf-hint">
                            Example: "pro 100 g", "pro 100 ml", "pro Portion"
                        </small>
                    </div>
                    {nutrition.fields.length === 0 ? (
                        <p className="pf-empty-hint">
                            No nutrition data. Add fields like "Energy", "Fat", "Protein".
                        </p>
                    ) : (
                        <div className="pf-dynamic-list">
                            {nutrition.fields.map((f, i) => (
                                <div key={i} className="pf-dynamic-row">
                                    <input
                                        type="text"
                                        className="pf-input"
                                        placeholder="e.g., Energy"
                                        value={f.key}
                                        onChange={(e) => nutrition.updateField(i, "key", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="pf-input"
                                        placeholder="e.g., 245 kcal"
                                        value={f.value}
                                        onChange={(e) => nutrition.updateField(i, "value", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="pf-remove-btn"
                                        onClick={() => nutrition.removeField(i)}
                                        aria-label="Remove"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button type="button" className="pf-add-field-btn" onClick={nutrition.addField}>
                        <span className="material-symbols-outlined">add</span>
                        Add Nutrition Field
                    </button>

                    <div className="pf-field pf-mt-2">
                        <label>Ingredients</label>
                        <textarea
                            className="pf-input pf-textarea"
                            value={form.ingredients}
                            onChange={(e) => setField("ingredients", e.target.value)}
                            placeholder="e.g., Apples, Vitamin C..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* ═══════════ Row 4: Storage ═══════════ */}
                <div className="pf-card">
                    <h3 className="pf-card-title">
                        <span className="material-symbols-outlined">ac_unit</span>
                        Storage Notes
                    </h3>

                    {storage.fields.length === 0 ? (
                        <p className="pf-empty-hint">
                            No storage notes. Add fields like "Storage", "Shelf Life".
                        </p>
                    ) : (
                        <div className="pf-dynamic-list">
                            {storage.fields.map((f, i) => (
                                <div key={i} className="pf-dynamic-row">
                                    <input
                                        type="text"
                                        className="pf-input"
                                        placeholder="e.g., Storage"
                                        value={f.key}
                                        onChange={(e) => storage.updateField(i, "key", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="pf-input"
                                        placeholder="e.g., Cool and dry"
                                        value={f.value}
                                        onChange={(e) => storage.updateField(i, "value", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="pf-remove-btn"
                                        onClick={() => storage.removeField(i)}
                                        aria-label="Remove"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button type="button" className="pf-add-field-btn" onClick={storage.addField}>
                        <span className="material-symbols-outlined">add</span>
                        Add Storage Field
                    </button>
                </div>

                {/* ═══════════ Sticky Footer ═══════════ */}
                <div className="pf-footer">
                    <button
                        type="button"
                        className="pf-btn pf-btn-secondary"
                        onClick={isEdit ? onBack : resetForm}
                        disabled={saving}
                    >
                        {isEdit ? "Cancel" : "Clear Form"}
                    </button>
                    <button
                        type="submit"
                        className="pf-btn pf-btn-primary"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="pf-spinner" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check</span>
                                {isEdit ? "Save Changes" : "Create Product"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}