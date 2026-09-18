import { Routes, Route, Navigate } from "react-router-dom";
import ShoppingCart from "./pages/ShoppingCart/ShoppingCart";
import CheckoutPage from "./pages/Checkout/CheckoutPage";
import DeliveryTimePage from "./pages/DeliveryTime/DeliveryTimePage";
import BillAndPayment from "./pages/BillAndPayment/BillAndPayment";
import { CheckoutProvider } from "../../context/CheckoutContext";

export default function CartAndPayments() {
    return (
        <CheckoutProvider>
            <Routes>
                <Route path="/" element={<ShoppingCart />} />
                <Route path="/Checkout" element={<CheckoutPage />} />
                <Route path="/DeliveryTime" element={<DeliveryTimePage />} />
                <Route path="/BillAndPayment/:orderId" element={<BillAndPayment />} />
                <Route path="*" element={<Navigate to="/Cart&Payments" replace />} />
            </Routes>
        </CheckoutProvider>
    );
}

