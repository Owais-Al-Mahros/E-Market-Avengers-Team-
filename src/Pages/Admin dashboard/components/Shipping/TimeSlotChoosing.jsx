// src/Pages/Admin dashboard/components/Shipping/TimeSlotChoosing.jsx
import "./TimeSlotChoosing.css";

export default function TimeSlotChoosing({
    selectedDay,
    defaultHours,
    dayOverrides,
    onToggleHour,
    onResetDay,
    onBackToDefault, // ✅ دالة جديدة للعودة إلى الوضع الافتراضي
    minDurationHours,
    onMinDurationChange,
    minAdvanceHours,
    onMinAdvanceChange,
}) {
    const allHours = [];
    for (let i = 6; i <= 23; i++) {
        allHours.push(`${String(i).padStart(2, "0")}:00`);
    }

    const activeHours = selectedDay
        ? (dayOverrides[selectedDay] || defaultHours)
        : defaultHours;

    const morningHours = allHours.filter(h => parseInt(h.split(":")[0], 10) < 12);
    const afternoonHours = allHours.filter(h => parseInt(h.split(":")[0], 10) >= 12);

    const formatHourDisplay = (hourStr) => {
        const hour = parseInt(hourStr.split(":")[0], 10);
        const ampm = hour >= 12 ? "pm" : "am";
        const hour12 = hour % 12 || 12;
        return `${hour12}${ampm}`;
    };

    return (
        <div className="time-slot-choosing">
            <div className="hours-section">
                <h3>
                    {selectedDay ? `🕒 Hours for ${selectedDay}` : "🕒 Default Hours (All Days)"}
                    {selectedDay && (
                        <div className="day-actions">
                            <button
                                className="reset-day-btn"
                                onClick={onResetDay}
                                title="Reset this day to default"
                            >
                                ↺ Reset to default
                            </button>
                            <button
                                className="back-default-btn"
                                onClick={onBackToDefault}
                                title="Switch back to default view"
                            >
                                ◀ Back to Default
                            </button>
                        </div>
                    )}
                </h3>
                <div className="hours-grid">
                    {morningHours.map((hour) => {
                        const isActive = activeHours.includes(hour);
                        return (
                            <button
                                key={hour}
                                className={`hour-toggle ${isActive ? "active" : ""}`}
                                onClick={() => onToggleHour(hour)}
                                title={isActive ? "Click to disable" : "Click to enable"}
                            >
                                <span className="hour-label">{formatHourDisplay(hour)}</span>
                                <span className="toggle-indicator">{isActive ? "✅" : "⛔"}</span>
                            </button>
                        );
                    })}
                    <div className="hour-divider"></div>
                    {afternoonHours.map((hour) => {
                        const isActive = activeHours.includes(hour);
                        return (
                            <button
                                key={hour}
                                className={`hour-toggle ${isActive ? "active" : ""}`}
                                onClick={() => onToggleHour(hour)}
                                title={isActive ? "Click to disable" : "Click to enable"}
                            >
                                <span className="hour-label">{formatHourDisplay(hour)}</span>
                                <span className="toggle-indicator">{isActive ? "✅" : "⛔"}</span>
                            </button>
                        );
                    })}
                </div>
                <small className="hours-note">
                    {selectedDay
                        ? "These are the hours for the selected day."
                        : "These hours apply to all days unless overridden."}
                </small>
            </div>

            <div className="rules-section">
                <h3>⚙️ Time Rules</h3>
                <div className="rules-grid">
                    <div className="rule-field">
                        <label>Min Advance Hours</label>
                        <input
                            type="number"
                            min="0"
                            max="6"
                            value={minAdvanceHours}
                            onChange={(e) => onMinAdvanceChange(Number(e.target.value))}
                        />
                        <small>Hours before delivery (e.g., 1 = can't order within 1 hour)</small>
                    </div>
                    <div className="rule-field">
                        <label>Min Duration (Hours)</label>
                        <input
                            type="number"
                            min="1"
                            max="8"
                            value={minDurationHours}
                            onChange={(e) => onMinDurationChange(Number(e.target.value))}
                        />
                        <small>Minimum delivery window (e.g., 2 hours)</small>
                    </div>
                </div>
            </div>
        </div>
    );
}