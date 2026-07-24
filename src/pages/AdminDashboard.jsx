import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

import ButtonAddProduct from "../components/ButtonAddProduct";
import ProductModal from "../components/productModal/ProductModal";
import ProductCard from "../components/ProductCard";
import AdminDashboardProductCard from "../components/AdminDashboardProductCard";

function AdminDashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [products, setProducts] = useState([]);

    const openModel = () => setIsModalOpen(true);
    const closeModel = () => setIsModalOpen(false);




    const Delete = (productName) => {
        const updatedProducts = products.filter(product => product.name !== productName);
        setProducts(updatedProducts);
        localStorage.setItem("products", JSON.stringify(updatedProducts));
    };




    const handleSubmit = (event) => {
        event.preventDefault();
        if (userName) {
            localStorage.setItem("data", userName);
        }
        setUserName("");
    }

    const loadProduts = () => {
        const StoredProducts = localStorage.getItem("products");
        setProducts(StoredProducts ? JSON.parse(StoredProducts) : []);
    };

    const renderProducts = () => {
        return products.map((product, index) => (
            <AdminDashboardProductCard
                key={index}
                name={product.name}
                description={product.description}
                price={product.price}
                Delete={Delete} />
        ))
    }

    useEffect(() => {
        loadProduts();
    }, [])




    return (
        <>

            <h1 className="title">Admin Dashboard</h1>

            <form onSubmit={handleSubmit}>
                <label> Please enter your name <input name="Name" onChange={(e) => setUserName(e.target.value)} type="text" value={userName} /></label>

                <button type="submit">submit</button>
            </form>
            <Link to="/">Go to Home Page</Link>

            <div className="body">
                {renderProducts()}
                <ButtonAddProduct openModel={openModel} />
            </div>


            {isModalOpen && <ProductModal closeModel={closeModel} onProductAdded={loadProduts} />}


        </>
    )
}

export default AdminDashboard