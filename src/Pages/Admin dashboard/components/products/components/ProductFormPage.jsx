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
import RichTextEditor from "./RichTextEditor";
import "./ProductFormPage.css";

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */
const EMPTY_FORM = {
    name: "",
    manufacturer: "",
    origin_country: "",
    price: "",
    tax_rate: 7,
    weight: "",
    weight_unit: "kg",
    gross_weight: "",
    pack_pieces: 1,
    piece_weight: "",
    piece_gross_weight: "",
    pack_extra_weight: "",
    deposit_per_piece: "",
    deposit_amount: "",
    deposit_tax_rate: "",
    category_id: "",
    subcategory_id: "",
    product_number: "",
    description: "",
    ingredients: "",
    image: "",
    product_type: "unit_based",
};

const TAX_RATE_OPTIONS = [
    { value: 7, icon: "🥗", label: "7% — Ermäßigt" },
    { value: 19, icon: "📦", label: "19% — Regelsatz" },
];

const WEIGHT_UNITS = ["kg", "g", "L", "ml"];

const WEIGHT_META = {
    unit_based: {
        label: "Nettogewicht / Füllmenge",
        hint: "Inhalt des Produkts (z.B. Abtropfgewicht). Wird dem Kunden angezeigt und bestimmt den Grundpreis.",
        placeholder: "z.B. 0,35",
    },
    weight_based: {
        label: "Nettogewicht",
        hint: "Bestimmt den Preis — z.B. 0,2 kg für eine Banane.",
        placeholder: "z.B. 0,2",
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

    const [activeTab, setActiveTab] = useState("basics");

    const [form, setForm] = useState(() => {
        if (isEdit && product) {
            return {
                name: product.name || "",
                manufacturer: product.manufacturer || "",
                origin_country: product.origin_country || "",
                price: product.total_price != null ? String(product.total_price) : "",
                tax_rate: product.tax_rate ?? 7,
                weight: product.weight ?? "",
                weight_unit: WEIGHT_UNITS.includes(product.weight_unit) ? product.weight_unit : "kg",
                gross_weight: product.gross_weight ?? "",
                pack_pieces: product.pack_pieces ?? 1,
                piece_weight: product.piece_weight ?? "",
                piece_gross_weight: product.piece_gross_weight ?? "",
                pack_extra_weight: product.pack_extra_weight ? product.pack_extra_weight : "",
                deposit_per_piece: product.pack_pieces > 1 && product.deposit_amount
                    ? Number((product.deposit_amount / product.pack_pieces).toFixed(4))
                    : "",
                deposit_amount: product.deposit_amount ?? "",
                deposit_tax_rate: product.deposit_tax_rate ?? "",
                category_id: product.category_id || "",
                subcategory_id: product.subcategory_id || "",
                product_number: product.product_number ?? "",
                description: product.description || "",
                ingredients: product.ingredients || "",
                image: product.image || "",
                product_type: product.product_type || "unit_based",
            };
        }
        return { ...EMPTY_FORM };
    });

    // ✅ حالة الجدول الغذائي الجديد (أعمدة وصفوف)
    const [nutritionData, setNutritionData] = useState({
        columns: ["pro 100 g", "pro Portion"],
        rows: [{ id: crypto.randomUUID(), name: "", values: ["", ""] }]
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(isEdit ? product?.image || "" : "");
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const formTopRef = useRef(null);
    const [productNumberStatus, setProductNumberStatus] = useState("idle");

    const storage = useDynamicFields(
        isEdit && product?.storage_notes ? Object.entries(product.storage_notes).map(([k, v]) => ({ key: k, value: v })) : []
    );

    const manufacturerInfo = useDynamicFields(
        isEdit && product?.manufacturer_info ? Object.entries(product.manufacturer_info).map(([k, v]) => ({ key: k, value: v })) : []
    );

    // ✅ تحميل بيانات التغذية (يدعم الصيغة القديمة والجديدة)
    useEffect(() => {
        if (isEdit && product?.nutrition_facts) {
            const nf = product.nutrition_facts;
            if (nf._type === 'nutrition_table' && nf.columns && nf.rows) {
                // الصيغة الجديدة
                setNutritionData({
                    columns: nf.columns,
                    rows: nf.rows.map(r => ({ ...r, id: crypto.randomUUID() }))
                });
            } else if (Object.keys(nf).length > 0) {
                // تحويل الصيغة القديمة إلى جدول
                const cols = [product.nutrition_basis || "pro 100 g", "Wert"];
                const rows = Object.entries(nf).map(([k, v]) => ({
                    id: crypto.randomUUID(),
                    name: k,
                    values: [v, ""]
                }));
                setNutritionData({ columns: cols, rows });
            }
        }
    }, [isEdit, product]);

    const bruttoPrice = parseFloat(form.price) || 0;
    const nettoPrice = useMemo(() => {
        const t = parseFloat(form.tax_rate) || 0;
        return t > 0 ? bruttoPrice / (1 + t / 100) : bruttoPrice;
    }, [bruttoPrice, form.tax_rate]);
    const taxAmount = Math.max(0, bruttoPrice - nettoPrice);

    const filteredSubs = useMemo(
        () => subcategories.filter((s) => Number(s.category_id) === Number(form.category_id)),
        [subcategories, form.category_id]
    );
    const hasImage = Boolean(selectedFile) || Boolean(form.image.trim());
    const weightMeta = WEIGHT_META[form.product_type] || WEIGHT_META.unit_based;

    /* ═══ Mehrstückpackung (z.B. 6er Pack Wasser) ═══ */
    const packPieces = Math.max(1, parseInt(form.pack_pieces) || 1);
    const isPack = packPieces > 1;
    const toBase = (w, unit) => {
        const u = String(unit || "kg").toLowerCase();
        return u === "g" || u === "ml" ? w / 1000 : w;
    };
    const packTotals = useMemo(() => {
        const pw = parseFloat(form.piece_weight) || 0;
        const pg = parseFloat(form.piece_gross_weight) || 0;
        const extra = parseFloat(form.pack_extra_weight) || 0;
        const dep = parseFloat(form.deposit_per_piece) || 0;
        return {
            net: packPieces * pw,
            gross: pg > 0 ? packPieces * pg + extra : 0,
            deposit: packPieces * dep,
        };
    }, [packPieces, form.piece_weight, form.piece_gross_weight, form.pack_extra_weight, form.deposit_per_piece]);

    // عبوة: الإجماليات تُشتق تلقائيًا هنا، والخادم يعيد حسابها أيضًا (trigger)
    useEffect(() => {
        if (!isPack) return;
        setForm((prev) => ({
            ...prev,
            weight: packTotals.net > 0 ? String(+packTotals.net.toFixed(3)) : "",
            gross_weight: packTotals.gross > 0 ? String(+packTotals.gross.toFixed(3)) : "",
            deposit_amount: packTotals.deposit > 0 ? String(+packTotals.deposit.toFixed(2)) : prev.deposit_amount,
        }));
    }, [isPack, packTotals]);

    useEffect(() => {
        const num = String(form.product_number || "").trim();
        if (!num) { setProductNumberStatus("idle"); return; }
        if (!/^\d+$/.test(num) || Number(num) <= 0) { setProductNumberStatus("invalid"); return; }
        setProductNumberStatus("checking");
        const timer = setTimeout(async () => {
            try {
                const { data, error } = await supabase.from("products").select("id").eq("product_number", Number(num)).maybeSingle();
                if (error && error.code !== "PGRST116") throw error;
                const isSelf = isEdit && data?.id === product?.id;
                setProductNumberStatus(data && !isSelf ? "taken" : "available");
            } catch (err) {
                setProductNumberStatus("idle");
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [form.product_number, isEdit, product?.id]);

    const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
    const handleProductTypeChange = (type) => setForm((prev) => ({ ...prev, product_type: type }));

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
        setNutritionData({ columns: ["pro 100 g", "pro Portion"], rows: [{ id: crypto.randomUUID(), name: "", values: ["", ""] }] });
        storage.resetFields();
        manufacturerInfo.resetFields();
        setProductNumberStatus("idle");
        setActiveTab("basics");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ✅ دوال التحكم في جدول التغذية
    const handleAddColumn = () => {
        setNutritionData(prev => ({
            ...prev,
            columns: [...prev.columns, "Neue Spalte"],
            rows: prev.rows.map(r => ({ ...r, values: [...r.values, ""] }))
        }));
    };

    const handleRemoveColumn = (colIndex) => {
        if (nutritionData.columns.length <= 1) return;
        setNutritionData(prev => ({
            ...prev,
            columns: prev.columns.filter((_, i) => i !== colIndex),
            rows: prev.rows.map(r => ({ ...r, values: r.values.filter((_, i) => i !== colIndex) }))
        }));
    };

    const handleColumnNameChange = (colIndex, newName) => {
        setNutritionData(prev => {
            const newCols = [...prev.columns];
            newCols[colIndex] = newName;
            return { ...prev, columns: newCols };
        });
    };

    const handleAddRow = () => {
        setNutritionData(prev => ({
            ...prev,
            rows: [...prev.rows, { id: crypto.randomUUID(), name: "", values: new Array(prev.columns.length).fill("") }]
        }));
    };

    const handleRemoveRow = (rowId) => {
        setNutritionData(prev => ({
            ...prev,
            rows: prev.rows.filter(r => r.id !== rowId)
        }));
    };

    const handleRowNameChange = (rowId, newName) => {
        setNutritionData(prev => ({
            ...prev,
            rows: prev.rows.map(r => r.id === rowId ? { ...r, name: newName } : r)
        }));
    };

    const handleRowValueChange = (rowId, colIndex, newValue) => {
        setNutritionData(prev => ({
            ...prev,
            rows: prev.rows.map(r => {
                if (r.id === rowId) {
                    const newValues = [...r.values];
                    newValues[colIndex] = newValue;
                    return { ...r, values: newValues };
                }
                return r;
            })
        }));
    };

    const validate = () => {
        if (!hasImage) return "Product image is required.";
        if (!form.name.trim()) return "Name is required.";
        const num = String(form.product_number || "").trim();
        if (!num || !/^\d+$/.test(num) || Number(num) <= 0) return "Product Number must be a positive integer.";
        if (productNumberStatus === "taken") return `Product Number ${num} is already in use.`;
        if (productNumberStatus === "checking") return "Product Number verification in progress. Please wait.";
        if (!form.category_id) return "Category is required.";
        if (form.price === "" || isNaN(parseFloat(form.price)) || bruttoPrice <= 0) return "Bruttopreis muss größer als 0 sein.";
        if (form.weight === "" || isNaN(parseFloat(form.weight)) || parseFloat(form.weight) <= 0) return "Gewicht ist erforderlich.";
        if (![7, 19].includes(Number(form.tax_rate))) return "Ungültiger Steuersatz. Nur 7% oder 19% zulässig.";

        if (isPack) {
            if (packPieces > 200) return "Stück pro Packung: maximal 200.";
            if (!(parseFloat(form.piece_weight) > 0)) return "Inhalt pro Stück ist erforderlich.";
            if (!(parseFloat(form.piece_gross_weight) > 0)) return "Versandgewicht pro Stück (kg) ist erforderlich.";
            if (parseFloat(form.pack_extra_weight) < 0) return "Zusatzgewicht darf nicht negativ sein.";
        }
        const grossKg = parseFloat(form.gross_weight);
        if (form.gross_weight === "" || isNaN(grossKg) || grossKg <= 0) {
            return "Versandgewicht (Brutto, in kg) ist erforderlich.";
        }
        if (grossKg > 200) return "Versandgewicht unplausibel (> 200 kg) — bitte in kg eingeben, nicht in g.";
        const netBase = toBase(parseFloat(form.weight) || 0, form.weight_unit);
        const unitLower = String(form.weight_unit).toLowerCase();
        if ((unitLower === "kg" || unitLower === "g") && grossKg < netBase * 0.999) {
            return `Versandgewicht (${grossKg} kg) darf nicht kleiner als das Nettogewicht (${netBase} kg) sein.`;
        }
        if ((unitLower === "l" || unitLower === "ml") && grossKg < netBase * 0.5) {
            return "Versandgewicht ist für diese Füllmenge unplausibel klein.";
        }
        if (form.deposit_amount !== "" && (isNaN(parseFloat(form.deposit_amount)) || parseFloat(form.deposit_amount) < 0)) {
            return "Pfand darf nicht negativ sein.";
        }
        if (parseFloat(form.deposit_amount) > 0 && ![7, 19].includes(Number(form.deposit_tax_rate || form.tax_rate))) {
            return "Pfand-MwSt. muss 7% oder 19% sein.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) return toast.error(err);

        setSaving(true);
        const toastId = toast.loading(isEdit ? "Updating product..." : "Creating product...");

        try {
            let imageUrl = form.image;
            if (selectedFile) {
                const up = await uploadProductImage(selectedFile);
                if (!up.success) throw new Error(up.error);
                imageUrl = up.publicUrl;
            }

            // تجهيز بيانات التغذية
            const nutritionPayload = {
                _type: "nutrition_table",
                columns: nutritionData.columns,
                rows: nutritionData.rows.map(({ id, ...rest }) => rest)
            };

            const payload = {
                name: form.name.trim(),
                manufacturer: form.manufacturer.trim() || null,
                manufacturer_info: manufacturerInfo.toObject(),
                origin_country: form.origin_country.trim() || null,
                image: imageUrl || null,
                description: form.description.trim() || null,
                price: Number(nettoPrice.toFixed(4)),
                total_price: Number(bruttoPrice.toFixed(2)),
                tax_rate: Number(form.tax_rate),
                weight: parseFloat(form.weight) || 0,
                weight_unit: form.weight_unit,
                gross_weight: parseFloat(form.gross_weight),
                pack_pieces: packPieces,
                piece_weight: isPack ? parseFloat(form.piece_weight) : null,
                piece_gross_weight: isPack ? parseFloat(form.piece_gross_weight) : null,
                pack_extra_weight: isPack ? (parseFloat(form.pack_extra_weight) || 0) : 0,
                deposit_amount: parseFloat(form.deposit_amount) || 0,
                deposit_tax_rate: parseFloat(form.deposit_amount) > 0 ? (parseFloat(form.deposit_tax_rate) || Number(form.tax_rate)) : 0,
                category_id: Number(form.category_id),
                subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
                product_number: Number(form.product_number),
                ingredients: form.ingredients.trim() || null,
                nutrition_facts: nutritionPayload,
                nutrition_basis: nutritionData.columns[0] || "100 g", // للتوافق مع الإصدارات القديمة
                storage_notes: storage.toObject(),
                product_type: form.product_type,
            };

            const res = isEdit ? await updateProductAPI(product.id, payload) : await addProductAPI(payload);
            if (!res.success) throw new Error(res.error);

            if (isEdit) {
                toast.success("Product updated successfully", { id: toastId });
                onSaved?.();
            } else {
                toast.success(`✅ "${payload.name}" added successfully`, { id: toastId, duration: 4000 });
                resetForm();
                formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to save product", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pf-page" ref={formTopRef}>
            <div className="pf-header">
                <button type="button" className="pf-back-btn" onClick={onBack}>
                    <span className="material-symbols-outlined">arrow_back</span> Back to Products
                </button>
                <div className="pf-header-title">
                    <span className="material-symbols-outlined">{isEdit ? "edit" : "add_box"}</span>
                    <h2>{isEdit ? "Edit Product" : "Add New Product"}</h2>
                </div>
            </div>

            <div className="pf-tabs-container">
                <button
                    type="button"
                    className={`pf-tab-btn ${activeTab === "basics" ? "active" : ""}`}
                    onClick={() => setActiveTab("basics")}
                >
                    <span className="material-symbols-outlined">inventory_2</span>
                    Basics
                </button>
                <button
                    type="button"
                    className={`pf-tab-btn ${activeTab === "details" ? "active" : ""}`}
                    onClick={() => setActiveTab("details")}
                >
                    <span className="material-symbols-outlined">info</span>
                    Details & Hersteller
                </button>
            </div>

            <form className="pf-form" onSubmit={handleSubmit} noValidate>

                {activeTab === "basics" && (
                    <div className="pf-tab-content">
                        {/* Row 1: Image & Basic Info */}
                        <div className="pf-row pf-row-wide-right">
                            <div className="pf-card pf-card-image">
                                <h3 className="pf-card-title"><span className="material-symbols-outlined">image</span> Produktbild <span className="pf-required">*</span></h3>
                                <div className="pf-image-area">
                                    <div className={`pf-image-box ${!hasImage ? "is-required" : ""}`}>
                                        {previewUrl ? <img src={previewUrl} alt="Vorschau" /> : <span className="material-symbols-outlined pf-image-placeholder">add_photo_alternate</span>}
                                    </div>
                                    <button type="button" className="pf-upload-btn" onClick={() => fileInputRef.current?.click()}>
                                        <span className="material-symbols-outlined">photo_camera</span>
                                        {previewUrl ? "Bild ändern" : "Bild hochladen"}
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                                    <div className="pf-or">— ODER —</div>
                                    <input type="text" className="pf-input" placeholder="Bild-URL einfügen..." value={form.image} onChange={(e) => { setField("image", e.target.value); setPreviewUrl(e.target.value); setSelectedFile(null); }} />
                                </div>
                            </div>

                            <div className="pf-card">
                                <h3 className="pf-card-title"><span className="material-symbols-outlined">info</span> Basic Information</h3>
                                <div className="pf-field">
                                    <label>Product Name *</label>
                                    <input type="text" className="pf-input" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g., Fresh Apples" />
                                </div>
                                <div className="pf-grid-2">
                                    <div className="pf-field">
                                        <label>
                                            Product Number *
                                            {productNumberStatus === "checking" && <small className="pf-status-hint"> — Checking...</small>}
                                            {productNumberStatus === "available" && <small className="pf-status-hint pf-status-ok"> ✓ Available</small>}
                                            {productNumberStatus === "taken" && <small className="pf-status-hint pf-status-error"> ✕ Already in use</small>}
                                            {productNumberStatus === "invalid" && <small className="pf-status-hint pf-status-error"> ✕ Positive number required</small>}
                                        </label>
                                        <input type="number" className={`pf-input ${productNumberStatus === "taken" || productNumberStatus === "invalid" ? "has-error" : ""}`} value={form.product_number} onChange={(e) => setField("product_number", e.target.value)} placeholder="e.g., 1001" min="1" />
                                    </div>
                                    <div className="pf-field">
                                        <label>Category *</label>
                                        <select className="pf-input" value={form.category_id} onChange={(e) => { setField("category_id", e.target.value); setField("subcategory_id", ""); }}>
                                            <option value="">Select category...</option>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="pf-field">
                                    <label>Subcategory</label>
                                    <select className="pf-input" value={form.subcategory_id} onChange={(e) => setField("subcategory_id", e.target.value)} disabled={!form.category_id || filteredSubs.length === 0}>
                                        <option value="">{!form.category_id ? "Select a category first" : filteredSubs.length === 0 ? "No subcategories available" : "None"}</option>
                                        {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div className="pf-field">
                                    <label>Produktbeschreibung</label>
                                    <RichTextEditor
                                        value={form.description}
                                        onChange={(html) => setField("description", html)}
                                        placeholder="Schreiben Sie hier die Produktbeschreibung..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Type & Pricing */}
                        <div className="pf-row pf-row-wide-right">
                            <div className="pf-card">
                                <h3 className="pf-card-title"><span className="material-symbols-outlined">tune</span> Produkt-Typ</h3>
                                <p className="pf-hint">Legt fest, wie der Preis interpretiert wird.</p>
                                <div className="pf-type-options pf-type-options-stack">
                                    <button type="button" className={`pf-type-btn ${form.product_type === "unit_based" ? "active" : ""}`} onClick={() => handleProductTypeChange("unit_based")}>
                                        <span className="material-symbols-outlined">inventory_2</span>
                                        <div><strong>Stückware</strong><small>Fester Preis pro Stück</small></div>
                                    </button>
                                    <button type="button" className={`pf-type-btn ${form.product_type === "weight_based" ? "active" : ""}`} onClick={() => handleProductTypeChange("weight_based")}>
                                        <span className="material-symbols-outlined">scale</span>
                                        <div><strong>Gewichtsware</strong><small>Preis nach tatsächlichem Gewicht</small></div>
                                    </button>
                                </div>
                            </div>

                            <div className="pf-card">
                                <h3 className="pf-card-title"><span className="material-symbols-outlined">euro</span> Pricing</h3>
                                <div className="pf-grid-2">
                                    <div className="pf-field">
                                        <label>Bruttopreis (€) *</label>
                                        <input type="number" step="0.01" min="0" className="pf-input" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="pf-field">
                                        <label>Steuersatz *</label>
                                        <select className="pf-input" value={form.tax_rate} onChange={(e) => setField("tax_rate", Number(e.target.value))}>
                                            {TAX_RATE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="pf-price-breakdown">
                                    <div className="pf-price-row"><span>Nettopreis</span><strong>€{nettoPrice.toFixed(2)}</strong></div>
                                    <div className="pf-price-row pf-price-row-tax"><span>MwSt. ({form.tax_rate}%)</span><span>€{taxAmount.toFixed(2)}</span></div>
                                    <div className="pf-price-row pf-price-row-total"><span>Bruttopreis</span><strong>€{bruttoPrice.toFixed(2)}</strong></div>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Weights & Pfand */}
                        <div className="pf-row pf-row-full">
                            <div className="pf-card">
                                <h3 className="pf-card-title"><span className="material-symbols-outlined">scale</span> Gewicht & Pfand</h3>

                                <div className="pf-section-title">Gewichte</div>

                                {/* Mehrstückpackung */}
                                <div className="pf-field">
                                    <label>Stück pro Packung</label>
                                    <input type="number" step="1" min="1" max="200" className="pf-input" value={form.pack_pieces} onChange={(e) => setField("pack_pieces", e.target.value)} />
                                    <small className="pf-hint">1 = normales Produkt. Für ein 6er-Pack Wasser: 6.</small>
                                </div>

                                {isPack && (
                                    <div style={{ marginTop: 12, padding: 14, border: "1px dashed #b9e769", borderRadius: 12, background: "#fafcfb" }}>
                                        <div className="pf-grid-2">
                                            <div className="pf-field">
                                                <label>Inhalt pro Stück ({form.weight_unit}) <span className="pf-required">*</span></label>
                                                <input type="number" step="0.001" min="0" className="pf-input" value={form.piece_weight} onChange={(e) => setField("piece_weight", e.target.value)} placeholder="z.B. 1,5" />
                                            </div>
                                            <div className="pf-field">
                                                <label>Versandgewicht pro Stück [kg] <span className="pf-required">*</span></label>
                                                <input type="number" step="0.001" min="0" className="pf-input" value={form.piece_gross_weight} onChange={(e) => setField("piece_gross_weight", e.target.value)} placeholder="z.B. 1,55" />
                                            </div>
                                        </div>
                                        <div className="pf-grid-2 pf-mt-2">
                                            <div className="pf-field">
                                                <label>Zusatzgewicht Verpackung/Folie [kg]</label>
                                                <input type="number" step="0.001" min="0" className="pf-input" value={form.pack_extra_weight} onChange={(e) => setField("pack_extra_weight", e.target.value)} placeholder="z.B. 0,05" />
                                            </div>
                                            <div className="pf-field">
                                                <label>Pfand pro Stück (€)</label>
                                                <input type="number" step="0.01" min="0" className="pf-input" value={form.deposit_per_piece} onChange={(e) => setField("deposit_per_piece", e.target.value)} placeholder="z.B. 0,25" />
                                            </div>
                                        </div>
                                        <div className="pf-price-breakdown pf-mt-2" style={{ padding: "12px 16px", marginTop: 12 }}>
                                            <div className="pf-price-row">
                                                <span>Packung:</span>
                                                <strong>{packPieces} × {parseFloat(form.piece_weight) || 0} {form.weight_unit}</strong>
                                            </div>
                                            <div className="pf-price-row">
                                                <span>Gesamtinhalt (netto, für den Kunden):</span>
                                                <strong>{(+packTotals.net.toFixed(3))} {form.weight_unit}</strong>
                                            </div>
                                            <div className="pf-price-row">
                                                <span>Versandgewicht gesamt (intern):</span>
                                                <strong>{(+packTotals.gross.toFixed(3))} kg</strong>
                                            </div>
                                            {packTotals.deposit > 0 && (
                                                <div className="pf-price-row">
                                                    <span>Pfand gesamt:</span>
                                                    <strong>€{packTotals.deposit.toFixed(2)}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pf-grid-2 pf-mt-2">
                                    <div className="pf-field">
                                        <label>{isPack ? "Gesamtinhalt (berechnet)" : weightMeta.label} <span className="pf-required">*</span></label>
                                        <input type="number" step="0.001" min="0" className="pf-input" value={form.weight} onChange={(e) => setField("weight", e.target.value)} placeholder={weightMeta.placeholder} disabled={isPack} />
                                    </div>
                                    <div className="pf-field">
                                        <label>Einheit</label>
                                        <select className="pf-input" value={form.weight_unit} onChange={(e) => setField("weight_unit", e.target.value)}>
                                            {WEIGHT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {!isPack && (
                                    <small className="pf-hint">{weightMeta.hint}</small>
                                )}

                                <div className="pf-field pf-mt-2">
                                    <label>Versandgewicht (Brutto) [kg] <span className="pf-required">*</span></label>
                                    <input
                                        type="number" step="0.001" min="0" className="pf-input"
                                        value={form.gross_weight}
                                        onChange={(e) => setField("gross_weight", e.target.value)}
                                        disabled={isPack}
                                        placeholder={toBase(parseFloat(form.weight) || 0, form.weight_unit) > 0
                                            ? `mind. ${toBase(parseFloat(form.weight) || 0, form.weight_unit).toFixed(3)} kg`
                                            : "z.B. 0,450"}
                                    />
                                    <small className="pf-hint">
                                        Produkt + Flüssigkeit + Glas/Verpackung — immer in kg. Nur für Versand/Fahrer, wird dem Kunden nie angezeigt.
                                    </small>
                                </div>

                                <div className="pf-section-title pf-mt-4">Pfand</div>
                                <div className="pf-grid-2">
                                    <div className="pf-field">
                                        <label>Pfand Brutto (€)</label>
                                        <input type="number" step="0.01" min="0" className="pf-input" value={form.deposit_amount} onChange={(e) => setField("deposit_amount", e.target.value)} placeholder="z.B. 0.25" readOnly={isPack && parseFloat(form.deposit_per_piece) > 0} />
                                    </div>
                                    <div className="pf-field">
                                        <label>Pfand MwSt. (%)</label>
                                        <select className="pf-input" value={form.deposit_tax_rate || form.tax_rate || 7} onChange={(e) => setField("deposit_tax_rate", Number(e.target.value))} disabled={!form.deposit_amount || parseFloat(form.deposit_amount) <= 0}>
                                            {TAX_RATE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {parseFloat(form.deposit_amount) > 0 && (
                                    <div className="pf-price-breakdown pf-mt-2" style={{ padding: '12px 16px', marginTop: '12px' }}>
                                        <div className="pf-price-row">
                                            <span>Netto Pfand (berechnet):</span>
                                            <strong style={{ color: "var(--primary-color)" }}>
                                                €{(parseFloat(form.deposit_amount) / (1 + (parseFloat(form.deposit_tax_rate) || parseFloat(form.tax_rate) || 0) / 100)).toFixed(2)}
                                            </strong>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "details" && (
                    <div className="pf-tab-content">
                        {/* Hersteller */}
                        <div className="pf-row pf-row-full">
                            <div className="pf-card">
                                <h3 className="pf-card-title"><span className="material-symbols-outlined">factory</span> Hersteller & Produktinformationen</h3>
                                <div className="pf-grid-2">
                                    <div className="pf-field">
                                        <label>Hersteller</label>
                                        <input type="text" className="pf-input" value={form.manufacturer} onChange={(e) => setField("manufacturer", e.target.value)} placeholder="z.B. Nestlé" />
                                    </div>
                                    <div className="pf-field">
                                        <label>Herkunftsland</label>
                                        <input type="text" className="pf-input" value={form.origin_country} onChange={(e) => setField("origin_country", e.target.value)} placeholder="z.B. Deutschland" />
                                    </div>
                                </div>

                                <div className="pf-field pf-mt-4">
                                    <label>Herstellerinformationen</label>
                                    {manufacturerInfo.fields.length === 0 ? (
                                        <p className="pf-empty-hint">Keine Informationen.</p>
                                    ) : (
                                        <div className="pf-dynamic-list">
                                            {manufacturerInfo.fields.map((f, i) => (
                                                <div key={i} className="pf-dynamic-row">
                                                    <input
                                                        type="text"
                                                        className="pf-input pf-input-key"
                                                        placeholder="z.B. Adresse"
                                                        value={f.key}
                                                        onChange={(e) => manufacturerInfo.updateField(i, "key", e.target.value)}
                                                    />
                                                    <span className="pf-dynamic-separator">:</span>
                                                    <input
                                                        type="text"
                                                        className="pf-input pf-input-value"
                                                        placeholder="z.B. Hauptstraße 1, Berlin"
                                                        value={f.value}
                                                        onChange={(e) => manufacturerInfo.updateField(i, "value", e.target.value)}
                                                    />
                                                    <button type="button" className="pf-remove-btn" onClick={() => manufacturerInfo.removeField(i)}>
                                                        <span className="material-symbols-outlined">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button type="button" className="pf-add-field-btn" onClick={manufacturerInfo.addField}>
                                        <span className="material-symbols-outlined">add</span> Add Info Field
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ✅ Nutrition - تصميم الجدول المرن الجديد */}
                        <div className="pf-row pf-row-full">
                            <div className="pf-card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--secondary-color)", paddingBottom: "0.75rem" }}>
                                    <h3 className="pf-card-title" style={{ margin: 0, border: 0, padding: 0 }}>
                                        <span className="material-symbols-outlined">nutrition</span> Nutrition Facts
                                    </h3>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button type="button" className="pf-btn pf-btn-secondary" onClick={handleAddColumn} style={{ padding: "8px 12px", minHeight: "auto", fontSize: "12px" }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>view_column</span> Add Column
                                        </button>
                                        <button type="button" className="pf-btn pf-btn-secondary" onClick={handleAddRow} style={{ padding: "8px 12px", minHeight: "auto", fontSize: "12px" }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_row</span> Add Row
                                        </button>
                                    </div>
                                </div>

                                <div className="nutrition-admin-wrapper">
                                    {/* Header Row: Columns */}
                                    <div className="nutrition-admin-row header-row">
                                        <div className="nutrition-admin-cell name-col">
                                            <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>Nährwert</span>
                                        </div>
                                        {nutritionData.columns.map((col, colIndex) => (
                                            <div key={`col-${colIndex}`} className="nutrition-admin-cell">
                                                <input
                                                    type="text"
                                                    className="pf-input"
                                                    value={col}
                                                    onChange={(e) => handleColumnNameChange(colIndex, e.target.value)}
                                                    placeholder="z.B. pro 100g"
                                                    style={{ fontWeight: "bold", fontSize: "13px" }}
                                                />
                                                {nutritionData.columns.length > 1 && (
                                                    <button type="button" className="pf-remove-btn" onClick={() => handleRemoveColumn(colIndex)} style={{ width: "28px", height: "28px", padding: 0, flexShrink: 0 }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="nutrition-admin-cell action-col"></div>
                                    </div>

                                    {/* Data Rows */}
                                    {nutritionData.rows.map((row) => (
                                        <div key={row.id} className="nutrition-admin-row">
                                            <div className="nutrition-admin-cell name-col">
                                                <input
                                                    type="text"
                                                    className="pf-input"
                                                    value={row.name}
                                                    onChange={(e) => handleRowNameChange(row.id, e.target.value)}
                                                    placeholder="z.B. Energie"
                                                    style={{ fontWeight: "bold" }}
                                                />
                                            </div>
                                            {row.values.map((val, colIndex) => (
                                                <div key={`${row.id}-${colIndex}`} className="nutrition-admin-cell">
                                                    <input
                                                        type="text"
                                                        className="pf-input"
                                                        value={val}
                                                        onChange={(e) => handleRowValueChange(row.id, colIndex, e.target.value)}
                                                        placeholder="Wert"
                                                    />
                                                </div>
                                            ))}
                                            <div className="nutrition-admin-cell action-col">
                                                <button type="button" className="pf-remove-btn" onClick={() => handleRemoveRow(row.id)} style={{ width: "32px", height: "32px", padding: 0 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pf-field pf-mt-2" style={{ marginTop: "1.5rem" }}>
                                    <label>Zutaten & Allergene</label>
                                    <textarea className="pf-input pf-textarea" value={form.ingredients} onChange={(e) => setField("ingredients", e.target.value)} placeholder="e.g., Apples, Vitamin C..." rows={3} />
                                </div>
                            </div>
                        </div>

                        {/* Storage */}
                        <div className="pf-row pf-row-full">
                            <div className="pf-card">
                                <h3 className="pf-card-title"><span className="material-symbols-outlined">ac_unit</span> Storage Notes</h3>
                                {storage.fields.length === 0 ? <p className="pf-empty-hint">No storage notes.</p> : (
                                    <div className="pf-dynamic-list">
                                        {storage.fields.map((f, i) => (
                                            <div key={i} className="pf-dynamic-row">
                                                <input type="text" className="pf-input pf-input-key" placeholder="e.g., Storage" value={f.key} onChange={(e) => storage.updateField(i, "key", e.target.value)} />
                                                <span className="pf-dynamic-separator">:</span>
                                                <input type="text" className="pf-input pf-input-value" placeholder="e.g., Cool and dry" value={f.value} onChange={(e) => storage.updateField(i, "value", e.target.value)} />
                                                <button type="button" className="pf-remove-btn" onClick={() => storage.removeField(i)}><span className="material-symbols-outlined">close</span></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button type="button" className="pf-add-field-btn" onClick={storage.addField}><span className="material-symbols-outlined">add</span> Add Storage Field</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pf-footer">
                    <button type="button" className="pf-btn pf-btn-secondary" onClick={isEdit ? onBack : resetForm} disabled={saving}>
                        {isEdit ? "Cancel" : "Clear Form"}
                    </button>
                    <button type="submit" className="pf-btn pf-btn-primary" disabled={saving}>
                        {saving ? <><span className="pf-spinner" /> Saving...</> : <><span className="material-symbols-outlined">check</span> {isEdit ? "Save Changes" : "Create Product"}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}