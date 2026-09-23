import { useMemo } from "react";
import { useShippingSettings } from "../../../../../context/ShippingSettingsContext";
import "./DayPicker.css";

export default function DayPicker({ selectedDate, onSelectDate }) {
    const { settings, loading } = useShippingSettings();

    // ============================================
    // توليد 14 يوم قادم
    // ============================================
    const availableDays = useMemo(() => {
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);

            const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
            const dateStr = date.toISOString().split("T")[0];
            const isEnabled = settings.enabledDates?.includes(dateStr) || false;
            const isToday = i === 0;
            const isPast = date < today;

            days.push({
                date,
                dateStr,
                dayName,
                dayShort: date.toLocaleDateString("de-DE", { weekday: "short" }),
                dayNumber: date.getDate(),
                monthShort: date.toLocaleDateString("de-DE", { month: "short" }),
                isEnabled,
                isToday,
                isPast,
            });
        }

        return days;
    }, [settings.enabledDays]);

    if (loading) {
        return (
            <div className="dp-container">
                <div className="dp-loading">Lade verfügbare Tage...</div>
            </div>
        );
    }

    const hasAvailableDays = availableDays.some(
        (d) => d.isEnabled && !d.isPast
    );

    return (
        <div className="dp-container">
            <div className="dp-header">
                <h2>
                    <span className="material-symbols-outlined">calendar_month</span>
                    Liefertag auswählen
                </h2>
                <p className="dp-subtitle">
                    Wählen Sie einen Tag für die Lieferung
                </p>
            </div>

            {!hasAvailableDays ? (
                <div className="dp-empty">
                    <span className="material-symbols-outlined">event_busy</span>
                    <p>Aktuell sind keine Liefertage verfügbar.</p>
                </div>
            ) : (
                <div className="dp-grid">
                    {availableDays.map((day) => {
                        const isSelected = selectedDate === day.dateStr;
                        const isDisabled = !day.isEnabled || day.isPast;

                        return (
                            <button
                                key={day.dateStr}
                                type="button"
                                className={`dp-day ${isSelected ? "dp-day-selected" : ""
                                    } ${isDisabled ? "dp-day-disabled" : ""} ${day.isToday ? "dp-day-today" : ""
                                    }`}
                                onClick={() => !isDisabled && onSelectDate(day.dateStr)}
                                disabled={isDisabled}
                            >
                                <span className="dp-day-name">{day.dayShort}</span>
                                <span className="dp-day-number">{day.dayNumber}</span>
                                <span className="dp-day-month">{day.monthShort}</span>
                                {day.isToday && (
                                    <span className="dp-day-badge">Heute</span>
                                )}
                                {isDisabled && !day.isToday && (
                                    <span className="dp-day-lock">
                                        <span className="material-symbols-outlined">
                                            block
                                        </span>
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