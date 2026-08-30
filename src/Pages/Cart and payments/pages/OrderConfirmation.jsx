import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import OrderStatusTracker from "./theComponents/OrderStatusTracker";
import "./OrderConfirmation.css";

export default function OrderConfirmation() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                navigate("/");
                return;
            }

            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            weight,
            total_weight
          )
        `)
                .eq("id", orderId)
                .single();

            if (error || !data) {
                navigate("/");
                return;
            }

            setOrder(data);
            setLoading(false);
        };

        fetchOrder();
    }, [orderId, navigate]);

    // ✅ حالة الإلغاء: نعرض رسالة اعتذار مع زر للعودة
    if (order && order.status === "cancelled") {
        return (
            <div className="cancelled-container">
                <div className="cancelled-card">
                    <span className="material-symbols-outlined cancel-icon">cancel</span>
                    <h2>❌ Order Cancelled</h2>
                    <p>
                        We're sorry, but your order <strong>#{order.order_number}</strong> has been cancelled.
                    </p>
                    <button className="btn-home" onClick={() => navigate("/")}>
                        🏠 Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your order...</p>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    // ✅ الحالات الأخرى (pending, confirmed, shipped, delivered)
    return (
        <div className="confirmation-page">
            <OrderStatusTracker status={order.status} orderNumber={order.order_number} />
        </div>
    );
}