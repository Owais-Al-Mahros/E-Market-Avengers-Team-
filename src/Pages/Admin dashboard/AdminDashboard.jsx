import { useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

import ButtonAddProduct from "./components/ButtonAddProduct.jsx";
import ProductModal from "./models/ProductModal.jsx";
import AdminDashboardProductCard from "./components/AdminDashboardProductCard.jsx";
import { useProducts } from "../../context/ProductContext.jsx";
import { deleteProduct as deleteProductAPI } from "../../hooks/useProduct.js"; // ✅ استيراد API الحذف
import { updateProduct as updateProductAPI } from "../../hooks/useProduct.js"; // ✅ استيراد API التحديث


function AdminDashboard() {
  const { products, loading, deleteProduct, updateProduct, refreshProducts } = useProducts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModel = () => setIsModalOpen(true);
  const closeModel = () => setIsModalOpen(false);


  const handleDelete = async (productId) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;

    const success = await deleteProductAPI(productId); // استدعاء API الحذف
    if (success) {
      deleteProduct(productId); // ✅ تحديث السياق محلياً (بدون إعادة جلب)
    } else {
      alert("Failed to delete product.");
    }
  };

  const handleUpdate = async (productId, updatedData) => {
    const result = await updateProductAPI(productId, updatedData); // استدعاء API التحديث
    if (result.success) {
      updateProduct(result.data); // ✅ تحديث السياق بالمنتج الجديد (ملاحظة: result.data هو المنتج المحدث)
    } else {
      alert("Failed to update product.");
    }
    return result;
  };

  const renderProducts = () => {
    if (loading) {
      return (<h1>...loading products</h1>);
    }
    return products.map((product, index) => (
      <AdminDashboardProductCard
        key={product.id}
        id={product.id}
        name={product.name}
        category={product.category}
        price={product.price}
        image={product.image}
        weight={product.weight}
        tax_rate={product.tax_rate}
        weight_unit={product.weight_unit}
        total_price={product.total_price}
        nutritionObject={product.nutrition_facts}  // 🔥 الكائن الجديد
        storageObject={product.storage_notes}       // 🔥 الكائن الجديد
        ingredients={product.ingredients}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    ));
  };


  return (
    <>
      <h1 className="title">Admin Dashboard</h1>
      <Link to="/">Go to Home Page</Link>

      <div className="body">
        {renderProducts()}
        {(!loading) && <ButtonAddProduct openModel={openModel} />}
      </div>

      {isModalOpen && (
        <ProductModal closeModel={closeModel} onProductAdded={refreshProducts} />
      )}

    </>
  );
}

export default AdminDashboard;
