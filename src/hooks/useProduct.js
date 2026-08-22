import { supabase } from "../lib/supabase";

export async function fetchData(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order('id', { ascending: true });
    if (error) {
        alert(error.message);
        return [];
    } else {
        return data || [];
    }

}

export async function deleteProduct(id) {
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

    if (error) {
        alert(error.message);
        return false;
    } else {
        return true;
    }
}
export async function deleteCategory(id) {
    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)

    if (error) {
        alert(error.message);
        return false;
    } else {
        return true;
    }
}

export async function updateProduct(id, updatedData) {
    try {
        const { data, error } = await supabase
            .from("products")
            .update(updatedData)
            .eq("id", id)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] }; // ✅ كائن success: true
    } catch (error) {
        console.error("❌ فشل التحديث:", error.message);
        return { success: false, error: error.message }; // ✅ كائن success: false
    }
}

export async function updateCategory(id, updatedData) {
    try {
        const { data, error } = await supabase
            .from("categories")
            .update(updatedData)
            .eq("id", id)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] }; // ✅ كائن success: true
    } catch (error) {
        console.error("❌ فشل التحديث:", error.message);
        return { success: false, error: error.message }; // ✅ كائن success: false
    }
}