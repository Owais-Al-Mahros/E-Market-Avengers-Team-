// src/Pages/Admin dashboard/components/Shipping/DayChoosing.jsx
import "./DayChoosing.css";

export default function DayChoosing({ enabledDays, onToggleDay }) {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
        <div className="day-choosing">
            <h3>📅 Available Days</h3>
            <div className="days-grid">
                {daysOfWeek.map((day) => {
                    const isActive = enabledDays.includes(day);
                    return (
                        <button
                            key={day}
                            className={`day-toggle ${isActive ? "active" : ""}`}
                            onClick={() => onToggleDay(day)}
                            title={isActive ? "Click to disable" : "Click to enable"}
                        >
                            <span className="day-short">{day.slice(0, 3)}</span>
                            <span className="day-full">{day}</span>
                            <span className="toggle-indicator">{isActive ? "✅" : "⛔"}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}