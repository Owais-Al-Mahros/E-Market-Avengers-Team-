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

export async function uploadProductImage(file) {
    try {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from("upload-image")
            .upload(fileName, file);

        if (error) throw error;
        const { data: publicUrlData } = supabase.storage
            .from("upload-image")
            .getPublicUrl(fileName);
        return { success: true, publicUrl: publicUrlData.publicUrl }; // ✅ كائن success: true

    } catch (error) {
        console.error("❌ فشل رفع الصورة:", error.message);
        return { success: false, error: error.message }; // ✅ كائن success: false
    }
}
export async function addProduct(productData) {
    try {
        const { data, error } = await supabase
            .from("products")
            .insert([productData])
            .select()
        if (error) throw error
        return { success: true, data: data[0] }

    } catch (error) {
        console.error("فشل تحميل المنتج ", error.message)
        return { success: false, error: error.message }
    }
}

export async function countSubCategory(categoryId) {
    try {
        // إذا كان لديك category_id بدلاً من الاسم، استخدم هذا:
        const { count, error } = await supabase
            .from("subcategories")
            .select("*", { count: "exact", head: true })
            .eq("category_id", categoryId); // تأكد من اسم العمود في جدولك

        if (error) throw error;
        return { success: true, count };
    } catch (error) {
        console.error("Error counting subcategories:", error.message);
        return { success: false, error: error.message };
    }
}