import { Link } from "react-router-dom"

import "./HomePage.css"

import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";

function HomePage() {
    // const storedAdmin = localStorage.getItem("isAdmin")
    const [products, setProducts] = useState([])


    useEffect(() => {
        const storedProducts = localStorage.getItem("products");
        setProducts(storedProducts ? JSON.parse(storedProducts) : []);
    }, []);


    const renderProducts = () => {
        return products.map((product, index) => (
            <ProductCard
                key={index}
                name={product.name}
                description={product.description}
                price={product.price} />
        ))
    }

    return (

        <>
            <h1>Home page</h1>
            <h3>Hello {localStorage.getItem("data")}</h3>


            <h2>Products</h2>
            <div className="Products">
                {renderProducts()}
            </div>





            <Link to="/login">Go To DashBoard</Link>
            {/* <Link to={storedAdmin == "true" ? "/dashboard" : "/login"}>Go To DashBoard</Link> */}
        </>
    )
}

export default HomePage