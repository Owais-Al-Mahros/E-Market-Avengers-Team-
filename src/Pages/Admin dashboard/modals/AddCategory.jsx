import { useCategories } from "../../../context/CategoryContext";
import { useState } from "react";
import "./AddCategory.css";

export default function AddCategory({ closeModel, onCategoryAdded }) {
    const { categories, loading, addCategory } = useCategories();
    const [category, setCategory] = useState({ name: "", image: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!category.name.trim()) return;

        setIsSubmitting(true);

        try {
            // ✅ إرسال الفئة إلى Supabase عبر السياق
            await addCategory({
                name: category.name.trim(),
                image: category.image.trim() || null,
            });

            // إعادة تعيين الحقول
            setCategory({ name: "", image: "" });

            // استدعاء دالة التحديث إذا وُجدت
            if (onCategoryAdded) await onCategoryAdded();

            closeModel();
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCategories = () => {
        if (loading) return <p className="loading-text">Loading categories...</p>;
        if (categories.length === 0)
            return <p className="empty-text">No categories yet. Add your first one!</p>;

        return categories.map((cat) => (
            <div key={cat.id} className="category-item">
                <div className="category-info">
                    {cat.image && (
                        <img src={cat.image} alt={cat.name} className="category-thumb" />
                    )}
                    <span className="category-name">{cat.name}</span>
                </div>
                <span className="category-count">
                    {cat.subcategories?.length || 0} sub
                </span>
            </div>
        ));
    };

    return (
        <div className="modal-overlay" onClick={closeModel}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* الرأس */}
                <div className="modal-header">
                    <h2>📂 Manage Categories</h2>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <div className="add-category-form">
                        <div className="form-fields">
                            <input
                                type="text"
                                placeholder="Category name..."
                                value={category.name}
                                onChange={(e) => setCategory({ ...category, name: e.target.value })}
                                disabled={isSubmitting}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Image URL (optional)..."
                                value={category.image}
                                onChange={(e) => setCategory({ ...category, image: e.target.value })}
                                disabled={isSubmitting}
                            />
                        </div>
                        <button type="submit" className="add-btn" disabled={isSubmitting}>
                            <span className="material-symbols-outlined">add</span>
                            {isSubmitting ? "Adding..." : "Add"}
                        </button>
                    </div>

                    <div className="categories-list">{renderCategories()}</div>
                </form>

                {/* التذييل */}
                <div className="modal-footer">
                    <button type="button" className="close-modal-btn" onClick={closeModel}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}