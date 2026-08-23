import ProductForm from "./components/ProductForm.jsx";
import { useState } from "react";
import toast from "react-hot-toast";
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

        const updatePromise = props.onUpdate(props.id, data).then((result) =>{
            if(result.success){
                props.closeModel()
            }else{
                throw new Error(result.error || "Unknown Error...")
            }
        })

        toast.promise(updatePromise,{
            loading : "Update Product Details...",
            success : "Update Product Successfully! ✏️",
            error : (err)=> `Update Failed : ${err.message}`,
        }).finally(()=>setLoading(false))
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