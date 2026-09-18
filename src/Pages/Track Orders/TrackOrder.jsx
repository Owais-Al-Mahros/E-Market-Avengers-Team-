import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import CartHeader from "../Cart and payments/pages/ShoppingCart/components/CartHeader";
import Footer from "../../Components/Footer";
import OrderSearch from "./components/OrderSearch";
import OrderStatusTracker from "./components/OrderStatusTracker";
import OrderDetailsView from "./components/OrderDetailsView";
import OrderActionsPanel from "./components/OrderActionsPanel";
import AmendmentHistory from "./components/AmendmentHistory";
import "./TrackOrder.css";

export default function TrackOrder() {
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [justPaid, setJustPaid] = useState(false);

    // ============================================
    // استقبال الحالة من BillAndPayment
    // ============================================
    useEffect(() => {
        if (location.state?.justPaid) {
            setJustPaid(true);
        }
    }, [location.state]);

    // ============================================
    // عند العثور على الطلب
    // ============================================
    const handleOrderFound = (foundOrder) => {
        setOrder(foundOrder);

        // ✅ حفظ آخر طلب في localStorage (ليعود إليه العميل لاحقاً)
        try {
            localStorage.setItem(
                "lastTrackedOrder",
                JSON.stringify({
                    order_number: foundOrder.order_number,
                    email: foundOrder.customer_info?.email,
                    tracked_at: new Date().toISOString(),
                })
            );
        } catch (err) {
            console.warn("Failed to save last order:", err);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ============================================
    // العودة إلى البحث
    // ============================================
    const handleBackToSearch = () => {
        setOrder(null);
        setJustPaid(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ============================================
    // إعادة تحميل الطلب (بعد إجراء)
    // ============================================
    const handleRefresh = async () => {
        setOrder(null);
    };

    // ============================================
    // Render
    // ============================================
    return (
        <div className="track-order-page">
            <CartHeader currentStep={null} />

            <main className="track-order-main">
                {!order ? (
                    /* ============ وضع البحث ============ */
                    <OrderSearch
                        onOrderFound={handleOrderFound}
                        initialOrderNumber={location.state?.prefilledOrder?.order_number || ""}
                        initialEmail={location.state?.prefilledOrder?.email || ""}
                        autoSubmit={location.state?.autoSearch || false}
                    />
                ) : (
                    /* ============ وضع عرض الطلب ============ */
                    <div className="track-order-result">
                        {/* ✅ رسالة نجاح الدفع (تظهر فقط بعد الدفع) */}
                        {justPaid && (
                            <div className="track-order-success-banner">
                                <span className="material-symbols-outlined">check_circle</span>
                                <div>
                                    <strong>Zahlung erfolgreich!</strong>
                                    <p>
                                        Ihre Bestellung wurde erfolgreich aufgenommen und wird jetzt
                                        bearbeitet.
                                    </p>

                                    {/* ✅ عرض رقم الطلب */}
                                    <div className="track-order-number-display">
                                        <span className="track-order-number-label">Ihre Bestellnummer:</span>
                                        <strong className="track-order-number-value">
                                            {order?.order_number}
                                        </strong>
                                    </div>

                                    <p className="track-order-success-hint">
                                        <span className="material-symbols-outlined">bookmark</span>
                                        <span>
                                            <strong>Bitte speichern Sie diese Nummer</strong> für die spätere
                                            Sendungsverfolgung. Sie können jederzeit unter
                                            <em> "Bestellung verfolgen" </em> zurückkehren.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* زر العودة إلى البحث */}
                        <button
                            className="track-order-back-btn"
                            onClick={handleBackToSearch}
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Andere Bestellung verfolgen
                        </button>

                        {/* شريط الحالة */}
                        <OrderStatusTracker
                            status={order.status}
                            orderNumber={order.order_number}
                        />

                        {/* تفاصيل الطلب */}
                        <OrderDetailsView order={order} />

                        {/* لوحة الإجراءات */}
                        <OrderActionsPanel order={order} onRefresh={handleRefresh} />

                        {/* سجل التعديلات */}
                        <AmendmentHistory orderId={order.id} />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}