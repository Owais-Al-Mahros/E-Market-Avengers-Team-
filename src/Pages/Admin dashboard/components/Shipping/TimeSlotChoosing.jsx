// src/Pages/Admin dashboard/components/Shipping/TimeSlotChoosing.jsx
import "./TimeSlotChoosing.css";

export default function TimeSlotChoosing({
    enabledHours,
    onToggleHour,
    minAdvanceHours,
    onMinAdvanceChange,
    minDurationHours,
    onMinDurationChange,
    maxDurationHours,
    onMaxDurationChange,
}) {
    const allHours = [];
    for (let i = 9; i <= 18; i++) {
        allHours.push(`${String(i).padStart(2, "0")}:00`);
    }

    return (
        <div className="time-slot-choosing">
            <div className="hours-section">
                <h3>🕒 Available Hours</h3>
                <div className="hours-grid">
                    {allHours.map((hour) => {
                        const isActive = enabledHours.includes(hour);
                        return (
                            <button
                                key={hour}
                                className={`hour-toggle ${isActive ? "active" : ""}`}
                                onClick={() => onToggleHour(hour)}
                                title={isActive ? "Click to disable" : "Click to enable"}
                            >
                                {hour}
                                <span className="toggle-indicator">{isActive ? "✅" : "⛔"}</span>
                            </button>
                        );
                    })}
                </div>
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
                        <small>Minimum delivery window</small>
                    </div>

                    <div className="rule-field">
                        <label>Max Duration (Hours)</label>
                        <input
                            type="number"
                            min="2"
                            max="12"
                            value={maxDurationHours}
                            onChange={(e) => onMaxDurationChange(Number(e.target.value))}
                        />
                        <small>Maximum delivery window</small>
                    </div>
                </div>
            </div>
        </div>
    );
}