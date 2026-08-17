import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

import ButtonAddProduct from "../components/ButtonAddProduct";
import ProductModal from "../components/productModal/ProductModal";
import AdminDashboardProductCard from "../components/AdminDashboardProductCard";
import EditProduct from "../components/productModal/EditProduct.jsx";
import { supabase } from '../lib/supabase';
import { fetchData } from "../hooks/useProduct.js"
import { deleteProduct } from "../hooks/useProduct"
import { updateProduct } from "../hooks/useProduct.js";

function AdminDashboard() {
  const [products, setProducts] = useState([]);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModel = () => setIsModalOpen(true);
  const closeModel = () => setIsModalOpen(false);


  const fetchProducts = async () => {
    const productsFromDataBase = await fetchData("products");
    setProducts(productsFromDataBase);
  }

  useEffect(() => {
    fetchProducts();
  }, [])


  const handleDelete = async (productId) => {
    const success = await deleteProduct(productId);
    setProducts((prev) => prev.filter((product) => product.id !== productId));
  }

  const handleUpdates = async (productId, updatedProduct) => {
    const success = await updateProduct(productId, updatedProduct);
    setProducts((prev) =>
      prev.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      ));
    return success;
  }

  const renderProducts = () => {
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
        onDelete={handleDelete}
        onUpdate={handleUpdates}
      />
    ));
  };


  return (
    <>
      <h1 className="title">Admin Dashboard</h1>
      <Link to="/">Go to Home Page</Link>

      <div className="body">
        {renderProducts()}
        <ButtonAddProduct openModel={openModel} />
      </div>

      {isModalOpen && (
        <ProductModal closeModel={closeModel} onProductAdded={fetchProducts} />
      )}

    </>
  );
}

export default AdminDashboard;
