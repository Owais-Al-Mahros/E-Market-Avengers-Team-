import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useProducts } from "../../../../../context/ProductContext";
import { useCategories } from "../../../../../context/CategoryContext";
import { useSubcategories } from "../../../../../context/SubcategoryContext";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import "./CategoriesView.css";

/* ══════════════════════════════════════════════════════
   🎯 Category Accordion Item
══════════════════════════════════════════════════════ */
function CategoryAccordionItem({
    category,
    isExpanded,
    onToggle,
    onRefreshCategories,
    onDeleteClick,
    updateCategory,
    addSubcategory,
    updateSubCategory,
    deleteSubcategory,
}) {
    const { fetchSubcategoriesWithCounts } = useProducts();

    // ─── Category edit ───
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(category.name);
    const [editFile, setEditFile] = useState(null);
    const [editPreview, setEditPreview] = useState(category.image || "");
    const editFileRef = useRef(null);

    // ─── Subcategories ───
    const [subs, setSubs] = useState([]);
    const [subsLoading, setSubsLoading] = useState(false);

    // ─── Add sub ───
    const [newSubName, setNewSubName] = useState("");
    const [newSubFile, setNewSubFile] = useState(null);
    const [newSubPreview, setNewSubPreview] = useState("");
    const newSubFileRef = useRef(null);
    const [addingSub, setAddingSub] = useState(false);

    // ─── Edit sub ───
    const [editingSub, setEditingSub] = useState(null);
    const editSubFileRef = useRef(null);

    const [saving, setSaving] = useState(false);

    // Load subcategories on expand
    useEffect(() => {
        if (!isExpanded) return;
        let cancelled = false;
        (async () => {
            setSubsLoading(true);
            const data = await fetchSubcategoriesWithCounts(category.id);
            if (!cancelled) setSubs(data);
            setSubsLoading(false);
        })();
        return () => { cancelled = true; };
    }, [isExpanded, category.id, fetchSubcategoriesWithCounts]);

    // Reset internal state on collapse
    useEffect(() => {
        if (!isExpanded) {
            setIsEditing(false);
            setEditFile(null);
            setEditPreview(category.image || "");
            setEditName(category.name);
            setNewSubName("");
            setNewSubFile(null);
            setNewSubPreview("");
            setEditingSub(null);
        }
    }, [isExpanded, category.image, category.name]);

    /* ═══════ Category Edit ═══════ */
    const startEditCategory = (e) => {
        e.stopPropagation();
        setEditName(category.name);
        setEditPreview(category.image || "");
        setEditFile(null);
        setIsEditing(true);
    };

    const cancelEditCategory = () => {
        setIsEditing(false);
        setEditFile(null);
        setEditPreview(category.image || "");
        setEditName(category.name);
    };

    const handleEditFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditFile(file);
        setEditPreview(URL.createObjectURL(file));
    };

    const saveEditCategory = async () => {
        const name = editName.trim();
        if (!name) return toast.error("Name required");
        setSaving(true);
        try {
            // ⚠️ نحفظ الصورة القديمة إن لم يُرفع جديد
            const res = await updateCategory(
                category.id,
                { name, image: category.image },
                editFile
            );
            if (res?.success === false) throw new Error(res.error);
            toast.success("Category updated");
            setIsEditing(false);
            setEditFile(null);
            await onRefreshCategories();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    /* ═══════ Add Subcategory ═══════ */
    const handleNewSubFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNewSubFile(file);
        setNewSubPreview(URL.createObjectURL(file));
    };

    const addNewSub = async () => {
        const name = newSubName.trim();
        if (!name) return toast.error("Name required");
        setAddingSub(true);
        try {
            const res = await addSubcategory(
                { name, category_id: category.id },
                newSubFile
            );
            if (res?.success === false) throw new Error(res.error);
            toast.success("Subcategory added");
            setNewSubName("");
            setNewSubFile(null);
            setNewSubPreview("");
            const data = await fetchSubcategoriesWithCounts(category.id);
            setSubs(data);
            await onRefreshCategories();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAddingSub(false);
        }
    };

    /* ═══════ Edit Subcategory ═══════ */
    const startEditSub = (sub) => {
        setEditingSub({
            id: sub.id,
            name: sub.name,
            image: sub.image || "",
            file: null,
            preview: sub.image || "",
        });
    };

    const cancelEditSub = () => setEditingSub(null);

    const handleEditSubFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || !editingSub) return;
        setEditingSub({
            ...editingSub,
            file,
            preview: URL.createObjectURL(file),
        });
    };

    const saveEditSub = async () => {
        if (!editingSub) return;
        const name = editingSub.name.trim();
        if (!name) return toast.error("Name required");
        setSaving(true);
        try {
            const res = await updateSubCategory(
                editingSub.id,
                { name, image: editingSub.image },
                editingSub.file
            );
            if (res?.success === false) throw new Error(res.error);
            toast.success("Subcategory updated");
            setEditingSub(null);
            const data = await fetchSubcategoriesWithCounts(category.id);
            setSubs(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    /* ═══════ Delete Subcategory ═══════ */
    const handleDeleteSub = async (sub) => {
        if (!window.confirm(`Delete "${sub.name}"?`)) return;
        try {
            await deleteSubcategory(sub.id);
            toast.success("Subcategory deleted");
            const data = await fetchSubcategoriesWithCounts(category.id);
            setSubs(data);
            await onRefreshCategories();
        } catch (err) {
            toast.error(err.message);
        }
    };

    /* ═══════ Render ═══════ */
    return (
        <div className={`cv-acc-item ${isExpanded ? "is-expanded" : ""}`}>
            {/* ═══ Header Row (View or Edit) ═══ */}
            {!isEditing ? (
                <div className="cv-acc-header" onClick={onToggle}>
                    <div className="cv-thumb">
                        {category.image ? (
                            <img src={category.image} alt={category.name} />
                        ) : (
                            <span className="material-symbols-outlined">folder</span>
                        )}
                    </div>

                    <div className="cv-acc-info">
                        <span className="cv-acc-name">{category.name}</span>
                        <div className="cv-acc-meta">
                            <span className="cv-badge">{category.subcategory_count} sub</span>
                            <span className="cv-badge cv-badge-alt">
                                {category.product_count} products
                            </span>
                        </div>
                    </div>

                    <div className="cv-acc-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="cv-icon-btn"
                            onClick={startEditCategory}
                            aria-label="Edit category"
                        >
                            <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                            type="button"
                            className="cv-icon-btn cv-danger"
                            onClick={() => onDeleteClick(category)}
                            aria-label="Delete category"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>

                    <span className="material-symbols-outlined cv-chevron">
                        {isExpanded ? "expand_less" : "expand_more"}
                    </span>
                </div>
            ) : (
                /* ═══ Edit Category Inline ═══ */
                <div className="cv-acc-edit" onClick={(e) => e.stopPropagation()}>
                    <div className="cv-acc-edit-image">
                        {editPreview ? (
                            <img src={editPreview} alt="Preview" />
                        ) : (
                            <span className="material-symbols-outlined">image</span>
                        )}
                        <button
                            type="button"
                            className="cv-img-upload-btn"
                            onClick={() => editFileRef.current?.click()}
                            aria-label="Change image"
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                        </button>
                        <input
                            ref={editFileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleEditFileChange}
                            style={{ display: "none" }}
                        />
                    </div>

                    <input
                        type="text"
                        className="cv-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditCategory();
                            if (e.key === "Escape") cancelEditCategory();
                        }}
                        autoFocus
                        placeholder="Category name"
                    />

                    <div className="cv-acc-edit-actions">
                        <button
                            className="cv-icon-btn cv-save"
                            onClick={saveEditCategory}
                            disabled={saving}
                            aria-label="Save"
                        >
                            <span className="material-symbols-outlined">check</span>
                        </button>
                        <button
                            className="cv-icon-btn"
                            onClick={cancelEditCategory}
                            disabled={saving}
                            aria-label="Cancel"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ Expanded Body ═══ */}
            {isExpanded && !isEditing && (
                <div className="cv-acc-body">
                    {/* Add Subcategory */}
                    <div className="cv-sub-add">
                        <div className="cv-sub-add-image">
                            {newSubPreview ? (
                                <img src={newSubPreview} alt="Preview" />
                            ) : (
                                <span className="material-symbols-outlined">
                                    add_photo_alternate
                                </span>
                            )}
                            <button
                                type="button"
                                className="cv-img-upload-btn cv-img-upload-sm"
                                onClick={() => newSubFileRef.current?.click()}
                                aria-label="Upload image"
                            >
                                <span className="material-symbols-outlined">photo_camera</span>
                            </button>
                            <input
                                ref={newSubFileRef}
                                type="file"
                                accept="image/*"
                                onChange={handleNewSubFileChange}
                                style={{ display: "none" }}
                            />
                        </div>

                        <input
                            type="text"
                            className="cv-input"
                            placeholder={`New subcategory for "${category.name}"...`}
                            value={newSubName}
                            onChange={(e) => setNewSubName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addNewSub()}
                        />

                        <button
                            className="cv-add-btn"
                            onClick={addNewSub}
                            disabled={addingSub || !newSubName.trim()}
                        >
                            <span className="material-symbols-outlined">add</span>
                            {addingSub ? "Adding..." : "Add Sub"}
                        </button>
                    </div>

                    {/* Subcategories List */}
                    <div className="cv-subs-list">
                        {subsLoading ? (
                            <p className="cv-empty cv-empty-sm">Loading...</p>
                        ) : subs.length === 0 ? (
                            <p className="cv-empty cv-empty-sm">
                                No subcategories yet. Add the first one above.
                            </p>
                        ) : (
                            subs.map((sub) => {
                                const isSubEditing = editingSub?.id === sub.id;

                                if (isSubEditing) {
                                    return (
                                        <div key={sub.id} className="cv-sub-item cv-sub-edit">
                                            <div className="cv-sub-thumb">
                                                {editingSub.preview ? (
                                                    <img src={editingSub.preview} alt="Preview" />
                                                ) : (
                                                    <span className="material-symbols-outlined">image</span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="cv-img-upload-btn cv-img-upload-xs"
                                                    onClick={() => editSubFileRef.current?.click()}
                                                    aria-label="Change image"
                                                >
                                                    <span className="material-symbols-outlined">
                                                        photo_camera
                                                    </span>
                                                </button>
                                                <input
                                                    ref={editSubFileRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleEditSubFileChange}
                                                    style={{ display: "none" }}
                                                />
                                            </div>

                                            <input
                                                type="text"
                                                className="cv-input"
                                                value={editingSub.name}
                                                onChange={(e) =>
                                                    setEditingSub({ ...editingSub, name: e.target.value })
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") saveEditSub();
                                                    if (e.key === "Escape") cancelEditSub();
                                                }}
                                                autoFocus
                                            />

                                            <div className="cv-sub-actions">
                                                <button
                                                    className="cv-icon-btn cv-save"
                                                    onClick={saveEditSub}
                                                    disabled={saving}
                                                    aria-label="Save"
                                                >
                                                    <span className="material-symbols-outlined">check</span>
                                                </button>
                                                <button
                                                    className="cv-icon-btn"
                                                    onClick={cancelEditSub}
                                                    disabled={saving}
                                                    aria-label="Cancel"
                                                >
                                                    <span className="material-symbols-outlined">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={sub.id} className="cv-sub-item">
                                        <div className="cv-sub-thumb">
                                            {sub.image ? (
                                                <img src={sub.image} alt={sub.name} />
                                            ) : (
                                                <span className="material-symbols-outlined">
                                                    subdirectory_arrow_right
                                                </span>
                                            )}
                                        </div>

                                        <div className="cv-sub-info">
                                            <span className="cv-sub-name">{sub.name}</span>
                                            <span className="cv-badge cv-badge-alt">
                                                {sub.product_count} products
                                            </span>
                                        </div>

                                        <div className="cv-sub-actions">
                                            <button
                                                className="cv-icon-btn"
                                                onClick={() => startEditSub(sub)}
                                                aria-label="Edit subcategory"
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button
                                                className="cv-icon-btn cv-danger"
                                                onClick={() => handleDeleteSub(sub)}
                                                aria-label="Delete subcategory"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   🎯 Main View
══════════════════════════════════════════════════════ */
export default function CategoriesView() {
    const { fetchCategoriesWithCounts, categoriesWithCounts } = useProducts();
    const { addCategory, updateCategory, deleteCategory } = useCategories();
    const { addSubcategory, updateSubCategory, deleteSubcategory } =
        useSubcategories();

    const [expandedId, setExpandedId] = useState(null);

    // Add category form
    const [newCatName, setNewCatName] = useState("");
    const [newCatFile, setNewCatFile] = useState(null);
    const [newCatPreview, setNewCatPreview] = useState("");
    const newCatFileRef = useRef(null);
    const [adding, setAdding] = useState(false);

    // Delete
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchCategoriesWithCounts();
    }, [fetchCategoriesWithCounts]);

    const handleNewCatFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNewCatFile(file);
        setNewCatPreview(URL.createObjectURL(file));
    };

    const handleAddCategory = async () => {
        const name = newCatName.trim();
        if (!name) return toast.error("Name required");
        setAdding(true);
        try {
            const res = await addCategory({ name }, newCatFile);
            if (res?.success === false) throw new Error(res.error);
            toast.success("Category added");
            setNewCatName("");
            setNewCatFile(null);
            setNewCatPreview("");
            await fetchCategoriesWithCounts();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setAdding(false);
        }
    };

    const performDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            await deleteCategory(pendingDelete.id);
            toast.success("Category deleted");
            if (expandedId === pendingDelete.id) setExpandedId(null);
            setPendingDelete(null);
            await fetchCategoriesWithCounts();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="cv-wrap">
            {/* ═══ Add New Category ═══ */}
            <section className="cv-section">
                <header className="cv-section-header">
                    <h3>
                        <span className="material-symbols-outlined">create_new_folder</span>
                        Add New Category
                    </h3>
                </header>

                <div className="cv-sub-add">
                    <div className="cv-sub-add-image">
                        {newCatPreview ? (
                            <img src={newCatPreview} alt="Preview" />
                        ) : (
                            <span className="material-symbols-outlined">
                                add_photo_alternate
                            </span>
                        )}
                        <button
                            type="button"
                            className="cv-img-upload-btn cv-img-upload-sm"
                            onClick={() => newCatFileRef.current?.click()}
                            aria-label="Upload image"
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                        </button>
                        <input
                            ref={newCatFileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleNewCatFileChange}
                            style={{ display: "none" }}
                        />
                    </div>

                    <input
                        type="text"
                        className="cv-input"
                        placeholder="Category name..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    />

                    <button
                        className="cv-add-btn"
                        onClick={handleAddCategory}
                        disabled={adding || !newCatName.trim()}
                    >
                        <span className="material-symbols-outlined">add</span>
                        {adding ? "Adding..." : "Add Category"}
                    </button>
                </div>
            </section>

            {/* ═══ Categories Accordion ═══ */}
            <section className="cv-section">
                <header className="cv-section-header">
                    <h3>
                        <span className="material-symbols-outlined">folder</span>
                        Categories
                        <span className="cv-count">{categoriesWithCounts.length}</span>
                    </h3>
                </header>

                {categoriesWithCounts.length === 0 ? (
                    <p className="cv-empty">
                        No categories yet. Add the first one above.
                    </p>
                ) : (
                    <div className="cv-accordion">
                        {categoriesWithCounts.map((cat) => (
                            <CategoryAccordionItem
                                key={cat.id}
                                category={cat}
                                isExpanded={expandedId === cat.id}
                                onToggle={() =>
                                    setExpandedId(expandedId === cat.id ? null : cat.id)
                                }
                                onRefreshCategories={fetchCategoriesWithCounts}
                                onDeleteClick={(c) => setPendingDelete(c)}
                                updateCategory={updateCategory}
                                addSubcategory={addSubcategory}
                                updateSubCategory={updateSubCategory}
                                deleteSubcategory={deleteSubcategory}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ═══ Confirm Delete ═══ */}
            {pendingDelete && (
                <ConfirmDialog
                    isOpen={true}
                    title={`Delete "${pendingDelete.name}"?`}
                    message="⚠️ All subcategories will be deleted. Products linked to this category will lose their assignment."
                    variant="danger"
                    icon="delete"
                    confirmLabel="Delete Category"
                    cancelLabel="Cancel"
                    isLoading={deleting}
                    onConfirm={performDelete}
                    onCancel={() => setPendingDelete(null)}
                />
            )}
        </div>
    );
}