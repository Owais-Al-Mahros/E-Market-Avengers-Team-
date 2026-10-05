import "./TimeSlotChoosing.css";

/* ═══════════════════════════════════════════
   Work Hours Configuration
   — Single source of truth
   ═══════════════════════════════════════════ */
const WORK_HOURS = {
    morning: { from: 6, to: 11 },
    afternoon: { from: 12, to: 23 },
};

const formatHour = (h) => {
    const normalized = h % 24;
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

const generateSlots = (from, to) => {
    const slots = [];
    for (let h = from; h <= to; h++) {
        const startStr = `${String(h).padStart(2, "0")}:00`;
        slots.push({
            hour: h,
            startStr,
            label: `${formatHour(h)} → ${formatHour(h + 1)}`,
        });
    }
    return slots;
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
    maxOrdersPerHour,
    onMaxOrdersPerHourChange,
    cutoffHour,
    onCutoffHourChange,
}) {
    const morningSlots = generateSlots(WORK_HOURS.morning.from, WORK_HOURS.morning.to);
    const afternoonSlots = generateSlots(WORK_HOURS.afternoon.from, WORK_HOURS.afternoon.to);

    const activeHours = selectedDate
        ? dateOverrides[selectedDate] || defaultHours
        : defaultHours;

    const renderSlot = (slot) => {
        const isActive = activeHours.includes(slot.startStr);
        return (
            <button
                key={slot.startStr}
                type="button"
                className={`hour-toggle ${isActive ? "active" : ""}`}
                onClick={() => onToggleHour(slot.startStr)}
                title={isActive ? "Click to disable" : "Click to enable"}
            >
                <span className="hour-label">{slot.label}</span>
                <span className="toggle-indicator">{isActive ? "✅" : "⛔"}</span>
            </button>
        );
    };

    return (
        <div className="time-slot-choosing">
            {/* ═══ Hours ═══ */}
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
                    {morningSlots.map(renderSlot)}
                    <div className="hour-divider" />
                    {afternoonSlots.map(renderSlot)}
                </div>

                <small className="hours-note">
                    {selectedDate
                        ? "These times apply only to this day."
                        : "These times apply to all enabled days (unless a specific override is set)."}
                </small>
            </div>

            {/* ═══ Rules ═══ */}
            <div className="rules-section">
                <h3>⚙️ Booking Rules</h3>
                <div className="rules-grid">
                    <div className="rule-field">
                        <label>Max Orders per Hour</label>
                        <input
                            type="number"
                            min="0"
                            max="99"
                            value={maxOrdersPerHour}
                            onChange={(e) => onMaxOrdersPerHourChange(Number(e.target.value))}
                        />
                        <small>0 = no limit. A slot auto-closes when the limit is reached.</small>
                    </div>

                    <div className="rule-field">
                        <label>Cutoff Hour</label>
                        <input
                            type="time"
                            value={cutoffHour}
                            onChange={(e) => onCutoffHourChange(e.target.value)}
                        />
                        <small>After this time, tomorrow's orders close — next available becomes day after tomorrow.</small>
                    </div>

                    <div className="rule-field">
                        <label>Minimum Duration (Hours)</label>
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