import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

/**
 * جلب كل صفوف جدول معيّن بترتيب id تصاعدي.
 * @param {string} tableName
 * @returns {Promise<Array>}
 */
export async function fetchData(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        toast.error(error.message);
        return [];
    }
    return data || [];
}