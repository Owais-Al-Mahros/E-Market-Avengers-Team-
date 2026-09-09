// src/Pages/Admin dashboard/components/Shipping/DayChoosing.jsx
import "./DayChoosing.css";

export default function DayChoosing({ enabledDays, onToggleDay, selectedDay, onSelectDay }) {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
        <div className="day-choosing">
            <h3>📅 Available Days</h3>
            <div className="days-grid">
                {daysOfWeek.map((day) => {
                    const isActive = enabledDays.includes(day);
                    const isSelected = selectedDay === day;
                    return (
                        <button
                            key={day}
                            className={`day-toggle ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`}
                            onClick={() => onToggleDay(day)} // لتفعيل / تعطيل اليوم
                            onDoubleClick={() => {
                                if (isActive) onSelectDay(day);
                            }}
                            title={isSelected ? "Click to unselect" : `Double-click to customize ${day}`}
                        >
                            <span className="day-short">{day.slice(0, 3)}</span>
                            <span className="day-full">{day}</span>
                            <span className="toggle-indicator">{isActive ? "✅" : "⛔"}</span>
                        </button>
                    );
                })}
            </div>
            <small className="hint">Double-click a day to customize its hours.</small>
        </div>
    );
}