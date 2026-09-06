// src/Pages/Checkout page/components/DeliveryTime.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import toast from "react-hot-toast";
import "./DeliveryTime.css";

export default function DeliveryTime({ onSelect, initialValue }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(true);

    // ===== إعدادات التوصيل =====
    const [settings, setSettings] = useState({
        enabledDays: [],
        enabledHours: [],
        minAdvanceHours: 1,
        minDurationHours: 2,
        maxDurationHours: 4,
    });

    // ===== دالة مساعدة لتحويل النص إلى مصفوفة بأمان =====
    const parseArray = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        if (value && typeof value === "object") {
            if (Array.isArray(value.days)) return value.days;
            if (Array.isArray(value.hours)) return value.hours;
            if (Array.isArray(Object.values(value)[0])) return Object.values(value)[0];
        }
        return [];
    };

    // ===== جلب الإعدادات من قاعدة البيانات =====
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from("delivery_settings")
                    .select("*")
                    .single();

                if (error) throw error;

                if (data) {
                    const enabledDays = parseArray(data.enabled_days);
                    const enabledHours = parseArray(data.enabled_hours);

                    setSettings({
                        enabledDays: enabledDays.length
                            ? enabledDays
                            : [
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                            ],
                        enabledHours: enabledHours.length
                            ? enabledHours
                            : [
                                "09:00",
                                "10:00",
                                "11:00",
                                "12:00",
                                "13:00",
                                "14:00",
                                "15:00",
                                "16:00",
                                "17:00",
                                "18:00",
                            ],
                        minAdvanceHours: data.min_advance_hours || 1,
                        minDurationHours: data.min_duration_hours || 2,
                        maxDurationHours: data.max_duration_hours || 4,
                    });
                }
            } catch (error) {
                console.error("Error fetching delivery settings:", error);
                toast.error("Could not load delivery settings. Using defaults.");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // ===== استعادة القيمة الأولية =====
    useEffect(() => {
        if (initialValue) {
            setSelectedDate(initialValue.date || "");
            setStartTime(initialValue.start || "");
            setEndTime(initialValue.end || "");
        }
    }, [initialValue]);

    // ===== أيام الأسبوع بالإنجليزية =====
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const today = new Date();
    const todayName = today.toLocaleDateString("en-US", { weekday: "long" });

    // ===== الحصول على اليوم التالي من تاريخ محدد =====
    const getNextDay = (dateStr) => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split("T")[0];
    };

    // ===== توليد الأيام القادمة (لمدة 7 أيام) =====
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

    // ===== دالة للتحقق من أن اليوم مفعّل =====
    const isDayEnabled = (dateStr) => {
        if (!dateStr) return false;
        const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
        return settings.enabledDays.includes(dayName);
    };

    // ===== دالة للتحقق من أن اليوم ليس ماضياً =====
    const isPastDay = (dateStr) => {
        if (!dateStr) return false;
        const todayStr = new Date().toISOString().split("T")[0];
        return dateStr < todayStr;
    };

    // ===== دالة للحصول على الساعات المتاحة للبداية =====
    const getAvailableStartHours = () => {
        if (!selectedDate) return [];

        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const isToday = selectedDate === today;

        if (isToday) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const minStartHour =
                currentHour + settings.minAdvanceHours + (currentMinute > 0 ? 1 : 0);

            const filtered = settings.enabledHours.filter((hour) => {
                const hourNum = parseInt(hour.split(":")[0], 10);
                return hourNum >= minStartHour;
            });

            return filtered;
        }

        return settings.enabledHours;
    };

    // ===== دالة للحصول على ساعات النهاية المتاحة =====
    const getAvailableEndHours = () => {
        if (!startTime) return [];
        const startHour = parseInt(startTime.split(":")[0], 10);
        const minEndHour = startHour + settings.minDurationHours;
        const maxEndHour = startHour + settings.maxDurationHours;

        return settings.enabledHours.filter((hour) => {
            const hourNum = parseInt(hour.split(":")[0], 10);
            return hourNum >= minEndHour && hourNum <= maxEndHour;
        });
    };

    // ===== دالة لعرض اليوم والتاريخ =====
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

    // ===== عرض التحديد =====
    const getSelectedDisplay = () => {
        if (selectedDate && startTime && endTime) {
            return `${getDayWithDate(selectedDate)} · ${startTime} - ${endTime}`;
        }
        return "";
    };

    // ===== تأكيد الاختيار =====
    const handleConfirm = () => {
        if (!selectedDate) {
            toast.error("Please select a delivery date.");
            return;
        }
        if (!startTime) {
            toast.error("Please select a start time.");
            return;
        }
        if (!endTime) {
            toast.error("Please select an end time.");
            return;
        }
        if (startTime >= endTime) {
            toast.error("Start time must be before end time.");
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

        onSelect({
            date: selectedDate,
            day: new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
            }),
            start: startTime,
            end: endTime,
        });
        setIsModalOpen(false);
    };

    // ===== إعادة التعيين =====
    const resetSelection = () => {
        setSelectedDate("");
        setStartTime("");
        setEndTime("");
        setIsModalOpen(false);
    };

    // ===== الساعات المتاحة =====
    const availableStartHours = getAvailableStartHours();
    const noStartSlots = availableStartHours.length === 0 && selectedDate;
    const availableEndHours = getAvailableEndHours();

    // ===== حالة التحميل =====
    if (loading) {
        return (
            <div className="delivery-time-trigger loading">
                <span>Loading delivery times...</span>
            </div>
        );
    }

    return (
        <>
            {/* زر فتح المودال */}
            <div className="delivery-time-trigger" onClick={() => setIsModalOpen(true)}>
                <span className="material-symbols-outlined">schedule</span>
                <span>Select Delivery Time</span>
                {selectedDate && startTime && endTime && (
                    <span className="selected-time">{getSelectedDisplay()}</span>
                )}
            </div>

            {/* المودال */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={resetSelection}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Choose Delivery Time</h3>
                            <button className="close-btn" onClick={resetSelection}>✕</button>
                        </div>

                        <div className="modal-body">
                            {/* ===== اختيار اليوم (أزرار) ===== */}
                            <div className="date-selection">
                                <label>Select a Day</label>
                                <div className="days-grid">
                                    {nextDays.map((dateStr) => {
                                        const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
                                        const isToday = dateStr === new Date().toISOString().split("T")[0];
                                        const isPast = dateStr < new Date().toISOString().split("T")[0];
                                        const isEnabled = isDayEnabled(dateStr) && !isPast;

                                        return (
                                            <button
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

                                {/* عرض التاريخ المختار بالكامل */}
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

                            {/* ===== اختيار الوقت ===== */}
                            <div className="time-selection">
                                <div className="time-range">
                                    <div className="time-field">
                                        <label htmlFor="start-time">Start Time</label>
                                        <select
                                            id="start-time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="time-select"
                                            disabled={noStartSlots || !selectedDate}
                                        >
                                            <option value="">
                                                {!selectedDate
                                                    ? "Select date first"
                                                    : noStartSlots
                                                        ? "No slots available today"
                                                        : "Select start time"}
                                            </option>
                                            {availableStartHours.map((hour) => (
                                                <option key={hour} value={hour}>
                                                    {hour}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="time-hint">
                                            {selectedDate && !noStartSlots
                                                ? `Earliest: ${availableStartHours[0] || "N/A"}`
                                                : "Select a date to see available times"}
                                        </small>
                                    </div>

                                    <div className="time-field">
                                        <label htmlFor="end-time">End Time</label>
                                        <select
                                            id="end-time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="time-select"
                                            disabled={!startTime || noStartSlots}
                                        >
                                            <option value="">
                                                {!startTime
                                                    ? "Select start time first"
                                                    : "Select end time"}
                                            </option>
                                            {availableEndHours.map((hour) => (
                                                <option key={hour} value={hour}>
                                                    {hour}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="time-hint">
                                            {startTime
                                                ? `Available end times (${settings.minDurationHours}-${settings.maxDurationHours}h range)`
                                                : "Select start time first"}
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* ملخص الاختيار */}
                            <div className="selection-summary">
                                <span>Selected: </span>
                                {selectedDate && startTime && endTime ? (
                                    <strong>{getSelectedDisplay()}</strong>
                                ) : (
                                    <span className="placeholder">
                                        Please select date and time range
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={resetSelection}>Cancel</button>
                            <button className="btn-confirm" onClick={handleConfirm}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}