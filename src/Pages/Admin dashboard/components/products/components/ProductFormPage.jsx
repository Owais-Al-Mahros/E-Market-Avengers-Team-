import { useState, useMemo, useRef, useEffect } from "react";
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
   Constants
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
    product_type: "unit_based",
};

/* ✅ فقط نسبتان قانونيتان في ألمانيا (§12 UStG) */
const TAX_RATE_OPTIONS = [
    {
        value: 7,
        icon: "🥗",
        label: "7% — Ermäßigt",
        description: "Lebensmittel, Bücher, Kulturveranstaltungen",
    },
    {
        value: 19,
        icon: "📦",
        label: "19% — Regelsatz",
        description: "Standardsteuersatz für alle anderen Waren",
    },
];

/* ✅ وحدات الوزن/الحجم — Stk ليست وحدة وزن! */
const WEIGHT_UNITS = ["kg", "g", "L", "ml"];

/* ✅ نصوص ديناميكية حسب نوع المنتج */
const WEIGHT_META = {
    unit_based: {
        label: "Geschätztes Gewicht pro Stück",
        hint:
            "Wird für die Versandkostenberechnung verwendet — " +
            "z.B. 0,35 kg für eine Getränkedose, 0,06 kg für ein Ei.",
        placeholder: "z.B. 0,35",
        required: true,
    },
    weight_based: {
        label: "Gewicht pro Einheit",
        hint:
            "Bestimmt den Preis — z.B. 0,2 kg für eine Banane. " +
            "Der Kunde zahlt nach tatsächlichem Gewicht.",
        placeholder: "z.B. 0,2",
        required: true,
    },
};

