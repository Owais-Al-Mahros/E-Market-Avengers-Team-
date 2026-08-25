import { Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import ShoppingCart from "./pages/ShoppingCart.jsx"

function CartAndPayments() {
    return (
        <>
            <Routes>
                <Route path='/' element={<ShoppingCart />} />
            </Routes>
        </>
    )
}

export default CartAndPayments