// src/Pages/Admin dashboard/components/ShippingSection.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import DayChoosing from "./Shipping/DayChoosing";
import TimeSlotChoosing from "./Shipping/TimeSlotChoosing";
import { useShippingSettings } from "../../../context/ShippingSettingsContext";
import "./ShippingSection.css";

export default function ShippingSection() {
    const {
        settings,
        loading,
        saving,
        saveSettings,
        toggleDay,
        toggleHour,
        resetDay,
        updateMinAdvance,
        updateMinDuration,
    } = useShippingSettings();

    const [selectedDay, setSelectedDay] = useState("");

    const handleSave = async () => {
        const result = await saveSettings();
        if (result.success) {
            toast.success("✅ Settings saved!");
        } else {
            toast.error(`Failed to save: ${result.error}`);
        }
    };

    if (loading) return <div className="shipping-section loading">Loading...</div>;

    return (
        <div className="shipping-section">
            <div className="section-header">
                <h2>🚚 Shipping Settings</h2>
            </div>

            <div className="section-body">
                <DayChoosing
                    enabledDays={settings.enabledDays}
                    onToggleDay={toggleDay}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                />

                <TimeSlotChoosing
                    selectedDay={selectedDay}
                    defaultHours={settings.defaultHours}
                    dayOverrides={settings.dayOverrides}
                    onToggleHour={(hour) => toggleHour(selectedDay, hour)}
                    onResetDay={() => resetDay(selectedDay)}
                    onBackToDefault={() => setSelectedDay("")} // ✅ دالة العودة
                    minAdvanceHours={settings.minAdvanceHours}
                    onMinAdvanceChange={updateMinAdvance}
                    minDurationHours={settings.minDurationHours}
                    onMinDurationChange={updateMinDuration}
                />
            </div>

            <div className="section-footer">
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save All"}
                </button>
            </div>
        </div>
    );
}