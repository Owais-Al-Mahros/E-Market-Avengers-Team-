import { createContext, useContext, useState, useEffect } from "react";

const CheckoutContext = createContext();

const STORAGE_KEY = "checkoutData";

export function CheckoutProvider({ children }) {
    const [checkoutData, setCheckoutData] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            return saved
                ? JSON.parse(saved)
                : {
                    // Personal Info
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    // Address
                    street: "",
                    houseNumber: "",
                    postalCode: "",
                    city: "",
                    // Access
                    floor: "",
                    apartment: "",
                    doorbellName: "",
                    hasElevator: "no",
                    deliveryNotes: "",
                    // Delivery Time
                    deliveryDate: "",
                    deliveryTime: "",
                    deliveryEndTime: "",
                    deliveryDayName: "",
                    // Shipping (من Edge Function)
                    shippingDetails: null,
                };
        } catch {
            return {};
        }
    });

    // حفظ تلقائي في sessionStorage
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(checkoutData));
        } catch (err) {
            console.warn("Failed to save checkout data:", err);
        }
    }, [checkoutData]);

    // ============================================
    // Helpers
    // ============================================
    const updateField = (field, value) => {
        setCheckoutData((prev) => ({ ...prev, [field]: value }));
    };

    const updateFields = (fields) => {
        setCheckoutData((prev) => ({ ...prev, ...fields }));
    };

    const clearCheckout = () => {
        setCheckoutData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            street: "",
            houseNumber: "",
            postalCode: "",
            city: "",
            floor: "",
            apartment: "",
            doorbellName: "",
            hasElevator: "no",
            deliveryNotes: "",
            deliveryDate: "",
            deliveryTime: "",
            deliveryEndTime: "",
            deliveryDayName: "",
            shippingDetails: null,
        });
        sessionStorage.removeItem(STORAGE_KEY);
    };

    // ============================================
    // Validations
    // ============================================
    const isAddressComplete = () => {
        return Boolean(
            checkoutData.firstName &&
            checkoutData.lastName &&
            checkoutData.email &&
            checkoutData.phone &&
            checkoutData.street &&
            checkoutData.houseNumber &&
            checkoutData.postalCode &&
            checkoutData.city &&
            checkoutData.floor !== "" &&
            checkoutData.doorbellName
        );
    };

    const isDeliveryTimeComplete = () => {
        return Boolean(checkoutData.deliveryDate && checkoutData.deliveryTime);
    };

    const value = {
        checkoutData,
        updateField,
        updateFields,
        clearCheckout,
        isAddressComplete,
        isDeliveryTimeComplete,
    };

    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    );
}

export function useCheckout() {
    const context = useContext(CheckoutContext);
    if (!context) {
        throw new Error("useCheckout must be used within CheckoutProvider");
    }
    return context;
}