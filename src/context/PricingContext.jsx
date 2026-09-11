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
            // ✅ 1. تحويل من camelCase (React) إلى snake_case (Database)
            const dbPayload = {
                base_address: newPricing.baseAddress,
                base_latitude: newPricing.baseLatitude,
                base_longitude: newPricing.baseLongitude,
                price_per_km: newPricing.pricePerKm,
                free_weight_threshold_kg: newPricing.freeWeightThresholdKg,
                price_per_extra_kg: newPricing.pricePerExtraKg,
                max_delivery_distance_km: newPricing.maxDeliveryDistanceKm,
                free_delivery_threshold_amount: newPricing.freeDeliveryThresholdAmount,
                price_per_floor_with_elevator: newPricing.pricePerFloorWithElevator,
                price_per_floor_without_elevator: newPricing.pricePerFloorWithoutElevator,
                updated_at: new Date().toISOString(),
            };

            // 2. التحقق من وجود صف سابق
            const { data: existing, error: selectError } = await supabase
                .from("pricing_settings")
                .select("id")
                .limit(1);

            if (selectError) throw selectError;

            let error;

            if (existing && existing.length > 0) {
                // تحديث الصف الموجود
                const { error: updateError } = await supabase
                    .from("pricing_settings")
                    .update(dbPayload)
                    .eq("id", existing[0].id);
                error = updateError;
            } else {
                // إدراج صف جديد
                const { error: insertError } = await supabase
                    .from("pricing_settings")
                    .insert([dbPayload]);
                error = insertError;
            }

            if (error) throw error;

            // 3. تحديث الحالة المحلية (camelCase كما هي)
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