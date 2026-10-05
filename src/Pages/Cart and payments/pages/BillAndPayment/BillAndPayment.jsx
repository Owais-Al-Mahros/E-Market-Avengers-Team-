import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import toast from "react-hot-toast";
import CartHeader from "../ShoppingCart/components/CartHeader";
import Footer from "../../../../components/layout/Footer";
import Invoice from "../../../../components/invoice/Invoice";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../../../../lib/stripe";
import "./BillAndPayment.css";

// ============================================================
// ✅ ثابت الهامش (نفس ما هو في create-payment-intent)
// ============================================================
const WEIGHT_BUFFER = 5.0;

// ============================================================
// ✅ Helper: تنسيق اليورو
// ============================================================
const fmtEur = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

// ============================================================
// ✅ Helper: استدعاء Edge Function
// ============================================================
async function callEdgeFunction(path, payload) {
    const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify(payload),
        }
    );
    return res.json().catch(() => ({ success: false, error: "Bad JSON response" }));
}

/* ============================================
   نموذج Stripe
============================================ */
function CheckoutForm({ orderId, clientSecret, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements || !isReady) {
            toast.error("Payment form is still loading, please wait...");
            return;
        }

        setIsProcessing(true);
        setPaymentError(null);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setPaymentError(submitError.message);
                toast.error(submitError.message);
                setIsProcessing(false);
                return;
            }

            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/track-order`,
                },
                redirect: "if_required",
            });

            if (error) {
                setPaymentError(error.message);
                toast.error(error.message);
                setIsProcessing(false);
                return;
            }

            if (
                paymentIntent &&
                (paymentIntent.status === "succeeded" ||
                    paymentIntent.status === "requires_capture" ||
                    paymentIntent.status === "processing")
            ) {
                if (paymentIntent.status === "requires_capture") {
                    toast.success("Payment authorized! ✅");
                } else if (paymentIntent.status === "processing") {
                    toast.success("Payment processing...");
                } else {
                    toast.success("Payment successful! 🎉");
                }

                // ✅ نمرّر paymentIntent.id لـ onSuccess
                onSuccess(paymentIntent.id);
            } else {
                setPaymentError(
                    "Unexpected payment status: " +
                    (paymentIntent?.status || "unknown")
                );
                setIsProcessing(false);
            }
        } catch (err) {
            setPaymentError(err.message || "Something went wrong");
            toast.error(err.message || "Payment failed");
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="stripe-form">
            <PaymentElement onReady={() => setIsReady(true)} />

            {paymentError && (
                <div className="stripe-error">
                    <span className="material-symbols-outlined">error</span>
                    {paymentError}
                </div>
            )}

            <button
                type="submit"
                className="bill-confirm-btn"
                disabled={!stripe || !elements || !isReady || isProcessing}
            >
                <span className="material-symbols-outlined">lock</span>
                {isProcessing
                    ? "Wird verarbeitet..."
                    : !isReady
                        ? "Wird geladen..."
                        : "Zahlungspflichtig bestellen"}
            </button>

            <p className="stripe-note">
                🔒 Ihre Zahlung wird sicher über Stripe abgewickelt. Der Betrag wird erst
                nach Bestätigung des endgültigen Gewichts belastet.
            </p>
        </form>
    );
}

/* ============================================
   المكوّن الرئيسي
============================================ */
export default function BillAndPayment() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState("");

    // ============================================================
    // ✅ 1. جلب الطلب عبر Edge Function (service_role)
    // ============================================================
    useEffect(() => {
        if (!orderId) {
            navigate("/");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const result = await callEdgeFunction("get-order-for-payment", {
                    orderId,
                });

                if (cancelled) return;

                if (!result.success || !result.order) {
                    toast.error(result.error || "Order not found");
                    navigate("/");
                    return;
                }

                setOrder(result.order);
                setLoading(false);
            } catch (err) {
                if (cancelled) return;
                console.error("Failed to fetch order:", err);
                toast.error("Fehler beim Laden der Bestellung");
                navigate("/");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [orderId, navigate]);

    // ============================================================
    // ✅ 2. إنشاء PaymentIntent عبر Edge Function
    // ============================================================
    useEffect(() => {
        if (!orderId || clientSecret) return;

        let cancelled = false;

        (async () => {
            try {
                const data = await callEdgeFunction("create-payment-intent", {
                    orderId,
                });

                if (cancelled) return;

                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    toast.error(data.error || "Failed to initialize payment");
                }
            } catch (error) {
                if (cancelled) return;
                console.error("Error creating payment intent:", error);
                toast.error("Failed to initialize payment");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [orderId, clientSecret]);

    // ============================================================
    // ✅ 3. عند نجاح الدفع — استدعاء mark-order-paid
    // ============================================================
    const handlePaymentSuccess = async (paymentIntentId) => {
        try {
            const result = await callEdgeFunction("mark-order-paid", {
                orderId,
                paymentIntentId,
            });

            if (!result.success) {
                console.error("mark-order-paid failed:", result.error);
                // لا نُعطّل المستخدم — Webhook سيُصلح الحالة لاحقًا
            }
        } catch (err) {
            console.error("mark-order-paid error:", err);
        }

        clearCart();

        toast.success("✅ Zahlung erfolgreich! Bestellung wird verarbeitet.", {
            duration: 4000,
        });

        navigate("/track-order", {
            state: {
                autoSearch: true,
                justPaid: true,
                prefilledOrder: {
                    order_number: order.order_number,
                    email: order.customer_info?.email,
                },
            },
            replace: true,
        });
    };

    // ============================================================
    // Loading
    // ============================================================
    if (loading) {
        return (
            <div className="bill-page">
                <CartHeader currentStep={4} />
                <div className="bill-loading">
                    <div className="bill-spinner" />
                    <p>Bestellübersicht wird geladen...</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    // ============================================================
    // تجهيز عناصر الفاتورة
    // ============================================================
    const activeItems =
        order.order_items?.filter((item) => !item.is_returned) || [];

    const invoiceItems = activeItems.map((item) => ({
        ...item,
        _displayQuantity: item.quantity,
        _isRemoved: false,
        _isAdjusted: false,
    }));

    const subtotal = invoiceItems.reduce(
        (sum, item) => sum + parseFloat(item.total_price || 0),
        0
    );
    const shippingCost = parseFloat(order.shipping_cost || 0);
    const estimatedTotal = subtotal + shippingCost;

    return (
        <div className="bill-page">
            <CartHeader currentStep={4} />

            <main className="bill-main">
                <div className="bill-hero">
                    <span className="bill-badge">🧾 Letzter Schritt</span>
                    <h1>Bestellung prüfen & bezahlen</h1>
                    <p>
                        Bestellung <strong>#{order.order_number}</strong> — Schließen Sie die
                        Zahlung ab, um die Bestellung zu bestätigen.
                    </p>
                </div>

                <div className="bill-layout">
                    {/* ============================================
                        LEFT: Invoice
                    ============================================ */}
                    <Invoice
                        order={order}
                        items={invoiceItems}
                        variant="preview"
                        showTaxBreakdown={true}
                        showAdjustmentNotice={false}
                        showWarningBanner={false}
                        showPaymentInfo={false}
                        showBufferInfo={true}
                        bufferAmount={WEIGHT_BUFFER}
                        afterTotalsSlot={
                            <div className="bill-explanation">
                                <div className="bill-explanation-icon">ℹ️</div>
                                <div>
                                    <strong>
                                        Warum reservieren wir €
                                        {fmtEur(WEIGHT_BUFFER)} extra?
                                    </strong>
                                    <p>
                                        Frischeprodukte werden nach Gewicht
                                        verkauft. Daher kann der endgültige
                                        Preis leicht vom geschätzten Betrag
                                        abweichen. Um eine reibungslose
                                        Abwicklung zu gewährleisten, reservieren
                                        wir vorübergehend{" "}
                                        <strong>€{fmtEur(WEIGHT_BUFFER)}</strong>{" "}
                                        zusätzlich auf Ihrer Zahlungsmethode.
                                    </p>
                                    <div className="bill-explanation-points">
                                        <div className="bill-explanation-point">
                                            <span className="material-symbols-outlined">
                                                check_circle
                                            </span>
                                            <span>
                                                Sie werden{" "}
                                                <strong>
                                                    nur für die tatsächlich
                                                    gelieferte Menge
                                                </strong>{" "}
                                                belastet.
                                            </span>
                                        </div>
                                        <div className="bill-explanation-point">
                                            <span className="material-symbols-outlined">
                                                schedule
                                            </span>
                                            <span>
                                                Der nicht verwendete Betrag wird{" "}
                                                <strong>
                                                    automatisch innerhalb von 3-5
                                                    Werktagen
                                                </strong>{" "}
                                                freigegeben.
                                            </span>
                                        </div>
                                        <div className="bill-explanation-point">
                                            <span className="material-symbols-outlined">
                                                shield
                                            </span>
                                            <span>
                                                <strong>
                                                    Keine versteckten Gebühren.
                                                </strong>{" "}
                                                Diese Reserve ist keine Zahlung,
                                                sondern nur eine Sicherheit.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    />

                    {/* ============================================
                        RIGHT: Stripe Payment
                    ============================================ */}
                    <div className="bill-payment">
                        <div className="bill-payment-section">
                            <h2>🔐 Sichere Zahlung</h2>
                            <p className="bill-payment-sub">
                                Ihre Zahlung wird jetzt autorisiert und nach Bestätigung des Gewichts belastet.
                            </p>

                            {clientSecret ? (
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret,
                                        appearance: {
                                            theme: "stripe",
                                            variables: {
                                                colorPrimary: "#145c4a",
                                                colorBackground: "#ffffff",
                                                colorText: "#15312B",
                                                borderRadius: "12px",
                                                fontFamily: "inherit",
                                            },
                                        },
                                    }}
                                >
                                    <CheckoutForm
                                        orderId={order.id}
                                        clientSecret={clientSecret}
                                        onSuccess={handlePaymentSuccess}
                                    />
                                </Elements>
                            ) : (
                                <div className="bill-loading-inline">
                                    <div className="bill-spinner-small" />
                                    <span>Zahlung wird vorbereitet...</span>
                                </div>
                            )}
                        </div>

                        <div className="bill-security-badge">
                            <span className="material-symbols-outlined">
                                verified_user
                            </span>
                            <div>
                                <strong>Powered by Stripe</strong>
                                <small>PCI-DSS Level 1 Certified</small>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}