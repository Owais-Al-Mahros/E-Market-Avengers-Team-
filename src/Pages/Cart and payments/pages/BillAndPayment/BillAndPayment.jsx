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

const PAYMENT_METHODS = [
    {
        id: "card",
        icon: "💳",
        title: "Credit / Debit Card",
        desc: "Secure payment via Stripe",
    },
    {
        id: "cod",
        icon: "💵",
        title: "Cash on Delivery",
        desc: "Pay in cash when your order arrives",
    },
    {
        id: "bank",
        icon: "🏦",
        title: "Bank Transfer",
        desc: "Transfer to our bank account",
    },
];

/* ============================================
   ✅ مكوّن فرعي — نموذج Stripe (مُصحّح)
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
            // ✅ الخطوة 1: استدعاء submit() أولاً (وهذا ما يطلبه Stripe)
            const { error: submitError } = await elements.submit();
            if (submitError) {
                console.error("Submit error:", submitError);
                setPaymentError(submitError.message);
                toast.error(submitError.message);
                setIsProcessing(false);
                return;
            }

            // ✅ الخطوة 2: الآن يمكن استدعاء confirmPayment() بأمان
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret: clientSecret, // تمرير clientSecret
                confirmParams: {
                    return_url: `${window.location.origin}/Cart&Payments/order-confirmation/${orderId}`,
                },
                redirect: "if_required",
            });

            if (error) {
                console.error("Confirm error:", error);
                setPaymentError(error.message);
                toast.error(error.message);
                setIsProcessing(false);
                return;
            }

            // ✅ الخطوة 3: فحص حالة الدفع
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
                setPaymentError("Unexpected payment status: " + (paymentIntent?.status || "unknown"));
                setIsProcessing(false);
            }
        } catch (err) {
            console.error("Payment exception:", err);
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
                🔒 Your payment is secured by Stripe. You will only be charged
                after we confirm the final weight and price.
            </p>
        </form>
    );
}

/* ============================================
   ✅ المكوّن الرئيسي
============================================ */
export default function BillAndPayment() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [submitting, setSubmitting] = useState(false);
    const [bankConfirmed, setBankConfirmed] = useState(false);

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

    // ===== 2. إنشاء Payment Intent عند اختيار البطاقة =====
    useEffect(() => {
        const createPaymentIntent = async () => {
            if (paymentMethod !== "card" || !orderId || clientSecret) return;

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
    }, [paymentMethod, orderId, clientSecret]);

    // ===== 3. عند نجاح الدفع =====
    const handlePaymentSuccess = async () => {
        try {
            // ✅ تحديث payment_method في DB قبل الانتقال
            const { error } = await supabase
                .from("orders")
                .update({
                    payment_method: "card",
                    payment_status: "authorized",
                    price_adjustment: PRICE_ADJUSTMENT,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            if (error) {
                console.error("Failed to update payment_method:", error);
            } else {
                console.log("✅ payment_method updated to 'card'");
            }
        } catch (err) {
            console.error("Update error:", err);
        }

        clearCart();
        navigate(`/Cart&Payments/order-confirmation/${orderId}`);
    };

    // ===== 4. تأكيد الدفع عند الاستلام / التحويل البنكي =====
    const handleManualConfirm = async () => {
        if (!order) return;

        if (paymentMethod === "bank" && !bankConfirmed) {
            toast.error("Please confirm the bank transfer first");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("orders")
                .update({
                    payment_method: paymentMethod,
                    price_adjustment: PRICE_ADJUSTMENT,
                    payment_status: paymentMethod === "cod" ? "pending" : "awaiting_transfer",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", order.id);

            if (error) throw error;

            toast.success("✅ Order confirmed!");
            clearCart();
            navigate(`/Cart&Payments/order-confirmation/${order.id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to confirm order");
        } finally {
            setSubmitting(false);
        }
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
                        Order <strong>#{order.order_number}</strong> — Complete your
                        payment to finalize.
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
              RIGHT: Payment
          ============================================ */}
                    <div className="bill-payment">
                        <div className="bill-payment-section">
                            <h2>💳 Payment Method</h2>
                            <p className="bill-payment-sub">Choose how you'd like to pay</p>

                            <div className="bill-methods">
                                {PAYMENT_METHODS.map((method) => (
                                    <div
                                        key={method.id}
                                        className={`bill-method ${paymentMethod === method.id ? "active" : ""
                                            }`}
                                        onClick={() => setPaymentMethod(method.id)}
                                    >
                                        <div className="bill-method-radio">
                                            <div className="bill-method-dot" />
                                        </div>
                                        <div className="bill-method-icon">{method.icon}</div>
                                        <div className="bill-method-info">
                                            <span className="bill-method-title">{method.title}</span>
                                            <span className="bill-method-desc">{method.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ===== Stripe Payment Form ===== */}
                        {paymentMethod === "card" && (
                            <div className="bill-payment-section">
                                <h2>🔐 Card Details</h2>
                                <p className="bill-payment-sub">
                                    Your payment will be authorized now and charged after we
                                    confirm the weight.
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
                        )}

                        {/* ===== Bank Transfer Details ===== */}
                        {paymentMethod === "bank" && (
                            <div className="bill-payment-section bill-bank-details">
                                <h2>🏦 Bank Transfer</h2>
                                <p className="bill-payment-sub">
                                    Transfer the amount to our account
                                </p>

                                <div className="bill-bank-row">
                                    <span>Account Holder</span>
                                    <strong>Shopora GmbH</strong>
                                </div>
                                <div className="bill-bank-row">
                                    <span>IBAN</span>
                                    <strong className="bill-mono">
                                        DE89 3704 0044 0532 0130 00
                                    </strong>
                                </div>
                                <div className="bill-bank-row">
                                    <span>BIC</span>
                                    <strong className="bill-mono">COBADEFFXXX</strong>
                                </div>
                                <div className="bill-bank-row">
                                    <span>Amount</span>
                                    <strong>€{grandTotal.toFixed(2)}</strong>
                                </div>
                                <div className="bill-bank-row">
                                    <span>Reference</span>
                                    <strong className="bill-mono">{order.order_number}</strong>
                                </div>

                                <p className="bill-bank-note">
                                    ⚠️ Include the reference number in your transfer.
                                </p>

                                <label className="bill-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={bankConfirmed}
                                        onChange={(e) => setBankConfirmed(e.target.checked)}
                                    />
                                    <span>I have sent the bank transfer</span>
                                </label>

                                <button
                                    className="bill-confirm-btn"
                                    onClick={handleManualConfirm}
                                    disabled={submitting || !bankConfirmed}
                                >
                                    {submitting ? "Confirming..." : "Confirm Order"}
                                </button>
                            </div>
                        )}

                        {/* ===== Cash on Delivery ===== */}
                        {paymentMethod === "cod" && (
                            <div className="bill-payment-section">
                                <h2>💵 Cash on Delivery</h2>
                                <p className="bill-payment-sub">
                                    Pay in cash when your order arrives
                                </p>

                                <div className="bill-cod-info">
                                    <div className="bill-cod-row">
                                        <span>Amount to Prepare</span>
                                        <strong>€{grandTotal.toFixed(2)}</strong>
                                    </div>
                                    <p className="bill-cod-note">
                                        Please have the exact amount ready to help our driver.
                                        The final amount may vary slightly based on product weights.
                                    </p>
                                </div>

                                <button
                                    className="bill-confirm-btn"
                                    onClick={handleManualConfirm}
                                    disabled={submitting}
                                >
                                    {submitting ? "Confirming..." : "Confirm Order"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}