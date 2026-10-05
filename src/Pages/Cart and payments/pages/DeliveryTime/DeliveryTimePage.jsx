import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { useCheckout } from "../../../../context/CheckoutContext";
import { useShippingSettings } from "../../../../context/ShippingSettingsContext";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import Footer from "../../../../components/layout/Footer";
import CartHeader from "../ShoppingCart/components/CartHeader";
import DayPicker from "./components/DayPicker";
import TimeSlotPicker from "./components/TimeSlotPicker";
import DeliverySummary from "./components/DeliverySummary";
import { toBaseUnit } from "../../../../lib/units";
import { saveLastOrder } from "../../../../lib/lastOrder";

import "./DeliveryTimePage.css";

// ============================================================
// ✅ توليد UUID متوافق مع كل السياقات (حتى HTTP غير آمن)
// ============================================================
function generateOrderId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        try { return crypto.randomUUID(); } catch { /* fall through */ }
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ============================================================
// ✅ توليد رقم طلب (Order Number)
// ============================================================
function generateOrderNumber() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${date}-${random}`;
}

export default function DeliveryTimePage() {
    const navigate = useNavigate();
    const { cartItems, totalPrice, clearCart } = useCart();
    const {
        checkoutData,
        updateFields,
        isAddressComplete,
        clearCheckout,
    } = useCheckout();

    const { settings: shippingSettings } = useShippingSettings();
    const maxOrdersPerHour = shippingSettings?.maxOrdersPerHour || 0;

    const [selectedDate, setSelectedDate] = useState(
        checkoutData.deliveryDate || ""
    );
    const [selectedTime, setSelectedTime] = useState(
        checkoutData.deliveryTime || ""
    );
    const [submitting, setSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // ============================================
    // التحقق من العنوان والسلة
    // ============================================
    useEffect(() => {
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
        setHasSubmitted(true);
        const toastId = toast.loading("Bestellung wird erstellt...");

        try {
            // ══════════════════════════════════════════════════════
            // 1. التحقق من سعة الساعة عبر RPC (SECURITY DEFINER)
            // ══════════════════════════════════════════════════════
            if (maxOrdersPerHour > 0) {
                const { data: currentCount, error: countError } = await supabase.rpc(
                    "get_slot_order_count",
                    { p_date: selectedDate, p_time: selectedTime }
                );

                if (countError) {
                    // فشل غير حاسم — نُسجّل ونكمل (القرار النهائي للأدمن)
                    console.warn("⚠️ Capacity check unavailable:", countError.message);
                } else if ((currentCount || 0) >= maxOrdersPerHour) {
                    toast.error(
                        "Dieser Zeitslot ist leider ausgebucht. Bitte wählen Sie einen anderen.",
                        { id: toastId }
                    );
                    setSubmitting(false);
                    setHasSubmitted(false);
                    return;
                }
            }

            // ══════════════════════════════════════════════════════
            // 2. حساب المبالغ
            // ══════════════════════════════════════════════════════
            const productsTotal = totalPrice;
            const shipping = checkoutData.shippingDetails.totalShipping || 0;
            const total = productsTotal + shipping;

            // ══════════════════════════════════════════════════════
            // 3. توليد المعرّفات من جهة العميل (لتفادي مشكلة RLS)
            // ══════════════════════════════════════════════════════
            const orderId = generateOrderId();
            const orderNumber = generateOrderNumber();

            // ══════════════════════════════════════════════════════
            // 4. تحضير بيانات الطلب
            // ══════════════════════════════════════════════════════
            // ══════════════════════════════════════════════════════
            // 4. تحضير بيانات الطلب
            // ══════════════════════════════════════════════════════
            const allowSubstitution = (() => {
                try {
                    const saved = localStorage.getItem("allowSubstitution");
                    return saved === null ? true : JSON.parse(saved);
                } catch {
                    return true;
                }
            })();

            // ✅ حماية: نستخرج القيم بأمان
            const shippingDetails = checkoutData.shippingDetails || {};
            const breakdown = shippingDetails.breakdown || {};

            const orderData = {
                id: orderId,
                customer_id: null,
                order_number: orderNumber,
                status: "awaiting_payment",
                subtotal: productsTotal,
                tax: 0,
                total_price: total,
                current_total: total,
                order_date: new Date().toISOString(),
                allow_substitution: allowSubstitution,

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
                    distance_km: shippingDetails.distance || 0,
                    breakdown: {
                        distance_cost: breakdown.distanceCost || 0,
                        weight_cost: breakdown.weightCost || 0,
                        floor_cost: breakdown.floorCost || 0,
                    },
                },

                shipping_cost: shippingDetails.totalShipping || 0,
                floor_fee: breakdown.floorCost || 0,
                payment_method: null,
                delivery_date: selectedDate,
                delivery_time: selectedTime,
                coupon_code: null,
                discount_type: null,
                discount_value: null,
                discount_amount: 0,
            };
            // ══════════════════════════════════════════════════════
            // 5. إدراج الطلب — بدون .select() (RLS يمنع القراءة)
            // ══════════════════════════════════════════════════════
            const { error: orderError } = await supabase
                .from("orders")
                .insert([orderData]);

            if (orderError) {
                throw new Error(orderError.message);
            }

            // ══════════════════════════════════════════════════════
            // 6. إدراج بنود الطلب — نستخدم orderId المعروف
            // ══════════════════════════════════════════════════════
            const orderItems = cartItems.map((item) => ({
                order_id: orderId,
                product_id: item.id,
                product_number: item.product_number || null,
                quantity: item.quantity,
                product_name: item.name,
                unit_price: item.price,
                total_price: (item.total_price || item.price) * item.quantity,
                tax_rate: item.tax_rate || 0,
                weight: item.weight || null,
                weight_unit: item.weight_unit || "kg",
                total_weight:
                    toBaseUnit(item.weight, item.weight_unit) * item.quantity,
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems);

            if (itemsError) {
                // فشل البنود → نحاول حذف الطلب (best-effort) ونُبلّغ
                console.error("❌ Order items insert failed:", itemsError);
                throw new Error(itemsError.message);
            }

            // ══════════════════════════════════════════════════════
            // 7. حفظ آخر طلب
            // ══════════════════════════════════════════════════════
            saveLastOrder({
                id: orderId,
                order_number: orderNumber,
                status: "awaiting_payment",
                customer_info: { email: checkoutData.email },
            });

            // ══════════════════════════════════════════════════════
            // 8. تنظيف
            // ══════════════════════════════════════════════════════
            updateFields({
                deliveryDate: selectedDate,
                deliveryTime: selectedTime,
            });

            clearCart();
            clearCheckout();

            toast.success(`✅ Bestellung ${orderNumber} erstellt!`, {
                id: toastId,
            });

            // ══════════════════════════════════════════════════════
            // 9. الانتقال لصفحة الدفع — نمرّر orderId المعروف
            // ══════════════════════════════════════════════════════
            navigate(`/Cart&Payments/BillAndPayment/${orderId}`, {
                replace: true,
            });
        } catch (error) {
            console.error("❌ Order submission failed:", error);
            toast.error(`Fehler: ${error.message}`, { id: toastId });
            setHasSubmitted(false);
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
                <div className="dt-hero">
                    <span className="dt-hero-badge">🕒 Schritt 2 von 4</span>
                    <h1>Liefertermin wählen</h1>
                    <p>Bestimmen Sie, wann wir Ihre Bestellung liefern sollen.</p>
                </div>

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
                                <span className="material-symbols-outlined">arrow_forward</span>
                                Weiter zur Zahlung
                            </>
                        )}
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}