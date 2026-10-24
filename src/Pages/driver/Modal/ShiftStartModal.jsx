import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { saveShiftCheck } from "../../../api/haccp";
import "./ShiftStartModal.css";

// ✅ تعريف النقاط الست في مكان واحد لسهولة الإدارة
const CHECKS_CONFIG = [
    { key: "area_clean", label: "Transportbereich sauber, trocken und frei von Verunreinigungen." },
    { key: "no_odors", label: "Keine auffällige Gerüche oder Schädlingsspuren." },
    { key: "no_damages", label: "Keine gefährdenden Beschädigungen." },
    { key: "boxes_intact", label: "Transportboxen sauber und unbeschädigt." },
    { key: "food_protected", label: "Lebensmittel vor Verunreinigungen geschützt." },
    { key: "hygiene_ok", label: "Persönliche Hygiene eingehalten; keine relevanten Krankheitssymptome." },
];

const INITIAL_CHECKLIST = {
    area_clean: null,
    no_odors: null,
    no_damages: null,
    boxes_intact: null,
    food_protected: null,
    hygiene_ok: null,
};

const INITIAL_NOTES = {
    area_clean: "",
    no_odors: "",
    no_damages: "",
    boxes_intact: "",
    food_protected: "",
    hygiene_ok: "",
};

