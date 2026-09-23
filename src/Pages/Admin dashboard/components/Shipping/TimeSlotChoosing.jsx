import "./TimeSlotChoosing.css";

/* Format hour: "8 AM" / "12 PM" / "12 AM" */
const formatHour = (h) => {
    const normalized = h % 24; // wrap-around
    const ampm = normalized >= 12 ? "PM" : "AM";
    const hour12 = normalized % 12 || 12;
    return `${hour12} ${ampm}`;
};

const formatDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "short",
    });
};

export default function TimeSlotChoosing({
    selectedDate,
    defaultHours,
    dateOverrides,
    onToggleHour,
    onResetDate,
    onBackToDefault,
    minDurationHours,
    onMinDurationChange,
    minAdvanceHours,
    onMinAdvanceChange,
}) {
    // ============================================
    // Generate hour slots
    // from = starting hour (24h)
    // to   = ending hour (24h, inclusive as start of slot)
    // ============================================
    const generateSlots = (from, to) => {
        const slots = [];
        for (let h = from; h <= to; h++) {
            const startStr = `${String(h).padStart(2, "0")}:00`;
            slots.push({
                hour: h,
                startStr,
                // Slot runs from `h` to `h+1`
                label: `${formatHour(h)} → ${formatHour(h + 1)}`,
            });
        }
        return slots;
    };

    // ✅ Morning: 6 AM → 11 AM (last slot ends at 12 PM)
    const morningSlots = generateSlots(6, 11);

    // ✅ Afternoon: 12 PM → 11 PM (last slot ends at 12 AM / midnight)
    const afternoonSlots = generateSlots(12, 23);

    const activeHours = selectedDate
        ? dateOverrides[selectedDate] || defaultHours
        : defaultHours;

    return (
        <div className="time-slot-choosing">
            <div className="hours-section">
                <h3>
                    {selectedDate
                        ? `🕒 Times for ${formatDateLabel(selectedDate)}`
                        : "🕒 Default Times (all days)"}

                    {selectedDate && (
                        <div className="day-actions">
                            <button
                                type="button"
                                className="reset-day-btn"
                                onClick={onResetDate}
                                title="Reset to default"
                            >
                                ↺ Reset
                            </button>
                            <button
                                type="button"
                                className="back-default-btn"
                                onClick={onBackToDefault}
                                title="Back to default times"
                            >
                                ◀ Back
                            </button>
                        </div>
                    )}
                </h3>

                <div className="hours-grid">
                    {morningSlots.map((slot) => {
                        const isActive = activeHours.includes(slot.startStr);
                        return (
                            <button
                                key={slot.startStr}
                                type="button"
                                className={`hour-toggle ${isActive ? "active" : ""}`}
                                onClick={() => onToggleHour(slot.startStr)}
                                title={
                                    isActive
                                        ? "Click to disable"
                                        : "Click to enable"
                                }
                            >
                                <span className="hour-label">{slot.label}</span>
                                <span className="toggle-indicator">
                                    {isActive ? "✅" : "⛔"}
                                </span>
                            </button>
                        );
                    })}

                    <div className="hour-divider" />

                    {afternoonSlots.map((slot) => {
                        const isActive = activeHours.includes(slot.startStr);
                        return (
                            <button
                                key={slot.startStr}
                                type="button"
                                className={`hour-toggle ${isActive ? "active" : ""}`}
                                onClick={() => onToggleHour(slot.startStr)}
                                title={
                                    isActive
                                        ? "Click to disable"
                                        : "Click to enable"
                                }
                            >
                                <span className="hour-label">{slot.label}</span>
                                <span className="toggle-indicator">
                                    {isActive ? "✅" : "⛔"}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <small className="hours-note">
                    {selectedDate
                        ? "These times apply only to this day."
                        : "These times apply to all enabled days (unless a specific override is set)."}
                </small>
            </div>

            <div className="rules-section">
                <h3>⚙️ Time Rules</h3>
                <div className="rules-grid">
                    <div className="rule-field">
                        <label>Minimum Advance Hours</label>
                        <input
                            type="number"
                            min="0"
                            max="48"
                            value={minAdvanceHours}
                            onChange={(e) =>
                                onMinAdvanceChange(Number(e.target.value))
                            }
                        />
                        <small>
                            Hours before delivery (24 = no same-day orders)
                        </small>

                        {/* Quick presets */}
                        <div className="rule-presets">
                            {[1, 12, 24, 48].map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    className={
                                        minAdvanceHours === h ? "active" : ""
                                    }
                                    onClick={() => onMinAdvanceChange(h)}
                                >
                                    {h}h
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rule-field">
                        <label>Minimum Duration (Hours)</label>
                        <input
                            type="number"
                            min="1"
                            max="8"
                            value={minDurationHours}
                            onChange={(e) =>
                                onMinDurationChange(Number(e.target.value))
                            }
                        />
                        <small>Minimum delivery window (e.g., 2 hours)</small>
                    </div>
                </div>
            </div>
        </div>
    );
}