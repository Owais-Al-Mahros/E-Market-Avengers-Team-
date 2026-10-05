import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

const TABLE = "categories";

export async function updateCategory(id, updatedData) {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .update(updatedData)
            .eq("id", id)
            .select();
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error("Failed to update category:", error.message);
        return { success: false, error: error.message };
    }
}

export async function deleteCategory(id) {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
        toast.error(error.message);
        return false;
    }
    return true;
}