import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

import ButtonAddProduct from "../components/ButtonAddProduct";
import ProductModal from "../components/ProductModal/ProductModal";
import AdminDashboardProductCard from "../components/AdminDashboardProductCard";
import EditProduct from "../components/productModal/EditProduct.jsx";
import { supabase } from '../lib/supabase';
import { fetchData } from "../hooks/useProduct.js"
import { deleteProduct } from "../hooks/useProduct"


function AdminDashboard() {
  const [products, setProducts] = useState([]);


  const [isEditCArdModalOpen, setIsEditCArdModalOpen] = useState(false);
  const openEditCardModel = () => setIsEditCArdModalOpen(true);
  const closeEditCardModel = () => setIsEditCArdModalOpen(false);

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
  const renderProducts = () => {
    return products.map((product, index) => (
      <AdminDashboardProductCard
        key={product.id}
        id={product.id}
        name={product.name}
        description={product.description}
        price={product.price}
        image={product.image}
        onDelete={handleDelete}
        Edit={openEditCardModel}
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
      {
        isEditCArdModalOpen && <EditProduct closeModel={closeEditCardModel} />
      }
    </>
  );
}

export default AdminDashboard;
