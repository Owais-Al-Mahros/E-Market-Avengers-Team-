import ProductForm from "./components/ProductForm.jsx";
import { useState } from "react";
import "./EditProduct.css";

export default function EditProduct(props) {
    const [loading, setLoading] = useState(false);

    const initialData = {
        id: props.id,
        name: props.name,
        price: props.price,
        image: props.image,
        category: props.category,
        weight: props.weight,
        weight_unit: props.weight_unit,
        tax_rate: props.tax_rate,
        ingredients: props.ingredients,
        nutrition_facts: props.nutritionObject,
        storage_notes: props.storageObject,
    };

    const handleSubmit = async (data) => {
        setLoading(true);
        try {
            // ✅ استخدم onUpdate من props (التي تقوم بتحديث السياق)
            const result = await props.onUpdate(props.id, data);
            if (result.success) {
                props.closeModel(); // أغلق المودال بعد النجاح
            } else {
                alert("Update failed: " + (result.error || "Unknown error"));
                setLoading(false);
            }
        } catch (error) {
            alert("An error occurred: " + error.message);
            setLoading(false);
        }
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