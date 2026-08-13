import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

import ButtonAddProduct from "../components/ButtonAddProduct";
import ProductModal from "../components/ProductModal/ProductModal";
import ProductCard from "../components/ProductCard";
import AdminDashboardProductCard from "../components/AdminDashboardProductCard";
import { supabase } from '../lib/supabase';

function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [products, setProducts] = useState([]);

  const openModel = () => setIsModalOpen(true);
  const closeModel = () => setIsModalOpen(false);


  const handleSubmit = (event) => {
    event.preventDefault();
    if (userName) {
      localStorage.setItem("data", userName);
    }
    setUserName("");
  };

  const featchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*");
    if (error) {
      alert(error.message)
    } else {
      setProducts(data);
    }
  }

  useEffect(() => {
    featchProducts();
  }, [])


  const renderProducts = () => {
    return products.map((product, index) => (
      <AdminDashboardProductCard
        key={product.id}
        name={product.name}
        description={product.description}
        price={product.price}
        image={product.image}

      />
    ));
  };


  return (
    <>
      <h1 className="title">Admin Dashboard</h1>

      <form onSubmit={handleSubmit}>
        <label>
          {" "}
          Please enter your name{" "}
          <input
            name="Name"
            onChange={(e) => setUserName(e.target.value)}
            type="text"
            value={userName}
          />
        </label>

        <button type="submit">submit</button>
      </form>
      <Link to="/">Go to Home Page</Link>

      <div className="body">
        {renderProducts()}
        <ButtonAddProduct openModel={openModel} />
      </div>

      {isModalOpen && (
        <ProductModal closeModel={closeModel} onProductAdded={featchProducts} />
      )}
    </>
  );
}

export default AdminDashboard;
