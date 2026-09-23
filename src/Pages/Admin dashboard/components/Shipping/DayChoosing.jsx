import { useState, useMemo, useRef, useEffect } from "react";
import "./DayChoosing.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CLICK_DELAY = 250; // ms

const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getMonthMatrix = (year, month) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startWeekday = firstDayOfMonth.getDay();
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

    const days = [];
    const totalDays = lastDayOfMonth.getDate();

    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);

    return days;
};

const getMonthLabel = (year, month) => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
};

export default function DayChoosing({
    enabledDates,
    onToggleDate,
    selectedDate,
    onSelectDate,
}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    // ✅ Timer لحل مشكلة الضغطتين
    const clickTimerRef = useRef(null);

    // تنظيف عند إلغاء المكوّن
    useEffect(() => {
        return () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        };
    }, []);

    const monthDays = useMemo(
        () => getMonthMatrix(viewYear, viewMonth),
        [viewYear, viewMonth]
    );

    const todayKey = toDateKey(today);

    const goPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const goNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const goToday = () => {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
    };

    const enabledCountInMonth = useMemo(() => {
        return monthDays.filter(
            (d) => d && enabledDates.includes(toDateKey(d))
        ).length;
    }, [monthDays, enabledDates]);

    // ============================================
    // ✅ معالج النقر — يميّز بين Single و Double
    // ============================================
    const handleCellClick = (dateKey, isActive) => {
        // إذا يوجد timer سابق → هذه نقرة ثانية (double-click)
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;

            // Double-click: فتح محرر الساعات (فقط إذا كان اليوم مفعّلاً)
            if (isActive) {
                onSelectDate(dateKey);
            }
            return;
        }

        // نقرة أولى → ابدأ timer
        clickTimerRef.current = setTimeout(() => {
            clickTimerRef.current = null;
            // Single-click: toggle
            onToggleDate(dateKey);
        }, CLICK_DELAY);
    };

    return (
        <div className="day-choosing">
            {/* ===== Header ===== */}
            <div className="cal-header">
                <button
                    type="button"
                    className="cal-nav-btn"
                    onClick={goPrevMonth}
                    title="Previous month"
                    aria-label="Previous month"
                >
                    <span className="material-symbols-outlined">
                        chevron_left
                    </span>
                </button>

                <div className="cal-header-center">
                    <h3 className="cal-month-label">
                        {getMonthLabel(viewYear, viewMonth)}
                    </h3>
                    <span className="cal-month-meta">
                        {enabledCountInMonth}{" "}
                        {enabledCountInMonth === 1 ? "active day" : "active days"}
                    </span>
                </div>

                <button
                    type="button"
                    className="cal-nav-btn"
                    onClick={goNextMonth}
                    title="Next month"
                    aria-label="Next month"
                >
                    <span className="material-symbols-outlined">
                        chevron_right
                    </span>
                </button>

                <button
                    type="button"
                    className="cal-today-btn"
                    onClick={goToday}
                    title="Go to today"
                >
                    <span className="material-symbols-outlined">today</span>
                    Today
                </button>
            </div>

            {/* ===== Notice about today ===== */}
            <div className="cal-notice">
                <span className="material-symbols-outlined">info</span>
                <span>
                    Today is unavailable — orders require at least{" "}
                    <strong>24h advance notice</strong>
                </span>
            </div>

            {/* ===== Calendar Body ===== */}
            <div className="cal-body">
                {/* Weekday header row */}
                <div className="cal-weekdays">
                    {WEEKDAYS.map((d) => (
                        <div key={d} className="cal-weekday">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="cal-grid">
                    {monthDays.map((date, idx) => {
                        if (!date) {
                            return (
                                <div
                                    key={`empty-${idx}`}
                                    className="cal-cell cal-cell-empty"
                                />
                            );
                        }

                        const dateKey = toDateKey(date);
                        const isActive = enabledDates.includes(dateKey);
                        const isSelected = selectedDate === dateKey;
                        const isToday = dateKey === todayKey;
                        const isPast = date < today; // ✅ اليوم الحالي أيضاً "past"
                        const isWeekend =
                            date.getDay() === 0 || date.getDay() === 6;

                        return (
                            <button
                                key={dateKey}
                                type="button"
                                disabled={isPast}
                                className={[
                                    "cal-cell",
                                    isActive ? "is-active" : "",
                                    isSelected ? "is-selected" : "",
                                    isToday ? "is-today" : "",
                                    isPast ? "is-past" : "",
                                    isWeekend ? "is-weekend" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onClick={() =>
                                    !isPast && handleCellClick(dateKey, isActive)
                                }
                                title={
                                    isToday
                                        ? "Today — requires 24h advance notice"
                                        : isPast
                                            ? "Past date"
                                            : isSelected
                                                ? "Click to unselect"
                                                : "Click: toggle · Double-click: edit hours"
                                }
                            >
                                <span className="cal-day-num">
                                    {date.getDate()}
                                </span>

                                {isToday && (
                                    <span className="cal-day-tag">Today</span>
                                )}

                                {isActive && (
                                    <span className="cal-day-check">
                                        <span className="material-symbols-outlined">
                                            check
                                        </span>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ===== Footer / Legend ===== */}
            <div className="cal-footer">
                <div className="cal-legend">
                    <span className="cal-legend-item">
                        <span className="cal-legend-chip chip-active" />
                        Active
                    </span>
                    <span className="cal-legend-item">
                        <span className="cal-legend-chip chip-today" />
                        Today (disabled)
                    </span>
                    <span className="cal-legend-item">
                        <span className="cal-legend-chip chip-selected" />
                        Selected
                    </span>
                    <span className="cal-legend-item">
                        <span className="cal-legend-chip chip-weekend" />
                        Weekend
                    </span>
                </div>

                <p className="cal-hint">
                    <strong>Click</strong> a day to enable/disable ·{" "}
                    <strong>Double-click</strong> an active day to edit its
                    hours
                </p>
            </div>
        </div>
    );
}