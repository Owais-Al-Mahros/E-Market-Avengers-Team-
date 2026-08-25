import { Routes, Route } from "react-router-dom";
import ShoppingCart from "./pages/ShoppingCart.jsx"
import CheckoutPage from "./pages/CheckoutPage.jsx";

function CartAndPayments() {
    return (
        <>
            <Routes>
                <Route path='/' element={<ShoppingCart />} />
                <Route path='/Checkout' element={<CheckoutPage />} />
            </Routes>
        </>
    )
}

export default CartAndPayments