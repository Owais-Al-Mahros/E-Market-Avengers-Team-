import "./ProductModal.css";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import ProductForm from "./components/ProductForm.jsx";

export default function ProductModal({ closeModel, onProductAdded }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("products").insert([data]);
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