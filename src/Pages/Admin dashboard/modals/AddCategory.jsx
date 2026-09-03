import { useCategories } from "../../../context/CategoryContext";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase"; // ✅ استيراد supabase
import AddSubCategory from "./components/AddSubCategory";
import "./AddCategory.css";
import toast from "react-hot-toast";

export default function AddCategory({ closeModel, onCategoryAdded }) {
  const { categories, loading, addCategory, deleteCategory } = useCategories();
  const [category, setCategory] = useState({ name: "", image: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showSubCategoryView, setShowSubCategoryView] = useState(false);

  // ✅ حالة لتخزين أعداد الفئات الفرعية لكل فئة
  const [subCounts, setSubCounts] = useState({});

  // ✅ جلب أعداد الفئات الفرعية عند تحميل الفئات
  useEffect(() => {
    const fetchSubCounts = async () => {
      if (categories.length === 0) return;

      try {
        // استعلام واحد لجلب الأعداد لكل الفئات
        const { data, error } = await supabase
          .from("subcategories")
          .select("category_id")
          .in(
            "category_id",
            categories.map((c) => c.id),
          );

        if (error) throw error;

        // حساب الأعداد لكل category_id
        const counts = {};
        data.forEach((sub) => {
          counts[sub.category_id] = (counts[sub.category_id] || 0) + 1;
        });

        setSubCounts(counts);
      } catch (error) {
        console.error("Error fetching subcategory counts:", error);
      }
    };

    fetchSubCounts();
  }, [categories]); // ✅ يُعاد الجلب عند تغير الفئات

  const openSubCategoryView = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setShowSubCategoryView(true);
  };

  const closeSubCategoryView = () => {
    setShowSubCategoryView(false);
    setSelectedCategoryId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setIsSubmitting(true);

    try {
      await addCategory({
        name: category.name.trim(),
        image: category.image.trim() || null,
      });
      setCategory({ name: "", image: "" });
      toast.success("Category added successfully!");
      if (onCategoryAdded) await onCategoryAdded();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ دالة الحذف مع toast مخصص
  const handleDeleteCategory = (e, id, name) => {
    e.stopPropagation();

    toast(
      (t) => (
        <div className="delete-confirm-toast">
          <p className="delete-confirm-message">
            Are you sure you want to delete the category{" "}
            <strong>"{name}"</strong> and all its subcategories?
          </p>
          <div className="delete-confirm-actions">
            <button
              className="delete-confirm-btn delete-btn-danger"
              onClick={() => {
                toast.dismiss(t.id);
                const deletePromise = deleteCategory(id).then(async () => {
                  if (onCategoryAdded) await onCategoryAdded();
                });

                toast.promise(deletePromise, {
                  loading: "Deleting category...",
                  success: "Category deleted successfully!",
                  error: (err) => `Failed to delete: ${err.message}`,
                });
              }}
            >
              Delete
            </button>
            <button
              className="delete-confirm-btn delete-btn-cancel"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
        className: "custom-toast",
        style: {
          maxWidth: "420px",
          background: "#1a2a3a",
          color: "#f5e6d3",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        },
      },
    );
  };

  const renderCategories = () => {
    if (loading) return <p className="loading-text">Loading categories...</p>;
    if (categories.length === 0)
      return (
        <p className="empty-text">No categories yet. Add your first one!</p>
      );

    return categories.map((cat) => (
      <div key={cat.id} className="category-item">
        <div
          className="category-info"
          onClick={() => openSubCategoryView(cat.id)}
        >
          {cat.image && (
            <img src={cat.image} alt={cat.name} className="category-thumb" />
          )}
          <span className="category-name">{cat.name}</span>
        </div>
        <div className="category-actions">
          {/* ✅ استخدم الأعداد المخزنة في الحالة */}
          <span className="category-count">{subCounts[cat.id] || 0} sub</span>
          <button
            type="button"
            className="delete-category-btn"
            onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)}
          >
            🗑️
          </button>
        </div>
      </div>
    ));
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="modal-overlay" onClick={closeModel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {!showSubCategoryView && (
          <div className="modal-header">
            <h2>📂 Manage Categories</h2>
          </div>
        )}

        <div className="modal-body-wrapper">
          {/* الواجهة الرئيسية */}
          <div
            className={`view-container ${showSubCategoryView ? "fade-out" : "fade-in"}`}
          >
            {!showSubCategoryView && (
              <>
                <form className="modal-body" onSubmit={handleSubmit}>
                  <div className="add-category-form">
                    <div className="form-fields">
                      <input
                        type="text"
                        placeholder="Category name..."
                        value={category.name}
                        onChange={(e) =>
                          setCategory({ ...category, name: e.target.value })
                        }
                        disabled={isSubmitting}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Image URL (optional)..."
                        value={category.image}
                        onChange={(e) =>
                          setCategory({ ...category, image: e.target.value })
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      type="submit"
                      className="add-btn"
                      disabled={isSubmitting}
                    >
                      <span className="material-symbols-outlined">add</span>
                      {isSubmitting ? "Adding..." : "Add"}
                    </button>
                  </div>
                  <div className="categories-list">{renderCategories()}</div>
                </form>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="close-modal-btn"
                    onClick={closeModel}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>

          {/* واجهة الفئات الفرعية */}
          <div
            className={`view-container ${showSubCategoryView ? "fade-in" : "fade-out"}`}
          >
            {showSubCategoryView && selectedCategory && (
              <AddSubCategory
                category={selectedCategory}
                onBack={closeSubCategoryView}
                onUpdate={onCategoryAdded}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
