import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { fetchMyHistory } from "../../../api/haccp";
import { formatDateTimeDE } from "../../../lib/haccpHelpers";
import "./ShiftSummaryModal.css";

const CHECK_LABELS = {
    area_clean: "Transportbereich sauber",
    no_odors: "Keine Gerüche/Schädlinge",
    no_damages: "Keine Beschädigungen",
    boxes_intact: "Boxen unbeschädigt",
    food_protected: "Lebensmittel geschützt",
    hygiene_ok: "Hygiene eingehalten",
};

export default function DriverHistoryModal({ onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyHistory().then(res => {
            if (res.success) setHistory(res.data);
            setLoading(false);
        });
    }, []);

    return createPortal(
        <div className="shift-sum-overlay" onClick={onClose}>
            <div className="shift-sum-modal" onClick={e => e.stopPropagation()}>
                <header className="shift-sum-header">
                    <div>
                        <h2>Mein Verlauf</h2>
                        <p>Deine letzten 10 Checks und Reinigungen</p>
                    </div>
                    <button onClick={onClose} className="shift-sum-close">✕</button>
                </header>

                <div className="shift-sum-body">
                    {loading ? (
                        <p style={{ textAlign: "center", padding: "20px" }}>Lade Verlauf...</p>
                    ) : history.length === 0 ? (
                        <p style={{ textAlign: "center", padding: "20px" }}>Noch keine Einträge vorhanden.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {history.map(item => (
                                <div key={item.id} style={{ background: "#fff", border: "1px solid #ddf4ea", borderRadius: "12px", padding: "16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <strong style={{ color: item.type === "check" ? "#145c4a" : "#8b5cf6" }}>
                                            {item.type === "check" ? "🚚 Fahrercheck" : "🧽 Reinigung"}
                                        </strong>
                                        <span style={{ fontSize: "12px", color: "#6b7a77" }}>
                                            {formatDateTimeDE(item.created_at)}
                                        </span>
                                    </div>

                                    {item.type === "check" ? (
                                        <div style={{ fontSize: "13px", color: "#15312b" }}>
                                            <p style={{ margin: "0 0 8px", paddingBottom: "8px", borderBottom: "1px dashed #e1ebe7" }}>
                                                Fahrzeug: <strong>{item.vehicle_number}</strong> | Tour: <strong>{item.tour_number}</strong>
                                            </p>

                                            {/* عرض تفاصيل الفحص */}
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                                                {Object.entries(CHECK_LABELS).map(([key, label]) => {
                                                    const isChecked = item.checklist?.[key];
                                                    return (
                                                        <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: isChecked ? "#047857" : "#dc2626" }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{isChecked ? "check_circle" : "cancel"}</span>
                                                            {label}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* ✅ عرض درجات الحرارة بالتفصيل */}
                                            {item.has_cooling_boxes ? (
                                                <div style={{ background: "#f0f7f4", padding: "10px", borderRadius: "8px" }}>
                                                    <span style={{ fontWeight: "bold", color: "#145c4a", fontSize: "12px", display: "block", marginBottom: "6px" }}>Kühlboxen:</span>
                                                    {item.cooling_boxes?.map((box, i) => (
                                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: i !== item.cooling_boxes.length - 1 ? "1px dashed #ddf4ea" : "none", padding: "4px 0" }}>
                                                            <span>Box {box.box_number}</span>
                                                            <strong>{box.actual_temp} °C</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ margin: 0, fontWeight: "bold", color: "#6b7a77" }}>Keine Kühlware</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: "13px", color: "#15312b" }}>
                                            <p style={{ margin: "0 0 4px" }}>{item.is_cleaned ? "✅ Erfolgreich gereinigt" : "❌ Nicht gereinigt"}</p>
                                            {item.notes && <p style={{ margin: 0, fontStyle: "italic", color: "#6b7a77" }}>Notiz: {item.notes}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}