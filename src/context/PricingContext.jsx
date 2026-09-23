import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PricingContext = createContext();

export function PricingProvider({ children }) {
    const [pricing, setPricing] = useState({
        baseLatitude: 52.5200,
        baseLongitude: 13.4050,
        baseAddress: "Berlin, Germany",
        weightTiers: [],               // ✅ جديد
        maxWeightKg: 100,              // ✅ جديد
        maxDeliveryDistanceKm: 30.00,
        freeDeliveryThresholdAmount: 0.00,
        pricePerFloorWithElevator: 0.50,
        pricePerFloorWithoutElevator: 1.00,
        distanceTiers: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ============================================
    // Fetch
    // ============================================
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
                weightTiers: data.weight_tiers ?? [],              // ✅
                maxWeightKg: data.max_weight_kg ?? 100,            // ✅
                maxDeliveryDistanceKm: data.max_delivery_distance_km ?? 30.00,
                freeDeliveryThresholdAmount:
                    data.free_delivery_threshold_amount ?? 0.00,
                pricePerFloorWithElevator:
                    data.price_per_floor_with_elevator ?? 0.50,
                pricePerFloorWithoutElevator:
                    data.price_per_floor_without_elevator ?? 1.00,
                distanceTiers: data.distance_tiers ?? [],
            });
            console.log("✅ Pricing loaded:", {
                weightTiers: data.weight_tiers,
                distanceTiers: data.distance_tiers,
                maxWeightKg: data.max_weight_kg,
            });
        } else {
            console.warn("⚠️ No pricing settings found, using defaults.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPricing();
    }, []);

    // ============================================
    // Save
    // ============================================
    const savePricing = async (newPricing) => {
        setSaving(true);
        try {
            const dbPayload = {
                base_address: newPricing.baseAddress,
                base_latitude: newPricing.baseLatitude,
                base_longitude: newPricing.baseLongitude,
                weight_tiers: newPricing.weightTiers || [],         // ✅ جديد
                max_weight_kg: newPricing.maxWeightKg ?? 100,       // ✅ جديد
                max_delivery_distance_km: newPricing.maxDeliveryDistanceKm,
                free_delivery_threshold_amount:
                    newPricing.freeDeliveryThresholdAmount,
                price_per_floor_with_elevator:
                    newPricing.pricePerFloorWithElevator,
                price_per_floor_without_elevator:
                    newPricing.pricePerFloorWithoutElevator,
                distance_tiers: newPricing.distanceTiers || [],
                updated_at: new Date().toISOString(),
            };

            console.log("💾 Saving pricing:", dbPayload);

            // ابحث عن الصف الموجود
            const { data: existing, error: selectError } = await supabase
                .from("pricing_settings")
                .select("id")
                .limit(1);

            if (selectError) throw selectError;

            let error;

            if (existing && existing.length > 0) {
                const { error: updateError } = await supabase
                    .from("pricing_settings")
                    .update(dbPayload)
                    .eq("id", existing[0].id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("pricing_settings")
                    .insert([dbPayload]);
                error = insertError;
            }

            if (error) throw error;

            // تحديث الحالة المحلية
            setPricing((prev) => ({ ...prev, ...newPricing }));
            return { success: true };
        } catch (error) {
            console.error("❌ Save pricing error:", error);
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