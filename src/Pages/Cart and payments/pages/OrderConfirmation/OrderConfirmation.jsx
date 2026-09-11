import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import CartHeader from "../ShoppingCart/components/CartHeader";
import "./OrderConfirmation.css";

const STATUS_STEPS = [
    { key: "pending", label: "Order Received", icon: "📥", desc: "We've received your order" },
    { key: "confirmed", label: "Confirmed", icon: "✅", desc: "Your order is being prepared" },
    { key: "shipped", label: "On the Way", icon: "🚚", desc: "Your order is out for delivery" },
    { key: "delivered", label: "Delivered", icon: "🎉", desc: "Enjoy your purchase!" },
];

export default function OrderConfirmation() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // ============================================
    // جلب الطلب
    // ============================================
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

    // ============================================
    // حالة التحميل
    // ============================================
    if (loading) {
        return (
            <div className="confirmation-page">
                <CartHeader currentStep={5} />
                <div className="confirmation-loading">
                    <div className="confirmation-spinner"></div>
                    <p>Loading your order...</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    // ============================================
    // حالة الإلغاء
    // ============================================
    if (order.status === "cancelled") {
        return (
            <div className="confirmation-page">
                <CartHeader currentStep={5} />

                <main className="confirmation-main">
                    <div className="cancelled-card">
                        <div className="cancelled-icon-wrap">
                            <span className="material-symbols-outlined">cancel</span>
                        </div>

                        <span className="cancelled-badge">Order Cancelled</span>

                        <h2>We're sorry to see this</h2>
                        <p className="cancelled-text">
                            Your order <strong>#{order.order_number}</strong> has been cancelled.
                        </p>
                        <p className="cancelled-subtext">
                            If you have any questions, please contact our support team.
                            We'd love to serve you again soon.
                        </p>

                        <button className="cancelled-btn-home" onClick={() => navigate("/")}>
                            <span className="material-symbols-outlined">home</span>
                            Back to Homepage
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // ============================================
    // الحالة النشطة (pending, confirmed, shipped, delivered)
    // ============================================
    const currentIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

    return (
        <div className="confirmation-page">
            <CartHeader currentStep={5} />

            <main className="confirmation-main">
                <div className="confirmation-tracker">
                    {/* ===== Hero ===== */}
                    <div className="tracker-hero">
                        <div className="tracker-success-icon">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <h1 className="tracker-title">Thank you for your order!</h1>
                        <p className="tracker-subtitle">
                            Your order <strong>#{order.order_number}</strong> has been received successfully.
                        </p>
                    </div>

                    {/* ===== Status Card ===== */}
                    <div className="tracker-card">
                        <div className="tracker-steps">
                            {STATUS_STEPS.map((step, idx) => {
                                const isActive = idx === currentIndex;
                                const isPast = idx < currentIndex;
                                const isFuture = idx > currentIndex;

                                return (
                                    <div
                                        key={step.key}
                                        className={`tracker-step ${isActive ? "active" : ""} ${isPast ? "past" : ""
                                            } ${isFuture ? "future" : ""}`}
                                    >
                                        <div className="tracker-circle">
                                            {isPast ? (
                                                <span className="material-symbols-outlined">check</span>
                                            ) : (
                                                <span>{step.icon}</span>
                                            )}
                                        </div>

                                        <div className="tracker-step-info">
                                            <span className="tracker-step-label">{step.label}</span>
                                            <span className="tracker-step-desc">{step.desc}</span>
                                        </div>

                                        {idx < STATUS_STEPS.length - 1 && (
                                            <div className="tracker-line" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ===== Note ===== */}
                    <div className="tracker-note">
                        <span className="material-symbols-outlined">info</span>
                        <p>
                            You'll receive updates as your order progresses.
                            Save your order number <strong>#{order.order_number}</strong> for reference.
                        </p>
                    </div>

                    {/* ===== Actions ===== */}
                    <div className="tracker-actions">
                        <button
                            className="tracker-btn-secondary"
                            onClick={() => navigate("/")}
                        >
                            <span className="material-symbols-outlined">home</span>
                            Back to Home
                        </button>
                        <button
                            className="tracker-btn-primary"
                            onClick={() => navigate("/Cart&Payments")}
                        >
                            <span className="material-symbols-outlined">shopping_bag</span>
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}