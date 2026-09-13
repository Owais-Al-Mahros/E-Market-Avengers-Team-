import { Routes, Route } from "react-router-dom";
import ShoppingCart from "./pages/ShoppingCart/ShoppingCart.jsx"
import CheckoutPage from "./pages/Checkout/CheckoutPage.jsx";
import OrderConfirmation from "./pages/OrderConfirmation/OrderConfirmation.jsx";
import BillAndPayment from "./pages/BillAndPayment/BillAndPayment.jsx";
function CartAndPayments() {
    return (
        <>
            <Routes>
                <Route path='/' element={<ShoppingCart />} />
                <Route path='/Checkout' element={<CheckoutPage />} />
                <Route path='/order-confirmation' element={<OrderConfirmation />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/BillAndPayment/:orderId" element={<BillAndPayment />} />

            </Routes>
        </>
    )
}

export default CartAndPayments