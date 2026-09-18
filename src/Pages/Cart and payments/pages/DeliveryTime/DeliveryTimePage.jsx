import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { useCheckout } from "../../../../context/CheckoutContext";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import Footer from "../../../../Components/Footer";
import CartHeader from "../ShoppingCart/components/CartHeader";
import DayPicker from "./components/DayPicker";
import TimeSlotPicker from "./components/TimeSlotPicker";
import DeliverySummary from "./components/DeliverySummary";
import { toBaseUnit } from "../../../../lib/units";   // ✅ جديد

import "./DeliveryTimePage.css";

export default function DeliveryTimePage() {
    const navigate = useNavigate();
    const { cartItems, totalPrice, clearCart } = useCart();
    const {
        checkoutData,
        updateFields,
        isAddressComplete,
        clearCheckout,
    } = useCheckout();

    const [selectedDate, setSelectedDate] = useState(checkoutData.deliveryDate || "");
    const [selectedTime, setSelectedTime] = useState(checkoutData.deliveryTime || "");
    const [submitting, setSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false); // ✅ flag

    // ============================================
    // التحقق من العنوان (يتخطى الفحص بعد الإرسال)
    // ============================================
    useEffect(() => {
        // ✅ لا نتحقق إذا كان الطلب قد أُرسل
        if (hasSubmitted) return;

        if (!isAddressComplete()) {
            toast.error("Bitte füllen Sie zuerst Ihre Adresse aus.");
            navigate("/Cart&Payments/Checkout");
        }
        if (cartItems.length === 0) {
            toast.error("Ihr Warenkorb ist leer.");
            navigate("/Cart&Payments");
        }
    }, [isAddressComplete, navigate, cartItems.length, hasSubmitted]);

    // ============================================
    // Handlers
    // ============================================
    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedTime("");
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
    };

    // ============================================
    // Generate order number
    // ============================================
    const generateOrderNumber = () => {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, "");
        const random = Math.floor(1000 + Math.random() * 9000);
        return `ORD-${date}-${random}`;
    };

    // ============================================
    // Create Order
    // ============================================
    const handleConfirmOrder = async () => {
        if (!selectedDate || !selectedTime) {
            toast.error("Bitte wählen Sie Liefertag und Lieferzeit.");
            return;
        }

        if (!checkoutData.shippingDetails) {
            toast.error("Versandkosten fehlen. Bitte zurück zur Adresse.");
            return;
        }

        setSubmitting(true);
        setHasSubmitted(true); // ✅ منع الـ useEffect
        const toastId = toast.loading("Bestellung wird erstellt...");

        try {
            // ============================================
            // 1. حساب المبالغ
            // ============================================
            const productsTotal = totalPrice; // ✅ يتضمن الضريبة بالفعل
            const shipping = checkoutData.shippingDetails.totalShipping || 0;
            const total = productsTotal + shipping; // ✅ سعران فقط

            // ============================================
            // 2. تحضير الطلب
            // ============================================
            const orderData = {
                customer_id: null,
                order_number: generateOrderNumber(),
                status: "awaiting_payment",
                subtotal: productsTotal,       // ✅ مع الضريبة
                shipping_cost: shipping,
                tax: 0,                        // ✅ الضريبة مدمجة
                total_price: total,
                current_total: total,
                order_date: new Date().toISOString(),

                allow_substitution: (() => {
                    try {
                        const saved = localStorage.getItem("allowSubstitution");
                        return saved === null ? true : JSON.parse(saved);
                    } catch {
                        return true;
                    }
                })(),

                customer_info: {
                    first_name: checkoutData.firstName,
                    last_name: checkoutData.lastName,
                    phone: checkoutData.phone,
                    email: checkoutData.email,
                },

                shipping_address: {
                    street: checkoutData.street,
                    house_number: checkoutData.houseNumber,
                    postal_code: checkoutData.postalCode,
                    city: checkoutData.city,
                    floor: checkoutData.floor,
                    apartment: checkoutData.apartment || "",
                    doorbell_name: checkoutData.doorbellName,
                    has_elevator: checkoutData.hasElevator === "yes",
                    notes: checkoutData.deliveryNotes || "",
                    distance_km: checkoutData.shippingDetails.distance,
                    breakdown: {
                        distance_cost:
                            checkoutData.shippingDetails.breakdown.distanceCost,
                        weight_cost: checkoutData.shippingDetails.breakdown.weightCost,
                        floor_cost: checkoutData.shippingDetails.breakdown.floorCost,
                    },
                },

                shipping_cost: checkoutData.shippingDetails.totalShipping,
                floor_fee: checkoutData.shippingDetails.breakdown.floorCost,
                total_price: total,
                current_total: total,

                payment_method: "cod",
                delivery_date: selectedDate,
                delivery_time: selectedTime,

                coupon_code: null,
                discount_type: null,
                discount_value: null,
                discount_amount: 0,
            };

            // ============================================
            // 3. إدراج الطلب
            // ============================================
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert([orderData])
                .select()
                .single();

            if (orderError) throw new Error(orderError.message);

            // ============================================
            // 4. إدراج بنود الطلب
            // ============================================
            const orderItems = cartItems.map((item) => ({
                order_id: order.id,
                product_id: item.id,
                product_number: item.product_number || null,
                quantity: item.quantity,
                product_name: item.name,
                unit_price: item.price,
                total_price: (item.total_price || item.price) * item.quantity,
                tax_rate: item.tax_rate || 0,
                weight: item.weight || null,
                weight_unit: item.weight_unit || "kg",
                // ✅ الوزن الإجمالي بالوحدة الأساسية (kg/L)
                total_weight: toBaseUnit(item.weight, item.weight_unit) * item.quantity,
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems);

            if (itemsError) throw new Error(itemsError.message);

            // ============================================
            // 5. حفظ آخر طلب
            // ============================================
            localStorage.setItem(
                "lastOrder",
                JSON.stringify({
                    id: order.id,
                    order_number: order.order_number,
                    status: order.status,
                    created_at: order.created_at,
                })
            );

            // ============================================
            // 6. تنظيف (بعد الإرسال)
            // ============================================
            updateFields({
                deliveryDate: selectedDate,
                deliveryTime: selectedTime,
            });

            clearCart();
            clearCheckout();

            toast.success(`✅ Bestellung ${order.order_number} erstellt!`, {
                id: toastId,
            });

            // ============================================
            // 7. الانتقال إلى صفحة الفاتورة والدفع
            // ============================================
            navigate(`/Cart&Payments/BillAndPayment/${order.id}`, { replace: true });
        } catch (error) {
            console.error("❌ Order submission failed:", error);
            toast.error(`Fehler: ${error.message}`, { id: toastId });
            setHasSubmitted(false); // ✅ السماح بإعادة المحاولة
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================
    // Render
    // ============================================
    return (
        <div className="dt-page">
            <CartHeader currentStep={3} />

            <main className="dt-main">
                {/* Hero */}
                <div className="dt-hero">
                    <span className="dt-hero-badge">🕒 Schritt 3 von 4</span>
                    <h1>Liefertermin wählen</h1>
                    <p>Bestimmen Sie, wann wir Ihre Bestellung liefern sollen.</p>
                </div>

                {/* Progress */}
                <div className="dt-progress">
                    <div className="dt-progress-item done">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span>Adresse</span>
                    </div>
                    <div className="dt-progress-line done" />
                    <div className="dt-progress-item active">
                        <span className="dt-progress-num">2</span>
                        <span>Liefertermin</span>
                    </div>
                    <div className="dt-progress-line" />
                    <div className="dt-progress-item">
                        <span className="dt-progress-num">3</span>
                        <span>Zahlung</span>
                    </div>
                </div>

                {/* Layout */}
                <div className="dt-layout">
                    <div className="dt-pickers">
                        <DayPicker
                            selectedDate={selectedDate}
                            onSelectDate={handleDateSelect}
                        />

                        {selectedDate && (
                            <TimeSlotPicker
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                onSelectTime={handleTimeSelect}
                            />
                        )}
                    </div>

                    <DeliverySummary
                        checkoutData={checkoutData}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        cartItems={cartItems}
                        totalPrice={totalPrice}
                    />
                </div>

                {/* Actions */}
                <div className="dt-actions">
                    <button
                        type="button"
                        className="dt-btn-cancel"
                        onClick={() => navigate("/Cart&Payments/Checkout")}
                        disabled={submitting}
                    >
                        ← Zurück zur Adresse
                    </button>
                    <button
                        type="button"
                        className="dt-btn-submit"
                        onClick={handleConfirmOrder}
                        disabled={submitting || !selectedDate || !selectedTime}
                    >
                        {submitting ? (
                            <>
                                <div className="dt-spinner" />
                                Wird verarbeitet...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">lock</span>
                                Bestellung bestätigen · Weiter zur Zahlung
                            </>
                        )}
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}