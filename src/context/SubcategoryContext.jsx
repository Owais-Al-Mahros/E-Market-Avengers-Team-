// src/context/SubcategoryContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { fetchData } from "../hooks/useProduct";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
const SubcategoryContext = createContext();

export function SubcategoryProvider({ children }) {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubcategories = async () => {
    setLoading(true);
    const data = await fetchData("subcategories");
    setSubcategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const addSubcategory = (newSubcategory) => {
    setSubcategories((prev) => [...prev, newSubcategory]);
  };

  const updateSubCategory = async (id, updateData, imageFile) => {
    try {
      let imageUrl = updateData.image;

      //check if image not null
      if (imageFile) {
        const fileName = `${Date.now()}_${updateData.name}`;
        const { error: uploadError } = await supabase.storage
          .from("upload-image")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("upload-image")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      //update data
      const { data, error } = supabase
        .from("subcategories")
        .update({ name: updateData.name, image: imageUrl })
        .eq("id", id)
        .select();

      if (error) throw error;
      //update
      if (data && data.length > 0) {
        setSubcategories((prev) =>
          prev.map((s) => (s.id === id ? data[0] : s)),
        );
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error("error", error);
      toast.error(`error in updating ${updateData.name} : ` + error.message)
      throw error;
    }
  };

  const deleteSubcategory = (subcategoryId) => {
    setSubcategories((prev) => prev.filter((s) => s.id !== subcategoryId));
  };

  // دالة مساعدة لجلب الفئات الفرعية لفئة معينة
  const getSubcategoriesByCategory = (categoryId) => {
    return subcategories.filter((sub) => sub.category_id === categoryId);
  };

  const value = {
    subcategories,
    loading,
    addSubcategory,
    updateSubCategory,
    deleteSubcategory,
    refreshSubcategories: fetchSubcategories,
    getSubcategoriesByCategory,
  };

  return (
    <SubcategoryContext.Provider value={value}>
      {children}
    </SubcategoryContext.Provider>
  );
}

export function useSubcategories() {
  const context = useContext(SubcategoryContext);
  if (!context) {
    throw new Error(
      "useSubcategories must be used within a SubcategoryProvider",
    );
  }
  return context;
}
