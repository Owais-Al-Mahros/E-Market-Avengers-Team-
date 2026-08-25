import ProductForm from "./components/ProductForm.jsx";
import { useState } from "react";
import toast from "react-hot-toast";
import { uploadProductImage } from "../../../hooks/useProduct.js"; // ✅ استيراد دالة رفع الصورة
import "./EditProduct.css";

export default function EditProduct(props) {
    const [loading, setLoading] = useState(false);

    const initialData = {
        id: props.id,
        name: props.name,
        price: props.price,
        image: props.image,
        category_id: props.category_id ? Number(props.category_id) : null,
        subcategory_id: props.subcategory_id ? Number(props.subcategory_id) : null,
        weight: props.weight,
        weight_unit: props.weight_unit,
        tax_rate: props.tax_rate,
        ingredients: props.ingredients,
        nutrition_facts: props.nutritionObject,
        storage_notes: props.storageObject,
    };

    const handleSubmit = async (data, file) => {
        setLoading(true);

        // ✅ دالة التحديث مع رفع الصورة إن وجدت
        const updatePromise = (async () => {
            let imageUrl = data.image; // الرابط القديم

            // إذا كان هناك ملف جديد، نرفعه
            if (file) {
                const uploadRes = await uploadProductImage(file);
                if (!uploadRes.success) throw new Error(uploadRes.error);
                imageUrl = uploadRes.publicUrl; // الرابط الجديد
            }

            // تحديث البيانات بالرابط الجديد
            const updatedData = { ...data, image: imageUrl };

            // إزالة الحقل category إن وجد
            const { category, ...cleanData } = updatedData;

            // تنفيذ التحديث
            const result = await props.onUpdate(props.id, cleanData);
            if (!result.success) {
                throw new Error(result.error || "Unknown Error...");
            }
            props.closeModel();
        })();

        toast.promise(updatePromise, {
            loading: "Updating product and image...",
            success: "Product updated successfully! ✏️",
            error: (err) => `Update Failed: ${err.message}`,
        }).finally(() => setLoading(false));
    };

    return (
        <ProductForm
            title="Edit Product"
            submitLabel="💾 Update"
            isLoading={loading}
            initialProductInfo={initialData}
            onSubmit={handleSubmit}
            closeModel={props.closeModel}
        />
    );
}