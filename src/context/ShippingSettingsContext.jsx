import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const ShippingSettingsContext = createContext();

export function ShippingSettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        enabledDates: [],
        defaultHours: [],
        dateOverrides: {},
        maxOrdersPerHour: 0,      // ✅ جديد (0 = لا حد)
        cutoffHour: "22:00",       // ✅ جديد
        minDurationHours: 2,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const parseArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
            try { return JSON.parse(value); } catch { return []; }
        }
        return [];
    };

    const parseObject = (value) => {
        if (!value) return {};
        if (typeof value === "string") {
            try { return JSON.parse(value); } catch { return {}; }
        }
        if (typeof value === "object" && !Array.isArray(value)) return value;
        return {};
    };

    const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from("delivery_settings")
                .select("*")
                .single();

            if (error && error.code !== "PGRST116") throw error;

            if (data) {
                setSettings({
                    enabledDates: parseArray(data.enabled_dates),
                    defaultHours: parseArray(data.default_hours),
                    dateOverrides: parseObject(data.date_overrides),
                    maxOrdersPerHour: data.max_orders_per_hour ?? 0,
                    cutoffHour: data.cutoff_hour ?? "22:00",
                    minDurationHours: data.min_duration_hours ?? 2,
                });
            }
        } catch (err) {
            setError(err.message || "Failed to load settings.");
            console.error("Error fetching settings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const payload = {
                enabled_dates: settings.enabledDates,
                default_hours: settings.defaultHours,
                date_overrides: settings.dateOverrides,
                max_orders_per_hour: settings.maxOrdersPerHour,
                cutoff_hour: settings.cutoffHour,
                min_duration_hours: settings.minDurationHours,
                updated_at: new Date().toISOString(),
            };

            const { data: existing, error: selectError } = await supabase
                .from("delivery_settings")
                .select("id")
                .limit(1);

            if (selectError) throw selectError;

            if (existing && existing.length > 0) {
                const { error } = await supabase
                    .from("delivery_settings")
                    .update(payload)
                    .eq("id", existing[0].id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("delivery_settings")
                    .insert([payload]);
                if (error) throw error;
            }

            return { success: true };
        } catch (err) {
            console.error("Save error:", err);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    const toggleDate = (dateStr) => {
        setSettings(prev => ({
            ...prev,
            enabledDates: prev.enabledDates.includes(dateStr)
                ? prev.enabledDates.filter(d => d !== dateStr)
                : [...prev.enabledDates, dateStr].sort(),
        }));
    };

    const toggleHour = (dateStr, hour) => {
        if (!dateStr) {
            setSettings(prev => ({
                ...prev,
                defaultHours: prev.defaultHours.includes(hour)
                    ? prev.defaultHours.filter(h => h !== hour)
                    : [...prev.defaultHours, hour].sort(),
            }));
            return;
        }

        setSettings(prev => {
            const currentDateHours = prev.dateOverrides[dateStr] || prev.defaultHours;
            const newDateHours = currentDateHours.includes(hour)
                ? currentDateHours.filter(h => h !== hour)
                : [...currentDateHours, hour].sort();

            return {
                ...prev,
                dateOverrides: { ...prev.dateOverrides, [dateStr]: newDateHours },
            };
        });
    };

    const resetDate = (dateStr) => {
        setSettings(prev => {
            const newOverrides = { ...prev.dateOverrides };
            delete newOverrides[dateStr];
            return { ...prev, dateOverrides: newOverrides };
        });
    };

    const updateMaxOrdersPerHour = (value) =>
        setSettings(prev => ({ ...prev, maxOrdersPerHour: parseInt(value) || 0 }));

    const updateCutoffHour = (value) =>
        setSettings(prev => ({ ...prev, cutoffHour: value }));

    const updateMinDuration = (value) =>
        setSettings(prev => ({ ...prev, minDurationHours: value }));

    const value = {
        settings,
        loading,
        saving,
        error,
        fetchSettings,
        saveSettings,
        toggleDate,
        toggleHour,
        resetDate,
        updateMaxOrdersPerHour,
        updateCutoffHour,
        updateMinDuration,
    };

    return (
        <ShippingSettingsContext.Provider value={value}>
            {children}
        </ShippingSettingsContext.Provider>
    );
}

export function useShippingSettings() {
    const context = useContext(ShippingSettingsContext);
    if (!context) {
        throw new Error("useShippingSettings must be used within a ShippingSettingsProvider");
    }
    return context;
}