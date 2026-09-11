// src/Pages/Checkout page/components/DeliveryTime.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useShippingSettings } from "../../../context/ShippingSettingsContext";
import "./DeliveryTime.css";

export default function DeliveryTime({ onSelect, initialValue }) {
    const { settings, loading } = useShippingSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [startTime, setStartTime] = useState(null);

    // استعادة القيمة الأولية إذا وجدت
    useEffect(() => {
        if (initialValue) {
            setSelectedDate(initialValue.date || "");
            if (initialValue.start) {
                const hour = parseInt(initialValue.start.split(":")[0], 10);
                setStartTime(hour);
            }
        }
    }, [initialValue]);

    // توليد الأيام القادمة (7 أيام)
    const generateNextDays = () => {
        const days = [];
        const start = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            days.push(date.toISOString().split("T")[0]);
        }
        return days;
    };
    const nextDays = generateNextDays();

    const isDayEnabled = (dateStr) => {
        if (!dateStr) return false;
        const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
        return settings.enabledDays.includes(dayName);
    };

    const isPastDay = (dateStr) => {
        if (!dateStr) return false;
        const todayStr = new Date().toISOString().split("T")[0];
        return dateStr < todayStr;
    };

    const getAvailableSlots = () => {
        if (!selectedDate) return [];
        const dayName = new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" });

        // الساعات المتاحة: تخصيص اليوم إن وُجد، وإلا الافتراضي
        const hoursForDay = settings.dayOverrides[dayName] || settings.defaultHours;
        if (!hoursForDay || hoursForDay.length === 0) return [];

        // تطبيع الساعات
        const normalizedHours = hoursForDay.map(h => {
            const [hour, min] = h.split(":");
            return `${String(parseInt(hour, 10)).padStart(2, "0")}:${min || "00"}`;
        });
        const uniqueHours = [...new Set(normalizedHours)].filter(h => h !== "");

        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const isToday = selectedDate === today;

        let minStartHour = 0;
        if (isToday) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            minStartHour = currentHour + settings.minAdvanceHours + (currentMinute > 0 ? 1 : 0);
        }

        const availableHours = uniqueHours
            .map(h => parseInt(h.split(":")[0], 10))
            .filter(h => h >= minStartHour)
            .sort((a, b) => a - b);

        const slots = [];
        for (let i = 0; i < availableHours.length; i++) {
            const start = availableHours[i];
            const end = start + settings.minDurationHours;
            if (availableHours.includes(end)) {
                slots.push({ start, end });
            }
        }
        return slots;
    };

    const slots = getAvailableSlots();

    const formatHourDisplay = (hourStr) => {
        const hour = parseInt(hourStr.split(":")[0], 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:00 ${ampm}`;
    };

    const getDayWithDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getSelectedDisplay = () => {
        if (selectedDate && startTime !== null) {
            const end = startTime + settings.minDurationHours;
            const startStr = String(startTime).padStart(2, "0") + ":00";
            const endStr = String(end).padStart(2, "0") + ":00";
            return `${getDayWithDate(selectedDate)} · ${formatHourDisplay(startStr)} - ${formatHourDisplay(endStr)}`;
        }
        return "";
    };

    const handleConfirm = () => {
        if (!selectedDate) {
            toast.error("Please select a delivery date.");
            return;
        }
        if (startTime === null) {
            toast.error("Please select a time slot.");
            return;
        }
        if (!isDayEnabled(selectedDate)) {
            toast.error("Selected day is not available for delivery.");
            return;
        }
        if (isPastDay(selectedDate)) {
            toast.error("Cannot select a past date.");
            return;
        }

        const end = startTime + settings.minDurationHours;
        const startStr = String(startTime).padStart(2, "0") + ":00";
        const endStr = String(end).padStart(2, "0") + ":00";

        onSelect({
            date: selectedDate,
            day: new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" }),
            start: startStr,
            end: endStr,
        });
        setIsModalOpen(false);
    };

    const resetSelection = () => {
        setSelectedDate("");
        setStartTime(null);
        setIsModalOpen(false);
    };

    if (loading) {
        return <div className="delivery-time-trigger loading"><span>Loading delivery times...</span></div>;
    }

    const hasAvailableDays = nextDays.some(dateStr => isDayEnabled(dateStr) && !isPastDay(dateStr));

    return (
        <>
            <div
                className={`delivery-time-trigger ${!hasAvailableDays ? "disabled" : ""}`}
                onClick={() => {
                    if (hasAvailableDays) setIsModalOpen(true);
                    else toast.error("No delivery days available.");
                }}
            >
                <span className="material-symbols-outlined">schedule</span>
                <span>Select Delivery Time</span>
                {selectedDate && startTime !== null && (
                    <span className="selected-time">{getSelectedDisplay()}</span>
                )}
                {!hasAvailableDays && <span className="no-available">(No slots)</span>}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={resetSelection}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Choose Delivery Time</h3>
                            <button className="close-btn" onClick={resetSelection}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="date-selection">
                                <label>Select a Day</label>
                                <div className="days-grid">
                                    {nextDays.map((dateStr) => {
                                        const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
                                        const isToday = dateStr === new Date().toISOString().split("T")[0];
                                        const isPast = isPastDay(dateStr);
                                        const isEnabled = isDayEnabled(dateStr) && !isPast;

                                        return (
                                            <button
                                                type="button"
                                                key={dateStr}
                                                className={`day-btn 
                                                    ${selectedDate === dateStr ? "active" : ""} 
                                                    ${isToday ? "today" : ""} 
                                                    ${isPast ? "past" : ""} 
                                                    ${!isEnabled ? "disabled" : ""}
                                                `}
                                                onClick={() => {
                                                    if (isEnabled) {
                                                        setSelectedDate(dateStr);
                                                        setStartTime(null);
                                                    }
                                                }}
                                                disabled={!isEnabled}
                                                title={isPast ? "Past date" : !isDayEnabled(dateStr) ? "Not available" : ""}
                                            >
                                                <span className="day-name-short">{dayName.slice(0, 3)}</span>
                                                <span className="day-number">{new Date(dateStr).getDate()}</span>
                                                {isToday && <span className="today-badge">Today</span>}
                                                {isPast && <span className="past-badge">✕</span>}
                                                {!isEnabled && !isPast && <span className="unavailable-badge">🚫</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedDate && (
                                    <div className="day-display">
                                        <span className="day-name">
                                            {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })}
                                        </span>
                                        <span className="day-date">
                                            {new Date(selectedDate).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="time-selection">
                                <div className="time-field">
                                    <label htmlFor="time-slot">Select Time Slot</label>
                                    <select
                                        id="time-slot"
                                        value={startTime !== null ? startTime : ""}
                                        onChange={(e) => setStartTime(Number(e.target.value))}
                                        className="time-select"
                                        disabled={!selectedDate || slots.length === 0}
                                    >
                                        <option value="">
                                            {!selectedDate
                                                ? "Select date first"
                                                : slots.length === 0
                                                    ? "No slots available"
                                                    : "Select a time slot"}
                                        </option>
                                        {slots.map((slot) => {
                                            const startStr = String(slot.start).padStart(2, "0") + ":00";
                                            const endStr = String(slot.end).padStart(2, "0") + ":00";
                                            return (
                                                <option key={slot.start} value={slot.start}>
                                                    {formatHourDisplay(startStr)} – {formatHourDisplay(endStr)}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <small className="time-hint">
                                        {selectedDate && slots.length > 0
                                            ? `Duration: ${settings.minDurationHours} hour(s)`
                                            : "Select a date to see available slots"}
                                    </small>
                                </div>
                            </div>

                            <div className="selection-summary">
                                <span>Selected: </span>
                                {selectedDate && startTime !== null ? (
                                    <strong>{getSelectedDisplay()}</strong>
                                ) : (
                                    <span className="placeholder">Please select date and time slot</span>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={resetSelection}>Cancel</button>
                            <button type="button" className="btn-confirm" onClick={handleConfirm}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}