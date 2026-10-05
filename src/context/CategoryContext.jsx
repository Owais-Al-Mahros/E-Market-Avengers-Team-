import { createContext, useContext } from "react";
import { useSupabaseCrud } from "../hooks/useSupabaseCrud";

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const crud = useSupabaseCrud("categories");
  return (
    <CategoryContext.Provider value={{
      categories: crud.items,
      loading: crud.loading,
      addCategory: crud.create,
      updateCategory: crud.update,
      deleteCategory: crud.remove,
      refreshCategories: crud.fetchAll,
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategories = () => useContext(CategoryContext);