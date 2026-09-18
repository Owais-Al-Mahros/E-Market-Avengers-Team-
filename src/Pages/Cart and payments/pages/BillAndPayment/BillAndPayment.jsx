import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import CartHeader from "../ShoppingCart/components/CartHeader";
import Footer from "./../../../../Components/Footer";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../../../../lib/stripe";
import "./BillAndPayment.css";

// ✅ الهامش الموحّد
const WEIGHT_BUFFER = 5.0;

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
            total_weight,
            is_returned
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

    // ===== 3. عند نجاح الدفع =====
    const handlePaymentSuccess = async () => {
        try {
            const { error } = await supabase
                .from("orders")
                .update({
                    status: "pending",
                    payment_method: "card",
                    payment_status: "authorized",
                    price_adjustment: WEIGHT_BUFFER,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            if (error) {
                console.error("Failed to update order status:", error);
                toast.error("Payment succeeded but order update failed.");
            }
        } catch (err) {
            console.error("Update error:", err);
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

    // ===== Loading =====
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

    // ============================================
    // Calculations
    // ============================================
    const activeItems =
        order.order_items?.filter((item) => !item.is_returned) || [];
    const returnedItems =
        order.order_items?.filter((item) => item.is_returned) || [];

    const subtotal = activeItems.reduce(
        (sum, item) => sum + parseFloat(item.total_price || 0),
        0
    );
    const shippingCost = parseFloat(order.shipping_cost || 0);

    // ✅ الإجمالي المتوقع (بدون الهامش) — هذا ما سيدفعه العميل فعلياً
    const estimatedTotal = subtotal + shippingCost;

    // ✅ المبلغ المُحجوز (مع الهامش)
    const authorizedAmount = estimatedTotal + WEIGHT_BUFFER;

    return (
        <div className="bill-page">
            <CartHeader currentStep={4} />

            <main className="bill-main">
                {/* Hero */}
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
                                {activeItems.length} items
                            </span>
                        </div>

                        <div className="bill-items">
                            {activeItems.map((item) => (
                                <div key={item.id} className="bill-item">
                                    <div className="bill-item-info">
                                        <span className="bill-item-name">
                                            {item.product_name}
                                        </span>
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

                        {/* Returned Items */}
                        {returnedItems.length > 0 && (
                            <div className="bill-returned-section">
                                <div className="bill-returned-header">
                                    <span className="material-symbols-outlined">
                                        assignment_return
                                    </span>
                                    <span>Returned Items ({returnedItems.length})</span>
                                </div>
                                {returnedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bill-item is-returned"
                                    >
                                        <div className="bill-item-info">
                                            <span className="bill-item-name">
                                                {item.product_name}
                                                <span className="bill-item-returned-badge">
                                                    ↩️ Returned
                                                </span>
                                            </span>
                                            <span className="bill-item-qty">
                                                {item.quantity} × €
                                                {parseFloat(item.unit_price).toFixed(2)}
                                            </span>
                                        </div>
                                        <span className="bill-item-total">
                                            €{parseFloat(item.total_price).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bill-divider" />

                        {/* ✅ Totals — فقط سعران */}
                        <div className="bill-totals">
                            <div className="bill-row">
                                <span>Produkte (inkl. MwSt.)</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="bill-row">
                                <span>Versand</span>
                                <span>€{shippingCost.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bill-divider" />

                        {/* ✅ الإجمالي المتوقع */}
                        <div className="bill-grand-total">
                            <span>Zu zahlender Betrag</span>
                            <span>€{estimatedTotal.toFixed(2)}</span>
                        </div>

                        {/* ✅ قسم الهامش المنفصل */}
                        <div className="bill-buffer-info">
                            <div className="bill-buffer-header">
                                <span className="material-symbols-outlined">info</span>
                                <strong>
                                    Sicherheitsreserve (kein Aufpreis)
                                </strong>
                            </div>
                            <div className="bill-buffer-row">
                                <span>Vorübergehend reserviert</span>
                                <span>+€{WEIGHT_BUFFER.toFixed(2)}</span>
                            </div>
                            <div className="bill-buffer-divider" />
                            <div className="bill-buffer-row total">
                                <span>Autorisierter Gesamtbetrag</span>
                                <span>€{authorizedAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* ✅ شرح مطوّر */}
                        <div className="bill-explanation">
                            <div className="bill-explanation-icon">ℹ️</div>
                            <div>
                                <strong>
                                    Warum reservieren wir €{WEIGHT_BUFFER.toFixed(2)}{" "}
                                    extra?
                                </strong>
                                <p>
                                    Frischeprodukte werden nach Gewicht verkauft. Daher
                                    kann der endgültige Preis leicht vom geschätzten
                                    Betrag abweichen. Um eine reibungslose Abwicklung zu
                                    gewährleisten, reservieren wir vorübergehend{" "}
                                    <strong>€{WEIGHT_BUFFER.toFixed(2)}</strong> zusätzlich
                                    auf Ihrer Zahlungsmethode.
                                </p>
                                <div className="bill-explanation-points">
                                    <div className="bill-explanation-point">
                                        <span className="material-symbols-outlined">
                                            check_circle
                                        </span>
                                        <span>
                                            Sie werden{" "}
                                            <strong>
                                                nur für die tatsächlich gelieferte Menge
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
                                                automatisch innerhalb von 3-5 Werktagen
                                            </strong>{" "}
                                            freigegeben.
                                        </span>
                                    </div>
                                    <div className="bill-explanation-point">
                                        <span className="material-symbols-outlined">
                                            shield
                                        </span>
                                        <span>
                                            <strong>Keine versteckten Gebühren.</strong>{" "}
                                            Diese Reserve ist keine Zahlung, sondern nur
                                            eine Sicherheit.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================
                        RIGHT: Stripe Payment
                    ============================================ */}
                    <div className="bill-payment">
                        <div className="bill-payment-section">
                            <h2>🔐 Secure Payment</h2>
                            <p className="bill-payment-sub">
                                Your payment will be authorized now and charged after
                                we confirm the weight.
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