export default function ProductFormPage({
    mode = "new",
    product = null,
    onBack,
    onSaved,
}) {
    const isEdit = mode === "edit";
    const { categories } = useCategories();
    const { subcategories } = useSubcategories();

    // ═══════════════════════════════════════════
    // Form State
    // ═══════════════════════════════════════════
    const [form, setForm] = useState(() => {
        if (isEdit && product) {
            return {
                name: product.name || "",
                price:
                    product.total_price != null
                        ? String(product.total_price)
                        : product.price != null
                            ? String(product.price)
                            : "",
                tax_rate: product.tax_rate ?? 7,
                weight: product.weight ?? "",
                weight_unit: WEIGHT_UNITS.includes(product.weight_unit)
                    ? product.weight_unit
                    : "kg",
                category_id: product.category_id || "",
                subcategory_id: product.subcategory_id || "",
                product_number: product.product_number ?? "",
                description: product.description || "",
                ingredients: product.ingredients || "",
                image: product.image || "",
                nutrition_basis: product.nutrition_basis || "100 g",
                product_type: product.product_type || "unit_based",
            };
        }
        return { ...EMPTY_FORM };
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(
        isEdit ? product?.image || "" : ""
    );
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const formTopRef = useRef(null);

    const [productNumberStatus, setProductNumberStatus] = useState("idle");

    // ═══════════════════════════════════════════
    // Dynamic Fields
    // ═══════════════════════════════════════════
    const nutrition = useDynamicFields(
        isEdit && product?.nutrition_facts
            ? Object.entries(product.nutrition_facts).map(([k, v]) => ({
                key: k,
                value: v,
            }))
            : []
    );
    const storage = useDynamicFields(
        isEdit && product?.storage_notes
            ? Object.entries(product.storage_notes).map(([k, v]) => ({
                key: k,
                value: v,
            }))
            : []
    );

    // ═══════════════════════════════════════════
    // ✅ Price Calculations — Brutto → Netto
    // ═══════════════════════════════════════════
    const bruttoPrice = parseFloat(form.price) || 0;

    const nettoPrice = useMemo(() => {
        const t = parseFloat(form.tax_rate) || 0;
        if (bruttoPrice <= 0) return 0;
        return t > 0 ? bruttoPrice / (1 + t / 100) : bruttoPrice;
    }, [bruttoPrice, form.tax_rate]);

    const taxAmount = Math.max(0, bruttoPrice - nettoPrice);

    // ═══════════════════════════════════════════
    // Derived
    // ═══════════════════════════════════════════
    const filteredSubs = useMemo(
        () =>
            subcategories.filter(
                (s) => Number(s.category_id) === Number(form.category_id)
            ),
        [subcategories, form.category_id]
    );

    const hasImage = Boolean(selectedFile) || Boolean(form.image.trim());

    /* ✅ meta حسب نوع المنتج */
    const weightMeta = WEIGHT_META[form.product_type] || WEIGHT_META.unit_based;

    // ═══════════════════════════════════════════
    // ✅ Debounced check لـ product_number
    // ═══════════════════════════════════════════
    useEffect(() => {
        const num = String(form.product_number || "").trim();

        if (!num) {
            setProductNumberStatus("idle");
            return;
        }

        if (!/^\d+$/.test(num) || Number(num) <= 0) {
            setProductNumberStatus("invalid");
            return;
        }

        setProductNumberStatus("checking");

        const timer = setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("id")
                    .eq("product_number", Number(num))
                    .maybeSingle();

                if (error && error.code !== "PGRST116") throw error;

                const isSelf = isEdit && data?.id === product?.id;
                if (data && !isSelf) {
                    setProductNumberStatus("taken");
                } else {
                    setProductNumberStatus("available");
                }
            } catch (err) {
                console.error("product_number check:", err);
                setProductNumberStatus("idle");
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [form.product_number, isEdit, product?.id]);

    // ═══════════════════════════════════════════
    // Handlers
    // ═══════════════════════════════════════════
    const setField = (name, value) =>
        setForm((prev) => ({ ...prev, [name]: value }));

    /* ✅ تغيير product_type — لا يلمس weight/weight_unit بعد الآن */
    const handleProductTypeChange = (type) => {
        setForm((prev) => ({ ...prev, product_type: type }));
    };

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
        setProductNumberStatus("idle");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ═══════════════════════════════════════════
    // Validation
    // ═══════════════════════════════════════════
    const validate = () => {
        if (!hasImage) return "Product image is required.";

        if (!form.name.trim()) return "Name is required.";

        const num = String(form.product_number || "").trim();
        if (!num) return "Product Number is required.";
        if (!/^\d+$/.test(num) || Number(num) <= 0) {
            return "Product Number must be a positive integer.";
        }
        if (productNumberStatus === "taken") {
            return `Product Number ${num} is already in use.`;
        }
        if (productNumberStatus === "checking") {
            return "Product Number verification in progress. Please wait.";
        }

        if (!form.category_id) return "Category is required.";

        if (form.price === "" || isNaN(parseFloat(form.price))) {
            return "Bruttopreis ist erforderlich.";
        }
        if (bruttoPrice <= 0) {
            return "Bruttopreis muss größer als 0 sein.";
        }

        /* ✅ weight مطلوب في كل الحالات */
        if (form.weight === "" || isNaN(parseFloat(form.weight))) {
            return "Gewicht ist erforderlich.";
        }
        if (parseFloat(form.weight) <= 0) {
            return "Gewicht muss größer als 0 sein.";
        }

        if (![7, 19].includes(Number(form.tax_rate))) {
            return "Ungültiger Steuersatz. Nur 7% oder 19% zulässig.";
        }

        return null;
    };

    // ═══════════════════════════════════════════
    // Submit
    // ═══════════════════════════════════════════
    const handleSubmit = async (e) => {
        e.preventDefault();

        const err = validate();
        if (err) return toast.error(err);

        setSaving(true);
        const toastId = toast.loading(
            isEdit ? "Updating product..." : "Creating product..."
        );

        try {
            let imageUrl = form.image;
            if (selectedFile) {
                const up = await uploadProductImage(selectedFile);
                if (!up.success) throw new Error(up.error);
                imageUrl = up.publicUrl;
            }

            const payload = {
                name: form.name.trim(),
                image: imageUrl || null,
                description: form.description.trim() || null,

                price: Number(nettoPrice.toFixed(4)),
                total_price: Number(bruttoPrice.toFixed(2)),
                tax_rate: Number(form.tax_rate),

                weight: parseFloat(form.weight) || 0,
                weight_unit: form.weight_unit,
                category_id: Number(form.category_id),
                subcategory_id: form.subcategory_id
                    ? Number(form.subcategory_id)
                    : null,
                product_number: Number(form.product_number),
                ingredients: form.ingredients.trim() || null,
                nutrition_facts: nutrition.toObject(),
                storage_notes: storage.toObject(),
                nutrition_basis: form.nutrition_basis?.trim() || null,
                product_type: form.product_type,
            };

            const res = isEdit
                ? await updateProductAPI(product.id, payload)
                : await addProductAPI(payload);

            if (!res.success) throw new Error(res.error);

            if (isEdit) {
                toast.success("Product updated successfully", { id: toastId });
                onSaved?.();
            } else {
                toast.success(`✅ "${payload.name}" added successfully`, {
                    id: toastId,
                    duration: 4000,
                });
                resetForm();
                formTopRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to save product", {
                id: toastId,
            });
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
                <button
                    type="button"
                    className="pf-back-btn"
                    onClick={onBack}
                >
                    <span className="material-symbols-outlined">
                        arrow_back
                    </span>
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
                <div className="pf-row pf-row-wide-right">
                    {/* Image Card */}
                    <div className="pf-card pf-card-image">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">
                                image
                            </span>
                            Produktbild
                            <span className="pf-required">*</span>
                        </h3>

                        <div className="pf-image-area">
                            <div
                                className={`pf-image-box ${!hasImage ? "is-required" : ""
                                    }`}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Vorschau" />
                                ) : (
                                    <span className="material-symbols-outlined pf-image-placeholder">
                                        add_photo_alternate
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                className="pf-upload-btn"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="material-symbols-outlined">
                                    photo_camera
                                </span>
                                {previewUrl ? "Bild ändern" : "Bild hochladen"}
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />

                            <div className="pf-or">— ODER —</div>

                            <input
                                type="text"
                                className="pf-input"
                                placeholder="Bild-URL einfügen..."
                                value={form.image}
                                onChange={(e) => {
                                    setField("image", e.target.value);
                                    setPreviewUrl(e.target.value);
                                    setSelectedFile(null);
                                }}
                            />
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">
                                info
                            </span>
                            Basic Information
                        </h3>

                        <div className="pf-field">
                            <label>Product Name *</label>
                            <input
                                type="text"
                                className="pf-input"
                                value={form.name}
                                onChange={(e) =>
                                    setField("name", e.target.value)
                                }
                                placeholder="e.g., Fresh Apples"
                            />
                        </div>

                        <div className="pf-grid-2">
                            <div className="pf-field">
                                <label>
                                    Product Number *
                                    {productNumberStatus === "checking" && (
                                        <small className="pf-status-hint">
                                            {" "}
                                            — Checking...
                                        </small>
                                    )}
                                    {productNumberStatus === "available" && (
                                        <small className="pf-status-hint pf-status-ok">
                                            {" "}
                                            ✓ Available
                                        </small>
                                    )}
                                    {productNumberStatus === "taken" && (
                                        <small className="pf-status-hint pf-status-error">
                                            {" "}
                                            ✕ Already in use
                                        </small>
                                    )}
                                    {productNumberStatus === "invalid" && (
                                        <small className="pf-status-hint pf-status-error">
                                            {" "}
                                            ✕ Positive number required
                                        </small>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    className={`pf-input ${productNumberStatus === "taken" ||
                                        productNumberStatus === "invalid"
                                        ? "has-error"
                                        : ""
                                        }`}
                                    value={form.product_number}
                                    onChange={(e) =>
                                        setField(
                                            "product_number",
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g., 1001"
                                    min="1"
                                />
                                <small className="pf-hint">
                                    Nur für interne Zwecke — nicht für Kunden
                                    sichtbar.
                                </small>
                            </div>

                            <div className="pf-field">
                                <label>Category *</label>
                                <select
                                    className="pf-input"
                                    value={form.category_id}
                                    onChange={(e) => {
                                        setField(
                                            "category_id",
                                            e.target.value
                                        );
                                        setField("subcategory_id", "");
                                    }}
                                >
                                    <option value="">
                                        Select category...
                                    </option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pf-field">
                            <label>Subcategory</label>
                            <select
                                className="pf-input"
                                value={form.subcategory_id}
                                onChange={(e) =>
                                    setField("subcategory_id", e.target.value)
                                }
                                disabled={
                                    !form.category_id ||
                                    filteredSubs.length === 0
                                }
                            >
                                <option value="">
                                    {!form.category_id
                                        ? "Select a category first"
                                        : filteredSubs.length === 0
                                            ? "No subcategories available"
                                            : "None"}
                                </option>
                                {filteredSubs.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="pf-field">
                            <label>Description</label>
                            <textarea
                                className="pf-input pf-textarea"
                                value={form.description}
                                onChange={(e) =>
                                    setField("description", e.target.value)
                                }
                                placeholder="Short description (optional)..."
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════ Row 2: Product Type (40%) + Pricing (60%) ═══════════ */}
                <div className="pf-row pf-row-wide-right">
                    {/* Product Type */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">
                                tune
                            </span>
                            Produkt-Typ
                        </h3>

                        <p className="pf-hint">
                            Legt fest, wie der Preis interpretiert wird.
                        </p>

                        <div className="pf-type-options pf-type-options-stack">
                            <button
                                type="button"
                                className={`pf-type-btn ${form.product_type === "unit_based"
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleProductTypeChange("unit_based")
                                }
                            >
                                <span className="material-symbols-outlined">
                                    inventory_2
                                </span>
                                <div>
                                    <strong>Stückware</strong>
                                    <small>
                                        Fester Preis pro Stück — Kunde wählt
                                        Anzahl
                                    </small>
                                </div>
                            </button>

                            <button
                                type="button"
                                className={`pf-type-btn ${form.product_type === "weight_based"
                                    ? "active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    handleProductTypeChange("weight_based")
                                }
                            >
                                <span className="material-symbols-outlined">
                                    scale
                                </span>
                                <div>
                                    <strong>Gewichtsware</strong>
                                    <small>
                                        Preis nach tatsächlichem Gewicht
                                        (Obst, Gemüse)
                                    </small>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">
                                euro
                            </span>
                            Pricing
                        </h3>

                        <div className="pf-grid-2">
                            <div className="pf-field">
                                <label>Bruttopreis (€) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="pf-input"
                                    value={form.price}
                                    onChange={(e) =>
                                        setField("price", e.target.value)
                                    }
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="pf-field">
                                <label>Steuersatz *</label>
                                <select
                                    className="pf-input"
                                    value={form.tax_rate}
                                    onChange={(e) =>
                                        setField(
                                            "tax_rate",
                                            Number(e.target.value)
                                        )
                                    }
                                >
                                    {TAX_RATE_OPTIONS.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.icon} {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pf-price-breakdown">
                            <div className="pf-price-row">
                                <span>Nettopreis</span>
                                <strong>€{nettoPrice.toFixed(2)}</strong>
                            </div>
                            <div className="pf-price-row pf-price-row-tax">
                                <span>MwSt. ({form.tax_rate}%)</span>
                                <span>€{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="pf-price-row pf-price-row-total">
                                <span>Bruttopreis</span>
                                <strong>€{bruttoPrice.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Row 3: Weight (40%) + Nutrition (60%) ═══════════ */}
                <div className="pf-row pf-row-wide-right">
                    {/* Weight */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">
                                scale
                            </span>
                            Weight & Unit
                        </h3>

                        <p className="pf-hint">{weightMeta.hint}</p>

                        <div className="pf-grid-2">
                            <div className="pf-field">
                                <label>
                                    {weightMeta.label}
                                    <span className="pf-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    className="pf-input"
                                    value={form.weight}
                                    onChange={(e) =>
                                        setField("weight", e.target.value)
                                    }
                                    placeholder={weightMeta.placeholder}
                                />
                            </div>

                            <div className="pf-field">
                                <label>Unit</label>
                                <select
                                    className="pf-input"
                                    value={form.weight_unit}
                                    onChange={(e) =>
                                        setField(
                                            "weight_unit",
                                            e.target.value
                                        )
                                    }
                                >
                                    {WEIGHT_UNITS.map((u) => (
                                        <option key={u} value={u}>
                                            {u}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>


                    {/* Nutrition */}
                    <div className="pf-card">
                        <h3 className="pf-card-title">
                            <span className="material-symbols-outlined">
                                nutrition
                            </span>
                            Nutrition Facts
                        </h3>

                        <div className="pf-field">
                            <label>Nutrition Basis</label>
                            <input
                                type="text"
                                className="pf-input"
                                value={form.nutrition_basis || ""}
                                onChange={(e) =>
                                    setField(
                                        "nutrition_basis",
                                        e.target.value
                                    )
                                }
                                placeholder="100 g"
                            />
                            <small className="pf-hint">
                                Example: "100 g", "100 ml", "Portion"
                            </small>
                        </div>

                        {nutrition.fields.length === 0 ? (
                            <p className="pf-empty-hint">
                                No nutrition data. Add fields like "Energy",
                                "Fat", "Protein".
                            </p>
                        ) : (
                            <div className="pf-dynamic-list">
                                {nutrition.fields.map((f, i) => (
                                    <div
                                        key={i}
                                        className="pf-dynamic-row"
                                    >
                                        <input
                                            type="text"
                                            className="pf-input"
                                            placeholder="e.g., Energy"
                                            value={f.key}
                                            onChange={(e) =>
                                                nutrition.updateField(
                                                    i,
                                                    "key",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <input
                                            type="text"
                                            className="pf-input"
                                            placeholder="e.g., 245 kcal"
                                            value={f.value}
                                            onChange={(e) =>
                                                nutrition.updateField(
                                                    i,
                                                    "value",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="pf-remove-btn"
                                            onClick={() =>
                                                nutrition.removeField(i)
                                            }
                                            aria-label="Remove"
                                        >
                                            <span className="material-symbols-outlined">
                                                close
                                            </span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            className="pf-add-field-btn"
                            onClick={nutrition.addField}
                        >
                            <span className="material-symbols-outlined">
                                add
                            </span>
                            Add Nutrition Field
                        </button>

                        <div className="pf-field pf-mt-2">
                            <label>Ingredients</label>
                            <textarea
                                className="pf-input pf-textarea"
                                value={form.ingredients}
                                onChange={(e) =>
                                    setField("ingredients", e.target.value)
                                }
                                placeholder="e.g., Apples, Vitamin C..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="pf-row pf-row-full">
                        <div className="pf-card">
                            <h3 className="pf-card-title">
                                <span className="material-symbols-outlined">
                                    ac_unit
                                </span>
                                Storage Notes
                            </h3>

                            {storage.fields.length === 0 ? (
                                <p className="pf-empty-hint">
                                    No storage notes. Add fields like "Storage",
                                    "Shelf Life".
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
                                                onChange={(e) =>
                                                    storage.updateField(
                                                        i,
                                                        "key",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <input
                                                type="text"
                                                className="pf-input"
                                                placeholder="e.g., Cool and dry"
                                                value={f.value}
                                                onChange={(e) =>
                                                    storage.updateField(
                                                        i,
                                                        "value",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="pf-remove-btn"
                                                onClick={() =>
                                                    storage.removeField(i)
                                                }
                                                aria-label="Remove"
                                            >
                                                <span className="material-symbols-outlined">
                                                    close
                                                </span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                className="pf-add-field-btn"
                                onClick={storage.addField}
                            >
                                <span className="material-symbols-outlined">
                                    add
                                </span>
                                Add Storage Field
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Footer ═══════════ */}
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
                                <span className="material-symbols-outlined">
                                    check
                                </span>
                                {isEdit ? "Save Changes" : "Create Product"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}