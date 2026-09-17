import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { useSubcategories } from "../../../../context/SubcategoryContext";
import { useCategories } from "../../../../context/CategoryContext";
import toast from "react-hot-toast";
import "./AddSubCategory.css";
import EditCategory from "../EditCategory";

export default function AddSubCategory({ category, onBack, onUpdate }) {
  const [subcategories, setSubcategories] = useState([]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubImage, setNewSubImage] = useState(""); // ✅ صورة الفئة الفرعية
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateCategory } = useCategories();
  const { updateSubCategory } = useSubcategories();

  const [editModalConfig, setEditModalConfig] = useState(null);

  // ✅ حالات تعديل الفئة الأم (الاسم + الصورة)
//   const [categoryName, setCategoryName] = useState(category.name);
//   const [categoryImage, setCategoryImage] = useState(category.image || "");
//   const [isEditingCategory, setIsEditingCategory] = useState(false);

//   // ✅ حالات تعديل الفئة الفرعية
//   const [editingSubId, setEditingSubId] = useState(null);
//   const [editingSubName, setEditingSubName] = useState("");
//   const [editingSubImage, setEditingSubImage] = useState("");

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

    const { error } = await supabase
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
      toast.error("Error: " + error.message);
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
    const { error } = await supabase
      .from("subcategories")
      .delete()
      .eq("id", id);
    if (error) alert("Error: " + error.message);
    else {
      fetchSubcategories();
      if (onUpdate) onUpdate();
    }
  };

  const handelOnSave = async (updateData, imageFile) => {
    try {
      const { type, data } = editModalConfig;

      if (type === "category") {
        updateCategory(data.id , updateData, imageFile);
        if (onUpdate) onUpdate();
      } else {
        updateSubCategory(data.id, updateData, imageFile);
        if (onUpdate) onUpdate();
        fetchSubcategories()
      }
    } catch (error) {
      console.error("error", error);
    }
  };

  // ✅ إلغاء تعديل فئة فرعية
//   const cancelEditSub = () => {
//     setEditingSubId(null);
//     setEditingSubName("");
//     setEditingSubImage("");
//   };

  return (
    <div className="subcategory-container">
      {editModalConfig && (
        <EditCategory
          title={
            editModalConfig.type === "category"
              ? "Main Category "
              : "Subcategory"
          }
          initialData={editModalConfig.data}
          onClose={()=>setEditModalConfig(null)}
          onSave={handelOnSave}
        />
      )}
      {/* رأس الفئة الأم */}
      <div className="sub-header">
        <div className="category-title">
          <div className="category-display">
            {category.image && (
              <img
                src={category.image}
                alt={category.name}
                className="category-thumb"
              />
            )}
            <h3>{category.name}</h3>
          </div>
          <button
            className="edit-category-btn"
            onClick={() =>
              setEditModalConfig({ type: "category", data: category })
            }
          >
            ✏️
          </button>
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
              <div className="sub-display">
                {sub.image && (
                  <img src={sub.image} alt={sub.name} className="sub-thumb" />
                )}
                <span>{sub.name}</span>
              </div>
              <div className="sub-actions">
                <button
                  className="edit-sub-btn"
                  onClick={() =>
                    setEditModalConfig({ type: "subcategory", data: sub })
                  }
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
            </div>
          ))
        )}
      </div>
      {
        <button className="back-btn" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>
      }
    </div>
  );
}
