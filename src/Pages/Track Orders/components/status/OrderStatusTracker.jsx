import "./OrderStatusTracker.css";

const STEPS = [
    { label: "Bestellung", icon: "checklist" },
    { label: "Bestätigt", icon: "fact_check" },
    { label: "Unterwegs", icon: "local_shipping" },
    { label: "Zugestellt", icon: "task_alt" },
];

// ✅ ترجمة الحالات للعرض
const STATUS_LABELS = {
    awaiting_payment: "Zahlung ausstehend",
    pending: "In Prüfung",
    confirmed: "Bestätigt",
    shipped: "Unterwegs",
    delivered: "Zugestellt",
    cancelled: "Storniert",
};

const STATUS_CONTENT = {
    awaiting_payment: {
        title: "💳 Zahlung ausstehend",
        desc: "Ihre Bestellung ist reserviert. Bitte schließen Sie die Zahlung ab, damit wir sie bearbeiten können.",
        icon: "credit_card",
        color: "#f59e0b",
        animation: "pulse",
    },
    pending: {
        title: "⏳ Bestellung in Prüfung",
        desc: "Ihre Bestellung ist eingegangen. Wir prüfen sie und bestätigen sie in Kürze.",
        icon: "hourglass_empty",
        color: "#f59e0b",
        animation: "pulse",
    },
    confirmed: {
        title: "✅ Bestellung bestätigt!",
        desc: "Ihre Bestellung wurde bestätigt. Wir bereiten Ihre Artikel vor.",
        icon: "check_circle",
        color: "#3b82f6",
        animation: "bounce",
    },
    shipped: {
        title: "🚚 Ihre Bestellung ist unterwegs!",
        desc: "Unser Fahrer ist auf dem Weg. Bitte seien Sie bereit, die Lieferung entgegenzunehmen.",
        icon: "local_shipping",
        color: "#8b5cf6",
        animation: "drive",
    },
    delivered: {
        title: "🎉 Erfolgreich zugestellt!",
        desc: "Ihre Bestellung wurde zugestellt. Vielen Dank für Ihren Einkauf!",
        icon: "celebration",
        color: "#10b981",
        animation: "confetti",
    },
    cancelled: {
        title: "❌ Bestellung storniert",
        desc: "Diese Bestellung wurde storniert. Bei Fragen kontaktieren Sie bitte unseren Support.",
        icon: "cancel",
        color: "#ef4444",
        animation: "none",
    },
};

export default function OrderStatusTracker({ status, orderNumber }) {
    // ============================================
    // تحديد المرحلة الحالية
    // ============================================
    const getStepIndex = () => {
        switch (status) {
            case "awaiting_payment":
            case "pending":
                return 0;
            case "confirmed":
                return 1;
            case "shipped":
                return 2;
            case "delivered":
                return 3;
            default:
                return 0;
        }
    };

    const activeStep = getStepIndex();
    const isWaiting = status === "awaiting_payment" || status === "pending";

    // ============================================
    // حالة ملغية — تصميم مختلف
    // ============================================
    if (status === "cancelled") {
        return (
            <div className="tracker-container cancelled">
                <div className="tracker-header">
                    <h2>📦 Bestellung #{orderNumber}</h2>
                    <span className="status-badge status-cancelled">
                        {STATUS_LABELS.cancelled}
                    </span>
                </div>
                <div className="tracker-content">
                    <div
                        className="status-icon-large"
                        style={{ color: "#ef4444" }}
                    >
                        <span className="material-symbols-outlined">cancel</span>
                    </div>
                    <h3 style={{ color: "#991b1b" }}>Bestellung storniert</h3>
                    <p>Diese Bestellung wurde storniert.</p>
                    <button className="btn-contact">Support kontaktieren</button>
                </div>
            </div>
        );
    }

    const currentStatus = STATUS_CONTENT[status] || STATUS_CONTENT.pending;
    const statusLabel = STATUS_LABELS[status] || status;

    // ============================================
    // Render
    // ============================================
    return (
        <div className="tracker-container">
            {/* Header */}
            <div className="tracker-header">
                <h2>📦 Bestellung #{orderNumber}</h2>
                <span className={`status-badge status-${status}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
                {STEPS.map((step, index) => {
                    const isActive = index <= activeStep;
                    const isCurrent = index === activeStep;
                    // ✅ الخطوة الحالية في حالة الانتظار — لون برتقالي
                    const isPendingCurrent = isWaiting && isCurrent;

                    return (
                        <div key={index} className="step-item">
                            <div
                                className={`step-circle ${isActive ? "active" : ""
                                    } ${isPendingCurrent ? "pending-step" : ""
                                    }`}
                            >
                                <span className="material-symbols-outlined">
                                    {step.icon}
                                </span>
                            </div>
                            <span className="step-label">{step.label}</span>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`step-line ${index < activeStep ? "active" : ""
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Content */}
            <div className="tracker-content">
                <div className={`status-display ${currentStatus.animation}`}>
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize: "64px",
                            color: currentStatus.color,
                        }}
                    >
                        {currentStatus.icon}
                    </span>
                </div>
                <h3 style={{ color: currentStatus.color }}>
                    {currentStatus.title}
                </h3>
                <p>{currentStatus.desc}</p>

                {/* ✅ Waiting spinner — لكل من awaiting_payment و pending */}
                {isWaiting && (
                    <div className="waiting-spinner">
                        <span className="spinner"></span>
                        {status === "awaiting_payment"
                            ? "Warten auf Zahlung..."
                            : "In Prüfung..."}
                    </div>
                )}

                {status === "delivered" && (
                    <button className="btn-invoice">
                        📄 Rechnung herunterladen
                    </button>
                )}
            </div>
        </div>
    );
}