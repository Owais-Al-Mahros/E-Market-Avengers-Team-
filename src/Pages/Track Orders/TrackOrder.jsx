import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import OrderSearch from "./components/search/OrderSearch";
import OrderStatusTracker from "./components/status/OrderStatusTracker";
import OrderDetailsView from "./components/details/OrderDetailsView";
import OrderActionsPanel from "./components/actions/OrderActionsPanel";
import AmendmentHistory from "./components/actions/AmendmentHistory";
import { verifyOrderAccess } from "../../api/orders";
import { saveLastOrder } from "../../lib/lastOrder";
import toast from "react-hot-toast";
import "./TrackOrder.css";

export default function TrackOrder() {
    const location = useLocation();

    const [order, setOrder] = useState(null);
    const [justPaid, setJustPaid] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // ============================================
    // استقبال الحالة من BillAndPayment
    // ============================================
    useEffect(() => {
        if (location.state?.justPaid) setJustPaid(true);
    }, [location.state]);

    // ============================================
    // عند العثور على الطلب
    // ============================================
    const handleOrderFound = useCallback((foundOrder) => {
        setOrder(foundOrder);

        // ✅ حفظ آخر طلب (مصدر واحد)
        saveLastOrder(foundOrder);

        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // ============================================
    // العودة إلى البحث
    // ============================================
    const handleBackToSearch = () => {
        setOrder(null);
        setJustPaid(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ============================================
    // ✅ إعادة جلب الطلب (بعد إجراء إلغاء/تعديل/إرجاع)
    // ============================================
    const handleRefresh = async () => {
        if (!order || refreshing) return;

        const orderNumber = order.order_number;
        const email = order.customer_info?.email;

        if (!orderNumber || !email) {
            // لا نستطيع إعادة الجلب — نعود للبحث
            handleBackToSearch();
            return;
        }

        setRefreshing(true);
        const toastId = toast.loading("Bestellung wird aktualisiert...");

        const result = await verifyOrderAccess(orderNumber, email);

        if (!result.success) {
            toast.error(result.error || "Aktualisierung fehlgeschlagen", {
                id: toastId,
            });
            setRefreshing(false);
            return;
        }

        // ✅ تحديث الطلب بالبيانات الجديدة
        setOrder(result.order);
        saveLastOrder(result.order);

        toast.success("Bestellung aktualisiert", { id: toastId });
        setRefreshing(false);

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ============================================
    // Render
    // ============================================
    return (
        <div className="track-order-page">
            {/* ✅ Header الرئيسي بدل CartHeader */}
            <Header />

            <main className="track-order-main">
                {!order ? (
                    <OrderSearch
                        onOrderFound={handleOrderFound}
                        initialOrderNumber={
                            location.state?.prefilledOrder?.order_number || ""
                        }
                        initialEmail={
                            location.state?.prefilledOrder?.email || ""
                        }
                        autoSubmit={location.state?.autoSearch || false}
                    />
                ) : (
                    <div className="track-order-result">
                        {/* ✅ رسالة نجاح الدفع */}
                        {justPaid && (
                            <div className="track-order-success-banner">
                                <span className="material-symbols-outlined">
                                    check_circle
                                </span>
                                <div>
                                    <strong>Bestellung erfolgreich übermittelt!</strong>
                                    <p>
                                        Ihre Bestellung wurde erfolgreich aufgenommen und wird nun geprüft.
                                        Der Betrag ist vorübergehend reserviert und wird erst nach der
                                        Gewichtsbestätigung endgültig belastet.
                                    </p>

                                    <div className="track-order-number-display">
                                        <span className="track-order-number-label">
                                            Ihre Bestellnummer:
                                        </span>
                                        <strong className="track-order-number-value">
                                            {order?.order_number}
                                        </strong>
                                    </div>

                                    <p className="track-order-success-hint">
                                        <span className="material-symbols-outlined">
                                            bookmark
                                        </span>
                                        <span>
                                            <strong>
                                                Bitte speichern Sie diese Nummer
                                            </strong>{" "}
                                            für die spätere Sendungsverfolgung. Sie können
                                            jederzeit unter
                                            <em> "Bestellung verfolgen" </em>{" "}
                                            zurückkehren.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* زر العودة إلى البحث */}
                        <button
                            className="track-order-back-btn"
                            onClick={handleBackToSearch}
                            disabled={refreshing}
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Andere Bestellung verfolgen
                        </button>

                        {/* شريط الحالة */}
                        <OrderStatusTracker
                            status={order.status}
                            orderNumber={order.order_number}
                        />

                        {/* تفاصيل الطلب (الفاتورة) */}
                        <OrderDetailsView order={order} />

                        {/* لوحة الإجراءات */}
                        <OrderActionsPanel
                            order={order}
                            onRefresh={handleRefresh}
                        />

                        <AmendmentHistory amendments={order.amendments || []} />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}