import { createPortal } from "react-dom";
import "./ShiftSummaryModal.css";

const CHECK_LABELS = {
    area_clean: "Transportbereich sauber",
    no_odors: "Keine Gerüche/Schädlinge",
    no_damages: "Keine Beschädigungen",
    boxes_intact: "Boxen unbeschädigt",
    food_protected: "Lebensmittel geschützt",
    hygiene_ok: "Hygiene eingehalten",
};

export default function ShiftSummaryModal({ checkData, onClose, onEndShift }) {
    if (!checkData) return null;

    const { checklist, cooling_boxes, vehicle_number, tour_number, created_at } = checkData;
    const notes = checklist?.notes || {};

    return createPortal(
        <div className="shift-sum-overlay" onClick={onClose}>
            <div className="shift-sum-modal" onClick={e => e.stopPropagation()}>
                <header className="shift-sum-header">
                    <div>
                        <h2>Mein Tagesprotokoll</h2>
                        <p>{new Date(created_at).toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' })} Uhr</p>
                    </div>
                    <button onClick={onClose} className="shift-sum-close">✕</button>
                </header>

                <div className="shift-sum-body">
                    <div className="shift-sum-info">
                        <div><span>Fahrzeug:</span> <strong>{vehicle_number}</strong></div>
                        <div><span>Tour:</span> <strong>{tour_number}</strong></div>
                    </div>

                    <div className="shift-sum-section">
                        <h3 style={{ marginBottom: "12px", borderBottom: "1px solid #ddf4ea", paddingBottom: "8px" }}>
                            Fahrzeug & Hygiene
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {Object.entries(CHECK_LABELS).map(([key, label]) => {
                                const isChecked = checklist?.[key];
                                return (
                                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                                        <span style={{ color: "#15312b", fontWeight: "600" }}>{label}</span>
                                        <span className="material-symbols-outlined" style={{ color: isChecked ? "#10b981" : "#dc2626", fontSize: "20px" }}>
                                            {isChecked ? "check_circle" : "cancel"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {Object.values(notes).some(n => n) && (
                        <div className="shift-sum-note">
                            <strong style={{ display: "block", marginBottom: "4px" }}>Notizen:</strong>
                            {Object.values(notes).filter(n => n).join(" | ")}
                        </div>
                    )}

                    {/* ✅ عرض درجات الحرارة */}
                    {checkData.has_cooling_boxes && cooling_boxes?.length > 0 && (
                        <div className="shift-sum-section">
                            <h3 style={{ marginBottom: "12px", borderBottom: "1px solid #ddf4ea", paddingBottom: "8px" }}>
                                Kühlgeräte & Temperatur
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {cooling_boxes.map((box, i) => (
                                    <div key={i} className="shift-sum-box" style={{ background: "#f0f7f4", border: "1px solid #ddf4ea", borderRadius: "8px", padding: "12px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                            <strong style={{ color: "#145c4a" }}>Kühlbox {box.box_number}</strong>
                                            <span style={{ fontWeight: "800", color: "#15312b", fontSize: "15px" }}>{box.actual_temp} °C</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "12px", fontSize: "11.5px", color: "#6b7a77" }}>
                                            <span>{box.device_working ? "✅ Gerät OK" : "❌ Defekt"}</span>
                                            <span>{box.temp_reached ? "✅ Temp OK" : "❌ Temp nicht erreicht"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="shift-sum-footer">
                    <button className="shift-sum-btn-end" onClick={onEndShift}>
                        Tour beenden & Reinigen
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}