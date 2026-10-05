import { useState, useRef } from "react";   // ← يجب أن يحتوي useRef
import toast from "react-hot-toast";
import DayChoosing from "./DeliveryTime/DayChoosing";
import TimeSlotChoosing from "./DeliveryTime/TimeSlotChoosing";
import PricingSettings from "./Pricing/PricingSettings";   // ← default import
import { useShippingSettings } from "../../../../context/ShippingSettingsContext";
import "./ShippingSection.css";

export default function ShippingSection() {
    const {
        settings,
        loading,
        saving: savingShipping,
        saveSettings,
        toggleDate,
        toggleHour,
        resetDate,
        updateMaxOrdersPerHour,
        updateCutoffHour,
        updateMinDuration,
    } = useShippingSettings();

    const pricingRef = useRef(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [savingAll, setSavingAll] = useState(false);

    /* ═══════════════════════════════════════════
       Unified save — Days + Hours + Pricing
       ═══════════════════════════════════════════ */
    const handleSaveAll = async () => {
        setSavingAll(true);
        const toastId = toast.loading("Saving all settings...");

        try {
            const [shippingResult, pricingResult] = await Promise.all([
                saveSettings(),
                pricingRef.current?.save(),
            ]);

            const shippingOk = shippingResult?.success !== false;
            const pricingOk = pricingResult?.success !== false;

            if (shippingOk && pricingOk) {
                toast.success("All settings saved", { id: toastId });
            } else {
                const failing = [];
                if (!shippingOk) failing.push("delivery days");
                if (!pricingOk) failing.push("pricing");
                toast.error(`Failed to save: ${failing.join(", ")}`, {
                    id: toastId,
                });
            }
        } catch (err) {
            console.error("Save all failed:", err);
            toast.error("Connection error", { id: toastId });
        } finally {
            setSavingAll(false);
        }
    };

    if (loading) {
        return (
            <div className="shipping-section loading">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="shipping-section">
            <div className="section-header">
                <div>
                    <h2>🚚 Shipping Settings</h2>
                    <p className="section-subtitle">
                        Manage delivery days, times, and pricing in one place.
                    </p>
                </div>

                <button
                    type="button"
                    className="save-all-btn"
                    onClick={handleSaveAll}
                    disabled={savingAll || savingShipping}
                >
                    <span className="material-symbols-outlined">
                        {savingAll ? "hourglass_top" : "save"}
                    </span>
                    {savingAll ? "Saving..." : "💾 Save All Changes"}
                </button>
            </div>

            {/* ═══ Part 1: Delivery Days & Times ═══ */}
            <div className="shipping-part">
                <div className="shipping-part-header">
                    <h3>📅 Delivery Days & Times</h3>
                </div>

                <div className="section-body">
                    <DayChoosing
                        enabledDates={settings.enabledDates}
                        onToggleDate={toggleDate}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />

                    <TimeSlotChoosing
                        selectedDate={selectedDate}
                        defaultHours={settings.defaultHours}
                        dateOverrides={settings.dateOverrides}
                        onToggleHour={(hour) => toggleHour(selectedDate, hour)}
                        onResetDate={() => resetDate(selectedDate)}
                        onBackToDefault={() => setSelectedDate("")}
                        maxOrdersPerHour={settings.maxOrdersPerHour}
                        onMaxOrdersPerHourChange={updateMaxOrdersPerHour}
                        cutoffHour={settings.cutoffHour}
                        onCutoffHourChange={updateCutoffHour}
                        minDurationHours={settings.minDurationHours}
                        onMinDurationChange={updateMinDuration}
                    />
                </div>
            </div>

            {/* ═══ Part 2: Pricing ═══ */}
            <div className="shipping-part">
                <div className="shipping-part-header">
                    <h3>💰 Pricing & Delivery Rules</h3>
                </div>

                <PricingSettings ref={pricingRef} />
            </div>
        </div>
    );
}