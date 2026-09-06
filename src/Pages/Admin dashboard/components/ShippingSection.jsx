// src/Pages/Admin dashboard/components/ShippingSection.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import toast from "react-hot-toast";
import DayChoosing from "./Shipping/DayChoosing";
import TimeSlotChoosing from "./Shipping/TimeSlotChoosing";
import PricePerDistance from "./Shipping/PricePerDistance";
import "./ShippingSection.css";

export default function ShippingSection() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ===== حالة الإعدادات =====
    const [settings, setSettings] = useState({
        enabledDays: [],
        enabledHours: [],
        minAdvanceHours: 1,
        minDurationHours: 2,
        maxDurationHours: 4,
    });

    const [pricing, setPricing] = useState({
        baseFee: 5.99,
        costPerKm: 0.5,
        freeDeliveryThreshold: 50,
    });

    // ===== دالة مساعدة لتحويل النص إلى مصفوفة =====
    const parseArray = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        if (value && typeof value === "object") {
            if (Array.isArray(value.days)) return value.days;
            if (Array.isArray(value.hours)) return value.hours;
            if (Array.isArray(Object.values(value)[0])) return Object.values(value)[0];
        }
        return [];
    };

    // ===== جلب الإعدادات =====
    useEffect(() => {
        const fetchData = async () => {
            try {
                // جلب إعدادات التوصيل
                const { data: deliveryData, error: deliveryError } = await supabase
                    .from("delivery_settings")
                    .select("*")
                    .single();

                if (deliveryError && deliveryError.code !== "PGRST116") throw deliveryError;

                if (deliveryData) {
                    setSettings({
                        enabledDays: parseArray(deliveryData.enabled_days),
                        enabledHours: parseArray(deliveryData.enabled_hours),
                        minAdvanceHours: deliveryData.min_advance_hours || 1,
                        minDurationHours: deliveryData.min_duration_hours || 2,
                        maxDurationHours: deliveryData.max_duration_hours || 4,
                    });
                }

                // جلب إعدادات الأسعار
                const { data: pricingData, error: pricingError } = await supabase
                    .from("pricing_settings")
                    .select("*")
                    .single();

                if (pricingError && pricingError.code !== "PGRST116") throw pricingError;

                if (pricingData) {
                    setPricing({
                        baseFee: pricingData.base_fee || 5.99,
                        costPerKm: pricingData.cost_per_km || 0.5,
                        freeDeliveryThreshold: pricingData.free_delivery_threshold || 50,
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast.error("Could not load settings.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ===== حفظ الإعدادات =====
    const handleSave = async () => {
        setSaving(true);
        try {
            // حفظ إعدادات التوصيل
            const { data: existingDelivery, error: checkDelivery } = await supabase
                .from("delivery_settings")
                .select("id")
                .single();

            if (checkDelivery && checkDelivery.code !== "PGRST116") throw checkDelivery;

            const deliveryPayload = {
                enabled_days: settings.enabledDays,
                enabled_hours: settings.enabledHours,
                min_advance_hours: settings.minAdvanceHours,
                min_duration_hours: settings.minDurationHours,
                max_duration_hours: settings.maxDurationHours,
                updated_at: new Date().toISOString(),
            };

            if (existingDelivery) {
                await supabase
                    .from("delivery_settings")
                    .update(deliveryPayload)
                    .eq("id", existingDelivery.id);
            } else {
                await supabase.from("delivery_settings").insert([deliveryPayload]);
            }

            // حفظ إعدادات الأسعار
            // const { data: existingPricing, error: checkPricing } = await supabase
            //     .from("pricing_settings")
            //     .select("id")
            //     .single();

            // if (checkPricing && checkPricing.code !== "PGRST116") throw checkPricing;

            // const pricingPayload = {
            //     base_fee: pricing.baseFee,
            //     cost_per_km: pricing.costPerKm,
            //     free_delivery_threshold: pricing.freeDeliveryThreshold,
            //     updated_at: new Date().toISOString(),
            // };

            // if (existingPricing) {
            //     await supabase
            //         .from("pricing_settings")
            //         .update(pricingPayload)
            //         .eq("id", existingPricing.id);
            // } else {
            //     await supabase.from("pricing_settings").insert([pricingPayload]);
            // }

            toast.success("✅ All settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // ===== دوال التبديل =====
    const toggleDay = (day) => {
        setSettings((prev) => ({
            ...prev,
            enabledDays: prev.enabledDays.includes(day)
                ? prev.enabledDays.filter((d) => d !== day)
                : [...prev.enabledDays, day],
        }));
    };

    const toggleHour = (hour) => {
        setSettings((prev) => ({
            ...prev,
            enabledHours: prev.enabledHours.includes(hour)
                ? prev.enabledHours.filter((h) => h !== hour)
                : [...prev.enabledHours, hour],
        }));
    };

    const updateMinAdvance = (value) => {
        setSettings((prev) => ({ ...prev, minAdvanceHours: value }));
    };

    const updateMinDuration = (value) => {
        setSettings((prev) => ({ ...prev, minDurationHours: value }));
    };

    const updateMaxDuration = (value) => {
        setSettings((prev) => ({ ...prev, maxDurationHours: value }));
    };

    const updatePricing = (newPricing) => {
        setPricing(newPricing);
    };

    // ===== حالة التحميل =====
    if (loading) {
        return (
            <div className="shipping-section loading">
                <div className="spinner"></div>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="shipping-section">
            <div className="section-header">
                <h2>🚚 Shipping Settings</h2>
                <p>Configure delivery days, hours, pricing, and time rules.</p>
            </div>

            <div className="section-body">
                {/* ===== اختيار الأيام ===== */}
                <DayChoosing
                    enabledDays={settings.enabledDays}
                    onToggleDay={toggleDay}
                />

                {/* ===== اختيار الساعات والقواعد ===== */}
                <TimeSlotChoosing
                    enabledHours={settings.enabledHours}
                    onToggleHour={toggleHour}
                    minAdvanceHours={settings.minAdvanceHours}
                    onMinAdvanceChange={updateMinAdvance}
                    minDurationHours={settings.minDurationHours}
                    onMinDurationChange={updateMinDuration}
                    maxDurationHours={settings.maxDurationHours}
                    onMaxDurationChange={updateMaxDuration}
                />

                {/* ===== أسعار التوصيل ===== */}
                {/* <PricePerDistance
                    onPriceChange={updatePricing}
                /> */}
            </div>

            <div className="section-footer">
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? "💾 Saving..." : "💾 Save All Settings"}
                </button>
            </div>
        </div>
    );
}