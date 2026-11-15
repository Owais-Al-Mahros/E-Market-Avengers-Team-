import { useEffect, useMemo, useRef } from "react";
import { useShippingSettings } from "../../../../../context/ShippingSettingsContext";
import "./DayPicker.css";

/* ✅ Helper — local date to YYYY-MM-DD */
const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export default function DayPicker({ selectedDate, onSelectDate }) {
    const { settings, loading } = useShippingSettings();
    const gridRef = useRef(null);

    // ============================================
    // ✅ حساب أول تاريخ متاح بناءً على cutoff_hour
    // ============================================
    const earliestDate = useMemo(() => {
        const now = new Date();
        const [cutoffH, cutoffM] = (settings.cutoffHour || "22:00")
            .split(":")
            .map(Number);

        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffH, cutoffM, 0, 0);

        const earliest = new Date();
        earliest.setHours(0, 0, 0, 0);

        if (now >= cutoffTime) {
            earliest.setDate(earliest.getDate() + 2);
        } else {
            earliest.setDate(earliest.getDate() + 1);
        }

        return earliest;
    }, [settings.cutoffHour]);

    // ============================================
    // ✅ توليد 14 يوم
    // ============================================
    const availableDays = useMemo(() => {
        const days = [];

        for (let i = 0; i < 14; i++) {
            const date = new Date(earliestDate);
            date.setDate(date.getDate() + i);

            // ✅ FIXED: local date key
            const dateStr = toDateKey(date);

            const isEnabled =
                settings.enabledDates?.includes(dateStr) || false;

            days.push({
                date,
                dateStr,
                dayShort: date.toLocaleDateString("de-DE", {
                    weekday: "short",
                }),
                dayNumber: date.getDate(),
                monthShort: date.toLocaleDateString("de-DE", {
                    month: "short",
                }),
                isEnabled,
                isEarliest: i === 0,
            });
        }

        return days;
    }, [earliestDate, settings.enabledDates]);

    // على الجوال الشريط أفقي: إن كان يوم مختارًا مسبقًا (عودة من صفحة لاحقة) نُظهره في المنتصف.
    // scrollLeft وليس scrollIntoView: الثاني قد يحرّك الصفحة نفسها عند التحميل.
    useEffect(() => {
        const grid = gridRef.current;
        const chip = grid?.querySelector('[aria-pressed="true"]');
        if (grid && chip) {
            grid.scrollLeft = chip.offsetLeft - (grid.clientWidth - chip.offsetWidth) / 2;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    if (loading) {
        return (
            <div className="dp-container">
                <div className="dp-loading">Lade verfügbare Tage...</div>
            </div>
        );
    }

    const hasAvailableDays = availableDays.some((d) => d.isEnabled);

    return (
        <div className="dp-container">
            <div className="dp-header">
                <h2>
                    <span className="material-symbols-outlined">
                        calendar_month
                    </span>
                    Liefertag auswählen
                </h2>
                <p className="dp-subtitle">
                    Wählen Sie einen Tag für die Lieferung
                </p>
            </div>

            {!hasAvailableDays ? (
                <div className="dp-empty">
                    <span className="material-symbols-outlined">
                        event_busy
                    </span>
                    <p>Aktuell sind keine Liefertage verfügbar.</p>
                </div>
            ) : (
                <div className="dp-grid" ref={gridRef} role="group" aria-label="Liefertag">
                    {availableDays.map((day) => {
                        const isSelected = selectedDate === day.dateStr;
                        const isDisabled = !day.isEnabled;

                        return (
                            <button
                                key={day.dateStr}
                                type="button"
                                className={`dp-day ${isSelected ? "dp-day-selected" : ""
                                    } ${isDisabled ? "dp-day-disabled" : ""}`}
                                onClick={() =>
                                    !isDisabled && onSelectDate(day.dateStr)
                                }
                                disabled={isDisabled}
                                aria-pressed={isSelected}
                                aria-label={`${day.date.toLocaleDateString("de-DE", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                })}${isDisabled ? " – nicht verfügbar" : ""}`}
                            >
                                <span className="dp-day-name">
                                    {day.dayShort}
                                </span>
                                <span className="dp-day-number">
                                    {day.dayNumber}
                                </span>
                                <span className="dp-day-month">
                                    {day.monthShort}
                                </span>
                                {isDisabled && (
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