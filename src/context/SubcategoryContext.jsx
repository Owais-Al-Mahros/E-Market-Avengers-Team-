// src/context/SubcategoryContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchData } from '../hooks/useProduct';

const SubcategoryContext = createContext();

export function SubcategoryProvider({ children }) {
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSubcategories = async () => {
        setLoading(true);
        const data = await fetchData('subcategories');
        setSubcategories(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSubcategories();
    }, []);

    const addSubcategory = (newSubcategory) => {
        setSubcategories((prev) => [...prev, newSubcategory]);
    };

    const updateSubcategory = (updatedSubcategory) => {
        setSubcategories((prev) =>
            prev.map((s) => (s.id === updatedSubcategory.id ? updatedSubcategory : s))
        );
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
        updateSubcategory,
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
        throw new Error('useSubcategories must be used within a SubcategoryProvider');
    }
    return context;
}