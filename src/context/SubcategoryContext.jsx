// src/context/SubcategoryContext.jsx
import { createContext, useContext } from "react";
import { useSupabaseCrud } from "../hooks/useSupabaseCrud";

const SubcategoryContext = createContext();

export function SubcategoryProvider({ children }) {
  const {
    items: subcategories,
    loading,
    create,
    update,
    remove,
    fetchAll,
  } = useSupabaseCrud("subcategories");

  // helper خاص (منطق العمل يبقى هنا)
  const getSubcategoriesByCategory = (categoryId) =>
    subcategories.filter((sub) => sub.category_id === categoryId);

  const value = {
    subcategories,
    loading,
    addSubcategory: create,
    updateSubCategory: update,
    deleteSubcategory: remove,
    refreshSubcategories: fetchAll,
    getSubcategoriesByCategory,
  };

  return (
    <SubcategoryContext.Provider value={value}>
      {children}
    </SubcategoryContext.Provider>
  );
}

export const useSubcategories = () => {
  const ctx = useContext(SubcategoryContext);
  if (!ctx) throw new Error("useSubcategories must be used within SubcategoryProvider");
  return ctx;
};