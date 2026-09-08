// src/context/ShippingSettingsContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const ShippingSettingsContext = createContext();

export function ShippingSettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        enabledDays: [],
        defaultHours: [],
        dayOverrides: {},
        minAdvanceHours: 1,
        minDurationHours: 2,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const parseJsonArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
            try { return JSON.parse(value); } catch { return []; }
        }
        if (typeof value === "object") {
            if (Array.isArray(value.days)) return value.days;
            if (Array.isArray(value.hours)) return value.hours;
        }
        return [];
    };

    const parseOverrides = (value) => {
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
                    enabledDays: parseJsonArray(data.enabled_days),
                    defaultHours: parseJsonArray(data.default_hours || data.enabled_hours),
                    dayOverrides: parseOverrides(data.day_overrides),
                    minAdvanceHours: data.min_advance_hours ?? 1,
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
                enabled_days: settings.enabledDays,
                default_hours: settings.defaultHours,
                day_overrides: settings.dayOverrides,
                min_advance_hours: settings.minAdvanceHours,
                min_duration_hours: settings.minDurationHours,
                // لا نرسل max_duration_hours
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

    const toggleDay = (day) => {
        setSettings(prev => ({
            ...prev,
            enabledDays: prev.enabledDays.includes(day)
                ? prev.enabledDays.filter(d => d !== day)
                : [...prev.enabledDays, day],
        }));
    };

    const toggleHour = (day, hour) => {
        if (!day) {
            setSettings(prev => ({
                ...prev,
                defaultHours: prev.defaultHours.includes(hour)
                    ? prev.defaultHours.filter(h => h !== hour)
                    : [...prev.defaultHours, hour],
            }));
            return;
        }

        setSettings(prev => {
            const currentDayHours = prev.dayOverrides[day] || prev.defaultHours;
            const newDayHours = currentDayHours.includes(hour)
                ? currentDayHours.filter(h => h !== hour)
                : [...currentDayHours, hour];
            return {
                ...prev,
                dayOverrides: { ...prev.dayOverrides, [day]: newDayHours },
            };
        });
    };

    const resetDay = (day) => {
        setSettings(prev => {
            const newOverrides = { ...prev.dayOverrides };
            delete newOverrides[day];
            return { ...prev, dayOverrides: newOverrides };
        });
    };

    const updateMinAdvance = (value) => setSettings(prev => ({ ...prev, minAdvanceHours: value }));
    const updateMinDuration = (value) => setSettings(prev => ({ ...prev, minDurationHours: value }));

    const value = {
        settings,
        loading,
        saving,
        error,
        fetchSettings,
        saveSettings,
        toggleDay,
        toggleHour,
        resetDay,
        updateMinAdvance,
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