export default function ShiftStartModal({ driverName, onComplete }) {
    const [vehicle, setVehicle] = useState("");
    const [tour, setTour] = useState("");
    const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
    const [notes, setNotes] = useState(INITIAL_NOTES);

    const [hasCooling, setHasCooling] = useState(null);
    const [boxes, setBoxes] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addBox = () => {
        setBoxes([...boxes, {
            id: Date.now(),
            box_number: "",
            device_working: true,
            temp_reached: true,
            actual_temp: ""
        }]);
    };

    const updateBox = (id, field, value) => {
        setBoxes(boxes.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const removeBox = (id) => {
        setBoxes(boxes.filter(b => b.id !== id));
    };

    const handleSubmit = async () => {
        if (!vehicle.trim() || !tour.trim()) return toast.error("Bitte Fahrzeug und Tour eingeben.");

        const allChecked = Object.values(checklist).every(v => v !== null);
        if (!allChecked) return toast.error("Bitte alle 6 Punkte bewerten.");

        if (hasCooling === null) return toast.error("Bitte angeben, ob Kühlware transportiert wird.");
        if (hasCooling && boxes.length === 0) return toast.error("Bitte mindestens eine Kühlbox hinzufügen.");

        if (hasCooling && boxes.some(b => !b.box_number || !b.actual_temp)) {
            return toast.error("Bitte Kühlbox-Nummer und Temperatur für alle Boxen ausfüllen.");
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Fahrercheck wird gespeichert...");

        // تنظيف الملاحظات الفارغة لتوفير المساحة
        const cleanedNotes = Object.fromEntries(
            Object.entries(notes).filter(([_, v]) => v.trim() !== "")
        );

        const payload = {
            vehicle_number: vehicle,
            tour_number: tour,
            checklist: { ...checklist, notes: cleanedNotes },
            has_cooling_boxes: hasCooling,
            cooling_boxes: hasCooling ? boxes : [],
        };

        const res = await saveShiftCheck(payload);

        if (res.success) {
            toast.success("✅ Fahrercheck erfolgreich gespeichert!", { id: toastId });
            onComplete();
        } else {
            toast.error(res.error, { id: toastId });
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="shift-overlay">
            <div className="shift-modal">
                <header className="shift-header">
                    <div className="shift-header-icon">🚚</div>
                    <div>
                        <h1>Shopora | Fahrercheck</h1>
                        <p>Bitte führen Sie den täglichen Check vor der Abfahrt durch.</p>
                    </div>
                </header>

                <div className="shift-body">
                    {/* البيانات الأساسية */}
                    <div className="shift-section">
                        <div className="shift-basics">
                            <div className="shift-input-group">
                                <label>Fahrzeug</label>
                                <input type="text" value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="z.B. B-SH-2026" />
                            </div>
                            <div className="shift-input-group">
                                <label>Fahrer</label>
                                <input type="text" value={driverName} disabled />
                            </div>
                            <div className="shift-input-group">
                                <label>Tour</label>
                                <input type="text" value={tour} onChange={e => setTour(e.target.value)} placeholder="z.B. Tour 1" />
                            </div>
                        </div>
                    </div>

                    {/* قائمة الفحص */}
                    <div className="shift-section">
                        <h3 className="shift-section-title">
                            <span className="material-symbols-outlined">fact_check</span>
                            Fahrzeug & Hygiene
                        </h3>

                        <div className="shift-checklist">
                            {/* ✅ استخدام المصفوفة لعرض النقاط والملاحظات بشكل ديناميكي */}
                            {CHECKS_CONFIG.map((check) => (
                                <CheckRow
                                    key={check.key}
                                    label={check.label}
                                    value={checklist[check.key]}
                                    onChange={(v) => setChecklist({ ...checklist, [check.key]: v })}
                                    showNote={checklist[check.key] === false}
                                    noteValue={notes[check.key]}
                                    onNoteChange={(v) => setNotes({ ...notes, [check.key]: v })}
                                />
                            ))}
                        </div>
                    </div>

                    {/* قسم التبريد */}
                    <div className="shift-section">
                        <h3 className="shift-section-title">
                            <span className="material-symbols-outlined">ac_unit</span>
                            Kühlgeräte & Temperatur
                        </h3>

                        <div className="shift-cooling-question">
                            <p>Werden Kühlpflichtige oder Tiefgekühlte Lebensmittel transportiert?</p>
                            <div className="shift-radio-group">
                                <button type="button" className={`shift-radio-btn yes ${hasCooling === true ? "active" : ""}`} onClick={() => setHasCooling(true)}>
                                    <span className="material-symbols-outlined">check</span> Ja
                                </button>
                                <button type="button" className={`shift-radio-btn no ${hasCooling === false ? "active" : ""}`} onClick={() => setHasCooling(false)}>
                                    <span className="material-symbols-outlined">close</span> Nein
                                </button>
                            </div>
                        </div>

                        {hasCooling === true && (
                            <div className="shift-boxes-area">
                                {boxes.map((box, index) => (
                                    <div key={box.id} className="shift-box-card">
                                        <div className="shift-box-header">
                                            <span className="shift-box-title">
                                                <span className="material-symbols-outlined">kitchen</span>
                                                Kühlbox
                                            </span>
                                            <button type="button" onClick={() => removeBox(box.id)} className="shift-remove-box">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>

                                        <div className="shift-box-grid">
                                            <div className="shift-input-group">
                                                <label>Kühlbox Nummer</label>
                                                <input type="text" placeholder="z.B. 01" value={box.box_number} onChange={e => updateBox(box.id, "box_number", e.target.value)} />
                                            </div>

                                            <div className="shift-box-checkboxes">
                                                <label className="shift-checkbox-label">
                                                    <input type="checkbox" checked={box.device_working} onChange={e => updateBox(box.id, "device_working", e.target.checked)} />
                                                    <span>Kühlgerät und Thermometer funktionieren</span>
                                                </label>
                                                <label className="shift-checkbox-label">
                                                    <input type="checkbox" checked={box.temp_reached} onChange={e => updateBox(box.id, "temp_reached", e.target.checked)} />
                                                    <span>Erforderliche Temperatur erreicht</span>
                                                </label>
                                            </div>

                                            <div className="shift-input-group">
                                                <label>Gemessene Temperatur (°C)</label>
                                                <input type="number" step="0.1" placeholder="z.B. 4.5" value={box.actual_temp} onChange={e => updateBox(box.id, "actual_temp", e.target.value)} />
                                            </div>
                                        </div>
                                        <p className="shift-box-hint">
                                            Die zulässige Temperatur wird anhand der geladenen Produkte ermittelt.
                                        </p>
                                    </div>
                                ))}

                                <button type="button" onClick={addBox} className="shift-add-box-btn">
                                    <span className="material-symbols-outlined">add</span>
                                    Add Kühlbox
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="shift-footer">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="shift-submit-btn">
                        {isSubmitting ? "Wird gespeichert..." : "Speichern und weiter"}
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
}

function CheckRow({ label, value, onChange, showNote, noteValue, onNoteChange }) {
    return (
        <div className="shift-check-row">
            <div className="shift-check-content">
                <span className="shift-check-label">{label}</span>
                <div className="shift-mini-radios">
                    <button type="button" className={`shift-mini-btn ${value === true ? "active-yes" : ""}`} onClick={() => onChange(true)}>Ja</button>
                    <button type="button" className={`shift-mini-btn ${value === false ? "active-no" : ""}`} onClick={() => onChange(false)}>Nein</button>
                </div>
            </div>
            {showNote && (
                <div className="shift-note-wrapper">
                    <span className="material-symbols-outlined">edit_note</span>
                    <input
                        className="shift-note-input"
                        placeholder="Notiz (Grund angeben)..."
                        value={noteValue}
                        onChange={e => onNoteChange(e.target.value)}
                    />
                </div>
            )}
        </div>
    );
}