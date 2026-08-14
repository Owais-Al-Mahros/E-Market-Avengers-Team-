import { renderMatches } from "react-router-dom";
import { supabase } from "../lib/supabase";

export async function fetchData(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select("*");
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

export async function updateProduct(id, updaateData) {
    try {
        const { data, error } = await supabase
            .from("products")
            .update(updaateData)
            .eq("id", id)
            .select();

        if (error) throw error;

        // console.log("✅ تم التحديث بنجاح:", data);
        return { success: true, data: data[0] };

    } catch (error) {
        // console.error("❌ فشل التحديث:", error.message);
        // alert(`فشل تحديث المنتج: ${error.message}`);
        return { success: false, error: error.message };
    }




}