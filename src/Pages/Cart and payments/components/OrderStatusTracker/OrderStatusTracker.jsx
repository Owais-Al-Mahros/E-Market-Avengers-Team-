import "./OrderStatusTracker.css";

export default function OrderStatusTracker({ status, orderNumber }) {
    // تحديد المرحلة الحالية (0, 1, 2, 3)
    const getStepIndex = () => {
        switch (status) {
            case "pending": return 0;
            case "confirmed": return 1;
            case "shipped": return 2;
            case "delivered": return 3;
            default: return 0;
        }
    };

    const activeStep = getStepIndex();

    // بيانات المراحل
    const steps = [
        { label: "Order Placed", icon: "checklist" },
        { label: "Confirmed", icon: "fact_check" },
        { label: "Shipped", icon: "local_shipping" },
        { label: "Delivered", icon: "task_alt" },
    ];

    // نصوص وأيقونات حسب الحالة (تظهر في المنتصف)
    const statusContent = {
        pending: {
            title: "⏳ Waiting for Confirmation",
            desc: "Your order has been received. The admin will confirm it shortly.",
            icon: "hourglass_empty",
            color: "#f59e0b", // برتقالي
            animation: "pulse",
        },
        confirmed: {
            title: "✅ Order Confirmed!",
            desc: "Great news! Your order has been confirmed. We are preparing your items.",
            icon: "check_circle",
            color: "#3b82f6", // أزرق
            animation: "bounce",
        },
        shipped: {
            title: "🚚 Your Order is on the Way!",
            desc: "The driver is heading to your location. Please be ready to receive it.",
            icon: "local_shipping",
            color: "#8b5cf6", // بنفسجي
            animation: "drive",
        },
        delivered: {
            title: "🎉 Delivered Successfully!",
            desc: "Your order has been delivered. Thank you for shopping with GreenCart!",
            icon: "celebration",
            color: "#10b981", // أخضر
            animation: "confetti",
        },
        cancelled: {
            title: "❌ Order Cancelled",
            desc: "This order has been cancelled. If you have any questions, please contact support.",
            icon: "cancel",
            color: "#ef4444", // أحمر
            animation: "none",
        },
    };

    // إذا كانت الحالة "cancelled"، نعرض تصميم مختلف (لا نعرض شريط التقدم)
    if (status === "cancelled") {
        return (
            <div className="tracker-container cancelled">
                <div className="tracker-header">
                    <h2>📦 Order #{orderNumber}</h2>
                    <span className="status-badge status-cancelled">Cancelled</span>
                </div>
                <div className="tracker-content">
                    <div className="status-icon-large" style={{ color: "#ef4444" }}>
                        <span className="material-symbols-outlined">cancel</span>
                    </div>
                    <h3 style={{ color: "#991b1b" }}>Order Cancelled</h3>
                    <p>This order has been cancelled by the admin.</p>
                    <button className="btn-contact">Contact Support</button>
                </div>
            </div>
        );
    }

    // الحالة الحالية (غير ملغية)
    const currentStatus = statusContent[status] || statusContent.pending;

    return (
        <div className="tracker-container">
            {/* رأس الطلب */}
            <div className="tracker-header">
                <h2>📦 Order #{orderNumber}</h2>
                <span className={`status-badge status-${status}`}>{status}</span>
            </div>

            {/* ===== شريط التقدم (الخطوات) ===== */}
            <div className="progress-steps">
                {steps.map((step, index) => (
                    <div key={index} className="step-item">
                        <div className={`step-circle ${index <= activeStep ? "active" : ""}`}>
                            <span className="material-symbols-outlined">{step.icon}</span>
                        </div>
                        <span className="step-label">{step.label}</span>
                        {index < steps.length - 1 && (
                            <div className={`step-line ${index < activeStep ? "active" : ""}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ===== المحتوى الديناميكي (الأنيميشن والنص) ===== */}
            <div className="tracker-content">
                <div className={`status-display ${currentStatus.animation}`}>
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "64px", color: currentStatus.color }}
                    >
                        {currentStatus.icon}
                    </span>
                </div>
                <h3 style={{ color: currentStatus.color }}>{currentStatus.title}</h3>
                <p>{currentStatus.desc}</p>

                {/* زر إجراء (يظهر فقط عند التوصيل) */}
                {status === "delivered" && (
                    <button className="btn-invoice">📄 Download Invoice</button>
                )}
                {status === "pending" && (
                    <div className="waiting-spinner">
                        <span className="spinner"></span> Waiting for admin...
                    </div>
                )}
            </div>
        </div>
    );
}