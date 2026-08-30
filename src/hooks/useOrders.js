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

