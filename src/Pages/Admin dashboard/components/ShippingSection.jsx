import { useState } from "react";
import toast from "react-hot-toast";
import DayChoosing from "./Shipping/DayChoosing";
import TimeSlotChoosing from "./Shipping/TimeSlotChoosing";
import PricingSettings from "./Shipping/PricingSettings";
import { useShippingSettings } from "../../../context/ShippingSettingsContext";
import "./ShippingSection.css";

export default function ShippingSection() {
    const {
        settings,
        loading,
        saving,
        saveSettings,
        toggleDate,
        toggleHour,
        resetDate,
        updateMaxOrdersPerHour,   // ✅ جديد
        updateCutoffHour,         // ✅ جديد
        updateMinDuration,
    } = useShippingSettings();

    const [selectedDate, setSelectedDate] = useState("");

    // ✅ Save shipping settings only (days + hours)
    const handleSaveShipping = async () => {
        const result = await saveSettings();
        if (result.success) {
            toast.success("✅ Delivery days & times saved!");
        } else {
            toast.error(`Error: ${result.error}`);
        }
    };

    if (loading) {
        return (
            <div className="shipping-section loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="shipping-section">
            <div className="section-header">
                <h2>🚚 Shipping Settings</h2>
                <p className="section-subtitle">
                    Manage delivery days, times, and pricing separately
                </p>
            </div>

            {/* ============================================
                PART 1: Shipping Days & Hours
            ============================================ */}
            <div className="shipping-part">
                <div className="shipping-part-header">
                    <h3>📅 Delivery Days & Times</h3>
                    <button
                        type="button"
                        className="save-part-btn"
                        onClick={handleSaveShipping}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "💾 Save Delivery Days"}
                    </button>
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

            {/* ============================================
                PART 2: Pricing (saved separately)
            ============================================ */}
            <div className="shipping-part">
                <div className="shipping-part-header">
                    <h3>💰 Pricing</h3>
                </div>

                <PricingSettings />
            </div>
        </div>
    );
}