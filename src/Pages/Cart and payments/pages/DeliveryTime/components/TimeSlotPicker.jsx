import { useMemo } from "react";
import { useShippingSettings } from "../../../../../context/ShippingSettingsContext";
import "./TimeSlotPicker.css";

export default function TimeSlotPicker({
    selectedDate,
    selectedTime,
    onSelectTime,
}) {
    const { settings } = useShippingSettings();

    // ============================================
    // حساب الفترات المتاحة
    // ============================================
    const slots = useMemo(() => {
        if (!selectedDate) return [];

        const dayName = new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
        });

        const hoursForDay =
            settings.dayOverrides?.[dayName] || settings.defaultHours || [];

        const normalizedHours = hoursForDay.map((h) => {
            const [hour, min] = h.split(":");
            return `${String(parseInt(hour, 10)).padStart(2, "0")}:${min || "00"}`;
        });
        const uniqueHours = [...new Set(normalizedHours)].filter((h) => h !== "");

        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const isToday = selectedDate === today;

        let minStartHour = 0;
        if (isToday) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            minStartHour =
                currentHour +
                (settings.minAdvanceHours || 1) +
                (currentMinute > 0 ? 1 : 0);
        }

        const availableHours = uniqueHours
            .map((h) => parseInt(h.split(":")[0], 10))
            .filter((h) => h >= minStartHour)
            .sort((a, b) => a - b);

        const duration = settings.minDurationHours || 2;
        const result = [];

        for (let i = 0; i < availableHours.length; i++) {
            const start = availableHours[i];
            const end = start + duration;
            if (availableHours.includes(end)) {
                result.push({
                    start,
                    end,
                    startStr: `${String(start).padStart(2, "0")}:00`,
                    endStr: `${String(end).padStart(2, "0")}:00`,
                });
            }
        }

        return result;
    }, [
        selectedDate,
        settings.dayOverrides,
        settings.defaultHours,
        settings.minAdvanceHours,
        settings.minDurationHours,
    ]);

    const formatTime = (timeStr) => {
        const hour = parseInt(timeStr.split(":")[0], 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:00 ${ampm}`;
    };

    return (
        <div className="tsp-container">
            <div className="tsp-header">
                <h2>
                    <span className="material-symbols-outlined">schedule</span>
                    Lieferzeit auswählen
                </h2>
                <p className="tsp-subtitle">
                    Mindestdauer: {settings.minDurationHours || 2} Stunden
                </p>
            </div>

            {slots.length === 0 ? (
                <div className="tsp-empty">
                    <span className="material-symbols-outlined">schedule</span>
                    <p>
                        Für diesen Tag sind keine Zeitfenster verfügbar. Bitte wählen Sie
                        einen anderen Tag.
                    </p>
                </div>
            ) : (
                <div className="tsp-grid">
                    {slots.map((slot) => {
                        const isSelected = selectedTime === slot.startStr;
                        return (
                            <button
                                key={slot.startStr}
                                type="button"
                                className={`tsp-slot ${isSelected ? "tsp-slot-selected" : ""
                                    }`}
                                onClick={() => onSelectTime(slot.startStr)}
                            >
                                <span className="tsp-slot-time">
                                    {formatTime(slot.startStr)} – {formatTime(slot.endStr)}
                                </span>
                                <span className="tsp-slot-duration">
                                    {slot.end - slot.start}h
                                </span>
                                {isSelected && (
                                    <span className="tsp-slot-check">
                                        <span className="material-symbols-outlined">check</span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}