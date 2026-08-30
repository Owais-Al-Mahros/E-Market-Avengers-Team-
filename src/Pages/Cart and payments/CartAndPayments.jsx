import { Routes, Route } from "react-router-dom";
import ShoppingCart from "./pages/ShoppingCart.jsx"
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";

function CartAndPayments() {
    return (
        <>
            <Routes>
                <Route path='/' element={<ShoppingCart />} />
                <Route path='/Checkout' element={<CheckoutPage />} />
                <Route path='/order-confirmation' element={<OrderConfirmation />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            </Routes>
        </>
    )
}

export default CartAndPayments