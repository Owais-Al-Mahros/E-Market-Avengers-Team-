import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";

import "./AddSubCategory.css";

export default function AddSubCategory({ category, onBack, onUpdate }) {
    const [subcategories, setSubcategories] = useState([]);
    const [newSubName, setNewSubName] = useState("");
    const [newSubImage, setNewSubImage] = useState(""); // ✅ صورة الفئة الفرعية
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ حالات تعديل الفئة الأم (الاسم + الصورة)
    const [categoryName, setCategoryName] = useState(category.name);
    const [categoryImage, setCategoryImage] = useState(category.image || "");
    const [isEditingCategory, setIsEditingCategory] = useState(false);

    // ✅ حالات تعديل الفئة الفرعية
    const [editingSubId, setEditingSubId] = useState(null);
    const [editingSubName, setEditingSubName] = useState("");
    const [editingSubImage, setEditingSubImage] = useState("");

    const fetchSubcategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("subcategories")
            .select("*")
            .eq("category_id", category.id)
            .order("name");
        if (!error) setSubcategories(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchSubcategories();
    }, [category.id]);

    // ✅ إضافة فئة فرعية مع صورة
    const handleAddSub = async (e) => {
        e.preventDefault();
        if (!newSubName.trim()) return;
        setIsSubmitting(true);

        const { data, error } = await supabase
            .from("subcategories")
            .insert([
                {
                    name: newSubName.trim(),
                    image: newSubImage.trim() || null,
                    category_id: parseInt(category.id),
                },
            ])
            .select();

        if (error) {
            alert("Error: " + error.message);
        } else {
            setNewSubName("");
            setNewSubImage("");
            fetchSubcategories();
            if (onUpdate) onUpdate();
        }
        setIsSubmitting(false);
    };

    // ✅ حذف فئة فرعية
    const handleDeleteSub = async (id) => {
        if (!window.confirm("Delete this subcategory?")) return;
        const { error } = await supabase.from("subcategories").delete().eq("id", id);
        if (error) alert("Error: " + error.message);
        else {
            fetchSubcategories();
            if (onUpdate) onUpdate();
        }
    };

    // ✅ بدء تعديل فئة فرعية
    const startEditSub = (sub) => {
        setEditingSubId(sub.id);
        setEditingSubName(sub.name);
        setEditingSubImage(sub.image || "");
    };

    // ✅ إلغاء تعديل فئة فرعية
    const cancelEditSub = () => {
        setEditingSubId(null);
        setEditingSubName("");
        setEditingSubImage("");
    };

    // ✅ حفظ تعديل فئة فرعية
    const handleUpdateSub = async (id) => {
        if (!editingSubName.trim()) return;
        const { error } = await supabase
            .from("subcategories")
            .update({
                name: editingSubName.trim(),
                image: editingSubImage.trim() || null,
            })
            .eq("id", id);
        if (error) alert("Error: " + error.message);
        else {
            cancelEditSub();
            fetchSubcategories();
            if (onUpdate) onUpdate();
        }
    };

    // ✅ حفظ التغييرات على الفئة الأم
    const handleUpdateCategory = async () => {
        if (!categoryName.trim()) return;
        const { error } = await supabase
            .from("categories")
            .update({
                name: categoryName.trim(),
                image: categoryImage.trim() || null,
            })
            .eq("id", category.id);
        if (error) alert("Error: " + error.message);
        else {
            setIsEditingCategory(false);
            if (onUpdate) onUpdate();
        }
    };

    return (
        <div className="subcategory-container">
            {/* رأس الفئة الأم */}
            <div className="sub-header">
                <div className="category-title">
                    {isEditingCategory ? (
                        <div className="edit-category-form">
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="Category name"
                                autoFocus
                            />
                            <input
                                type="text"
                                value={categoryImage}
                                onChange={(e) => setCategoryImage(e.target.value)}
                                placeholder="Image URL"
                            />
                            <button onClick={handleUpdateCategory}>Save</button>
                            <button onClick={() => setIsEditingCategory(false)}>Cancel</button>
                        </div>
                    ) : (
                        <>
                            <div className="category-display">
                                {categoryImage && (
                                    <img
                                        src={categoryImage}
                                        alt={categoryName}
                                        className="category-thumb"
                                    />
                                )}
                                <h3>{category.name}</h3>
                            </div>
                            <button
                                className="edit-category-btn"
                                onClick={() => setIsEditingCategory(true)}
                            >
                                ✏️
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* نموذج إضافة فئة فرعية (مع صورة) */}
            <form className="add-sub-form" onSubmit={handleAddSub}>
                <input
                    type="text"
                    placeholder="Subcategory name..."
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    disabled={isSubmitting}
                    required
                />
                <input
                    type="text"
                    placeholder="Image URL (optional)..."
                    value={newSubImage}
                    onChange={(e) => setNewSubImage(e.target.value)}
                    disabled={isSubmitting}
                />
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "+ Add Sub"}
                </button>
            </form>

            {/* قائمة الفئات الفرعية مع أزرار تعديل وحذف */}
            <div className="subcategories-list">
                {loading ? (
                    <p className="loading-text">Loading subcategories...</p>
                ) : subcategories.length === 0 ? (
                    <p className="empty-text">No subcategories yet.</p>
                ) : (
                    subcategories.map((sub) => (
                        <div key={sub.id} className="subcategory-item">
                            {editingSubId === sub.id ? (
                                // ✅ وضع التعديل
                                <div className="edit-sub-form">
                                    <input
                                        type="text"
                                        value={editingSubName}
                                        onChange={(e) => setEditingSubName(e.target.value)}
                                        placeholder="Subcategory name"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={editingSubImage}
                                        onChange={(e) => setEditingSubImage(e.target.value)}
                                        placeholder="Image URL"
                                    />
                                    <button onClick={() => handleUpdateSub(sub.id)}>Save</button>
                                    <button onClick={cancelEditSub}>Cancel</button>
                                </div>
                            ) : (
                                // ✅ وضع العرض العادي
                                <>
                                    <div className="sub-display">
                                        {sub.image && (
                                            <img
                                                src={sub.image}
                                                alt={sub.name}
                                                className="sub-thumb"
                                            />
                                        )}
                                        <span>{sub.name}</span>
                                    </div>
                                    <div className="sub-actions">
                                        <button
                                            className="edit-sub-btn"
                                            onClick={() => startEditSub(sub)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="delete-sub-btn"
                                            onClick={() => handleDeleteSub(sub.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
            {<button className="back-btn" onClick={onBack}>
                <span className="material-symbols-outlined">arrow_back</span>
                Back
            </button>}
        </div>
    );
}