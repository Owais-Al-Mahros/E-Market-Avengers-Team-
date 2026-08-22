import "./ProductModal.css";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import ProductForm from "./components/ProductForm.jsx";
import { uploadProductImage } from "../../../hooks/useProduct.js";

export default function ProductModal({ closeModel, onProductAdded }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data, file) => {
    setLoading(true);
    try {
      let imageUrl = data.image;
      if (file) {
        const uploadRes = await uploadProductImage(file);
        if (!uploadRes.success) throw new Error(uploadRes.error);
        imageUrl = uploadRes.url;
      }
      const { error } = await supabase
        .from("products")
        .insert([{ ...data, image: imageUrl }]);
      if (error) throw error;
      if (onProductAdded) await onProductAdded();
      closeModel();
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <ProductForm
      title="Add New Product"
      submitLabel="➕ Add"
      isLoading={loading}
      onSubmit={handleSubmit}
      closeModel={closeModel}
    />
  );
}
