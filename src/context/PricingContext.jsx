import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PricingContext = createContext();

export function PricingProvider({ children }) {
    const [pricing, setPricing] = useState({
        baseLatitude: 52.5200,
        baseLongitude: 13.4050,
        baseAddress: "Berlin, Germany",
        pricePerKm: 1.50,
        freeWeightThresholdKg: 50.00,
        pricePerExtraKg: 0.50,
        maxDeliveryDistanceKm: 30.00,
        freeDeliveryThresholdAmount: 0.00,
        pricePerFloorWithElevator: 0.50,
        pricePerFloorWithoutElevator: 1.00,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // جلب إعدادات التسعير
    const fetchPricing = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("pricing_settings")
            .select("*")
            .single();

        if (!error && data) {
            setPricing({
                baseLatitude: data.base_latitude ?? 52.5200,
                baseLongitude: data.base_longitude ?? 13.4050,
                baseAddress: data.base_address ?? "Berlin, Germany",
                pricePerKm: data.price_per_km ?? 1.50,
                freeWeightThresholdKg: data.free_weight_threshold_kg ?? 50.00,
                pricePerExtraKg: data.price_per_extra_kg ?? 0.50,
                maxDeliveryDistanceKm: data.max_delivery_distance_km ?? 30.00,
                freeDeliveryThresholdAmount: data.free_delivery_threshold_amount ?? 0.00,
                pricePerFloorWithElevator: data.price_per_floor_with_elevator ?? 0.50,
                pricePerFloorWithoutElevator: data.price_per_floor_without_elevator ?? 1.00,
            });
        } else {
            console.warn("No pricing settings found, using defaults.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPricing();
    }, []);

    // حفظ إعدادات التسعير
    const savePricing = async (newPricing) => {
        setSaving(true);
        try {
            // نتحقق أولاً إذا كان هناك صف موجود
            const { data: existing, error: selectError } = await supabase
                .from("pricing_settings")
                .select("id")
                .limit(1);

            if (selectError) throw selectError;

            const payload = { ...newPricing, updated_at: new Date().toISOString() };
            let error;

            if (existing && existing.length > 0) {
                // تحديث
                const { error: updateError } = await supabase
                    .from("pricing_settings")
                    .update(payload)
                    .eq("id", existing[0].id);
                error = updateError;
            } else {
                // إدراج جديد
                const { error: insertError } = await supabase
                    .from("pricing_settings")
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            setPricing(prev => ({ ...prev, ...newPricing }));
            return { success: true };
        } catch (error) {
            console.error("Save pricing error:", error);
            return { success: false, error: error.message };
        } finally {
            setSaving(false);
        }
    };

    const value = {
        pricing,
        loading,
        saving,
        fetchPricing,
        savePricing,
    };

    return (
        <PricingContext.Provider value={value}>
            {children}
        </PricingContext.Provider>
    );
}

export function usePricing() {
    const context = useContext(PricingContext);
    if (!context) {
        throw new Error("usePricing must be used within a PricingProvider");
    }
    return context;
}