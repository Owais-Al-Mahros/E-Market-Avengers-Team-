import { createContext, useContext } from "react";
import { useSupabaseSingleton } from "../hooks/useSupabaseSingleton";

const PricingContext = createContext();

// ============================================
// Mappers — التحويل بين DB والواجهة
// ============================================
const DEFAULT_PRICING = {
    baseLatitude: 52.52,
    baseLongitude: 13.405,
    baseStreet: "",
    baseHouseNumber: "",
    basePostalCode: "",
    baseCity: "",
    weightTiers: [],
    maxWeightKg: 100,
    maxDeliveryDistanceKm: 30.0,
    freeDeliveryThresholdAmount: 0.0,
    pricePerFloorWithElevator: 0.5,
    pricePerFloorWithoutElevator: 1.0,
    distanceTiers: [],
};

const fromDb = (d) => ({
    baseLatitude: d.base_latitude ?? DEFAULT_PRICING.baseLatitude,
    baseLongitude: d.base_longitude ?? DEFAULT_PRICING.baseLongitude,
    baseStreet: d.base_street ?? "",
    baseHouseNumber: d.base_house_number ?? "",
    basePostalCode: d.base_postal_code ?? "",
    baseCity: d.base_city ?? "",
    weightTiers: d.weight_tiers ?? [],
    maxWeightKg: d.max_weight_kg ?? 100,
    maxDeliveryDistanceKm: d.max_delivery_distance_km ?? 30.0,
    freeDeliveryThresholdAmount: d.free_delivery_threshold_amount ?? 0.0,
    pricePerFloorWithElevator: d.price_per_floor_with_elevator ?? 0.5,
    pricePerFloorWithoutElevator: d.price_per_floor_without_elevator ?? 1.0,
    distanceTiers: d.distance_tiers ?? [],
});

const toDb = (p) => ({
    base_street: p.baseStreet,
    base_house_number: p.baseHouseNumber,
    base_postal_code: p.basePostalCode,
    base_city: p.baseCity,
    base_latitude: p.baseLatitude,
    base_longitude: p.baseLongitude,
    weight_tiers: p.weightTiers || [],
    max_weight_kg: p.maxWeightKg ?? 100,
    max_delivery_distance_km: p.maxDeliveryDistanceKm,
    free_delivery_threshold_amount: p.freeDeliveryThresholdAmount,
    price_per_floor_with_elevator: p.pricePerFloorWithElevator,
    price_per_floor_without_elevator: p.pricePerFloorWithoutElevator,
    distance_tiers: p.distanceTiers || [],
    updated_at: new Date().toISOString(),
});

export function PricingProvider({ children }) {
    const {
        data: pricing,
        setData: setPricing,
        loading,
        saving,
        fetchOne: fetchPricing,
        save: savePricing,
    } = useSupabaseSingleton("pricing_settings", {
        defaults: DEFAULT_PRICING,
        fromDb,
        toDb,
    });

    return (
        <PricingContext.Provider
            value={{ pricing, setPricing, loading, saving, fetchPricing, savePricing }}
        >
            {children}
        </PricingContext.Provider>
    );
}

export const usePricing = () => {
    const ctx = useContext(PricingContext);
    if (!ctx) throw new Error("usePricing must be used within PricingProvider");
    return ctx;
};