// src/context/CategoryContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // جلب الفئات من Supabase
    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('id');
        if (!error) setCategories(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // ✅ دالة الإضافة المثالية (تحديث محلي + إرسال إلى Supabase)
    const addCategory = async (newCategory) => {
        try {
            // 1. إرسال إلى Supabase
            const { data, error } = await supabase
                .from('categories')
                .insert([{
                    name: newCategory.name.trim(),
                    image: newCategory.image?.trim() || null
                }])
                .select(); // ✅ نستخدم select() للحصول على الكائن المُضاف مع الـ id

            if (error) throw error;

            // 2. التحديث المحلي (بعد نجاح الإرسال)
            if (data && data.length > 0) {
                setCategories((prev) => [...prev, data[0]]);
            }

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category: ' + error.message);
            return { success: false, error: error.message };
        }
    };

    // دوال التحديث والحذف (بنفس النمط)
    const updateCategory = async (id, updatedData) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update(updatedData)
                .eq('id', id)
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                setCategories((prev) =>
                    prev.map((cat) => (cat.id === id ? data[0] : cat))
                );
            }
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error updating category:', error);
            return { success: false, error: error.message };
        }
    };

    const deleteCategory = async (id) => {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCategories((prev) => prev.filter((cat) => cat.id !== id));
            return { success: true };
        } catch (error) {
            console.error('Error deleting category:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        categories,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
        refreshCategories: fetchCategories,
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
}