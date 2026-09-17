import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import CartHeader from "../ShoppingCart/components/CartHeader";
import Footer from "./../../../../Components/Footer";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "../../../../lib/stripe";
import "./BillAndPayment.css";

const PRICE_ADJUSTMENT = 2.0;

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
                    return_url: `${window.location.origin}/Cart&Payments/order-confirmation/${orderId}`,
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
                    paymentIntent.status === "requires_capture")
            ) {
                if (paymentIntent.status === "requires_capture") {
                    toast.success("Payment authorized! ✅");
                } else {
                    toast.success("Payment successful! 🎉");
                }
                onSuccess();
            } else {
                setPaymentError(
                    "Unexpected payment status: " + (paymentIntent?.status || "unknown")
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
            <PaymentElement
                onReady={() => {
                    console.log("✅ PaymentElement ready");
                    setIsReady(true);
                }}
            />

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
                    ? "Processing..."
                    : !isReady
                        ? "Loading..."
                        : "Authorize Payment"}
            </button>

            <p className="stripe-note">
                🔒 Your payment is secured by Stripe. You will only be charged after
                we confirm the final weight and price.
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

    // ===== 1. جلب الطلب =====
    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                navigate("/");
                return;
            }

            const { data, error } = await supabase
                .from("orders")
                .select(
                    `
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
        `
                )
                .eq("id", orderId)
                .single();

            if (error || !data) {
                toast.error("Order not found");
                navigate("/");
                return;
            }

            setOrder(data);
            setLoading(false);
        };

        fetchOrder();
    }, [orderId, navigate]);

    // ===== 2. إنشاء PaymentIntent =====
    useEffect(() => {
        const createPaymentIntent = async () => {
            if (!orderId || clientSecret) return;

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                        },
                        body: JSON.stringify({ orderId }),
                    }
                );

                const data = await response.json();

                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    toast.error(data.error || "Failed to initialize payment");
                }
            } catch (error) {
                console.error("Error creating payment intent:", error);
                toast.error("Failed to initialize payment");
            }
        };

        createPaymentIntent();
    }, [orderId, clientSecret]);

    // ===== 3. عند نجاح الدفع → تحويل الطلب إلى "pending" =====
    const handlePaymentSuccess = async () => {
        try {
            // ✅ الآن يظهر في الداشبورد
            const { error } = await supabase
                .from("orders")
                .update({
                    status: "pending",                        // ← يظهر للأدمن
                    payment_method: "card",
                    payment_status: "authorized",
                    price_adjustment: PRICE_ADJUSTMENT,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            if (error) {
                console.error("Failed to update order status:", error);
                toast.error("Payment succeeded but order update failed. Contact support.");
            } else {
                console.log("✅ Order status → pending");
            }
        } catch (err) {
            console.error("Update error:", err);
        }

        clearCart();
        navigate(`/Cart&Payments/order-confirmation/${orderId}`);
    };

    // ===== حالات التحميل =====
    if (loading) {
        return (
            <div className="bill-page">
                <CartHeader currentStep={4} />
                <div className="bill-loading">
                    <div className="bill-spinner" />
                    <p>Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    // ===== الحسابات =====
    const subtotal = order.order_items.reduce(
        (sum, item) => sum + parseFloat(item.total_price || 0),
        0
    );
    const shippingCost = parseFloat(order.shipping_cost || 0);
    const tax = parseFloat(order.tax || 0);
    const adjustment = PRICE_ADJUSTMENT;
    const grandTotal = subtotal + shippingCost + tax + adjustment;

    return (
        <div className="bill-page">
            <CartHeader currentStep={4} />

            <main className="bill-main">
                {/* ===== Hero ===== */}
                <div className="bill-hero">
                    <span className="bill-badge">🧾 Final Step</span>
                    <h1>Review & Pay</h1>
                    <p>
                        Order <strong>#{order.order_number}</strong> — Complete your payment
                        to finalize.
                    </p>
                </div>

                <div className="bill-layout">
                    {/* ============================================
              LEFT: Invoice
          ============================================ */}
                    <div className="bill-invoice">
                        <div className="bill-invoice-header">
                            <h2>📋 Invoice</h2>
                            <span className="bill-items-count">
                                {order.order_items.length} items
                            </span>
                        </div>

                        <div className="bill-items">
                            {order.order_items.map((item) => (
                                <div key={item.id} className="bill-item">
                                    <div className="bill-item-info">
                                        <span className="bill-item-name">{item.product_name}</span>
                                        <span className="bill-item-qty">
                                            {item.quantity} × €
                                            {parseFloat(item.unit_price).toFixed(2)}
                                            {item.total_weight > 0 &&
                                                ` · ${parseFloat(item.total_weight).toFixed(2)} kg`}
                                        </span>
                                    </div>
                                    <span className="bill-item-total">
                                        €{parseFloat(item.total_price).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="bill-divider" />

                        <div className="bill-totals">
                            <div className="bill-row">
                                <span>Subtotal</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="bill-row">
                                <span>Shipping</span>
                                <span>€{shippingCost.toFixed(2)}</span>
                            </div>
                            <div className="bill-row">
                                <span>Tax (7%)</span>
                                <span>€{tax.toFixed(2)}</span>
                            </div>
                            <div className="bill-row bill-adjustment">
                                <span>
                                    ⚖️ Weight Adjustment Margin
                                    <small>Covers weight variations</small>
                                </span>
                                <span>+€{adjustment.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bill-divider" />

                        <div className="bill-grand-total">
                            <span>Estimated Total</span>
                            <span>€{grandTotal.toFixed(2)}</span>
                        </div>

                        <div className="bill-explanation">
                            <div className="bill-explanation-icon">ℹ️</div>
                            <div>
                                <strong>About the €{adjustment.toFixed(2)} margin</strong>
                                <p>
                                    Fresh products are sold by weight. The final price may vary
                                    slightly. This margin covers up to €{adjustment.toFixed(2)} in
                                    differences.
                                    <br />
                                    <strong>
                                        Any unused amount is automatically refunded within 3-5
                                        business days.
                                    </strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ============================================
              RIGHT: Stripe Payment Only
          ============================================ */}
                    <div className="bill-payment">
                        <div className="bill-payment-section">
                            <h2>🔐 Secure Payment</h2>
                            <p className="bill-payment-sub">
                                Your payment will be authorized now and charged after we confirm
                                the weight.
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
                                    <span>Preparing payment...</span>
                                </div>
                            )}
                        </div>

                        {/* Security Badge */}
                        <div className="bill-security-badge">
                            <span className="material-symbols-outlined">verified_user</span>
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