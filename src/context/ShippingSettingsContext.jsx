import { createContext, useContext } from "react";
import { useSupabaseSingleton } from "../hooks/useSupabaseSingleton";

const ShippingSettingsContext = createContext();

const DEFAULT_SETTINGS = {
    enabledDates: [],
    defaultHours: [],
    dateOverrides: {},
    maxOrdersPerHour: 0,
    cutoffHour: "22:00",
    minDurationHours: 2,
};

const parseArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
};

const parseObject = (v) => {
    if (!v) return {};
    if (typeof v === "string") {
        try { return JSON.parse(v); } catch { return {}; }
    }
    return typeof v === "object" && !Array.isArray(v) ? v : {};
};

const fromDb = (d) => ({
    enabledDates: parseArray(d.enabled_dates),
    defaultHours: parseArray(d.default_hours),
    dateOverrides: parseObject(d.date_overrides),
    maxOrdersPerHour: d.max_orders_per_hour ?? 0,
    cutoffHour: d.cutoff_hour ?? "22:00",
    minDurationHours: d.min_duration_hours ?? 2,
});

const toDb = (s) => ({
    enabled_dates: s.enabledDates,
    default_hours: s.defaultHours,
    date_overrides: s.dateOverrides,
    max_orders_per_hour: s.maxOrdersPerHour,
    cutoff_hour: s.cutoffHour,
    min_duration_hours: s.minDurationHours,
    updated_at: new Date().toISOString(),
});

export function ShippingSettingsProvider({ children }) {
    const {
        data: settings,
        setData: setSettings,
        loading,
        saving,
        error,
        fetchOne: fetchSettings,
        save: saveSettings,
    } = useSupabaseSingleton("delivery_settings", {
        defaults: DEFAULT_SETTINGS,
        fromDb,
        toDb,
    });

    // ============================================
    // منطق العمل (يبقى في الـ Context)
    // ============================================
    const toggleDate = (dateStr) => {
        setSettings((prev) => ({
            ...prev,
            enabledDates: prev.enabledDates.includes(dateStr)
                ? prev.enabledDates.filter((d) => d !== dateStr)
                : [...prev.enabledDates, dateStr].sort(),
        }));
    };

    const toggleHour = (dateStr, hour) => {
        if (!dateStr) {
            setSettings((prev) => ({
                ...prev,
                defaultHours: prev.defaultHours.includes(hour)
                    ? prev.defaultHours.filter((h) => h !== hour)
                    : [...prev.defaultHours, hour].sort(),
            }));
            return;
        }
        setSettings((prev) => {
            const current = prev.dateOverrides[dateStr] || prev.defaultHours;
            const next = current.includes(hour)
                ? current.filter((h) => h !== hour)
                : [...current, hour].sort();
            return {
                ...prev,
                dateOverrides: { ...prev.dateOverrides, [dateStr]: next },
            };
        });
    };

    const resetDate = (dateStr) => {
        setSettings((prev) => {
            const newOverrides = { ...prev.dateOverrides };
            delete newOverrides[dateStr];
            return { ...prev, dateOverrides: newOverrides };
        });
    };

    const updateMaxOrdersPerHour = (value) =>
        setSettings((prev) => ({ ...prev, maxOrdersPerHour: parseInt(value) || 0 }));

    const updateCutoffHour = (value) =>
        setSettings((prev) => ({ ...prev, cutoffHour: value }));

    const updateMinDuration = (value) =>
        setSettings((prev) => ({ ...prev, minDurationHours: value }));

    return (
        <ShippingSettingsContext.Provider
            value={{
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
            }}
        >
            {children}
        </ShippingSettingsContext.Provider>
    );
}

export const useShippingSettings = () => {
    const ctx = useContext(ShippingSettingsContext);
    if (!ctx) throw new Error("useShippingSettings must be used within ShippingSettingsProvider");
    return ctx;
};